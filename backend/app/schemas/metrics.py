from uuid import UUID

from pydantic import BaseModel


class StepMetricsResponse(BaseModel):
    agent: str
    input_tokens: int | None = None
    output_tokens: int | None = None
    total_tokens: int | None = None
    cost_usd: float | None = None
    model_name: str | None = None
    tool_calls: int = 0
    tool_names: list[str] = []
    duration_ms: int | None = None
    langsmith_url: str | None = None


class BudgetInfo(BaseModel):
    tokens_used: int = 0
    max_tokens: int = 100000
    cost_used: float = 0.0
    max_cost: float = 1.0
    remaining_tokens: int = 100000
    remaining_cost: float = 1.0


class RunMetricsResponse(BaseModel):
    run_id: UUID
    status: str
    total_tokens: int
    total_cost_usd: float
    total_duration_ms: int
    total_tool_calls: int
    steps: list[StepMetricsResponse]
    budget: BudgetInfo | None = None
