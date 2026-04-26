"""
=============================================================================
  FastAPI Application — IoT Patient Health Monitoring API
=============================================================================
  Provides REST endpoints for authentication, patient data access,
  rule management, report generation, and EDA results.
=============================================================================
"""

import os
import sys
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# ── Local imports ─────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from security import (
    authenticate, validate_token, require_role,
    check_rate_limit, mask_dataframe, log_data_access,
    log_unauthorized_attempt, get_audit_log
)
from rules_engine import RuleEngine
from analysis import load_and_clean, run_full_eda
from report_generator import generate_patient_report, generate_system_report

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(SCRIPT_DIR, "data", "patient_vitals.csv")

# ── App Setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="IoT Patient Health Monitoring API",
    description="EDA, DSL Rules, Security & Report Generation",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global State ──────────────────────────────────────────────────────────────
rule_engine = RuleEngine()
_cached_df = None
_cached_alerts = None
_cached_eda = None


def get_data():
    """Load and cache the dataset."""
    global _cached_df
    if _cached_df is None:
        _cached_df = load_and_clean(DATA_PATH)
    return _cached_df


def get_alerts():
    """Compute and cache alerts."""
    global _cached_alerts
    if _cached_alerts is None:
        _cached_alerts = rule_engine.evaluate_dataset(get_data())
    return _cached_alerts


# ── Auth Dependency ───────────────────────────────────────────────────────────
def verify_token(authorization: str = Header(None)):
    """FastAPI dependency to validate JWT from Authorization header."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = authorization.replace("Bearer ", "")
    result = validate_token(token)
    if not result["valid"]:
        raise HTTPException(status_code=401, detail=result["message"])
    username = result["payload"]["sub"]
    if not check_rate_limit(username):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    return result["payload"]


# ── Pydantic Models ──────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class RuleCreate(BaseModel):
    name: str
    field: str
    operator: str
    value: float
    alert: str
    severity: str = "MEDIUM"
    description: str = ""


# ═══════════════════════════════════════════════════════════════════════════════
#  ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/login")
def login(req: LoginRequest):
    """Authenticate and receive a JWT token."""
    result = authenticate(req.username, req.password)
    if not result["success"]:
        raise HTTPException(status_code=401, detail=result["message"])
    return result


@app.get("/api/patients")
def list_patients(user=Depends(verify_token)):
    """List all patients (masked for non-admin users)."""
    df = get_data()
    log_data_access(user["sub"], "LIST_PATIENTS", "all")
    patients = df.groupby("patient_id").first().reset_index()
    cols = ["patient_id", "patient_name", "age", "gender", "condition"]
    result = patients[cols]
    if user["role"] != "Admin":
        result = mask_dataframe(result)
    return result.to_dict(orient="records")


@app.get("/api/patients/{patient_id}/vitals")
def get_patient_vitals(patient_id: str, user=Depends(verify_token)):
    """Get vitals data for a specific patient."""
    df = get_data()
    patient_df = df[df["patient_id"] == patient_id]
    if patient_df.empty:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    log_data_access(user["sub"], "VIEW_VITALS", patient_id)
    return patient_df.tail(50).to_dict(orient="records")


@app.get("/api/alerts")
def get_alerts_endpoint(user=Depends(verify_token)):
    """Get all triggered alerts."""
    alerts = get_alerts()
    log_data_access(user["sub"], "VIEW_ALERTS", "all")
    return alerts.to_dict(orient="records") if not alerts.empty else []


@app.get("/api/rules")
def list_rules(user=Depends(verify_token)):
    """List all DSL rules."""
    return rule_engine.list_rules()


@app.post("/api/rules")
def create_rule(rule: RuleCreate, user=Depends(verify_token)):
    """Add a new alert rule (Admin only)."""
    auth = require_role(
        user.get("_token", ""), "Admin"
    )
    new_rule = rule.dict()
    rule_engine.add_rule(new_rule)
    global _cached_alerts
    _cached_alerts = None  # Invalidate cache
    return {"message": "Rule added", "rule": new_rule}


@app.delete("/api/rules/{rule_id}")
def delete_rule(rule_id: str, user=Depends(verify_token)):
    """Remove a rule by ID (Admin only)."""
    rule_engine.remove_rule(rule_id)
    global _cached_alerts
    _cached_alerts = None
    return {"message": f"Rule {rule_id} removed"}


@app.get("/api/reports/patient/{patient_id}")
def download_patient_report(patient_id: str, user=Depends(verify_token)):
    """Generate and download a patient report PDF."""
    df = get_data()
    alerts = get_alerts()
    risk = rule_engine.get_risk_level(alerts, patient_id)
    chart = os.path.join(SCRIPT_DIR, "outputs", f"vitals_{patient_id}.png")
    path = generate_patient_report(patient_id, df, alerts, risk, chart_path=chart)
    if not path or not os.path.exists(path):
        raise HTTPException(status_code=500, detail="Report generation failed")
    log_data_access(user["sub"], "DOWNLOAD_REPORT", patient_id)
    return FileResponse(path, media_type="application/pdf",
                        filename=f"report_{patient_id}.pdf")


@app.get("/api/reports/system")
def download_system_report(user=Depends(verify_token)):
    """Generate and download the system overview report PDF."""
    from analysis import compute_summary_statistics, generate_insights
    df = get_data()
    alerts = get_alerts()
    stats = compute_summary_statistics(df)
    insights = generate_insights(df, alerts)
    risk_levels = {pid: rule_engine.get_risk_level(alerts, pid)
                   for pid in df["patient_id"].unique()}
    path = generate_system_report(df, alerts, stats, insights, risk_levels)
    if not path or not os.path.exists(path):
        raise HTTPException(status_code=500, detail="Report generation failed")
    log_data_access(user["sub"], "DOWNLOAD_SYSTEM_REPORT", "all")
    return FileResponse(path, media_type="application/pdf",
                        filename="system_report.pdf")


@app.get("/api/audit-log")
def view_audit_log(user=Depends(verify_token)):
    """View recent audit log entries (Admin only)."""
    if user["role"] != "Admin":
        log_unauthorized_attempt(user["sub"], "VIEW_AUDIT_LOG")
        raise HTTPException(status_code=403, detail="Admin access required")
    return {"entries": get_audit_log()}


@app.get("/api/health")
def health_check():
    """API health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}
