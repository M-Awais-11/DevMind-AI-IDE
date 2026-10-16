import httpx
import json
import re
from typing import List, Dict, Any, Optional, Tuple
from ..core.config import settings
from ..tools import TOOL_DEFINITIONS

SYSTEM_PROMPT = """You are an expert AI Software Engineer integrated into an AI Coding IDE.
You help developers create, debug, explain, and refactor software projects by taking real actions.

You have access to the following workspace tools:
{tool_descriptions}

HOW TO EXECUTE TOOLS:
You can call tools using standard tool calling, OR by outputting a tool block in your response formatted exactly as:
```tool_call
{{
  "tool": "<tool_name>",
  "args": {{ ... }}
}}
```

GUIDELINES:
1. Always first inspect the project or relevant files before modifying code if you don't know the existing structure.
2. Formulate a clear, concise plan of the steps you are taking.
3. Write clean, complete, production-quality code. Avoid placeholders or truncation.
4. When you create or update files, make sure paths are relative to workspace root (e.g. 'index.html', 'src/app.js').
5. After creating or modifying files, if a build, syntax check, or test is appropriate, execute it to verify.
6. Summarize your accomplishments cleanly to the user.
"""

def get_tool_descriptions() -> str:
    lines = []
    for tool in TOOL_DEFINITIONS:
        lines.append(f"- {tool['name']}: {tool['description']}")
        lines.append(f"  Params: {json.dumps(tool['parameters'].get('properties', {}))}")
    return "\n".join(lines)

class OpenRouterAIService:
    def __init__(self):
        pass

    async def call_openrouter(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        api_key: Optional[str] = None,
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        """Calls the OpenRouter chat completions API."""
        key = api_key or settings.OPENROUTER_API_KEY
        target_model = model or settings.OPENROUTER_MODEL or "google/gemini-2.0-flash-exp:free"
        
        if not key or key.strip() == "":
            return {
                "error": True,
                "message": (
                    "⚠️ OpenRouter API Key is not set!\n\n"
                    "Please click the **Settings** icon in the top right or bottom of the IDE, "
                    "or enter your free API key from [OpenRouter.ai](https://openrouter.ai/keys) "
                    "into `backend/.env` (OPENROUTER_API_KEY)."
                ),
                "raw_response": None
            }

        headers = {
            "Authorization": f"Bearer {key.strip()}",
            "HTTP-Referer": "http://localhost:4200",
            "X-Title": "AI Coding IDE",
            "Content-Type": "application/json"
        }

        # Format tools for OpenAI standard
        formatted_tools = [
            {
                "type": "function",
                "function": {
                    "name": t["name"],
                    "description": t["description"],
                    "parameters": t["parameters"]
                }
            }
            for t in TOOL_DEFINITIONS
        ]

        payload = {
            "model": target_model,
            "messages": messages,
            "tools": formatted_tools,
            "tool_choice": "auto",
            "temperature": temperature
        }

        async with httpx.AsyncClient(timeout=90.0) as client:
            try:
                response = await client.post(
                    f"{settings.OPENROUTER_BASE_URL.rstrip('/')}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    err_body = response.text
                    return {
                        "error": True,
                        "message": f"OpenRouter Error ({response.status_code}): {err_body}",
                        "raw_response": None
                    }
                    
                data = response.json()
                choice = data["choices"][0]
                message = choice["message"]
                
                return {
                    "error": False,
                    "message": message.get("content") or "",
                    "tool_calls": message.get("tool_calls", []),
                    "raw_response": data
                }
            except httpx.TimeoutException:
                return {
                    "error": True,
                    "message": "OpenRouter API request timed out. Please try again.",
                    "raw_response": None
                }
            except Exception as e:
                return {
                    "error": True,
                    "message": f"Connection error contacting OpenRouter: {str(e)}",
                    "raw_response": None
                }

    def parse_fallback_tool_calls(self, text: str) -> List[Dict[str, Any]]:
        """
        Parses text for markdown tool call blocks like:
        ```tool_call
        {"tool": "write_file", "args": {"path": "index.html", "content": "..."}}
        ```
        Allows free models that don't emit native tool_calls to invoke tools seamlessly.
        """
        if not text:
            return []
            
        calls = []
        patterns = [
            r"```(?:tool_call|json|action)\s*(\{[\s\S]*?\})\s*```",
            r"<tool_call>\s*(\{[\s\S]*?\})\s*</tool_call>"
        ]
        
        for pat in patterns:
            for match in re.finditer(pat, text):
                raw_json = match.group(1).strip()
                try:
                    parsed = json.loads(raw_json)
                    tool_name = parsed.get("tool") or parsed.get("name") or parsed.get("function")
                    args = parsed.get("args") or parsed.get("parameters") or parsed.get("arguments") or {}
                    if tool_name:
                        calls.append({
                            "id": f"call_fb_{len(calls)}",
                            "type": "function",
                            "function": {
                                "name": tool_name,
                                "arguments": json.dumps(args) if isinstance(args, dict) else str(args)
                            }
                        })
                except Exception:
                    continue
                    
        return calls

ai_service = OpenRouterAIService()
