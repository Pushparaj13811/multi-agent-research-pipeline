import json
from unittest.mock import AsyncMock, patch

import pytest

from app.agents.planner import planner_node


@pytest.mark.asyncio
async def test_planner_returns_valid_plan():
    mock_plan = {
        "title": "LLM Scaling Laws",
        "objective": "Understand scaling laws",
        "sections": [{"name": "Intro", "description": "Overview", "search_queries": ["scaling laws"]}],
        "search_queries": ["LLM scaling laws"],
        "scope": "Academic",
    }
    mock_response = AsyncMock()
    mock_response.content = json.dumps(mock_plan)
    mock_response.type = "ai"

    with patch("app.agents.planner.get_llm") as mock_get_llm:
        mock_llm = AsyncMock()
        mock_llm.ainvoke.return_value = mock_response
        mock_get_llm.return_value = mock_llm

        state = {
            "messages": [],
            "query": "What are LLM scaling laws?",
            "mode": "topic",
            "llm_provider": "openai",
            "plan": None,
            "plan_approved": False,
            "search_results": [],
            "extracted_content": [],
            "report": None,
            "run_id": "test-id",
        }

        result = await planner_node(state)
        assert result["plan"]["title"] == "LLM Scaling Laws"
        assert len(result["plan"]["sections"]) == 1
