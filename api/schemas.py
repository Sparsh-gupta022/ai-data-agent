from typing import Any, Literal, Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    mode: Literal["auto", "sql", "etl"] = "auto"
    conversation_id: Optional[str] = None


class ChatMetadata(BaseModel):
    conversation_id: str
    routed_mode: Optional[str] = None  # for "auto": which specialist actually handled it
    is_safe_sql: Optional[str] = None  # "Yes" / "No", sql mode only
    safety_comments: Optional[str] = None
    source_api: Optional[str] = None  # etl mode only
    records_extracted: Optional[int] = None
    records_after_cleaning: Optional[int] = None
    download_url: Optional[str] = None


class ChatResponse(BaseModel):
    success: bool
    mode: str
    answer: str
    generated_sql: Optional[str] = None
    data: Optional[list] = None
    columns: Optional[list] = None
    execution_time: Optional[float] = None
    metadata: ChatMetadata
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded", "down"]
    database: bool
    llm_configured: bool
    details: Optional[str] = None
