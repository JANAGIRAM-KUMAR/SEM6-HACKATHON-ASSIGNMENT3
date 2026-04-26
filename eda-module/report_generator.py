"""
=============================================================================
  Report Generator — PDF Reports for Patient Health Monitoring
=============================================================================
  Generates structured, professional PDF reports for individual patients
  and system-wide overviews using ReportLab.
=============================================================================
"""

import os
from datetime import datetime

import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, PageBreak, HRFlowable
)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Custom Styles ─────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    "ReportTitle", parent=styles["Title"],
    fontSize=22, textColor=colors.HexColor("#1565c0"),
    spaceAfter=6, alignment=TA_CENTER,
))
styles.add(ParagraphStyle(
    "SectionHeader", parent=styles["Heading2"],
    fontSize=14, textColor=colors.HexColor("#1565c0"),
    spaceBefore=16, spaceAfter=8,
    borderWidth=1, borderColor=colors.HexColor("#1565c0"),
    borderPadding=4,
))
styles.add(ParagraphStyle(
    "SubHeader", parent=styles["Heading3"],
    fontSize=11, textColor=colors.HexColor("#424242"),
    spaceBefore=8, spaceAfter=4,
))
styles.add(ParagraphStyle(
    "BodyText2", parent=styles["BodyText"],
    fontSize=10, leading=14, textColor=colors.HexColor("#333333"),
))
styles.add(ParagraphStyle(
    "RiskHigh", parent=styles["BodyText"],
    fontSize=12, textColor=colors.white, backColor=colors.HexColor("#d32f2f"),
    alignment=TA_CENTER, spaceBefore=4, spaceAfter=4,
    borderPadding=6,
))
styles.add(ParagraphStyle(
    "RiskMedium", parent=styles["BodyText"],
    fontSize=12, textColor=colors.black, backColor=colors.HexColor("#fbc02d"),
    alignment=TA_CENTER, spaceBefore=4, spaceAfter=4,
    borderPadding=6,
))
styles.add(ParagraphStyle(
    "RiskLow", parent=styles["BodyText"],
    fontSize=12, textColor=colors.white, backColor=colors.HexColor("#388e3c"),
    alignment=TA_CENTER, spaceBefore=4, spaceAfter=4,
    borderPadding=6,
))
styles.add(ParagraphStyle(
    "Footer", parent=styles["Normal"],
    fontSize=8, textColor=colors.gray, alignment=TA_CENTER,
))


def _risk_style(level: str):
    """Return the appropriate style for a risk level."""
    mapping = {"CRITICAL": "RiskHigh", "HIGH": "RiskHigh",
               "MEDIUM": "RiskMedium", "LOW": "RiskLow"}
    return styles[mapping.get(level, "RiskLow")]


def _make_table(data, col_widths=None):
    """Create a styled table from 2D list data."""
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1565c0")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#bdbdbd")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t


def _add_image(elements, image_path, width=6*inch):
    """Add an image to the report if the file exists."""
    if image_path and os.path.exists(image_path):
        img = Image(image_path, width=width, height=width*0.5)
        elements.append(img)
        elements.append(Spacer(1, 8))
    else:
        elements.append(Paragraph(f"<i>[Chart not available]</i>", styles["BodyText2"]))


# ═══════════════════════════════════════════════════════════════════════════════
#  INDIVIDUAL PATIENT REPORT
# ═══════════════════════════════════════════════════════════════════════════════

