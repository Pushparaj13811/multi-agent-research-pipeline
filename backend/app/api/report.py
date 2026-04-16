import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import User, Run
from app.services.research_service import get_run
from app.services.report_service import markdown_to_pdf

router = APIRouter(prefix="/api/runs", tags=["report"])


@router.get("/{run_id}/report")
async def get_report(
    run_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    run = await get_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if run.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if not run.report:
        raise HTTPException(status_code=404, detail="Report not yet generated")
    return {"report": run.report, "markdown": run.report_markdown}


@router.get("/{run_id}/report/pdf")
async def get_report_pdf(
    run_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    run = await get_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if run.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if not run.report_markdown:
        raise HTTPException(status_code=404, detail="Report not yet generated")

    pdf_bytes = markdown_to_pdf(run.report_markdown)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report-{run_id}.pdf"},
    )
