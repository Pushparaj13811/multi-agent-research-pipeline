import json

from langchain_core.messages import HumanMessage
from langgraph.prebuilt import create_react_agent

from app.agents.llm import get_llm
from app.agents.state import ResearchState
from app.prompts.searcher import SEARCHER_PROMPT
from app.tools.tavily_search import tavily_search
from app.tools.serper_search import serper_search


async def searcher_node(state: ResearchState) -> dict:
    plan = state["plan"]
    if not plan:
        return {"search_results": []}

    llm = get_llm(state["llm_provider"], state.get("api_keys"))
    tools = [tavily_search, serper_search]

    search_agent = create_react_agent(
        model=llm,
        tools=tools,
        prompt=SEARCHER_PROMPT,
    )

    queries = plan.get("search_queries", [])
    queries_text = "\n".join(f"- {q}" for q in queries)

    result = await search_agent.ainvoke({
        "messages": [
            HumanMessage(content=f"Execute these search queries and return results:\n{queries_text}")
        ]
    })

    search_results = []
    seen_urls = set()
    for msg in result["messages"]:
        if msg.type == "tool" and isinstance(msg.content, str):
            try:
                data = json.loads(msg.content)
                if isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict) and "url" in item and item["url"] not in seen_urls:
                            seen_urls.add(item["url"])
                            search_results.append(item)
            except (json.JSONDecodeError, TypeError):
                pass

    return {"search_results": search_results, "messages": result["messages"]}
