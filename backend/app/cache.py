import json
import hashlib
from typing import Any

import redis.asyncio as redis

from app.config import settings

_redis_client: redis.Redis | None = None


async def get_redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(settings.redis_url, decode_responses=True)
    return _redis_client


async def close_redis():
    global _redis_client
    if _redis_client:
        await _redis_client.aclose()
        _redis_client = None


def _make_cache_key(prefix: str, **kwargs) -> str:
    """Generate a deterministic cache key from prefix and kwargs."""
    raw = json.dumps(kwargs, sort_keys=True)
    hash_val = hashlib.sha256(raw.encode()).hexdigest()[:16]
    return f"research:{prefix}:{hash_val}"


async def cache_get(prefix: str, **kwargs) -> Any | None:
    """Get a cached value. Returns None on miss or Redis errors."""
    try:
        client = await get_redis()
        key = _make_cache_key(prefix, **kwargs)
        data = await client.get(key)
        if data:
            return json.loads(data)
    except Exception:
        pass
    return None


async def cache_set(prefix: str, value: Any, ttl: int | None = None, **kwargs):
    """Set a cached value. Silently fails on Redis errors."""
    try:
        client = await get_redis()
        key = _make_cache_key(prefix, **kwargs)
        await client.set(key, json.dumps(value), ex=ttl or settings.cache_ttl_seconds)
    except Exception:
        pass
