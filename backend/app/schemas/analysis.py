from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class QueryRequest(BaseModel):
    project_id: int
    image_id: Optional[int] = None
    pair_id: Optional[int] = None
    query: str
    parameters: Optional[Dict[str, Any]] = None

class ToolExecutionStep(BaseModel):
    step_number: int
    tool_name: str
    description: str
    status: str
    execution_time_ms: float
    inputs: Dict[str, Any]
    outputs: Dict[str, Any]
    validation_check: Optional[str] = None

class AnalysisJobResponse(BaseModel):
    id: int
    project_id: int
    image_id: Optional[int] = None
    pair_id: Optional[int] = None
    query: str
    status: str
    detected_intent: Optional[str] = None
    plan: Optional[List[Dict[str, Any]]] = None
    execution_trace: Optional[List[Dict[str, Any]]] = None
    result_text: Optional[str] = None
    confidence_score: Optional[float] = None
    visual_evidence: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    owner_email: Optional[str] = None
    owner_role: Optional[str] = None

    class Config:
        from_attributes = True

class TraceResponse(BaseModel):
    job_id: int
    status: str
    detected_intent: Optional[str]
    plan: Optional[List[Dict[str, Any]]]
    execution_trace: Optional[List[Dict[str, Any]]]
