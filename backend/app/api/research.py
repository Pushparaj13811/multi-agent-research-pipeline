import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.middleware.rate_limit import limiter
from app.models import User
from app.schemas import CreateResearchRequest, CreateRunResponse, ApprovePlanRequest, ValidateKeysRequest, ValidateKeysResponse
from app.services.research_service import create_run, execute_research, get_run

router = APIRouter(prefix="/api/research", tags=["research"])


@router.post("", response_model=CreateRunResponse)
@limiter.limit("10/minute")
async def start_research(
    request: Request,
    body: CreateResearchRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    keys_dict = body.api_keys.model_dump() if body.api_keys else None
    run = await create_run(db, body.query, body.mode, body.llm_provider, user_id=user.id)
    background_tasks.add_task(execute_research, run.id, body.max_tokens, body.max_cost_usd, keys_dict, user.id)
    return CreateRunResponse(run_id=run.id)


@router.post("/{run_id}/approve")
@limiter.limit("30/minute")
async def approve_plan(
    request: Request,
    run_id: uuid.UUID,
    body: ApprovePlanRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    run = await get_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if run.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this run")
    if run.status != "awaiting_approval":
        raise HTTPException(status_code=400, detail=f"Run is not awaiting approval, status: {run.status}")

    # Resume the graph in background
    from app.services.research_service import resume_research
    background_tasks.add_task(resume_research, run_id, body.edited_plan if body.edited_plan else None)

    return {"status": "approved"}


@router.post("/validate-keys", response_model=ValidateKeysResponse)
@limiter.limit("20/minute")
async def validate_api_keys(
    request: Request,
    body: ValidateKeysRequest,
    user: User = Depends(get_current_user),
):
    from app.agents.llm import get_llm
    try:
        keys_dict = body.api_keys.model_dump()
        llm = get_llm(body.provider, keys_dict)
        await llm.ainvoke([{"role": "user", "content": "Hi"}])
        return ValidateKeysResponse(valid=True, provider=body.provider, message="API key is valid")
    except Exception as e:
        return ValidateKeysResponse(valid=False, provider=body.provider, message=str(e))
