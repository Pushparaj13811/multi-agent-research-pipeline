import time
from dataclasses import dataclass, field

from langchain_core.callbacks import AsyncCallbackHandler
from langchain_core.outputs import LLMResult

from app.observability.budget import BudgetTracker


@dataclass
class StepMetric:
    agent: str = ""
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    cost_usd: float = 0.0
    model_name: str = ""
    tool_calls: int = 0
    tool_names: list[str] = field(default_factory=list)
    duration_ms: int = 0
    started_at: float = 0.0


MODEL_COSTS = {
    "gpt-4o": {"input": 2.50, "output": 10.00},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "claude-sonnet-4-20250514": {"input": 3.00, "output": 15.00},
}


def _estimate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    costs = MODEL_COSTS.get(model, {"input": 5.0, "output": 15.0})
    return (input_tokens * costs["input"] + output_tokens * costs["output"]) / 1_000_000


class MetricsCollector(AsyncCallbackHandler):
    def __init__(self, run_id: str, budget: BudgetTracker | None = None):
        self.run_id = run_id
        self.budget = budget
        self.current_step: StepMetric | None = None
        self.completed_steps: list[StepMetric] = []

    def start_step(self, agent: str):
        self.current_step = StepMetric(agent=agent, started_at=time.time())

    def end_step(self):
        if self.current_step:
            self.current_step.duration_ms = int((time.time() - self.current_step.started_at) * 1000)
            self.completed_steps.append(self.current_step)
            step = self.current_step
            self.current_step = None
            return step
        return None

    async def on_llm_end(self, response: LLMResult, **kwargs):
        if not self.current_step:
            return
        usage = response.llm_output or {}
        token_usage = usage.get("token_usage", {})
        self.current_step.input_tokens += token_usage.get("prompt_tokens", 0)
        self.current_step.output_tokens += token_usage.get("completion_tokens", 0)
        self.current_step.total_tokens += token_usage.get("total_tokens", 0)
        model = usage.get("model_name", "")
        if model:
            self.current_step.model_name = model
            self.current_step.cost_usd += _estimate_cost(
                model, token_usage.get("prompt_tokens", 0), token_usage.get("completion_tokens", 0)
            )

        # Check budget after recording usage
        if self.budget and self.current_step:
            tokens = token_usage.get("total_tokens", 0)
            cost = _estimate_cost(model, token_usage.get("prompt_tokens", 0), token_usage.get("completion_tokens", 0)) if model else 0
            if tokens > 0 or cost > 0:
                self.budget.record_usage(tokens, cost)

    async def on_tool_start(self, serialized: dict, input_str: str, **kwargs):
        if not self.current_step:
            return
        self.current_step.tool_calls += 1
        tool_name = serialized.get("name", "unknown")
        self.current_step.tool_names.append(tool_name)

    def get_total_metrics(self) -> dict:
        return {
            "total_tokens": sum(s.total_tokens for s in self.completed_steps),
            "total_cost_usd": sum(s.cost_usd for s in self.completed_steps),
            "total_duration_ms": sum(s.duration_ms for s in self.completed_steps),
            "total_tool_calls": sum(s.tool_calls for s in self.completed_steps),
        }
