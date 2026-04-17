import queue
from crewai import Crew, Process

from tasks import create_tasks

# Maps task completion order → agent display info
AGENT_SEQUENCE = [
    {
        "name": "Search Specialist",
        "status": "Searching the web with multiple targeted queries...",
    },
    {
        "name": "Content Analyst",
        "status": "Scraping and analyzing content from top sources...",
    },
    {
        "name": "Research Synthesizer",
        "status": "Synthesizing all findings into a comprehensive report...",
    },
]


def run_research(query: str, event_queue: queue.Queue) -> None:
    """
    Run the full CrewAI research pipeline and push SSE-ready dicts
    into event_queue. Puts None as the final sentinel.

    Event types emitted:
      {"type": "agent_start",    "agent": str, "status": str}
      {"type": "task_complete",  "agent": str, "summary": str}
      {"type": "result",         "content": str, "source": "deep_research"}
      {"type": "error",          "content": str}
      None  (sentinel – signals stream end)
    """
    task_counter = [0]

    def on_task_complete(task_output) -> None:
        idx = task_counter[0]
        task_counter[0] += 1

        agent_name = (
            AGENT_SEQUENCE[idx]["name"] if idx < len(AGENT_SEQUENCE) else "Agent"
        )

        if hasattr(task_output, "raw") and task_output.raw:
            summary = str(task_output.raw)[:400]
        else:
            summary = str(task_output)[:400]

        event_queue.put(
            {"type": "task_complete", "agent": agent_name, "summary": summary}
        )

        next_idx = idx + 1
        if next_idx < len(AGENT_SEQUENCE):
            event_queue.put(
                {
                    "type": "agent_start",
                    "agent": AGENT_SEQUENCE[next_idx]["name"],
                    "status": AGENT_SEQUENCE[next_idx]["status"],
                }
            )

    try:
        tasks, agents = create_tasks(query)

        event_queue.put(
            {
                "type": "agent_start",
                "agent": AGENT_SEQUENCE[0]["name"],
                "status": AGENT_SEQUENCE[0]["status"],
            }
        )

        crew = Crew(
            agents=agents,
            tasks=tasks,
            process=Process.sequential,
            task_callback=on_task_complete,
            verbose=False,
        )

        result = crew.kickoff()

        if hasattr(result, "raw") and result.raw:
            content = result.raw
        else:
            content = str(result)

        event_queue.put({"type": "result", "content": content, "source": "deep_research"})

    except Exception as exc:
        event_queue.put({"type": "error", "content": f"Research failed: {exc}"})

    finally:
        event_queue.put(None)
