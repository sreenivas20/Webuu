"""
Search result cache backed by a local JSON file.

TTLs:
  deep_research  — 24 hours
  llm_knowledge  — 7 days
"""

import hashlib
import json
import os
import time
from typing import Optional

_CACHE_FILE = os.path.join(os.path.dirname(__file__), "search_cache.json")

DEEP_RESEARCH_TTL = 24 * 60 * 60        # 24 hours
LLM_KNOWLEDGE_TTL = 7  * 24 * 60 * 60   # 7 days


def _normalize(query: str) -> str:
    return query.lower().strip()


def _cache_key(query: str) -> str:
    return hashlib.md5(_normalize(query).encode()).hexdigest()


def _load() -> dict:
    if not os.path.exists(_CACHE_FILE):
        return {}
    try:
        with open(_CACHE_FILE, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except Exception:
        return {}


def _write(data: dict) -> None:
    try:
        with open(_CACHE_FILE, "w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)
    except Exception:
        pass


def get(query: str) -> Optional[dict]:
    """Return cached entry if it exists and has not expired, else None."""
    cache = _load()
    key   = _cache_key(query)
    entry = cache.get(key)
    if not entry:
        return None

    ttl = (
        LLM_KNOWLEDGE_TTL
        if entry.get("source") == "llm_knowledge"
        else DEEP_RESEARCH_TTL
    )
    if time.time() - entry.get("timestamp", 0) > ttl:
        del cache[key]
        _write(cache)
        return None

    entry["count"] = entry.get("count", 1) + 1
    entry["last_accessed"] = time.time()
    cache[key] = entry
    _write(cache)
    return entry


def save(query: str, result: str, source: str) -> None:
    """Persist a result (upsert — increments count on re-save)."""
    cache    = _load()
    key      = _cache_key(query)
    existing = cache.get(key, {})
    cache[key] = {
        "query":          _normalize(query),
        "query_original": query,
        "result":         result,
        "source":         source,
        "timestamp":      time.time(),
        "count":          existing.get("count", 0) + 1,
        "last_accessed":  time.time(),
    }
    _write(cache)


def get_frequent(limit: int = 5) -> list:
    """Return up to *limit* non-expired entries sorted by access count."""
    cache = _load()
    now   = time.time()
    valid = []
    for entry in cache.values():
        ttl = (
            LLM_KNOWLEDGE_TTL
            if entry.get("source") == "llm_knowledge"
            else DEEP_RESEARCH_TTL
        )
        if now - entry.get("timestamp", 0) <= ttl:
            valid.append({
                "query":  entry["query_original"],
                "count":  entry.get("count", 1),
                "source": entry.get("source", "deep_research"),
            })
    return sorted(valid, key=lambda x: x["count"], reverse=True)[:limit]
