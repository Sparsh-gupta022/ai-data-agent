# Data Agent — Backend

An AI data-analysis agent built with **LangGraph** + **Gemini**, backed by **PostgreSQL**, exposed over a small **FastAPI** layer for the [`frontend/`](../frontend) app.

## Architecture

```
Next.js frontend  --HTTP-->  FastAPI (api/server.py)  --invoke()-->  LangGraph agents  --->  PostgreSQL / external APIs
```

- **`agents/sql_analyst.py`** — curates the question, builds a schema-aware prompt, generates SQL (Gemini), judges the SQL for safety (read-only only), executes it, then summarizes the result in plain language.
- **`agents/etl_analyst.py`** — plans an extraction (which API URL / output filename), extracts JSON, transforms with pandas (dedupe, drop empty columns/rows, normalize column names), loads to `data/extract/*.csv`, then summarizes the run.
- **`agents/data_agent.py`** — the "Auto" mode. Routes each request to the SQL analyst or the ETL analyst with a small classifier LLM call, then returns whichever result came back.
- **`utils/database.py`** — thin psycopg2 wrapper: schema introspection + query execution (both string and structured column/row form).
- **`utils/etl_tools.py`** — extract/transform/load helpers used by the ETL analyst.
- **`api/server.py`** — FastAPI app. Translates HTTP requests into agent invocations and normalizes results into one JSON contract.
- **`api/history_store.py`** — a JSON-file conversation log, structured the way a `conversations`/`messages` table pair would look, so it can be swapped for Postgres later without changing its interface.

## Setup

Requires Python 3.11+ and a PostgreSQL database already loaded with the ride-share schema (see `feed_db.py`).

```bash
cd Data_Agent
cp .env.example .env      # fill in GEMINI_API_KEY and your Postgres credentials
uv sync                   # or: pip install -e .
```

If you haven't loaded the database yet:

```bash
uv run feed_db.py
```

## Running the API

```bash
uv run uvicorn api.server:app --reload --port 8000
# or, without uv:
uvicorn api.server:app --reload --port 8000
```

Check it's up:

```bash
curl http://localhost:8000/api/health
```

## API Endpoints

### `POST /api/chat`
```json
{ "message": "Which payment method has the highest average transaction value?", "mode": "auto", "conversation_id": null }
```
`mode` is one of `"auto" | "sql" | "etl"`.

Response:
```json
{
  "success": true,
  "mode": "auto",
  "answer": "...",
  "generated_sql": "SELECT ... (sql mode / auto-routed-to-sql only)",
  "data": [["credit_card", 120], ["debit_card", 80]],
  "columns": ["payment_method", "txn_count"],
  "execution_time": 2.14,
  "metadata": {
    "conversation_id": "a1b2c3d4e5f6",
    "routed_mode": "sql",
    "is_safe_sql": "Yes",
    "safety_comments": "Read-only SELECT query.",
    "source_api": null,
    "records_extracted": null,
    "records_after_cleaning": null,
    "download_url": null
  },
  "error": null
}
```
Only the fields relevant to the mode that actually ran are populated; the rest are `null`.

### `GET /api/health`
Reports whether Postgres is reachable and whether `GEMINI_API_KEY` is set, without ever returning credential values.

### `GET /api/history`
Lightweight summaries of past conversations (id, title, timestamps, turn count).

### `GET /api/history/{conversation_id}`
Full turn-by-turn record for one conversation.

### `GET /api/download/{filename}`
Serves a CSV previously written by the ETL analyst into `data/extract/`. Filenames are sanitized so this can only ever serve files from that directory.

## Security notes

- The frontend never receives `.env` values or talks to Postgres directly, only this API does.
- `sql_analyst` runs every generated query through an LLM "judge" node that rejects anything but read-only `SELECT`s before execution.
- `/api/download` resolves only `os.path.basename(filename)` inside `data/extract/`, so path traversal outside that directory is not possible.

## Known limitations

- Conversation history is a single JSON file, adequate for local/demo use, not concurrent multi-user production.
- The ETL analyst infers the source URL and output filename from the request via an LLM call; unusual phrasing may produce an unexpected URL/filename. The pipeline fails cleanly (`status: "failed"`) rather than silently doing the wrong thing.
- There's no LangGraph node-level progress streaming; the frontend shows a stage-based loading indicator per mode rather than true live backend progress.