def generate_patient_report(
    patient_id: str,
    df: pd.DataFrame,
    alerts_df: pd.DataFrame,
    risk_level: str,
    insights: list = None,
    chart_path: str = None,
) -> str:
    """
    Generate a detailed PDF report for a single patient.
    Returns the output file path.
    """
    patient_df = df[df["patient_id"] == patient_id].sort_values("timestamp")
    if patient_df.empty:
        print(f"[REPORT] No data for patient {patient_id}")
        return ""

    patient_info = patient_df.iloc[0]
    output_path = os.path.join(OUTPUT_DIR, f"report_{patient_id}.pdf")
    doc = SimpleDocTemplate(output_path, pagesize=A4,
                            topMargin=20*mm, bottomMargin=20*mm,
                            leftMargin=15*mm, rightMargin=15*mm)
    elements = []

    # ── Title ─────────────────────────────────────────────────────────────
    elements.append(Paragraph("IoT Patient Health Monitoring System", styles["ReportTitle"]))
    elements.append(Paragraph(f"Individual Patient Report", styles["SubHeader"]))
    elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#1565c0")))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        styles["Footer"]
    ))
    elements.append(Spacer(1, 12))

    # ── 1. Patient Overview ───────────────────────────────────────────────
    elements.append(Paragraph("1. Patient Overview", styles["SectionHeader"]))
    overview_data = [
        ["Field", "Value"],
        ["Patient ID", str(patient_id)],
        ["Name", str(patient_info.get("patient_name", "N/A"))],
        ["Age", str(patient_info.get("age", "N/A"))],
        ["Gender", str(patient_info.get("gender", "N/A"))],
        ["Condition", str(patient_info.get("condition", "N/A"))],
        ["Total Readings", str(len(patient_df))],
        ["Date Range", f"{patient_df['timestamp'].min()} to {patient_df['timestamp'].max()}"],
    ]
    elements.append(_make_table(overview_data, col_widths=[2*inch, 4*inch]))
    elements.append(Spacer(1, 12))

    # ── 2. Vitals Summary ────────────────────────────────────────────────
    elements.append(Paragraph("2. Vitals Summary", styles["SectionHeader"]))
    vitals_data = [
        ["Metric", "Average", "Min", "Max", "Std Dev"],
        ["Heart Rate (bpm)",
         f"{patient_df['heart_rate'].mean():.1f}",
         f"{patient_df['heart_rate'].min():.0f}",
         f"{patient_df['heart_rate'].max():.0f}",
         f"{patient_df['heart_rate'].std():.1f}"],
        ["SpO2 (%)",
         f"{patient_df['spo2'].mean():.1f}",
         f"{patient_df['spo2'].min():.0f}",
         f"{patient_df['spo2'].max():.0f}",
         f"{patient_df['spo2'].std():.1f}"],
        ["Temperature (°C)",
         f"{patient_df['temperature'].mean():.1f}",
         f"{patient_df['temperature'].min():.1f}",
         f"{patient_df['temperature'].max():.1f}",
         f"{patient_df['temperature'].std():.2f}"],
        ["Systolic BP (mmHg)",
         f"{patient_df['systolic_bp'].mean():.1f}",
         f"{patient_df['systolic_bp'].min():.0f}",
         f"{patient_df['systolic_bp'].max():.0f}",
         f"{patient_df['systolic_bp'].std():.1f}"],
    ]
    elements.append(_make_table(vitals_data))
    elements.append(Spacer(1, 12))

    # ── 3. Vitals Trends (Chart) ─────────────────────────────────────────
    elements.append(Paragraph("3. Vitals Trends", styles["SectionHeader"]))
    _add_image(elements, chart_path)

    # ── 4. Alert History ──────────────────────────────────────────────────
    elements.append(Paragraph("4. Alert History", styles["SectionHeader"]))
    patient_alerts = alerts_df[alerts_df["patient_id"] == patient_id] if not alerts_df.empty else pd.DataFrame()
    if patient_alerts.empty:
        elements.append(Paragraph("No alerts triggered for this patient.", styles["BodyText2"]))
    else:
        alert_data = [["Timestamp", "Alert", "Severity", "Rule"]]
        for _, row in patient_alerts.head(20).iterrows():
            alert_data.append([
                str(row.get("timestamp", "")),
                str(row.get("alert", "")),
                str(row.get("severity", "")),
                str(row.get("rule_name", "")),
            ])
        elements.append(_make_table(alert_data, col_widths=[1.8*inch, 1.8*inch, 1*inch, 1.8*inch]))
        if len(patient_alerts) > 20:
            elements.append(Paragraph(
                f"<i>... and {len(patient_alerts)-20} more alerts</i>", styles["BodyText2"]
            ))

    elements.append(Spacer(1, 12))

    # ── 5. Risk Assessment ───────────────────────────────────────────────
    elements.append(Paragraph("5. Risk Assessment", styles["SectionHeader"]))
    elements.append(Paragraph(f"Overall Risk Level: {risk_level}", _risk_style(risk_level)))
    elements.append(Spacer(1, 8))

    alert_count = len(patient_alerts)
    severity_counts = patient_alerts["severity"].value_counts().to_dict() if not patient_alerts.empty else {}
    elements.append(Paragraph(
        f"Total alerts: {alert_count} | "
        f"Critical: {severity_counts.get('CRITICAL', 0)} | "
        f"High: {severity_counts.get('HIGH', 0)} | "
        f"Medium: {severity_counts.get('MEDIUM', 0)}",
        styles["BodyText2"]
    ))
    elements.append(Spacer(1, 12))

    # ── 6. Recommendations ───────────────────────────────────────────────
    elements.append(Paragraph("6. Recommendations", styles["SectionHeader"]))
    recommendations = _generate_recommendations(patient_df, patient_alerts, risk_level)
    for rec in recommendations:
        elements.append(Paragraph(f"• {rec}", styles["BodyText2"]))
    elements.append(Spacer(1, 12))

    # ── Insights ──────────────────────────────────────────────────────────
    if insights:
        elements.append(Paragraph("Key Insights", styles["SectionHeader"]))
        for insight in insights:
            elements.append(Paragraph(f"• {insight}", styles["BodyText2"]))

    # ── Footer ────────────────────────────────────────────────────────────
    elements.append(Spacer(1, 30))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.gray))
    elements.append(Paragraph(
        "This report is auto-generated by the IoT Patient Health Monitoring System. "
        "For clinical decisions, consult with a qualified healthcare professional.",
        styles["Footer"]
    ))

    doc.build(elements)
    print(f"[REPORT] Patient report saved: {output_path}")
    return output_path


