"""
FastAPI layer for the Data Agent.

This file does NOT reimplement any agent logic. It is a thin HTTP boundary:

    Frontend (Next.js)  -->  this API  -->  agents/*.py (LangGraph)  -->  Postgres / Gemini / external APIs

Run with:
    uv run uvicorn api.server:app --reload --port 8000
or:
    uvicorn api.server:app --reload --port 8000
"""

import os
import sys
import time
import traceback

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from langchain_core.messages import HumanMessage

from api.schemas import ChatRequest, ChatResponse, ChatMetadata, HealthResponse
from api import history_store
from utils.etl_tools import ETLTools

app = FastAPI(title="Data Agent API", version="0.1.0")

# The Next.js dev server defaults to :3000; allow it (and a couple of common
# alternates) explicitly rather than "*", since this API is meant to sit
# behind a real frontend, not be a public open endpoint.
FRONTEND_ORIGINS = [
    o.strip()
    for o in os.getenv("FRONTEND_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Agents are imported lazily inside the request handlers rather than at
# module scope. Importing agents.data_agent pulls in langchain_google_genai
# and constructs an LLM client, which requires GEMINI_API_KEY to be set; we
# want a missing/broken key to produce a clean 503 on /api/chat, not crash
# the whole API process on startup.
# ---------------------------------------------------------------------------

def _get_agents():
    from agents.sql_analyst import sql_analyst
    from agents.etl_analyst import etl_analyst
    from agents.data_agent import data_agent
    return sql_analyst, etl_analyst, data_agent


@app.get("/api/health", response_model=HealthResponse)
def health():
    db_ok = False
    db_detail = ""
    try:
        from utils.database import DatabaseUtil
        conn_details = {
            "host": os.getenv("host"),
            "port": os.getenv("port"),
            "user": os.getenv("user"),
            "password": os.getenv("password"),
            "dbname": os.getenv("database"),
        }
        db = DatabaseUtil(conn_details)
        db_ok = db.connection is not None
        if db.connection:
            db.connection.close()
    except Exception as e:
        db_detail = "database check failed"

    llm_configured = bool(os.getenv("GEMINI_API_KEY"))

    status = "ok" if (db_ok and llm_configured) else "degraded"
    return HealthResponse(
        status=status,
        database=db_ok,
        llm_configured=llm_configured,
        details=db_detail or None,
    )


@app.get("/api/history")
def get_history():
    return {"conversations": history_store.list_conversations()}


@app.get("/api/history/{conversation_id}")
def get_conversation(conversation_id: str):
    convo = history_store.get_conversation(conversation_id)
    if convo is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return convo


@app.get("/api/download/{filename}")
def download_file(filename: str):
    # Only allow serving files that live directly inside data/extract/,
    # never an arbitrary path on disk.
    safe_name = os.path.basename(filename)
    file_path = os.path.join(ETLTools.OUTPUT_DIR, safe_name)

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path, media_type="text/csv", filename=safe_name)


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    conversation_id = request.conversation_id or history_store.new_conversation_id()
    start = time.time()

    try:
        sql_analyst, etl_analyst, data_agent = _get_agents()
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail="Backend is not fully configured (missing GEMINI_API_KEY or a dependency failed to load).",
        ) from e

    try:
        if request.mode == "sql":
            response_payload, routed_mode = _run_sql(sql_analyst, request.message), "sql"
        elif request.mode == "etl":
            response_payload, routed_mode = _run_etl(etl_analyst, request.message), "etl"
        else:
            response_payload, routed_mode = _run_auto(data_agent, request.message)

    except Exception as e:
        traceback.print_exc()
        elapsed = time.time() - start
        error_response = ChatResponse(
            success=False,
            mode=request.mode,
            answer="Something went wrong while processing your request. Please try again.",
            execution_time=round(elapsed, 3),
            metadata=ChatMetadata(conversation_id=conversation_id),
            error="internal_error",
        )
        history_store.append_turn(conversation_id, request.mode, request.message, error_response.model_dump())
        return error_response

    elapsed = time.time() - start
    response_payload.execution_time = round(elapsed, 3)
    response_payload.metadata.conversation_id = conversation_id
    response_payload.metadata.routed_mode = routed_mode

    history_store.append_turn(conversation_id, request.mode, request.message, response_payload.model_dump())
    return response_payload


def _run_sql(sql_analyst, message: str) -> ChatResponse:
    input_schema = {
        "messages": [],
        "user_ques": message,
        "curated_ques": "",
        "prompt_query_context": "",
        "generated_sql_query": "",
        "is_safe": "No",
        "comments": "",
        "sql_query_execution_result": "",
        "final_answer": "",
    }
    result = sql_analyst.invoke(input_schema)

    return ChatResponse(
        success=True,
        mode="sql",
        answer=result.get("final_answer", ""),
        generated_sql=result.get("generated_sql_query") or None,
        data=result.get("result_rows") or None,
        columns=result.get("result_columns") or None,
        metadata=ChatMetadata(
            conversation_id="",  # filled in by caller
            is_safe_sql=result.get("is_safe"),
            safety_comments=result.get("comments") or None,
        ),
    )


def _run_etl(etl_analyst, message: str) -> ChatResponse:
    result = etl_analyst.invoke({"messages": [], "user_request": message})

    download_url = None
    if result.get("status") == "success" and result.get("output_path"):
        download_url = f"/api/download/{os.path.basename(result['output_path'])}"

    return ChatResponse(
        success=result.get("status") == "success",
        mode="etl",
        answer=result.get("final_answer", ""),
        metadata=ChatMetadata(
            conversation_id="",
            source_api=result.get("api_url") or None,
            records_extracted=result.get("raw_record_count"),
            records_after_cleaning=result.get("clean_record_count"),
            download_url=download_url,
        ),
        error=result.get("error") or None,
    )


def _run_auto(data_agent, message: str):
    result = data_agent.invoke({"messages": [HumanMessage(content=message)], "route_response": ""})
    routed_mode = result.get("route_response", "sql")

    if routed_mode == "etl":
        etl_result = result.get("etl_result") or {}
        download_url = None
        if etl_result.get("status") == "success" and etl_result.get("output_path"):
            download_url = f"/api/download/{os.path.basename(etl_result['output_path'])}"

        response = ChatResponse(
            success=etl_result.get("status") == "success",
            mode="auto",
            answer=result.get("final_answer", ""),
            metadata=ChatMetadata(
                conversation_id="",
                source_api=etl_result.get("api_url") or None,
                records_extracted=etl_result.get("raw_record_count"),
                records_after_cleaning=etl_result.get("clean_record_count"),
                download_url=download_url,
            ),
            error=etl_result.get("error") or None,
        )
    else:
        sql_result = result.get("sql_result") or {}
        response = ChatResponse(
            success=True,
            mode="auto",
            answer=result.get("final_answer", ""),
            generated_sql=sql_result.get("generated_sql_query") or None,
            data=sql_result.get("result_rows") or None,
            columns=sql_result.get("result_columns") or None,
            metadata=ChatMetadata(
                conversation_id="",
                is_safe_sql=sql_result.get("is_safe"),
                safety_comments=sql_result.get("comments") or None,
            ),
        )

    return response, routed_mode
