from app.config import settings
from app.logging import get_logger

logger = get_logger(module="budget")


class BudgetExceededError(Exception):
    """Raised when a run exceeds its token or cost budget."""
    def __init__(self, message: str, tokens_used: int, cost_used: float):
        self.tokens_used = tokens_used
        self.cost_used = cost_used
        super().__init__(message)


class BudgetTracker:
    """Tracks token usage and cost against per-run budgets."""

    def __init__(self, run_id: str, max_tokens: int | None = None, max_cost: float | None = None):
        self.run_id = run_id
        self.max_tokens = max_tokens or settings.max_tokens_per_run
        self.max_cost = max_cost or settings.max_cost_per_run
        self.tokens_used = 0
        self.cost_used = 0.0
        self._warning_sent = False

    def record_usage(self, tokens: int, cost: float):
        """Record token usage and check against budget."""
        self.tokens_used += tokens
        self.cost_used += cost

        # Check warning threshold
        token_ratio = self.tokens_used / self.max_tokens if self.max_tokens > 0 else 0
        cost_ratio = self.cost_used / self.max_cost if self.max_cost > 0 else 0

        if not self._warning_sent and (token_ratio >= settings.budget_warning_threshold or cost_ratio >= settings.budget_warning_threshold):
            self._warning_sent = True
            logger.warning(
                "budget_warning",
                run_id=self.run_id,
                tokens_used=self.tokens_used,
                max_tokens=self.max_tokens,
                cost_used=round(self.cost_used, 6),
                max_cost=self.max_cost,
                token_pct=round(token_ratio * 100, 1),
                cost_pct=round(cost_ratio * 100, 1),
            )

        # Check if budget exceeded
        if self.tokens_used > self.max_tokens:
            logger.error("budget_exceeded", run_id=self.run_id, reason="tokens", used=self.tokens_used, limit=self.max_tokens)
            raise BudgetExceededError(
                f"Token budget exceeded: {self.tokens_used:,} / {self.max_tokens:,} tokens",
                tokens_used=self.tokens_used,
                cost_used=self.cost_used,
            )

        if self.cost_used > self.max_cost:
            logger.error("budget_exceeded", run_id=self.run_id, reason="cost", used=round(self.cost_used, 6), limit=self.max_cost)
            raise BudgetExceededError(
                f"Cost budget exceeded: ${self.cost_used:.4f} / ${self.max_cost:.2f}",
                tokens_used=self.tokens_used,
                cost_used=self.cost_used,
            )

    @property
    def remaining_tokens(self) -> int:
        return max(0, self.max_tokens - self.tokens_used)

    @property
    def remaining_cost(self) -> float:
        return max(0.0, self.max_cost - self.cost_used)

    def to_dict(self) -> dict:
        return {
            "tokens_used": self.tokens_used,
            "max_tokens": self.max_tokens,
            "cost_used": round(self.cost_used, 6),
            "max_cost": self.max_cost,
            "remaining_tokens": self.remaining_tokens,
            "remaining_cost": round(self.remaining_cost, 6),
        }
