"""
=============================================================================
  EDA Module — Exploratory Data Analysis for Patient Vitals
=============================================================================
  Cleans, preprocesses, analyzes, and visualizes IoT patient health data.
  Produces summary statistics, trend insights, and publication-quality charts.
=============================================================================
"""

import os
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for server/script use
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime

# ── Configure Plot Aesthetics ─────────────────────────────────────────────────
sns.set_theme(style="darkgrid", palette="viridis")
plt.rcParams.update({
    "figure.figsize": (12, 6),
    "font.size": 11,
    "axes.titlesize": 14,
    "axes.labelsize": 12,
})

# ── Output Directory ──────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)


# ═══════════════════════════════════════════════════════════════════════════════
#  DATA LOADING & PREPROCESSING
# ═══════════════════════════════════════════════════════════════════════════════

def load_and_clean(filepath: str) -> pd.DataFrame:
    """
    Load patient vitals CSV / JSON and perform cleaning:
      - Parse timestamps
      - Convert numeric columns
      - Handle missing values via forward-fill + median imputation
      - Add derived time columns (hour, day_of_week, date)
    """
    # Detect format
    if filepath.endswith(".json"):
        df = pd.read_json(filepath)
    else:
        df = pd.read_csv(filepath)

    print(f"[EDA] Loaded {len(df)} raw records from {os.path.basename(filepath)}")

    # ── Convert types ─────────────────────────────────────────────────────
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    numeric_cols = ["heart_rate", "spo2", "temperature", "systolic_bp", "diastolic_bp"]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # ── Report missing values ─────────────────────────────────────────────
    missing = df[numeric_cols].isnull().sum()
    missing_report = missing[missing > 0]
    if not missing_report.empty:
        print(f"[EDA] Missing values detected:\n{missing_report.to_string()}")

    # ── Impute: forward-fill within each patient, then median ─────────────
    df.sort_values(["patient_id", "timestamp"], inplace=True)
    df[numeric_cols] = df.groupby("patient_id")[numeric_cols].transform(
        lambda g: g.fillna(method="ffill").fillna(g.median())
    )
    # Final fallback — global median
    for col in numeric_cols:
        df[col].fillna(df[col].median(), inplace=True)

    # ── Derived columns ──────────────────────────────────────────────────
    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.day_name()
    df["date"] = df["timestamp"].dt.date

    df.reset_index(drop=True, inplace=True)
    print(f"[EDA] Cleaning complete. {len(df)} records ready for analysis.")
    return df


# ═══════════════════════════════════════════════════════════════════════════════
#  STATISTICAL ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════════

def compute_summary_statistics(df: pd.DataFrame) -> dict:
    """Compute per-patient and overall summary statistics."""
    stats = {}

    # ── Per-patient aggregates ────────────────────────────────────────────
    per_patient = df.groupby("patient_id").agg(
        avg_heart_rate=("heart_rate", "mean"),
        max_heart_rate=("heart_rate", "max"),
        min_heart_rate=("heart_rate", "min"),
        avg_spo2=("spo2", "mean"),
        min_spo2=("spo2", "min"),
        avg_temperature=("temperature", "mean"),
        max_temperature=("temperature", "max"),
        min_temperature=("temperature", "min"),
        avg_systolic_bp=("systolic_bp", "mean"),
        max_systolic_bp=("systolic_bp", "max"),
        total_readings=("heart_rate", "count"),
    ).round(2)
    stats["per_patient"] = per_patient

    # ── Overall aggregates ────────────────────────────────────────────────
    stats["overall"] = {
        "total_records": len(df),
        "unique_patients": df["patient_id"].nunique(),
        "date_range": f"{df['timestamp'].min()} — {df['timestamp'].max()}",
        "avg_heart_rate": round(df["heart_rate"].mean(), 2),
        "avg_spo2": round(df["spo2"].mean(), 2),
        "avg_temperature": round(df["temperature"].mean(), 2),
    }

    print("[EDA] Summary statistics computed.")
    return stats


