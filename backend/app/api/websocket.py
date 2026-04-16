import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import decode_access_token
from app.database import async_session
from app.models import Run
from app.observability.callbacks import manager

router = APIRouter()


@router.websocket("/ws/research/{run_id}")
async def websocket_endpoint(websocket: WebSocket, run_id: str):
    # Authenticate via query parameter: ?token=<jwt>
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = payload.get("sub")

    # Verify user owns the run
    async with async_session() as db:
        result = await db.execute(select(Run).where(Run.id == run_id))
        run = result.scalar_one_or_none()
        if not run or (run.user_id and str(run.user_id) != user_id):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    await manager.connect(run_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "approve_plan":
                # Trigger graph resume
                import asyncio
                from app.services.research_service import resume_research
                asyncio.create_task(resume_research(
                    uuid.UUID(run_id),
                    data.get("edited_plan"),
                ))
    except WebSocketDisconnect:
        manager.disconnect(run_id, websocket)
