from unittest.mock import AsyncMock, patch

import pytest

from app.tools.tavily_search import tavily_search


@pytest.mark.asyncio
async def test_tavily_search_returns_results():
    mock_response = {
        "results": [
            {"url": "https://example.com", "title": "Test", "content": "Snippet text", "score": 0.95}
        ]
    }
    with patch("app.tools.tavily_search._get_client") as mock_get:
        mock_client = mock_get.return_value
        mock_client.search.return_value = mock_response
        results = await tavily_search.ainvoke({"query": "LLM scaling laws", "max_results": 5})
        assert len(results) == 1
        assert results[0]["url"] == "https://example.com"
        assert results[0]["relevance_score"] == 0.95


@pytest.mark.asyncio
async def test_tavily_search_empty_results():
    with patch("app.tools.tavily_search._get_client") as mock_get:
        mock_client = mock_get.return_value
        mock_client.search.return_value = {"results": []}
        results = await tavily_search.ainvoke({"query": "nonexistent query xyz"})
        assert results == []
