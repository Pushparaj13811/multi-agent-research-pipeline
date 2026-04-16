import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import User, Run
from app.schemas import RunResponse, RunListResponse

router = APIRouter(prefix="/api/runs", tags=["runs"])


@router.get("", response_model=RunListResponse)
async def list_runs(
    limit: int = 20,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Run).where(Run.user_id == user.id).order_by(Run.created_at.desc()).limit(limit).offset(offset)
    )
    runs = list(result.scalars().all())

    count_result = await db.execute(select(func.count(Run.id)).where(Run.user_id == user.id))
    total = count_result.scalar() or 0

    return RunListResponse(
        runs=[RunResponse.model_validate(r) for r in runs],
        total=total,
    )


@router.get("/{run_id}", response_model=RunResponse)
async def get_run_detail(
    run_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Run).where(Run.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if run.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this run")
    return RunResponse.model_validate(run)
