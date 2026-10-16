import pytest
from pathlib import Path
from backend.app.core.config import get_workspace_path
from backend.app.core.security import sanitize_and_resolve_path, validate_command
from backend.app.tools.file_tools import write_file, read_file, patch_file, delete_file, list_directory
from backend.app.tools.terminal_tools import execute_terminal_command
from backend.app.tools import execute_tool

def test_sandboxing_blocks_escape():
    # Attempting to escape the workspace sandbox must raise PermissionError
    with pytest.raises(PermissionError):
        sanitize_and_resolve_path("../../../windows/system32/cmd.exe")

def test_file_write_and_read():
    res_write = write_file("test_sample.txt", "Hello AI Coding IDE!")
    assert "Successfully wrote" in res_write
    
    content = read_file("test_sample.txt")
    assert content == "Hello AI Coding IDE!"
    
    # Patch test
    res_patch = patch_file("test_sample.txt", "Hello", "Welcome to")
    assert "Successfully patched" in res_patch
    
    updated = read_file("test_sample.txt")
    assert updated == "Welcome to AI Coding IDE!"
    
    # Cleanup
    delete_file("test_sample.txt")

def test_command_validation_blocks_harmful():
    is_valid, reason = validate_command("rm -rf /")
    assert not is_valid
    assert "Dangerous command" in reason

def test_execute_safe_command():
    res = execute_terminal_command("python --version")
    assert res.success
    assert "Python" in (res.stdout + res.stderr)

def test_execute_tool_registry():
    success, out = execute_tool("get_project_summary", {})
    assert success
    assert "Project Type" in out
