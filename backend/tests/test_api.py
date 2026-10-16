import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.config import get_workspace_path

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_get_project_current():
    response = client.get("/api/projects/current")
    assert response.status_code == 200
    data = response.json()
    assert "workspace_root" in data
    assert "summary" in data

def test_get_files_tree():
    response = client.get("/api/files/tree")
    assert response.status_code == 200
    tree = response.json()
    assert "name" in tree
    assert "children" in tree

def test_save_and_read_file_api():
    # Save file
    save_res = client.post("/api/files/save", json={"path": "api_test.txt", "content": "Hello via API"})
    assert save_res.status_code == 200
    assert save_res.json()["success"] is True

    # Read file
    read_res = client.get("/api/files/content?path=api_test.txt")
    assert read_res.status_code == 200
    assert read_res.json()["content"] == "Hello via API"

    # Delete file
    del_res = client.delete("/api/files/delete?path=api_test.txt")
    assert del_res.status_code == 200

def test_preview_endpoint():
    response = client.get("/api/preview/")
    assert response.status_code == 200
    assert "html" in response.headers.get("content-type", "").lower()

def test_terminal_execute_api():
    response = client.post("/api/terminal/execute", json={"command": "python --version"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "Python" in (data["stdout"] + data["stderr"])

def test_root_serves_frontend():
    response = client.get("/")
    assert response.status_code == 200
    assert "AI Coding IDE" in response.text

def test_open_project_endpoint():
    current = client.get("/api/projects/current").json()["workspace_root"]
    # Open the current workspace root
    res = client.post("/api/projects/open", json={"path": current})
    assert res.status_code == 200
    assert res.json()["success"] is True

    # Test invalid directory
    res_bad = client.post("/api/projects/open", json={"path": "/nonexistent_folder_xyz_12345"})
    assert res_bad.status_code == 404

def test_resolve_run_endpoint():
    # Python file
    py_res = client.post("/api/terminal/resolve-run", json={"path": "main.py"})
    assert py_res.status_code == 200
    assert py_res.json()["type"] == "terminal"
    assert "python main.py" in py_res.json()["command"]

    # HTML file
    html_res = client.post("/api/terminal/resolve-run", json={"path": "index.html"})
    assert html_res.status_code == 200
    assert html_res.json()["type"] == "preview"