def generate_insights(df: pd.DataFrame, alerts_df: pd.DataFrame = None) -> list:
    """Generate human-readable textual insights from the data."""
    insights = []

    # ── Insight: Patient with lowest average SpO2 ─────────────────────────
    avg_spo2 = df.groupby("patient_id")["spo2"].mean()
    worst_spo2_patient = avg_spo2.idxmin()
    insights.append(
        f"Patient {worst_spo2_patient} has the lowest average SpO2 "
        f"({avg_spo2[worst_spo2_patient]:.1f}%) — monitor closely."
    )

    # ── Insight: Night-time SpO2 dips ─────────────────────────────────────
    night_df = df[df["hour"].between(0, 5)]
    if not night_df.empty:
        night_spo2 = night_df.groupby("patient_id")["spo2"].mean()
        day_spo2 = df[df["hour"].between(8, 20)].groupby("patient_id")["spo2"].mean()
        for pid in night_spo2.index:
            if pid in day_spo2.index:
                diff = day_spo2[pid] - night_spo2[pid]
                if diff > 2:
                    insights.append(
                        f"Patient {pid} shows SpO2 drop of {diff:.1f}% during "
                        f"night hours (00:00–05:00) — possible sleep apnea indicator."
                    )

    # ── Insight: Highest heart rate variability ───────────────────────────
    hr_std = df.groupby("patient_id")["heart_rate"].std()
    most_variable = hr_std.idxmax()
    insights.append(
        f"Patient {most_variable} has the highest heart rate variability "
        f"(σ = {hr_std[most_variable]:.1f} bpm)."
    )

    # ── Insight: Alert frequency (if alerts provided) ─────────────────────
    if alerts_df is not None and not alerts_df.empty:
        alert_counts = alerts_df.groupby("patient_id").size()
        most_alerts = alert_counts.idxmax()
        insights.append(
            f"Patient {most_alerts} triggered the most alerts "
            f"({alert_counts[most_alerts]} total) — requires priority review."
        )

    return insights


# ═══════════════════════════════════════════════════════════════════════════════
#  VISUALIZATIONS
# ═══════════════════════════════════════════════════════════════════════════════

def plot_heart_rate_over_time(df: pd.DataFrame) -> str:
    """Line chart: Heart rate trends per patient over time."""
    fig, ax = plt.subplots(figsize=(14, 6))
    for pid, group in df.groupby("patient_id"):
        group_sorted = group.sort_values("timestamp")
        ax.plot(group_sorted["timestamp"], group_sorted["heart_rate"],
                label=pid, alpha=0.8, linewidth=1.2)
    ax.set_title("Heart Rate Over Time by Patient", fontweight="bold")
    ax.set_xlabel("Timestamp")
    ax.set_ylabel("Heart Rate (bpm)")
    ax.legend(title="Patient", loc="upper right")
    plt.xticks(rotation=30)
    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, "heart_rate_trends.png")
    fig.savefig(path, dpi=150)
    plt.close(fig)
    print(f"[EDA] Saved: {path}")
    return path


def plot_spo2_trends(df: pd.DataFrame) -> str:
    """Line chart: SpO2 trends per patient with danger zone highlighted."""
    fig, ax = plt.subplots(figsize=(14, 6))
    for pid, group in df.groupby("patient_id"):
        group_sorted = group.sort_values("timestamp")
        ax.plot(group_sorted["timestamp"], group_sorted["spo2"],
                label=pid, alpha=0.8, linewidth=1.2)
    # Danger zone
    ax.axhline(y=92, color="red", linestyle="--", alpha=0.7, label="Danger Threshold (92%)")
    ax.fill_between(ax.get_xlim(), 70, 92, alpha=0.08, color="red")
    ax.set_title("SpO2 Trends by Patient", fontweight="bold")
    ax.set_xlabel("Timestamp")
    ax.set_ylabel("SpO2 (%)")
    ax.set_ylim(80, 102)
    ax.legend(title="Patient", loc="lower right")
    plt.xticks(rotation=30)
    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, "spo2_trends.png")
    fig.savefig(path, dpi=150)
    plt.close(fig)
    print(f"[EDA] Saved: {path}")
    return path


def plot_temperature_distribution(df: pd.DataFrame) -> str:
    """Box plot: Temperature distribution per patient."""
    fig, ax = plt.subplots(figsize=(10, 6))
    sns.boxplot(data=df, x="patient_id", y="temperature", ax=ax,
                palette="coolwarm", width=0.5)
    ax.axhline(y=38.5, color="red", linestyle="--", alpha=0.7, label="Fever Threshold")
    ax.set_title("Temperature Distribution by Patient", fontweight="bold")
    ax.set_xlabel("Patient ID")
    ax.set_ylabel("Temperature (°C)")
    ax.legend()
    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, "temperature_distribution.png")
    fig.savefig(path, dpi=150)
    plt.close(fig)
    print(f"[EDA] Saved: {path}")
    return path


