import json
from typing import Dict, Any, Tuple
from .file_tools import (
    read_file, write_file, patch_file, delete_file, create_directory, 
    list_directory, get_workspace_tree
)
from .terminal_tools import execute_terminal_command
from .search_tools import search_files, find_files_by_name
from .git_tools import git_status, git_diff, git_commit, git_init
from .project_tools import detect_project_type, get_project_summary
from ..database.database import log_tool_audit

TOOL_DEFINITIONS = [
    {
        "name": "read_file",
        "description": "Read content of a file inside the workspace.",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative file path from workspace root, e.g. 'index.html'"}
            },
            "required": ["path"]
        }
    },
    {
        "name": "write_file",
        "description": "Create a new file or overwrite an existing file with complete content.",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative file path, e.g. 'src/app.js'"},
                "content": {"type": "string", "description": "Complete text content to write into the file"}
            },
            "required": ["path", "content"]
        }
    },
    {
        "name": "patch_file",
        "description": "Replace a specific snippet in an existing file with new content.",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative file path to modify"},
                "target_content": {"type": "string", "description": "Exact text chunk in the file to replace"},
                "replacement_content": {"type": "string", "description": "New replacement text"}
            },
            "required": ["path", "target_content", "replacement_content"]
        }
    },
    {
        "name": "delete_file",
        "description": "Delete a file or directory in the workspace.",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative path to file or directory to delete"}
            },
            "required": ["path"]
        }
    },
    {
        "name": "create_directory",
        "description": "Create a new directory in the workspace.",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Directory path to create"}
            },
            "required": ["path"]
        }
    },
    {
        "name": "list_directory",
        "description": "List files and subdirectories in a given directory.",
        "parameters": {
            "type": "object",
            "properties": {
                "subpath": {"type": "string", "description": "Subdirectory to list (leave empty for workspace root)", "default": ""}
            }
        }
    },
    {
        "name": "execute_terminal_command",
        "description": "Execute a shell command in the project workspace (e.g., npm install, pytest, python script.py).",
        "parameters": {
            "type": "object",
            "properties": {
                "command": {"type": "string", "description": "Shell command to execute"},
                "timeout_seconds": {"type": "integer", "description": "Execution timeout in seconds", "default": 60}
            },
            "required": ["command"]
        }
    },
    {
        "name": "search_files",
        "description": "Search for text or regex patterns across workspace files.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Text or regex query to search for"},
                "is_regex": {"type": "boolean", "description": "Whether query is a regex pattern", "default": False}
            },
            "required": ["query"]
        }
    },
    {
        "name": "find_files_by_name",
        "description": "Find files by glob pattern, e.g. '*.html' or '**/*.ts'.",
        "parameters": {
            "type": "object",
            "properties": {
                "pattern": {"type": "string", "description": "Glob pattern to match"}
            },
            "required": ["pattern"]
        }
    },
    {
        "name": "git_status",
        "description": "Get git branch and working tree status.",
        "parameters": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "git_diff",
        "description": "Get git diff of unstaged changes.",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string", "description": "Optional specific file path"}
            }
        }
    },
    {
        "name": "git_commit",
        "description": "Stage all changes and commit with a message.",
        "parameters": {
            "type": "object",
            "properties": {
                "message": {"type": "string", "description": "Commit message"}
            },
            "required": ["message"]
        }
    },
    {
        "name": "get_project_summary",
        "description": "Get framework detection and structure summary of the workspace.",
        "parameters": {
            "type": "object",
            "properties": {}
        }
    }
]

def execute_tool(tool_name: str, args: Dict[str, Any]) -> Tuple[bool, Any]:
    """
    Executes the specified tool safely by name with argument validation and audit logging.
    Returns (success: bool, output: Any).
    """
    # Normalize tool name (strip namespace prefixes if model adds them)
    if tool_name.startswith("functions."):
        tool_name = tool_name[len("functions."):]
    elif tool_name.startswith("tools."):
        tool_name = tool_name[len("tools."):]

    try:
        if tool_name == "read_file":
            res = read_file(args.get("path", ""))
            log_tool_audit(tool_name, args, res[:200] if isinstance(res, str) else res, "success")
            return True, res
            
        elif tool_name == "write_file":
            res = write_file(args.get("path", ""), args.get("content", ""))
            log_tool_audit(tool_name, {"path": args.get("path")}, res, "success")
            return True, res
            
        elif tool_name == "patch_file":
            res = patch_file(args.get("path", ""), args.get("target_content", ""), args.get("replacement_content", ""))
            log_tool_audit(tool_name, {"path": args.get("path")}, res, "success")
            return True, res
            
        elif tool_name == "delete_file":
            res = delete_file(args.get("path", ""))
            log_tool_audit(tool_name, args, res, "success")
            return True, res
            
        elif tool_name == "create_directory":
            res = create_directory(args.get("path", ""))
            log_tool_audit(tool_name, args, res, "success")
            return True, res
            
        elif tool_name == "list_directory":
            res = list_directory(args.get("subpath", ""))
            log_tool_audit(tool_name, args, f"Found {len(res)} items", "success")
            return True, res
            
        elif tool_name == "execute_terminal_command":
            cmd_res = execute_terminal_command(args.get("command", ""), args.get("timeout_seconds", 60))
            out_str = f"Exit code: {cmd_res.exit_code}\nSTDOUT:\n{cmd_res.stdout}\nSTDERR:\n{cmd_res.stderr}"
            log_tool_audit(tool_name, {"command": args.get("command")}, out_str, "success" if cmd_res.success else "failed")
            return cmd_res.success, out_str
            
        elif tool_name == "search_files":
            res = search_files(args.get("query", ""), args.get("is_regex", False))
            log_tool_audit(tool_name, args, f"Found {len(res)} matches", "success")
            return True, res
            
        elif tool_name == "find_files_by_name":
            res = find_files_by_name(args.get("pattern", "*"))
            log_tool_audit(tool_name, args, res, "success")
            return True, res
            
        elif tool_name == "git_status":
            res = git_status()
            return True, res.model_dump()
            
        elif tool_name == "git_diff":
            res = git_diff(args.get("file_path"))
            return True, res
            
        elif tool_name == "git_commit":
            res = git_commit(args.get("message", "Update"))
            log_tool_audit(tool_name, args, res, "success")
            return True, res
            
        elif tool_name == "get_project_summary":
            res = get_project_summary()
            return True, res
            
        else:
            err = f"Unknown tool: '{tool_name}'"
            log_tool_audit(tool_name, args, err, "error")
            return False, err
            
    except Exception as e:
        err = f"Error executing tool '{tool_name}': {str(e)}"
        log_tool_audit(tool_name, args, err, "error")
        return False, err
