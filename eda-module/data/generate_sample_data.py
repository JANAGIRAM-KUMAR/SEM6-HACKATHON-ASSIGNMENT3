"""
Sample Data Generator — IoT Patient Health Monitoring System
Generates realistic synthetic patient vitals data for demonstration.
"""

import csv
import random
import os
from datetime import datetime, timedelta

PATIENTS = [
    {"id": "P001", "name": "Aarav Sharma",  "age": 45, "gender": "M", "condition": "Hypertension"},
    {"id": "P002", "name": "Priya Nair",    "age": 62, "gender": "F", "condition": "COPD"},
    {"id": "P003", "name": "Ravi Kumar",    "age": 34, "gender": "M", "condition": "Diabetes"},
    {"id": "P004", "name": "Meera Reddy",   "age": 71, "gender": "F", "condition": "Heart Failure"},
    {"id": "P005", "name": "Karthik Iyer",  "age": 28, "gender": "M", "condition": "Healthy"},
]

BASELINES = {
    "P001": {"hr": 82, "spo2": 97, "temp": 36.8, "sys": 145, "dia": 92},
    "P002": {"hr": 78, "spo2": 91, "temp": 36.6, "sys": 128, "dia": 80},
    "P003": {"hr": 75, "spo2": 98, "temp": 36.7, "sys": 120, "dia": 78},
    "P004": {"hr": 88, "spo2": 94, "temp": 36.9, "sys": 138, "dia": 88},
    "P005": {"hr": 70, "spo2": 99, "temp": 36.5, "sys": 115, "dia": 72},
}


def generate_vitals(patient_id, timestamp):
    """Generate one vitals reading with realistic noise and occasional anomalies."""
    base = BASELINES[patient_id]
    hour = timestamp.hour
    hr_adjust = -5 if 0 <= hour < 6 else (3 if 12 <= hour < 18 else 0)
    spo2_adjust = -2 if (patient_id == "P002" and 0 <= hour < 6) else 0

    heart_rate = round(base["hr"] + hr_adjust + random.gauss(0, 4))
    spo2 = min(100, round(base["spo2"] + spo2_adjust + random.gauss(0, 1.2)))
    temperature = round(base["temp"] + random.gauss(0, 0.3), 1)
    systolic_bp = round(base["sys"] + random.gauss(0, 6))
    diastolic_bp = round(base["dia"] + random.gauss(0, 4))

    # Inject anomalies ~8% of the time
    if random.random() < 0.08:
        anomaly = random.choice(["high_hr", "low_spo2", "fever", "high_bp"])
        if anomaly == "high_hr":
            heart_rate = random.randint(115, 140)
        elif anomaly == "low_spo2":
            spo2 = random.randint(85, 91)
        elif anomaly == "fever":
            temperature = round(random.uniform(38.5, 40.0), 1)
        elif anomaly == "high_bp":
            systolic_bp = random.randint(150, 180)

    heart_rate = max(40, min(180, heart_rate))
    spo2 = max(70, min(100, spo2))
    temperature = max(34.0, min(42.0, temperature))
    systolic_bp = max(80, min(200, systolic_bp))
    diastolic_bp = max(50, min(120, diastolic_bp))

    # ~3% chance of missing value per field
    if random.random() < 0.03: heart_rate = ""
    if random.random() < 0.03: spo2 = ""
    if random.random() < 0.03: temperature = ""

    return {
        "patient_id": patient_id, "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        "heart_rate": heart_rate, "spo2": spo2, "temperature": temperature,
        "systolic_bp": systolic_bp, "diastolic_bp": diastolic_bp,
    }


def generate_dataset(output_path, days=7):
    """Generate a full CSV dataset for all patients."""
    start_time = datetime(2026, 4, 19, 0, 0, 0)
    rows = []
    for patient in PATIENTS:
        pid = patient["id"]
        current = start_time
        end = start_time + timedelta(days=days)
        while current < end:
            row = generate_vitals(pid, current)
            row["patient_name"] = patient["name"]
            row["age"] = patient["age"]
            row["gender"] = patient["gender"]
            row["condition"] = patient["condition"]
            rows.append(row)
            current += timedelta(hours=1, minutes=random.randint(-5, 5))
    random.shuffle(rows)

    fieldnames = [
        "patient_id", "patient_name", "age", "gender", "condition",
        "timestamp", "heart_rate", "spo2", "temperature", "systolic_bp", "diastolic_bp"
    ]
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"[OK] Generated {len(rows)} records -> {output_path}")
    return len(rows)


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    generate_dataset(os.path.join(script_dir, "patient_vitals.csv"))
