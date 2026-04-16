import uuid
from datetime import datetime, timezone

from langgraph.types import Command
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.graph import build_research_graph, _graphs
from app.agents.llm import MissingAPIKeyError
from app.auth.encryption import decrypt_api_key
from app.database import async_session
from app.models import Run, AgentStep, StepMetrics, UserAPIKey
from app.logging import get_logger
from app.observability.budget import BudgetExceededError, BudgetTracker
from app.observability.callbacks import manager
from app.observability.metrics_collector import MetricsCollector

logger = get_logger(module="research_service")


async def create_run(db: AsyncSession, query: str, mode: str, llm_provider: str, user_id: uuid.UUID | None = None) -> Run:
    run = Run(
        id=uuid.uuid4(),
        query=query,
        mode=mode,
        llm_provider=llm_provider,
        status="pending",
        user_id=user_id,
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)
    logger.info("run_created", run_id=str(run.id), query=run.query, mode=run.mode)
    return run


async def _get_user_api_keys(db: AsyncSession, user_id) -> dict | None:
    """Fetch and decrypt user's stored API keys from the database."""
    if not user_id:
        return None
    result = await db.execute(
        select(UserAPIKey).where(UserAPIKey.user_id == user_id)
    )
    stored_keys = result.scalars().all()
    if not stored_keys:
        return None

    keys = {}
    for sk in stored_keys:
        try:
            decrypted = decrypt_api_key(sk.encrypted_key)
            if sk.provider == "openai":
                keys["openai_api_key"] = decrypted
            elif sk.provider == "anthropic":
                keys["anthropic_api_key"] = decrypted
            elif sk.provider == "bedrock":
                keys["bedrock_api_key"] = decrypted
        except Exception:
            continue
    return keys if keys else None


async def _save_step_metrics(db: AsyncSession, run: Run, step_metric, metrics: MetricsCollector, budget: BudgetTracker, rid: str):
    """Save agent step and metrics to DB, broadcast via WebSocket."""
    step = AgentStep(
        run_id=run.id,
        agent=step_metric.agent,
        status="completed",
        started_at=datetime.fromtimestamp(step_metric.started_at, tz=timezone.utc),
        completed_at=datetime.now(timezone.utc),
        duration_ms=step_metric.duration_ms,
    )
    db.add(step)
    await db.flush()

    sm = StepMetrics(
        step_id=step.id,
        run_id=run.id,
        input_tokens=step_metric.input_tokens,
        output_tokens=step_metric.output_tokens,
        total_tokens=step_metric.total_tokens,
        cost_usd=step_metric.cost_usd,
        model_name=step_metric.model_name,
        tool_calls=step_metric.tool_calls,
        tool_names=step_metric.tool_names,
    )
    db.add(sm)
    await db.commit()

    logger.info("agent_completed", run_id=rid, agent=step_metric.agent, duration_ms=step_metric.duration_ms, tokens=step_metric.total_tokens)
    await manager.broadcast(rid, {
        "type": "agent_complete",
        "agent": step_metric.agent,
        "duration_ms": step_metric.duration_ms,
        "tokens": step_metric.total_tokens,
    })

    totals = metrics.get_total_metrics()
    await manager.broadcast(rid, {
        "type": "metrics_update",
        **totals,
        "budget": budget.to_dict(),
    })


async def _run_graph_phase(db: AsyncSession, run: Run, graph, config: dict, input_data, metrics: MetricsCollector, budget: BudgetTracker, rid: str):
    """Run the graph (or resume it) and process events. Returns True if completed, False if interrupted."""
    agent_names = ["planner", "plan_approval", "searcher", "reader", "writer"]

    try:
        async for event in graph.astream_events(input_data, config=config, version="v2"):
            kind = event.get("event", "")
            name = event.get("name", "")

            if kind == "on_chain_start" and name in agent_names:
                agent = name
                status_map = {
                    "planner": "planning",
                    "plan_approval": "awaiting_approval",
                    "searcher": "searching",
                    "reader": "reading",
                    "writer": "writing",
                }
                if agent in status_map:
                    run.status = status_map[agent]
                    await db.commit()

                metrics.start_step(agent)
                logger.info("agent_started", run_id=rid, agent=agent)
                await manager.broadcast(rid, {"type": "agent_start", "agent": agent})

            elif kind == "on_chain_end" and name in agent_names:
                step_metric = metrics.end_step()
                if step_metric:
                    await _save_step_metrics(db, run, step_metric, metrics, budget, rid)

    except Exception as e:
        # Check if this is a graph interrupt (plan approval needed)
        if "GraphInterrupt" in type(e).__name__ or "interrupt" in str(type(e)).lower():
            # Graph was interrupted for plan approval — this is expected
            state = await graph.aget_state(config)
            if state and hasattr(state, 'tasks') and state.tasks:
                # There are pending interrupts — send plan to frontend
                interrupt_data = state.tasks[0].interrupts[0].value if state.tasks[0].interrupts else {}
                plan = interrupt_data.get("plan") if isinstance(interrupt_data, dict) else None
                if plan:
                    await manager.broadcast(rid, {"type": "plan_ready", "plan": plan})

                run.status = "awaiting_approval"
                await db.commit()
                logger.info("research_awaiting_approval", run_id=rid)
                return False  # Not completed — waiting for approval

        # Re-raise non-interrupt exceptions
        raise

    return True  # Completed normally


