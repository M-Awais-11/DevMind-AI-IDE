import json
import asyncio
from typing import List, Dict, Any, Optional, Callable, Awaitable
from ..services.ai_service import ai_service
from ..services.context_service import context_service
from ..tools import execute_tool
from ..database.database import save_chat_message, get_chat_history

class AgentRunner:
    def __init__(self, max_steps: int = 8):
        self.max_steps = max_steps

    async def run(
        self,
        user_prompt: str,
        session_id: str = "default",
        active_file: Optional[str] = None,
        open_files: Optional[List[str]] = None,
        event_callback: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None
    ) -> Dict[str, Any]:
        """
        Executes the ReAct agent loop for the given user prompt.
        Streams status updates, plan items, tool calls, and final response.
        """
        async def emit(event_type: str, data: Any):
            if event_callback:
                try:
                    await event_callback({"type": event_type, "data": data})
                except Exception:
                    pass

        await emit("status", {"message": "Analyzing project and instructions..."})

        # Fetch prior session history (only non-error messages)
        history = get_chat_history(session_id)
        system_content = context_service.build_system_context(active_file, open_files)
        
        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": system_content}
        ]

        # Append recent history (last 6 messages, skipping errors)
        for h in history[-6:]:
            if h.get("metadata", {}).get("error"):
                continue
            role = "user" if h["sender"] == "user" else "assistant"
            messages.append({"role": role, "content": h["content"]})

        # Append current user prompt
        messages.append({"role": "user", "content": user_prompt})
        save_chat_message(session_id, "user", user_prompt)

        steps_log = []
        final_answer = ""

        for step in range(1, self.max_steps + 1):
            await emit("status", {"message": f"Agent Reasoning (Step {step}/{self.max_steps})...", "step": step})

            ai_res = await ai_service.call_openrouter(messages)
            
            if ai_res.get("error"):
                err_msg = ai_res.get("message", "Unknown error contacting OpenRouter AI")
                await emit("error", {"message": err_msg})
                save_chat_message(session_id, "agent", err_msg, {"error": True})
                return {"success": False, "answer": err_msg, "steps": steps_log}

            raw_text = ai_res.get("message", "")
            native_tool_calls = ai_res.get("tool_calls") or []

            # Check if native tool calls exist; if not, check text for fallback tool calls
            is_native = bool(native_tool_calls)
            tool_calls = native_tool_calls

            if not tool_calls:
                fallback_calls = ai_service.parse_fallback_tool_calls(raw_text)
                if fallback_calls:
                    tool_calls = fallback_calls
                    is_native = False

            # If the model didn't call any tools, this is the final response
            if not tool_calls:
                final_answer = raw_text
                await emit("message", {"content": final_answer})
                break

            # Append assistant's message correctly based on native vs fallback
            if is_native:
                assistant_msg: Dict[str, Any] = {
                    "role": "assistant",
                    "content": raw_text or None,
                    "tool_calls": native_tool_calls
                }
                messages.append(assistant_msg)
            else:
                assistant_msg = {
                    "role": "assistant",
                    "content": raw_text or ""
                }
                messages.append(assistant_msg)

            if raw_text and not raw_text.strip().startswith("```"):
                await emit("thought", {"content": raw_text.strip()})

            for call in tool_calls:
                fn = call.get("function", {})
                tool_name = fn.get("name")
                raw_args = fn.get("arguments", "{}")
                
                try:
                    args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
                except Exception:
                    args = {}

                await emit("tool_call", {"tool": tool_name, "args": args})

                # Execute tool
                success, output = execute_tool(tool_name, args)
                output_str = str(output)

                await emit("tool_result", {
                    "tool": tool_name,
                    "success": success,
                    "output": output_str[:500] + ("..." if len(output_str) > 500 else "")
                })

                steps_log.append({
                    "step": step,
                    "tool": tool_name,
                    "args": args,
                    "success": success,
                    "output_preview": output_str[:200]
                })

                # Append tool result to context
                if is_native:
                    # Native OpenAI tool response strictly requires role: 'tool' and matching tool_call_id
                    messages.append({
                        "role": "tool",
                        "tool_call_id": call.get("id", f"call_{step}"),
                        "content": output_str
                    })
                else:
                    # Fallback text tool response appended as user observation (never violates OpenAI schema)
                    messages.append({
                        "role": "user",
                        "content": f"[Tool Execution Result for {tool_name}]:\n{output_str}"
                    })

            # Small delay to prevent tight rate limiting on free endpoints
            await asyncio.sleep(0.3)

        if not final_answer and steps_log:
            final_answer = f"Completed actions across {len(steps_log)} steps."

        await emit("status", {"message": "Done", "completed": True})
        save_chat_message(session_id, "agent", final_answer, {"steps": steps_log})
        
        return {"success": True, "answer": final_answer, "steps": steps_log}

agent_runner = AgentRunner()
