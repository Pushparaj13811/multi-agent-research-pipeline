import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import User, Run
from app.schemas import RunMetricsResponse
from app.services.metrics_service import get_run_metrics

router = APIRouter(prefix="/api/runs", tags=["metrics"])


@router.get("/{run_id}/metrics", response_model=RunMetricsResponse)
async def get_metrics(
    run_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Run).where(Run.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if run.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    metrics = await get_run_metrics(db, run_id)
    if not metrics:
        raise HTTPException(status_code=404, detail="Metrics not found")
    return metrics
