# Multi-Agent Research Pipeline with Observability

A production-grade multi-agent system that performs end-to-end research using specialized AI agents. Features real-time observability via LangSmith, custom metrics dashboard, and OpenTelemetry export.

## Architecture

```
User Query → FastAPI → LangGraph StateGraph
                         ├── Planner Agent (generates research plan)
                         ├── Human Approval (interrupt checkpoint)
                         ├── Searcher Agent (Tavily + Serper web search)
                         ├── Reader Agent (content extraction + summarization)
                         └── Writer Agent (report synthesis)
                              ↓
                         Structured Report (JSON + Markdown + PDF)
```

## Features

- **Multi-Agent Pipeline**: 4 specialized agents (Planner, Searcher, Reader, Writer) orchestrated via LangGraph StateGraph
- **3 Research Modes**: Topic Report, Academic Paper Analysis, Competitive Analysis
- **Configurable LLM**: Switch between OpenAI (GPT-4o) and Anthropic (Claude) per run
- **Human-in-the-Loop**: Plan approval checkpoint before execution proceeds
- **Real-Time Streaming**: WebSocket-powered live agent activity and metrics
- **3-Tier Observability**:
  - LangSmith auto-tracing (token usage, latency, tool calls)
  - Custom metrics dashboard (charts, cost breakdown, tool call log)
  - OpenTelemetry export (Jaeger, Grafana Tempo, Datadog compatible)
- **Report Output**: Structured JSON + rendered Markdown + PDF download
- **PostgreSQL Persistence**: Full run history with agent steps and metrics

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, LangGraph, LangChain |
| LLM | OpenAI GPT-4o, Anthropic Claude |
| Search | Tavily (primary), Serper (fallback) |
| Extraction | Tavily Extract, BeautifulSoup4 |
| Database | PostgreSQL, SQLAlchemy (async), Alembic |
| Observability | LangSmith, OpenTelemetry, custom metrics |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Charts | Recharts |
| PDF | WeasyPrint |

## Quick Start

### Option A: Docker (Recommended for production / Ubuntu server)

Everything runs in containers — zero host dependencies beyond Docker.

```bash
# 1. Copy and configure environment
cp .env.example .env
# Edit .env: set JWT_SECRET_KEY, ENCRYPTION_KEY, TAVILY_API_KEY, etc.

# 2. Start everything (builds multi-stage images, runs migrations automatically)
docker compose up -d

# 3. Open http://localhost
```

**With Jaeger observability:**
```bash
docker compose --profile otel up -d
# Jaeger UI: http://localhost:16686
```

**Docker architecture:**
- `frontend` — 3-stage build: deps → build → nginx (serves static + proxies API/WS)
- `backend` — 2-stage build: deps → runtime (WeasyPrint libs baked in, auto-migrates on start)
- `postgres` — persistent volume, health-checked
- `redis` — 128MB LRU cache, persistent volume
- `jaeger` (optional) — OTel trace viewer

### Option B: Local Development

**Prerequisites:** Python 3.12+, Node.js 18+, PostgreSQL, Redis

```bash
# 1. Start infrastructure
docker compose up -d postgres redis

# 2. Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env  # edit with your values
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 3. Frontend
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/research` | Start a new research run |
| POST | `/api/research/{id}/approve` | Approve/edit the research plan |
| GET | `/api/runs` | List all runs |
| GET | `/api/runs/{id}` | Get run details |
| GET | `/api/runs/{id}/metrics` | Get run metrics |
| GET | `/api/runs/{id}/report` | Get report (JSON + markdown) |
| GET | `/api/runs/{id}/report/pdf` | Download report as PDF |
| WS | `/ws/research/{id}` | Real-time agent updates |

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── agents/        # LangGraph nodes + state
│   │   ├── api/           # FastAPI routes + WebSocket
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── observability/ # LangSmith, metrics, OTel
│   │   ├── prompts/       # Mode-specific agent prompts
│   │   ├── schemas/       # Pydantic request/response models
│   │   ├── services/      # Business logic + PDF generation
│   │   └── tools/         # Search + extraction tools
│   ├── tests/
│   └── alembic/
├── frontend/
│   └── src/
│       ├── api/           # HTTP client + WebSocket hook
│       ├── components/    # React components
│       ├── pages/         # Route pages
│       └── types/         # TypeScript definitions
├── docker-compose.yml
└── docs/
```

## Environment Variables

See `.env.example` for all required variables. At minimum you need:

- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` (at least one LLM provider)
- `TAVILY_API_KEY` (primary search)
- `DATABASE_URL` (PostgreSQL connection)

## Testing

```bash
cd backend
python -m pytest tests/ -v
```
