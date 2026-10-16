from typing import Dict, Any

SAFE_TOOLS = {
    "read_file",
    "list_directory",
    "search_files",
    "get_project_structure",
    "git_status",
    "git_diff",
    "get_file_info",
}

MUTATING_TOOLS = {
    "write_file",
    "patch_file",
    "create_directory",
    "delete_file",
    "rename_file",
    "git_commit",
    "execute_terminal_command"
}

def is_tool_safe(tool_name: str) -> bool:
    return tool_name in SAFE_TOOLS

def requires_confirmation(tool_name: str, auto_approve_all: bool = False) -> bool:
    if auto_approve_all:
        return False
    return tool_name in MUTATING_TOOLS
