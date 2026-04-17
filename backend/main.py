import asyncio
import json
import os
import queue
import threading

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

import cache as search_cache
from smart_check import check_llm_knowledge

app = FastAPI(
    title="WEBUU",
    version="2.0.0",
    description="Deep research powered by CrewAI + Groq — with smart caching",
)

_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
_FRONTEND_URL = os.getenv("FRONTEND_URL")
if _FRONTEND_URL:
    _ALLOWED_ORIGINS.append(_FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SearchRequest(BaseModel):
    query: str


@app.get("/health")
async def health():
    return {"status": "ok", "message": "WEBUU backend is running"}


@app.get("/api/frequent")
async def frequent_searches():
    return {"searches": search_cache.get_frequent(limit=8)}


@app.post("/api/search")
async def search(request: SearchRequest):
    """
    Smart research endpoint — three-tier routing:
      1. Cache hit       → instant result
      2. LLM knowledge   → answer from training data (~2 s)
      3. Deep research   → full 3-agent CrewAI crew (~90 s)
    """
    query = request.query.strip()
    if not query:
        return {"error": "Query cannot be empty"}

    async def event_stream():
        loop = asyncio.get_running_loop()

        # ── Tier 1: Cache ──────────────────────────────────────────────────
        cached = search_cache.get(query)
        if cached:
            yield _sse({"type": "source_info", "source": "cache",
                        "cached_source": cached.get("source", "deep_research")})
            yield _sse({"type": "result",
                        "content": cached["result"],
                        "source": "cache",
                        "cached_source": cached.get("source", "deep_research")})
            yield _sse({"type": "done"})
            return

        # ── Tier 2: LLM knowledge check ────────────────────────────────────
        knows, llm_answer = await loop.run_in_executor(
            None, lambda: check_llm_knowledge(query)
        )

        if knows and llm_answer:
            yield _sse({"type": "source_info", "source": "llm_knowledge"})
            yield _sse({"type": "agent_start",
                        "agent": "WEBUU AI",
                        "status": "Answering from training knowledge…"})
            yield _sse({"type": "task_complete",
                        "agent": "WEBUU AI",
                        "summary": "Report generated from AI training knowledge"})
            yield _sse({"type": "result",
                        "content": llm_answer,
                        "source": "llm_knowledge"})
            yield _sse({"type": "done"})
            search_cache.save(query, llm_answer, "llm_knowledge")
            return

        # ── Tier 3: Full deep research crew ────────────────────────────────
        yield _sse({"type": "source_info", "source": "deep_research"})

        event_queue: queue.Queue = queue.Queue()

        def run_crew():
            from crew import run_research
            run_research(query, event_queue)

        threading.Thread(target=run_crew, daemon=True).start()

        result_content = None

        while True:
            try:
                item = await loop.run_in_executor(
                    None,
                    lambda: event_queue.get(timeout=180),
                )

                if item is None:
                    yield _sse({"type": "done"})
                    break

                if item.get("type") == "result":
                    result_content = item.get("content", "")

                yield _sse(item)

            except queue.Empty:
                yield _sse({"type": "heartbeat"})

            except Exception as exc:
                yield _sse({"type": "error", "content": str(exc)})
                break

        if result_content:
            search_cache.save(query, result_content, "deep_research")

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
