import httpx
from langchain_core.tools import tool
from tenacity import retry, stop_after_attempt, wait_exponential

from app.cache import cache_get, cache_set
from app.config import settings
from app.logging import get_logger

logger = get_logger(module="serper_search")


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10), reraise=True)
async def _serper_request(query: str, max_results: int) -> dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            "https://google.serper.dev/search",
            json={"q": query, "num": max_results},
            headers={"X-API-KEY": settings.serper_api_key, "Content-Type": "application/json"},
        )
        response.raise_for_status()
        return response.json()


@tool
async def serper_search(query: str, max_results: int = 5) -> list[dict]:
    """Search the web using Serper (Google). Returns a list of results with url, title, snippet."""
    # Check cache first
    cached = await cache_get("serper_search", query=query, max_results=max_results)
    if cached is not None:
        logger.info("cache_hit", tool="serper_search", query=query)
        return cached

    data = await _serper_request(query, max_results)
    results = [
        {
            "url": r["link"],
            "title": r.get("title", ""),
            "snippet": r.get("snippet", ""),
            "relevance_score": 1.0 - (r.get("position", 1) - 1) * 0.1,
            "source": "serper",
        }
        for r in data.get("organic", [])[:max_results]
    ]

    await cache_set("serper_search", results, query=query, max_results=max_results)
    logger.info("search_completed", tool="serper_search", query=query, results=len(results))
    return results
