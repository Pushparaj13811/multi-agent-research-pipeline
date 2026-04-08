from unittest.mock import patch

import pytest

from app.tools.tavily_extract import tavily_extract


@pytest.mark.asyncio
async def test_tavily_extract_returns_content():
    mock_response = {
        "results": [
            {"url": "https://example.com", "raw_content": "Full article text here..."}
        ]
    }
    with patch("app.tools.tavily_extract._get_client") as mock_get:
        mock_client = mock_get.return_value
        mock_client.extract.return_value = mock_response
        result = await tavily_extract.ainvoke({"url": "https://example.com"})
        assert result["url"] == "https://example.com"
        assert "Full article text" in result["content"]


@pytest.mark.asyncio
async def test_tavily_extract_no_content():
    with patch("app.tools.tavily_extract._get_client") as mock_get:
        mock_client = mock_get.return_value
        mock_client.extract.return_value = {"results": []}
        result = await tavily_extract.ainvoke({"url": "https://example.com"})
        assert result["content"] == ""
