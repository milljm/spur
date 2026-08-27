# Spur

A branched RAG chat UI. The engine is [`dynamic-rag-chat`](https://github.com/milljm/dynamic-rag-chat); this repo is only the view.

`spur-server.py` in that repo is the HTTP contract. Read it to learn the hooks (`/api/session`, `/api/branches*`, `/api/history*`, `/api/chat` SSE). Spur talks to it over `VITE_CHAT_API`.

## Run

Two processes.

**1. Adapter** (from `dynamic-rag-chat`, same venv you already use):

```bash
uv run --with fastapi --with uvicorn spur-server.py
```

It loads `.chat.yaml`, so LM Studio / Ollama / keys are whatever the terminal app already uses. OpenAPI lives at `http://127.0.0.1:8765/docs`.

**2. UI** (this repo):

```bash
npm install
cp .env.example .env   # VITE_CHAT_API=http://127.0.0.1:8765
npm run dev
```

Open the address Vite prints.

Without `VITE_CHAT_API`, the UI is demo mode and never talks to your pickle.

## What Spur does not own

History, RAG, branch lock rules, agent tools, and `save_history` stay in `chat.py`. Do not copy `spur-server.py` here — it will drift. Edit the adapter next to `chat.py`.
