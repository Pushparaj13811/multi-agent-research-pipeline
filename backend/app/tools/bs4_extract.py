import httpx
from bs4 import BeautifulSoup
from langchain_core.tools import tool
from tenacity import retry, stop_after_attempt, wait_exponential


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10), reraise=True)
async def _fetch_url(url: str) -> str:
    async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
        response = await client.get(url, headers={"User-Agent": "ResearchAgent/1.0"})
        response.raise_for_status()
        return response.text


@tool
async def bs4_extract(url: str) -> dict:
    """Extract content from a URL using BeautifulSoup. Fallback extractor. Returns url and extracted text."""
    html = await _fetch_url(url)
    soup = BeautifulSoup(html, "lxml")

    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    article = soup.find("article")
    if article:
        text = article.get_text(separator="\n", strip=True)
    else:
        text = soup.get_text(separator="\n", strip=True)

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    content = "\n".join(lines)

    if len(content) > 10000:
        content = content[:10000] + "\n\n[Content truncated...]"

    return {"url": url, "content": content, "extraction_method": "beautifulsoup"}
