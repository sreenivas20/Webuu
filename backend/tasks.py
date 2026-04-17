from crewai import Task

from agents import create_analyst_agent, create_search_agent, create_synthesizer_agent
from prompts import (
    ANALYSIS_TASK_DESCRIPTION,
    ANALYSIS_TASK_EXPECTED_OUTPUT,
    SEARCH_TASK_DESCRIPTION,
    SEARCH_TASK_EXPECTED_OUTPUT,
    SYNTHESIS_TASK_DESCRIPTION,
    SYNTHESIS_TASK_EXPECTED_OUTPUT,
)


def create_tasks(query: str):
    """
    Build the three research tasks with context chaining and return
    (tasks_list, agents_list) ready to be passed to Crew.
    """
    search_agent      = create_search_agent()
    analyst_agent     = create_analyst_agent()
    synthesizer_agent = create_synthesizer_agent()

    search_task = Task(
        description=SEARCH_TASK_DESCRIPTION.format(query=query),
        expected_output=SEARCH_TASK_EXPECTED_OUTPUT,
        agent=search_agent,
    )

    analysis_task = Task(
        description=ANALYSIS_TASK_DESCRIPTION,
        expected_output=ANALYSIS_TASK_EXPECTED_OUTPUT,
        agent=analyst_agent,
        context=[search_task],
    )

    synthesis_task = Task(
        description=SYNTHESIS_TASK_DESCRIPTION.format(query=query),
        expected_output=SYNTHESIS_TASK_EXPECTED_OUTPUT,
        agent=synthesizer_agent,
        context=[search_task, analysis_task],
    )

    return (
        [search_task, analysis_task, synthesis_task],
        [search_agent, analyst_agent, synthesizer_agent],
    )
