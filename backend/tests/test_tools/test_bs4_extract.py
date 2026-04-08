from unittest.mock import AsyncMock, patch

import pytest

from app.tools.bs4_extract import bs4_extract


SAMPLE_HTML = """
<html>
<head><title>Test Page</title></head>
<body>
<article>
<h1>Main Heading</h1>
<p>This is the main content of the article.</p>
<p>Second paragraph with more details.</p>
</article>
<nav>Navigation links</nav>
<footer>Footer stuff</footer>
</body>
</html>
"""


@pytest.mark.asyncio
async def test_bs4_extract_returns_content():
    mock_response = AsyncMock()
    mock_response.text = SAMPLE_HTML
    mock_response.raise_for_status = lambda: None

    with patch("app.tools.bs4_extract.httpx.AsyncClient") as mock_cls:
        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_cls.return_value = mock_client

        result = await bs4_extract.ainvoke({"url": "https://example.com"})
        assert result["url"] == "https://example.com"
        assert "main content" in result["content"].lower()
        assert result["extraction_method"] == "beautifulsoup"
