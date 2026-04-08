from unittest.mock import AsyncMock, patch

import pytest

from app.tools.serper_search import serper_search


@pytest.mark.asyncio
async def test_serper_search_returns_results():
    mock_response_json = {
        "organic": [
            {"link": "https://example.com", "title": "Test", "snippet": "Snippet text", "position": 1}
        ]
    }
    mock_response = AsyncMock()
    mock_response.json.return_value = mock_response_json
    mock_response.raise_for_status = lambda: None

    with patch("app.tools.serper_search.httpx.AsyncClient") as mock_cls:
        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_cls.return_value = mock_client

        results = await serper_search.ainvoke({"query": "LLM scaling laws", "max_results": 5})
        assert len(results) == 1
        assert results[0]["url"] == "https://example.com"
        assert results[0]["source"] == "serper"
