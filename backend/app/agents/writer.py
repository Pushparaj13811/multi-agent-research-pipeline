import json

from langchain_core.messages import HumanMessage, SystemMessage

from app.agents.llm import get_llm
from app.agents.state import ResearchState
from app.prompts.writer import get_writer_prompt


async def writer_node(state: ResearchState) -> dict:
    llm = get_llm(state["llm_provider"], state.get("api_keys"))
    prompt = get_writer_prompt(state["mode"])

    plan = state.get("plan", {})
    extracted = state.get("extracted_content", [])

    context_parts = []
    for i, item in enumerate(extracted, 1):
        url = item.get("url", "unknown")
        content = item.get("content", item.get("summary", ""))
        if len(content) > 3000:
            content = content[:3000] + "..."
        context_parts.append(f"### Source {i}: {url}\n{content}")

    context = "\n\n".join(context_parts)

    response = await llm.ainvoke([
        SystemMessage(content=prompt),
        HumanMessage(content=f"""Research Plan:
{json.dumps(plan, indent=2)}

Extracted Content:
{context}

Write the complete research report following the plan structure. Return ONLY the JSON object."""),
    ])

    try:
        content = response.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        report = json.loads(content.strip())
    except (json.JSONDecodeError, IndexError):
        report = {
            "title": plan.get("title", state["query"]),
            "summary": "Report generation encountered an error.",
            "sections": [],
            "key_findings": [],
            "sources": [],
        }

    md_parts = [f"# {report.get('title', '')}\n", f"_{report.get('summary', '')}_\n"]
    for section in report.get("sections", []):
        md_parts.append(f"## {section['name']}\n")
        md_parts.append(section.get("content", "") + "\n")
    report_markdown = "\n".join(md_parts)

    return {"report": report, "report_markdown": report_markdown, "messages": [response]}
