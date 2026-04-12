import json

from langchain_core.messages import HumanMessage
from langgraph.prebuilt import create_react_agent

from app.agents.llm import get_llm
from app.agents.state import ResearchState
from app.prompts.reader import READER_PROMPT
from app.tools.tavily_extract import tavily_extract
from app.tools.bs4_extract import bs4_extract


async def reader_node(state: ResearchState) -> dict:
    search_results = state.get("search_results", [])
    if not search_results:
        return {"extracted_content": []}

    llm = get_llm(state["llm_provider"], state.get("api_keys"))
    tools = [tavily_extract, bs4_extract]

    reader_agent = create_react_agent(
        model=llm,
        tools=tools,
        prompt=READER_PROMPT,
    )

    urls = [r["url"] for r in search_results if r.get("url")][:12]
    urls_text = "\n".join(f"- {url}" for url in urls)

    result = await reader_agent.ainvoke({
        "messages": [
            HumanMessage(content=f"Extract content from these URLs:\n{urls_text}")
        ]
    })

    extracted = []
    for msg in result["messages"]:
        if msg.type == "tool" and isinstance(msg.content, str):
            try:
                data = json.loads(msg.content)
                if isinstance(data, dict) and "content" in data:
                    extracted.append(data)
            except (json.JSONDecodeError, TypeError):
                pass

    return {"extracted_content": extracted, "messages": result["messages"]}
