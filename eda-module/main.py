"""
=============================================================================
  Main Entry Point — IoT Patient Health Monitoring System
=============================================================================
  Orchestrates the full pipeline:
    1. Generate sample data (if not present)
    2. Run EDA analysis & generate visualizations
    3. Evaluate DSL alert rules
    4. Demonstrate security features
    5. Generate PDF reports
=============================================================================
"""

import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

from analysis import load_and_clean, run_full_eda
from rules_engine import RuleEngine
from security import demo_security
from report_generator import generate_patient_report, generate_system_report


def main():
    print("=" * 70)
    print("  IoT PATIENT HEALTH MONITORING SYSTEM")
    print("  EDA · DSL Rules · Security · Reports")
    print("=" * 70)

    # ── Paths ─────────────────────────────────────────────────────────────
    data_dir = os.path.join(SCRIPT_DIR, "data")
    data_path = os.path.join(data_dir, "patient_vitals.csv")
    outputs_dir = os.path.join(SCRIPT_DIR, "outputs")
    os.makedirs(outputs_dir, exist_ok=True)

    # ══════════════════════════════════════════════════════════════════════
    #  STEP 1: Generate Sample Data (if not present)
    # ══════════════════════════════════════════════════════════════════════
    if not os.path.exists(data_path):
        print("\n[STEP 1] Generating sample dataset...")
        from data.generate_sample_data import generate_dataset
        generate_dataset(data_path)
    else:
        print(f"\n[STEP 1] Dataset found: {data_path}")

    # ══════════════════════════════════════════════════════════════════════
    #  STEP 2: Load & Clean Data
    # ══════════════════════════════════════════════════════════════════════
    print("\n[STEP 2] Loading and cleaning data...")
    df = load_and_clean(data_path)
    print(f"  Shape: {df.shape}")
    print(f"  Patients: {df['patient_id'].unique().tolist()}")
    print(f"  Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")

    # ══════════════════════════════════════════════════════════════════════
    #  STEP 3: Evaluate DSL Alert Rules
    # ══════════════════════════════════════════════════════════════════════
    print("\n[STEP 3] Loading and evaluating DSL rules...")
    engine = RuleEngine()

    # Display loaded rules
    print("\n  Loaded Rules:")
    for rule in engine.list_rules():
        print(f"    [{rule['id']}] {rule['name']}: {rule['expression']} "
              f"-> {rule['alert']} ({rule['severity']})")

    # Evaluate against dataset
    alerts_df = engine.evaluate_dataset(df)
    print(f"\n  Total alerts triggered: {len(alerts_df)}")
    if not alerts_df.empty:
        print("\n  Alert Summary:")
        alert_summary = alerts_df.groupby(["alert", "severity"]).size().reset_index(name="count")
        for _, row in alert_summary.iterrows():
            print(f"    {row['alert']} ({row['severity']}): {row['count']} occurrences")

        print("\n  Alerts per Patient:")
        per_patient = alerts_df.groupby("patient_id").size()
        for pid, count in per_patient.items():
            risk = engine.get_risk_level(alerts_df, pid)
            print(f"    {pid}: {count} alerts — Risk: {risk}")

    # ══════════════════════════════════════════════════════════════════════
    #  STEP 4: Run Full EDA
    # ══════════════════════════════════════════════════════════════════════
    print("\n[STEP 4] Running Exploratory Data Analysis...")
    eda_results = run_full_eda(df, alerts_df)

    # Print summary stats
    print("\n  Per-Patient Statistics:")
    print(eda_results["stats"]["per_patient"].to_string(index=True))

    # ══════════════════════════════════════════════════════════════════════
    #  STEP 5: Security Demo
    # ══════════════════════════════════════════════════════════════════════
    print("\n[STEP 5] Running Security Module Demo...")
    demo_security()

    # ══════════════════════════════════════════════════════════════════════
    #  STEP 6: Generate PDF Reports
    # ══════════════════════════════════════════════════════════════════════
    print("\n[STEP 6] Generating PDF Reports...")

    # Risk levels for all patients
    risk_levels = {}
    for pid in df["patient_id"].unique():
        risk_levels[pid] = engine.get_risk_level(alerts_df, pid)

    # Individual patient reports
    for pid in df["patient_id"].unique():
        chart_path = eda_results["patient_charts"].get(pid, "")
        patient_insights = [i for i in eda_results["insights"] if pid in i]
        generate_patient_report(
            patient_id=pid,
            df=df,
            alerts_df=alerts_df,
            risk_level=risk_levels[pid],
            insights=patient_insights,
            chart_path=chart_path,
        )

    # System overview report
    generate_system_report(
        df=df,
        alerts_df=alerts_df,
        stats=eda_results["stats"],
        insights=eda_results["insights"],
        risk_levels=risk_levels,
        chart_paths=eda_results["charts"],
    )

    # ══════════════════════════════════════════════════════════════════════
    #  DONE
    # ══════════════════════════════════════════════════════════════════════
    print("\n" + "=" * 70)
    print("  ALL STEPS COMPLETE")
    print("=" * 70)
    print(f"\n  Output directory: {outputs_dir}")
    print("  Generated files:")
    for f in sorted(os.listdir(outputs_dir)):
        fpath = os.path.join(outputs_dir, f)
        size_kb = os.path.getsize(fpath) / 1024
        print(f"    {f} ({size_kb:.1f} KB)")

    print(f"\n  To start the API server, run:")
    print(f"    cd eda-module && uvicorn app:app --reload --port 8000")
    print(f"\n  API Docs: http://localhost:8000/docs")
    print("=" * 70)


if __name__ == "__main__":
    main()
