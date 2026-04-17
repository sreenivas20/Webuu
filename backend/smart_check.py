"""
Ask the LLM whether it can answer a query from its training knowledge,
without running the full 3-agent research crew.

Returns (knows: bool, answer: str | None).
"""

import os

from dotenv import load_dotenv

load_dotenv()


def check_llm_knowledge(query: str) -> tuple[bool, str | None]:
    try:
        import litellm

        from prompts import KNOWLEDGE_CHECK_PROMPT

        prompt = KNOWLEDGE_CHECK_PROMPT.format(query=query)

        response = litellm.completion(
            model="groq/llama-3.3-70b-versatile",
            api_key=os.getenv("GROQ_API_KEY"),
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=3000,
        )

        answer = response.choices[0].message.content.strip()

        if answer.upper().startswith("NEEDS_RESEARCH"):
            return False, None

        return True, answer

    except Exception:
        return False, None
