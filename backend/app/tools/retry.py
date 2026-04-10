import structlog
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)

logger = structlog.get_logger()


def with_retry(max_attempts: int = 3, min_wait: float = 1, max_wait: float = 10):
    """Decorator for retrying tool calls with exponential backoff."""
    return retry(
        stop=stop_after_attempt(max_attempts),
        wait=wait_exponential(multiplier=1, min=min_wait, max=max_wait),
        retry=retry_if_exception_type((ConnectionError, TimeoutError, Exception)),
        before_sleep=before_sleep_log(logger, "warning"),
        reraise=True,
    )
