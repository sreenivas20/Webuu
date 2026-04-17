from typing import Type

import requests
from bs4 import BeautifulSoup
from crewai.tools import BaseTool
from duckduckgo_search import DDGS
from pydantic import BaseModel, Field


# ─── Input schemas ────────────────────────────────────────────────────────────

class SearchInput(BaseModel):
    query: str = Field(..., description="Search query to look up on DuckDuckGo")


class ScrapeInput(BaseModel):
    url: str = Field(..., description="Full URL of the page to scrape")


# ─── Tools ───────────────────────────────────────────────────────────────────

class DuckDuckGoSearchTool(BaseTool):
    name: str = "DuckDuckGo Web Search"
    description: str = (
        "Search the web using DuckDuckGo. Returns titles, URLs, and text snippets "
        "for the most relevant results. Use this to discover sources on a topic."
    )
    args_schema: Type[BaseModel] = SearchInput

    def _run(self, query: str) -> str:
        try:
            with DDGS() as ddgs:
                raw = list(ddgs.text(query, max_results=8))

            if not raw:
                return f"No results found for: {query}"

            lines = [f"Search results for: {query}\n"]
            for i, r in enumerate(raw, 1):
                lines.append(
                    f"{i}. {r.get('title', 'No title')}\n"
                    f"   URL: {r.get('href', 'N/A')}\n"
                    f"   {r.get('body', 'No snippet')}\n"
                )
            return "\n".join(lines)

        except Exception as exc:
            return f"Search failed: {exc}"


class WebScraperTool(BaseTool):
    name: str = "Web Page Scraper"
    description: str = (
        "Fetch a web page and extract its readable text content. "
        "Use this to read the full content of a URL found in search results."
    )
    args_schema: Type[BaseModel] = ScrapeInput

    def _run(self, url: str) -> str:
        try:
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                )
            }
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")

            # Remove non-content tags
            for tag in soup(["script", "style", "nav", "footer",
                              "header", "aside", "form", "iframe"]):
                tag.decompose()

            text = soup.get_text(separator="\n", strip=True)
            # Collapse blank lines
            lines = [ln for ln in text.splitlines() if ln.strip()]
            content = "\n".join(lines)

            if len(content) > 4000:
                content = content[:4000] + "\n\n[Content truncated at 4000 chars]"

            return f"Content from {url}:\n\n{content}"

        except Exception as exc:
            return f"Failed to scrape {url}: {exc}"
