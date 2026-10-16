from typing import List
from ..services.ai_service import ai_service

PLANNER_SYSTEM_PROMPT = """You are an expert Project Planner in an AI IDE.
Given a user request and project summary, break down the execution into a logical, ordered checklist of concrete actions.
Keep steps concise (4-7 steps max). Format each step on a new line starting with a number, e.g.:
1. Inspect existing project structure
2. Create index.html with responsive layout
3. Add style.css with dark mode variables
4. Verify by checking created files
"""

async def generate_plan(request_text: str, project_summary: str) -> List[str]:
    """Generates an initial plan of action for the user's request."""
    messages = [
        {"role": "system", "content": PLANNER_SYSTEM_PROMPT},
        {"role": "user", "content": f"Project summary:\n{project_summary}\n\nUser request:\n{request_text}"}
    ]
    res = await ai_service.call_openrouter(messages, temperature=0.1)
    if res.get("error"):
        return ["1. Analyze request", "2. Execute requested changes", "3. Verify workspace"]
        
    lines = [line.strip() for line in res.get("message", "").splitlines() if line.strip() and (line.strip()[0].isdigit() or line.strip().startswith("-"))]
    return lines if lines else ["1. Analyze project", "2. Modify files", "3. Test and verify"]