# ═══════════════════════════════════════════════════════════════════════════════
#  SYSTEM OVERVIEW REPORT
# ═══════════════════════════════════════════════════════════════════════════════

def generate_system_report(
    df: pd.DataFrame,
    alerts_df: pd.DataFrame,
    stats: dict,
    insights: list,
    risk_levels: dict,
    chart_paths: dict = None,
) -> str:
    """
    Generate a system-wide overview PDF report.
    Returns the output file path.
    """
    output_path = os.path.join(OUTPUT_DIR, "system_report.pdf")
    doc = SimpleDocTemplate(output_path, pagesize=A4,
                            topMargin=20*mm, bottomMargin=20*mm,
                            leftMargin=15*mm, rightMargin=15*mm)
    elements = []

    # ── Title ─────────────────────────────────────────────────────────────
    elements.append(Paragraph("IoT Patient Health Monitoring System", styles["ReportTitle"]))
    elements.append(Paragraph("System Overview Report", styles["SubHeader"]))
    elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#1565c0")))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        styles["Footer"]
    ))
    elements.append(Spacer(1, 12))

    # ── 1. System Overview ────────────────────────────────────────────────
    elements.append(Paragraph("1. System Overview", styles["SectionHeader"]))
    overall = stats.get("overall", {})
    overview_data = [
        ["Metric", "Value"],
        ["Total Records", str(overall.get("total_records", "N/A"))],
        ["Unique Patients", str(overall.get("unique_patients", "N/A"))],
        ["Date Range", str(overall.get("date_range", "N/A"))],
        ["Avg Heart Rate", f"{overall.get('avg_heart_rate', 0)} bpm"],
        ["Avg SpO2", f"{overall.get('avg_spo2', 0)}%"],
        ["Avg Temperature", f"{overall.get('avg_temperature', 0)} °C"],
        ["Total Alerts", str(len(alerts_df)) if alerts_df is not None else "0"],
    ]
    elements.append(_make_table(overview_data, col_widths=[2.5*inch, 3.5*inch]))
    elements.append(Spacer(1, 12))

    # ── 2. Patient Risk Summary ───────────────────────────────────────────
    elements.append(Paragraph("2. Patient Risk Summary", styles["SectionHeader"]))
    risk_data = [["Patient ID", "Condition", "Risk Level", "Alerts"]]
    per_patient = stats.get("per_patient", pd.DataFrame())
    for pid in sorted(risk_levels.keys()):
        condition = ""
        if not df[df["patient_id"] == pid].empty:
            condition = df[df["patient_id"] == pid].iloc[0].get("condition", "")
        alert_count = len(alerts_df[alerts_df["patient_id"] == pid]) if not alerts_df.empty else 0
        risk_data.append([pid, condition, risk_levels[pid], str(alert_count)])
    elements.append(_make_table(risk_data, col_widths=[1.2*inch, 2*inch, 1.3*inch, 1*inch]))
    elements.append(Spacer(1, 12))

    # ── 3. Charts ─────────────────────────────────────────────────────────
    if chart_paths:
        elements.append(Paragraph("3. Visualizations", styles["SectionHeader"]))
        for chart_name, path in chart_paths.items():
            if path and os.path.exists(path):
                elements.append(Paragraph(
                    chart_name.replace("_", " ").title(), styles["SubHeader"]
                ))
                _add_image(elements, path, width=5.5*inch)

    # ── 4. Key Insights ──────────────────────────────────────────────────
    elements.append(Paragraph("4. Key Insights", styles["SectionHeader"]))
    for insight in insights:
        elements.append(Paragraph(f"• {insight}", styles["BodyText2"]))
    elements.append(Spacer(1, 12))

    # ── 5. Alert Breakdown ────────────────────────────────────────────────
    if alerts_df is not None and not alerts_df.empty:
        elements.append(Paragraph("5. Alert Breakdown", styles["SectionHeader"]))
        alert_summary = alerts_df.groupby("alert").agg(
            Count=("alert", "size"),
            Severity=("severity", "first"),
        ).reset_index()
        alert_table = [["Alert Type", "Count", "Severity"]]
        for _, row in alert_summary.iterrows():
            alert_table.append([row["alert"], str(row["Count"]), row["Severity"]])
        elements.append(_make_table(alert_table, col_widths=[2.5*inch, 1.5*inch, 1.5*inch]))

    # ── Footer ────────────────────────────────────────────────────────────
    elements.append(Spacer(1, 30))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.gray))
    elements.append(Paragraph(
        "This report is auto-generated by the IoT Patient Health Monitoring System. "
        "For clinical decisions, consult with a qualified healthcare professional.",
        styles["Footer"]
    ))

    doc.build(elements)
    print(f"[REPORT] System report saved: {output_path}")
    return output_path


