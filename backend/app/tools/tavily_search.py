import asyncio
from functools import lru_cache

from langchain_core.tools import tool
from tavily import TavilyClient
from tenacity import retry, stop_after_attempt, wait_exponential

from app.cache import cache_get, cache_set
from app.config import settings
from app.logging import get_logger

logger = get_logger(module="tavily_search")


@lru_cache
def _get_client() -> TavilyClient:
    return TavilyClient(api_key=settings.tavily_api_key)


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10), reraise=True)
def _search_with_retry(client: TavilyClient, query: str, max_results: int) -> dict:
    return client.search(query=query, max_results=max_results)


@tool
async def tavily_search(query: str, max_results: int = 5) -> list[dict]:
    """Search the web using Tavily. Returns a list of results with url, title, snippet, and relevance_score."""
    # Check cache first
    cached = await cache_get("tavily_search", query=query, max_results=max_results)
    if cached is not None:
        logger.info("cache_hit", tool="tavily_search", query=query)
        return cached

    client = _get_client()
    response = await asyncio.to_thread(_search_with_retry, client, query, max_results)
    results = [
        {
            "url": r["url"],
            "title": r["title"],
            "snippet": r["content"],
            "relevance_score": r.get("score", 0.0),
            "source": "tavily",
        }
        for r in response.get("results", [])
    ]

    # Cache for 1 hour
    await cache_set("tavily_search", results, query=query, max_results=max_results)
    logger.info("search_completed", tool="tavily_search", query=query, results=len(results))
    return results
