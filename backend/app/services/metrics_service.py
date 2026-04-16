import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Run, AgentStep, StepMetrics
from app.schemas.metrics import RunMetricsResponse, StepMetricsResponse


async def get_run_metrics(db: AsyncSession, run_id: uuid.UUID) -> RunMetricsResponse | None:
    result = await db.execute(
        select(Run).where(Run.id == run_id)
    )
    run = result.scalar_one_or_none()
    if not run:
        return None

    steps_result = await db.execute(
        select(AgentStep)
        .where(AgentStep.run_id == run_id)
        .options(selectinload(AgentStep.metrics))
        .order_by(AgentStep.started_at)
    )
    steps = steps_result.scalars().all()

    step_responses = []
    total_tokens = 0
    total_cost = 0.0
    total_duration = 0
    total_tool_calls = 0

    for step in steps:
        m = step.metrics
        if m:
            step_responses.append(StepMetricsResponse(
                agent=step.agent,
                input_tokens=m.input_tokens,
                output_tokens=m.output_tokens,
                total_tokens=m.total_tokens,
                cost_usd=float(m.cost_usd) if m.cost_usd else None,
                model_name=m.model_name,
                tool_calls=m.tool_calls or 0,
                tool_names=m.tool_names or [],
                duration_ms=step.duration_ms,
                langsmith_url=m.langsmith_url,
            ))
            total_tokens += m.total_tokens or 0
            total_cost += float(m.cost_usd or 0)
            total_duration += step.duration_ms or 0
            total_tool_calls += m.tool_calls or 0

    return RunMetricsResponse(
        run_id=run_id,
        status=run.status,
        total_tokens=total_tokens,
        total_cost_usd=total_cost,
        total_duration_ms=total_duration,
        total_tool_calls=total_tool_calls,
        steps=step_responses,
    )
