import asyncio
from functools import lru_cache

from langchain_core.tools import tool
from tavily import TavilyClient
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings


@lru_cache
def _get_client() -> TavilyClient:
    return TavilyClient(api_key=settings.tavily_api_key)


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10), reraise=True)
def _extract_with_retry(client: TavilyClient, url: str) -> dict:
    return client.extract(urls=[url])


@tool
async def tavily_extract(url: str) -> dict:
    """Extract content from a URL using Tavily. Returns url and extracted content."""
    client = _get_client()
    response = await asyncio.to_thread(_extract_with_retry, client, url)
    results = response.get("results", [])
    if not results:
        return {"url": url, "content": "", "extraction_method": "tavily"}
    return {
        "url": url,
        "content": results[0].get("raw_content", ""),
        "extraction_method": "tavily",
    }
