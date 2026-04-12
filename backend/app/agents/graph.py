from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, START, END
from langgraph.types import interrupt

from app.agents.state import ResearchState
from app.agents.planner import planner_node
from app.agents.searcher import searcher_node
from app.agents.reader import reader_node
from app.agents.writer import writer_node

# Registry of active graph instances (keyed by run_id)
# Needed so resume_research can access the same graph+checkpointer
_graphs: dict[str, dict] = {}


def plan_approval_node(state: ResearchState) -> dict:
    """Human-in-the-loop: interrupt for plan approval."""
    plan = state.get("plan")
    approval = interrupt({
        "type": "plan_ready",
        "plan": plan,
        "message": "Please review and approve the research plan.",
    })

    if isinstance(approval, dict):
        edited_plan = approval.get("edited_plan")
        if edited_plan:
            return {"plan": edited_plan, "plan_approved": True}
    return {"plan_approved": True}


def build_research_graph(checkpointer=None):
    if checkpointer is None:
        checkpointer = MemorySaver()

    graph = StateGraph(ResearchState)

    graph.add_node("planner", planner_node)
    graph.add_node("plan_approval", plan_approval_node)
    graph.add_node("searcher", searcher_node)
    graph.add_node("reader", reader_node)
    graph.add_node("writer", writer_node)

    graph.add_edge(START, "planner")
    graph.add_edge("planner", "plan_approval")
    graph.add_edge("plan_approval", "searcher")
    graph.add_edge("searcher", "reader")
    graph.add_edge("reader", "writer")
    graph.add_edge("writer", END)

    compiled = graph.compile(checkpointer=checkpointer)
    return compiled