# ═══════════════════════════════════════════════════════════════════════════════
#  RECOMMENDATION ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

def _generate_recommendations(patient_df, alerts_df, risk_level):
    """Generate clinical recommendations based on patient data and alerts."""
    recs = []
    avg_spo2 = patient_df["spo2"].mean()
    avg_hr = patient_df["heart_rate"].mean()
    max_temp = patient_df["temperature"].max()
    avg_sys = patient_df["systolic_bp"].mean()

    if avg_spo2 < 93:
        recs.append("Average SpO2 is below 93%. Consider supplemental oxygen and pulmonology consult.")
    if avg_hr > 100:
        recs.append("Elevated average heart rate. Evaluate for tachycardia causes (dehydration, infection, pain).")
    if avg_hr < 55:
        recs.append("Low average heart rate. Evaluate medication side effects and cardiac function.")
    if max_temp >= 38.5:
        recs.append("Fever episodes detected. Order blood cultures and start empiric antibiotics if warranted.")
    if avg_sys >= 140:
        recs.append("Elevated average systolic BP. Review antihypertensive regimen.")

    if risk_level in ("CRITICAL", "HIGH"):
        recs.append("Patient is in HIGH/CRITICAL risk category. Increase monitoring frequency to every 15 minutes.")
        recs.append("Consider ICU transfer or bedside continuous monitoring.")
    elif risk_level == "MEDIUM":
        recs.append("Moderate risk. Maintain current monitoring and review within 24 hours.")
    else:
        recs.append("Low risk. Continue routine monitoring schedule.")

    if not recs:
        recs.append("All vitals within normal limits. Continue standard monitoring protocol.")

    return recs
