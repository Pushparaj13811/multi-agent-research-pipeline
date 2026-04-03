from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Search Providers (server-managed, not per-user)
    tavily_api_key: str = ""
    serper_api_key: str = ""

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/research_agent"

    # LangSmith
    langchain_tracing_v2: bool = True
    langchain_api_key: str = ""
    langchain_project: str = "multi-agent-research"

    # OpenTelemetry
    enable_otel: bool = False
    otel_exporter_otlp_endpoint: str = "http://localhost:4317"

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    cache_ttl_seconds: int = 3600  # 1 hour

    # Logging
    log_level: str = "INFO"

    # Cost Guardrails
    max_tokens_per_run: int = 100000  # 100K tokens max per run
    max_cost_per_run: float = 1.0    # $1.00 max per run
    budget_warning_threshold: float = 0.8  # warn at 80% of budget

    # Auth
    jwt_secret_key: str = "change-me-in-production-use-a-real-secret-key"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours

    # Encryption
    encryption_key: str = ""  # Fernet key for encrypting stored API keys

    # App
    cors_origins: str = "http://localhost:5173"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
