"""
=============================================================================
  DSL Rule Engine — Domain-Specific Language for Alert Rules
=============================================================================
  Dynamically loads, parses, evaluates, and manages alert rules defined in
  JSON format. Supports single-field rules and compound (AND/OR) rules.
=============================================================================
"""

import json
import os
import operator
import pandas as pd
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_RULES_PATH = os.path.join(SCRIPT_DIR, "rules.json")

# ── Operator Mapping ──────────────────────────────────────────────────────────
OPERATORS = {
    ">":  operator.gt,
    "<":  operator.lt,
    ">=": operator.ge,
    "<=": operator.le,
    "==": operator.eq,
    "!=": operator.ne,
}


class RuleEngine:
    """
    DSL-based rule engine for evaluating patient vitals against
    configurable alert thresholds.

    Supports:
      - Single-field rules:   {"field": "spo2", "operator": "<", "value": 92, ...}
      - Compound rules:       {"type": "compound", "logic": "AND", "conditions": [...]}
    """

    def __init__(self, rules_path: str = None):
        self.rules_path = rules_path or DEFAULT_RULES_PATH
        self.rules = []
        self.load_rules()

    # ── Rule I/O ──────────────────────────────────────────────────────────

    def load_rules(self):
        """Load rules from the JSON file."""
        if not os.path.exists(self.rules_path):
            print(f"[RULES] Warning: {self.rules_path} not found. Starting with empty rules.")
            self.rules = []
            return
        with open(self.rules_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.rules = data.get("rules", [])
        print(f"[RULES] Loaded {len(self.rules)} rules from {os.path.basename(self.rules_path)}")

    def save_rules(self):
        """Persist current rules back to the JSON file."""
        with open(self.rules_path, "w", encoding="utf-8") as f:
            json.dump({"rules": self.rules}, f, indent=2)
        print(f"[RULES] Saved {len(self.rules)} rules to {os.path.basename(self.rules_path)}")

    def add_rule(self, rule: dict):
        """Add a new rule and persist."""
        if "id" not in rule:
            rule["id"] = f"R{len(self.rules)+1:03d}"
        self.rules.append(rule)
        self.save_rules()
        print(f"[RULES] Added rule: {rule['id']} — {rule.get('name', 'Unnamed')}")

    def remove_rule(self, rule_id: str):
        """Remove a rule by ID and persist."""
        before = len(self.rules)
        self.rules = [r for r in self.rules if r.get("id") != rule_id]
        if len(self.rules) < before:
            self.save_rules()
            print(f"[RULES] Removed rule: {rule_id}")
        else:
            print(f"[RULES] Rule {rule_id} not found.")

    def list_rules(self) -> list:
        """Return a summary of all loaded rules."""
        summaries = []
        for r in self.rules:
            if r.get("type") == "compound":
                cond_str = f" {r['logic']} ".join(
                    f"{c['field']} {c['operator']} {c['value']}" for c in r["conditions"]
                )
                summaries.append({
                    "id": r["id"], "name": r.get("name", ""),
                    "expression": cond_str,
                    "alert": r["alert"], "severity": r["severity"],
                })
            else:
                summaries.append({
                    "id": r["id"], "name": r.get("name", ""),
                    "expression": f"{r['field']} {r['operator']} {r['value']}",
                    "alert": r["alert"], "severity": r["severity"],
                })
        return summaries

    # ── Evaluation ────────────────────────────────────────────────────────

    def _evaluate_condition(self, row: dict, condition: dict) -> bool:
        """Evaluate a single condition against a data row."""
        field = condition["field"]
        op_str = condition["operator"]
        threshold = condition["value"]

        if field not in row or row[field] is None or pd.isna(row[field]):
            return False

        op_func = OPERATORS.get(op_str)
        if op_func is None:
            print(f"[RULES] Unknown operator: {op_str}")
            return False

        try:
            return op_func(float(row[field]), float(threshold))
        except (ValueError, TypeError):
            return False

    def evaluate_row(self, row: dict) -> list:
        """
        Evaluate all rules against a single data row.
        Returns a list of triggered alerts.
        """
        triggered = []
        for rule in self.rules:
            fired = False

            if rule.get("type") == "compound":
                # Compound rule with AND/OR logic
                results = [self._evaluate_condition(row, c) for c in rule["conditions"]]
                if rule.get("logic", "AND").upper() == "AND":
                    fired = all(results)
                else:  # OR
                    fired = any(results)
            else:
                # Simple single-field rule
                fired = self._evaluate_condition(row, rule)

            if fired:
                triggered.append({
                    "rule_id":   rule["id"],
                    "alert":     rule["alert"],
                    "severity":  rule["severity"],
                    "rule_name": rule.get("name", ""),
                    "description": rule.get("description", ""),
                })
        return triggered

    def evaluate_dataset(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Apply all rules to an entire DataFrame.
        Returns a DataFrame of all triggered alerts with patient/time context.
        """
        all_alerts = []
        for _, row in df.iterrows():
            row_dict = row.to_dict()
            alerts = self.evaluate_row(row_dict)
            for alert in alerts:
                alert["patient_id"] = row_dict.get("patient_id", "")
                alert["timestamp"]  = row_dict.get("timestamp", "")
                alert["heart_rate"] = row_dict.get("heart_rate", "")
                alert["spo2"]       = row_dict.get("spo2", "")
                alert["temperature"] = row_dict.get("temperature", "")
                all_alerts.append(alert)

        alerts_df = pd.DataFrame(all_alerts)
        if not alerts_df.empty:
            alerts_df.sort_values(["patient_id", "timestamp"], inplace=True)
            alerts_df.reset_index(drop=True, inplace=True)

        print(f"[RULES] Evaluation complete: {len(alerts_df)} alerts triggered across dataset.")
        return alerts_df

    def get_risk_level(self, alerts_df: pd.DataFrame, patient_id: str) -> str:
        """
        Determine risk level for a patient based on alert frequency and severity.
        Returns: 'LOW', 'MEDIUM', 'HIGH', or 'CRITICAL'
        """
        patient_alerts = alerts_df[alerts_df["patient_id"] == patient_id]
        if patient_alerts.empty:
            return "LOW"

        severity_scores = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
        total_score = sum(
            severity_scores.get(row["severity"], 1)
            for _, row in patient_alerts.iterrows()
        )

        count = len(patient_alerts)
        avg_score = total_score / count if count > 0 else 0

        if avg_score >= 3.5 or count >= 20:
            return "CRITICAL"
        elif avg_score >= 2.5 or count >= 12:
            return "HIGH"
        elif avg_score >= 1.5 or count >= 5:
            return "MEDIUM"
        else:
            return "LOW"
