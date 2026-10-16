# ⚡ AI Coding IDE

> A full-stack, AI-powered Integrated Development Environment (IDE) enabling developers to create, edit, debug, test, and manage software projects using natural-language instructions alongside a professional IDE interface.

---

## 🌟 Key Features

- **Monaco Code Editor**: Full-featured VS Code editor powered by Monaco with syntax highlighting (HTML, CSS, JS, TS, Python, JSON, Markdown), multiple tabs, unsaved changes indicator, and `Ctrl+S` auto-saving.
- **Autonomous AI Agent**: Multi-phase ReAct agent loop (Inspect $\rightarrow$ Plan $\rightarrow$ Execute Tools $\rightarrow$ Verify $\rightarrow$ Report) powered by **OpenRouter AI** with free models.
- **Controlled Tool System**:
  - `file_tools`: Sandboxed file operations (read, write, patch, delete, list, directory tree).
  - `terminal_tools`: Safe shell command execution inside the workspace directory.
  - `search_tools`: Regex and text search across project files.
  - `git_tools`: Source control tracking, diffs, commits, branch management.
  - `project_tools`: Project type detection (Angular, React, Node, Python, Static Web) and test runners.
- **Live Preview Panel**: Real-time website preview iframe rendering workspace HTML/CSS/JS with automatic refresh and URL bar.
- **Integrated Terminal**: Run shell commands directly in the sandboxed workspace.
- **Source Control (Git)**: Inspect modified and untracked files, stage changes, and commit with custom messages.
- **100% Free & Local Architecture**: Uses local SQLite database, local Python backend, and free models on OpenRouter AI.

---

## 🚀 Quick Start

### 1. Launch the IDE (One Command)
Run the launcher script:
```bash
python run_ide.py
```
This starts the backend on `http://127.0.0.1:8000` and automatically opens the complete IDE in your web browser!

### 2. Configure OpenRouter AI (Free Tier)
1. Click the **⚙ Settings** button in the top right header.
2. Enter your OpenRouter API Key (get a free key at [openrouter.ai/keys](https://openrouter.ai/keys)).
3. Select your free model (e.g. `google/gemini-2.0-flash-exp:free` or `qwen/qwen-2.5-coder-32b-instruct:free`).
4. Click **Save Configuration**.

---

## 💡 Example Natural-Language Prompts

In the AI Assistant panel on the right, you can give instructions like:

- *"Create a modern responsive portfolio website with hero, about, projects, contact form, and dark mode."*
- *"Add a navbar with smooth scrolling and animations."*
- *"Inspect my project and explain how the files are structured."*
- *"Find and fix the error in style.css."*
- *"Run git status and commit all my changes with message 'Initial release'."*

The AI Agent will formulate a plan, create or edit the required files, verify the result, and report its actions. You can preview the live website immediately in the **Live Preview** tab at the bottom!

---

## 📁 Project Architecture

```text
IDE/
├── backend/
│   ├── app/
│   │   ├── api/             # REST & WebSocket endpoints (files, git, chat, terminal)
│   │   ├── agents/          # ReAct agent engine & planners
│   │   ├── tools/           # Sandboxed file, terminal, search, and git tools
│   │   ├── services/        # OpenRouter AI client, context builder, live preview
│   │   ├── database/        # Local SQLite database for chats and audit logs
│   │   ├── core/            # Security sandboxing, path resolution, config
│   │   └── main.py          # FastAPI application entrypoint
│   ├── workspace/           # Sandboxed active project workspace
│   ├── tests/               # Pytest suite for backend & security
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/        # Services (FileService, AgentService, TerminalService, ApiService)
│   │   │   └── features/    # Editor, Explorer, Chat, Terminal, Git, Preview, Settings
│   │   ├── index.html
│   │   └── main.ts
│   ├── package.json
│   └── angular.json
│
├── run_ide.py               # One-click launcher
└── README.md
```

---

## 🧪 Running Automated Tests

Run backend tool and API tests:
```bash
python -m pytest backend/tests
```

Rebuild Angular frontend:
```bash
cd frontend
npm run build
```
