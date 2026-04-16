from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.research import router as research_router
from app.api.runs import router as runs_router
from app.api.metrics import router as metrics_router
from app.api.report import router as report_router
from app.api.websocket import router as ws_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(research_router)
api_router.include_router(runs_router)
api_router.include_router(metrics_router)
api_router.include_router(report_router)
api_router.include_router(ws_router)