def plot_alerts_per_patient(alerts_df: pd.DataFrame) -> str:
    """Bar chart: Number of alerts triggered per patient, colored by severity."""
    if alerts_df is None or alerts_df.empty:
        print("[EDA] No alerts to plot.")
        return ""
    fig, ax = plt.subplots(figsize=(10, 6))
    severity_order = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    colors = {"CRITICAL": "#d32f2f", "HIGH": "#f57c00", "MEDIUM": "#fbc02d", "LOW": "#66bb6a"}
    pivot = alerts_df.groupby(["patient_id", "severity"]).size().unstack(fill_value=0)
    # Reorder columns
    ordered_cols = [s for s in severity_order if s in pivot.columns]
    pivot = pivot[ordered_cols]
    pivot.plot(kind="bar", stacked=True, ax=ax,
               color=[colors.get(c, "#90a4ae") for c in ordered_cols])
    ax.set_title("Alerts per Patient by Severity", fontweight="bold")
    ax.set_xlabel("Patient ID")
    ax.set_ylabel("Number of Alerts")
    ax.legend(title="Severity")
    plt.xticks(rotation=0)
    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, "alerts_per_patient.png")
    fig.savefig(path, dpi=150)
    plt.close(fig)
    print(f"[EDA] Saved: {path}")
    return path


def plot_hourly_heatmap(df: pd.DataFrame) -> str:
    """Heatmap: Average heart rate by patient and hour of day."""
    pivot = df.pivot_table(values="heart_rate", index="patient_id",
                           columns="hour", aggfunc="mean").round(1)
    fig, ax = plt.subplots(figsize=(16, 5))
    sns.heatmap(pivot, annot=True, fmt=".0f", cmap="YlOrRd", ax=ax,
                linewidths=0.5, cbar_kws={"label": "Avg Heart Rate (bpm)"})
    ax.set_title("Average Heart Rate by Patient & Hour", fontweight="bold")
    ax.set_xlabel("Hour of Day")
    ax.set_ylabel("Patient ID")
    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, "hourly_heatmap.png")
    fig.savefig(path, dpi=150)
    plt.close(fig)
    print(f"[EDA] Saved: {path}")
    return path


def plot_vitals_for_patient(df: pd.DataFrame, patient_id: str) -> str:
    """Multi-panel chart for a single patient's vitals."""
    patient_df = df[df["patient_id"] == patient_id].sort_values("timestamp")
    if patient_df.empty:
        print(f"[EDA] No data for patient {patient_id}")
        return ""

    fig, axes = plt.subplots(3, 1, figsize=(14, 12), sharex=True)
    fig.suptitle(f"Vitals Overview — Patient {patient_id}", fontsize=16, fontweight="bold")

    # Heart Rate
    axes[0].plot(patient_df["timestamp"], patient_df["heart_rate"],
                 color="#1976d2", linewidth=1.2)
    axes[0].axhline(110, color="red", linestyle="--", alpha=0.5, label="High (110)")
    axes[0].axhline(50, color="orange", linestyle="--", alpha=0.5, label="Low (50)")
    axes[0].set_ylabel("Heart Rate (bpm)")
    axes[0].legend(loc="upper right")

    # SpO2
    axes[1].plot(patient_df["timestamp"], patient_df["spo2"],
                 color="#388e3c", linewidth=1.2)
    axes[1].axhline(92, color="red", linestyle="--", alpha=0.5, label="Danger (92%)")
    axes[1].set_ylabel("SpO2 (%)")
    axes[1].set_ylim(80, 102)
    axes[1].legend(loc="lower right")

    # Temperature
    axes[2].plot(patient_df["timestamp"], patient_df["temperature"],
                 color="#e64a19", linewidth=1.2)
    axes[2].axhline(38.5, color="red", linestyle="--", alpha=0.5, label="Fever (38.5°C)")
    axes[2].set_ylabel("Temperature (°C)")
    axes[2].set_xlabel("Timestamp")
    axes[2].legend(loc="upper right")

    plt.xticks(rotation=30)
    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, f"vitals_{patient_id}.png")
    fig.savefig(path, dpi=150)
    plt.close(fig)
    print(f"[EDA] Saved: {path}")
    return path


def run_full_eda(df: pd.DataFrame, alerts_df: pd.DataFrame = None) -> dict:
    """Run the complete EDA pipeline and return all results."""
    results = {}
    results["stats"] = compute_summary_statistics(df)
    results["insights"] = generate_insights(df, alerts_df)

    # Generate all visualizations
    results["charts"] = {
        "heart_rate_trends": plot_heart_rate_over_time(df),
        "spo2_trends": plot_spo2_trends(df),
        "temperature_distribution": plot_temperature_distribution(df),
        "hourly_heatmap": plot_hourly_heatmap(df),
    }
    if alerts_df is not None and not alerts_df.empty:
        results["charts"]["alerts_per_patient"] = plot_alerts_per_patient(alerts_df)

    # Per-patient detail charts
    results["patient_charts"] = {}
    for pid in df["patient_id"].unique():
        results["patient_charts"][pid] = plot_vitals_for_patient(df, pid)

    print(f"\n[EDA] === INSIGHTS ===")
    for i, insight in enumerate(results["insights"], 1):
        print(f"  {i}. {insight}")

    return results