async def execute_research(run_id: uuid.UUID, max_tokens: int | None = None, max_cost: float | None = None, api_keys: dict | None = None, user_id=None):
    """Execute research pipeline Phase 1: run until interrupt or completion."""
    logger.info("research_started", run_id=str(run_id))
    async with async_session() as db:
        run = await get_run(db, run_id)
        if not run:
            return

        rid = str(run.id)

        # Always load user's stored keys, then overlay request keys
        stored_keys = await _get_user_api_keys(db, user_id or run.user_id)
        if stored_keys and api_keys:
            merged = {**stored_keys, **{k: v for k, v in api_keys.items() if v}}
            api_keys = merged
        elif stored_keys:
            api_keys = stored_keys

        budget = BudgetTracker(rid, max_tokens=max_tokens, max_cost=max_cost)
        metrics = MetricsCollector(rid, budget=budget)
        graph = build_research_graph()

        # Store graph instance for later resume
        _graphs[rid] = {"graph": graph, "metrics": metrics, "budget": budget}

        config = {
            "configurable": {"thread_id": rid},
            "callbacks": [metrics],
        }

        initial_state = {
            "messages": [],
            "query": run.query,
            "mode": run.mode,
            "llm_provider": run.llm_provider,
            "plan": None,
            "plan_approved": False,
            "search_results": [],
            "extracted_content": [],
            "report": None,
            "report_markdown": None,
            "run_id": rid,
            "token_budget": budget.max_tokens,
            "cost_budget": budget.max_cost,
            "api_keys": api_keys,
        }

        try:
            run.status = "planning"
            await db.commit()

            completed = await _run_graph_phase(db, run, graph, config, initial_state, metrics, budget, rid)

            if completed:
                await _finalize_run(db, run, graph, config, metrics, rid)

        except MissingAPIKeyError as e:
            logger.error("research_missing_key", run_id=rid, error=str(e))
            run.status = "failed"
            run.error = str(e)
            await db.commit()
            await manager.broadcast(rid, {"type": "error", "message": str(e)})
        except BudgetExceededError as e:
            logger.error("research_budget_exceeded", run_id=rid, error=str(e))
            run.status = "failed"
            run.error = f"Budget exceeded: {str(e)}"
            await db.commit()
            await manager.broadcast(rid, {"type": "error", "message": str(e), "budget": budget.to_dict()})
        except Exception as e:
            logger.error("research_failed", run_id=rid, error=str(e))
            run.status = "failed"
            run.error = str(e)
            await db.commit()
            await manager.broadcast(rid, {"type": "error", "message": str(e)})


async def resume_research(run_id: uuid.UUID, edited_plan: dict | None = None):
    """Resume research after plan approval (Phase 2)."""
    rid = str(run_id)
    logger.info("research_resuming", run_id=rid)

    graph_data = _graphs.get(rid)
    if not graph_data:
        logger.error("research_resume_no_graph", run_id=rid)
        return

    graph = graph_data["graph"]
    metrics = graph_data["metrics"]
    budget = graph_data["budget"]

    config = {
        "configurable": {"thread_id": rid},
        "callbacks": [metrics],
    }

    # Build resume value
    resume_value = {"approved": True}
    if edited_plan:
        resume_value["edited_plan"] = edited_plan

    async with async_session() as db:
        run = await get_run(db, run_id)
        if not run:
            return

        try:
            # Resume the graph with the approval command
            resume_input = Command(resume=resume_value)
            completed = await _run_graph_phase(db, run, graph, config, resume_input, metrics, budget, rid)

            if completed:
                await _finalize_run(db, run, graph, config, metrics, rid)

        except MissingAPIKeyError as e:
            logger.error("research_missing_key", run_id=rid, error=str(e))
            run.status = "failed"
            run.error = str(e)
            await db.commit()
            await manager.broadcast(rid, {"type": "error", "message": str(e)})
        except BudgetExceededError as e:
            logger.error("research_budget_exceeded", run_id=rid, error=str(e))
            run.status = "failed"
            run.error = f"Budget exceeded: {str(e)}"
            await db.commit()
            await manager.broadcast(rid, {"type": "error", "message": str(e), "budget": budget.to_dict()})
        except Exception as e:
            logger.error("research_failed", run_id=rid, error=str(e))
            run.status = "failed"
            run.error = str(e)
            await db.commit()
            await manager.broadcast(rid, {"type": "error", "message": str(e)})
        finally:
            # Clean up stored graph
            _graphs.pop(rid, None)


async def _finalize_run(db: AsyncSession, run: Run, graph, config: dict, metrics: MetricsCollector, rid: str):
    """Finalize a completed research run — save report and broadcast completion."""
    final_state = await graph.aget_state(config)
    state_values = final_state.values if hasattr(final_state, "values") else {}

    run.plan = state_values.get("plan")
    run.report = state_values.get("report")
    run.report_markdown = state_values.get("report_markdown", "")
    run.status = "completed"
    run.completed_at = datetime.now(timezone.utc)
    await db.commit()

    totals = metrics.get_total_metrics()
    logger.info("research_completed", run_id=rid, total_tokens=totals.get("total_tokens", 0))
    await manager.broadcast(rid, {"type": "run_complete", "report_id": rid})


async def get_run(db: AsyncSession, run_id: uuid.UUID) -> Run | None:
    result = await db.execute(select(Run).where(Run.id == run_id))
    return result.scalar_one_or_none()


async def get_runs(db: AsyncSession, limit: int = 20, offset: int = 0) -> tuple[list[Run], int]:
    result = await db.execute(
        select(Run).order_by(Run.created_at.desc()).limit(limit).offset(offset)
    )
    runs = list(result.scalars().all())

    count_result = await db.execute(select(func.count(Run.id)))
    total = count_result.scalar() or 0

    return runs, total
