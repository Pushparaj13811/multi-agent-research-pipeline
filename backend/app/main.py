from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.cache import close_redis
from app.config import settings
from app.logging import setup_logging, get_logger
from app.middleware.rate_limit import setup_rate_limiting
from app.observability.langsmith import setup_langsmith
from app.observability.otel import setup_otel

logger = get_logger(module="main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(settings.log_level)
    if not settings.encryption_key:
        logger.warning("encryption_key_missing", message="ENCRYPTION_KEY not set — API key storage will not work until configured")
    setup_langsmith()
    setup_otel()
    logger.info("application_started", version="0.1.0", otel_enabled=settings.enable_otel)
    yield
    await close_redis()
    logger.info("application_shutdown")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Multi-Agent Research Pipeline",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins.split(","),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    setup_rate_limiting(app)

    @app.get("/api/health")
    async def health():
        return {"status": "ok"}

    app.include_router(api_router)

    return app


app = create_app()
