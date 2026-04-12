import json

from langchain_core.messages import HumanMessage, SystemMessage

from app.agents.llm import get_llm
from app.agents.state import ResearchState
from app.prompts.planner import get_planner_prompt


async def planner_node(state: ResearchState) -> dict:
    llm = get_llm(state["llm_provider"], state.get("api_keys"))
    prompt = get_planner_prompt(state["mode"])

    response = await llm.ainvoke([
        SystemMessage(content=prompt),
        HumanMessage(content=f"Research query: {state['query']}"),
    ])

    try:
        content = response.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        plan = json.loads(content.strip())
    except (json.JSONDecodeError, IndexError):
        plan = {"title": state["query"], "objective": state["query"], "sections": [], "search_queries": [], "scope": "general"}

    return {"plan": plan, "messages": [response]}
