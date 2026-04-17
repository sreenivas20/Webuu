import os

from crewai import Agent
from crewai.llm import LLM
from dotenv import load_dotenv

from prompts import (
    ANALYST_AGENT_BACKSTORY,
    ANALYST_AGENT_GOAL,
    ANALYST_AGENT_ROLE,
    SEARCH_AGENT_BACKSTORY,
    SEARCH_AGENT_GOAL,
    SEARCH_AGENT_ROLE,
    SYNTHESIZER_AGENT_BACKSTORY,
    SYNTHESIZER_AGENT_GOAL,
    SYNTHESIZER_AGENT_ROLE,
)
from tools import DuckDuckGoSearchTool, WebScraperTool

load_dotenv()


def get_llm() -> LLM:
    return LLM(
        model="groq/llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.7,
        max_tokens=4096,
    )


def create_search_agent() -> Agent:
    return Agent(
        role=SEARCH_AGENT_ROLE,
        goal=SEARCH_AGENT_GOAL,
        backstory=SEARCH_AGENT_BACKSTORY,
        tools=[DuckDuckGoSearchTool()],
        llm=get_llm(),
        verbose=False,
        max_iter=6,
    )


def create_analyst_agent() -> Agent:
    return Agent(
        role=ANALYST_AGENT_ROLE,
        goal=ANALYST_AGENT_GOAL,
        backstory=ANALYST_AGENT_BACKSTORY,
        tools=[WebScraperTool(), DuckDuckGoSearchTool()],
        llm=get_llm(),
        verbose=False,
        max_iter=8,
    )


def create_synthesizer_agent() -> Agent:
    return Agent(
        role=SYNTHESIZER_AGENT_ROLE,
        goal=SYNTHESIZER_AGENT_GOAL,
        backstory=SYNTHESIZER_AGENT_BACKSTORY,
        tools=[],
        llm=get_llm(),
        verbose=False,
        max_iter=4,
    )
