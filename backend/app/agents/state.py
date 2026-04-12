import operator
from typing import Annotated, Literal

from langgraph.graph import add_messages
from typing_extensions import TypedDict


class ResearchState(TypedDict):
    messages: Annotated[list, add_messages]
    query: str
    mode: Literal["topic", "paper", "competitive"]
    llm_provider: Literal["openai", "anthropic", "bedrock"]
    plan: dict | None
    plan_approved: bool
    search_results: Annotated[list[dict], operator.add]
    extracted_content: Annotated[list[dict], operator.add]
    report: dict | None
    report_markdown: str | None
    run_id: str
    token_budget: int
    cost_budget: float
    api_keys: dict | None
