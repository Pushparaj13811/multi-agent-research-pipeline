from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


LLMProviderType = Literal["openai", "anthropic", "bedrock"]


class APIKeyConfig(BaseModel):
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    bedrock_api_key: str | None = None  # Bedrock API key
    aws_access_key_id: str | None = None  # Alternative: AWS credentials
    aws_secret_access_key: str | None = None
    aws_region: str = "us-east-1"
    bedrock_model_id: str = "anthropic.claude-3-sonnet-20240229-v1:0"


class CreateResearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    mode: Literal["topic", "paper", "competitive"]
    llm_provider: LLMProviderType = "openai"
    max_tokens: int | None = Field(None, description="Max tokens for this run (overrides server default)")
    max_cost_usd: float | None = Field(None, description="Max cost in USD for this run (overrides server default)")
    api_keys: APIKeyConfig | None = Field(None, description="User-provided API keys (not stored on server)")


class ValidateKeysRequest(BaseModel):
    api_keys: APIKeyConfig
    provider: LLMProviderType


class ValidateKeysResponse(BaseModel):
    valid: bool
    provider: str
    message: str


class ApprovePlanRequest(BaseModel):
    approved: bool
    edited_plan: dict | None = None


class RunResponse(BaseModel):
    id: UUID
    query: str
    mode: str
    llm_provider: str
    status: str
    plan: dict | None = None
    report: dict | None = None
    report_markdown: str | None = None
    created_at: datetime
    completed_at: datetime | None = None
    error: str | None = None

    model_config = {"from_attributes": True}


class RunListResponse(BaseModel):
    runs: list[RunResponse]
    total: int


class CreateRunResponse(BaseModel):
    run_id: UUID
