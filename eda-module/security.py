"""
=============================================================================
  Security Module — HIPAA-like Simulation
=============================================================================
  Implements JWT authentication, role-based access, data masking,
  field encryption, access logging, and rate limiting.
=============================================================================
"""

import os
import json
import time
import hashlib
import logging
from datetime import datetime, timedelta
from functools import wraps

import jwt
from cryptography.fernet import Fernet

# ── Configuration ─────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_DIR = os.path.join(SCRIPT_DIR, "outputs")
os.makedirs(LOG_DIR, exist_ok=True)

JWT_SECRET = "iot-health-monitor-secret-key-2026"
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 8

# Fernet key for field-level encryption (in production, use a vault)
ENCRYPTION_KEY = Fernet.generate_key()
_cipher = Fernet(ENCRYPTION_KEY)

# ── Logging Setup ─────────────────────────────────────────────────────────────
audit_logger = logging.getLogger("audit")
audit_logger.setLevel(logging.INFO)
_handler = logging.FileHandler(os.path.join(LOG_DIR, "audit_log.txt"), encoding="utf-8")
_handler.setFormatter(logging.Formatter("%(asctime)s | %(levelname)s | %(message)s"))
audit_logger.addHandler(_handler)
# Also log to console
_console = logging.StreamHandler()
_console.setFormatter(logging.Formatter("[SECURITY] %(message)s"))
audit_logger.addHandler(_console)

# ── User Store (simulated) ───────────────────────────────────────────────────
USERS = {
    "admin": {
        "password_hash": hashlib.sha256("admin123".encode()).hexdigest(),
        "role": "Admin",
        "full_name": "System Administrator",
    },
    "dr.sharma": {
        "password_hash": hashlib.sha256("doctor456".encode()).hexdigest(),
        "role": "Doctor",
        "full_name": "Dr. Aarav Sharma",
    },
    "dr.nair": {
        "password_hash": hashlib.sha256("doctor789".encode()).hexdigest(),
        "role": "Doctor",
        "full_name": "Dr. Priya Nair",
    },
}

# ── Rate Limiter State ───────────────────────────────────────────────────────
_rate_limit_store = {}  # {username: [timestamp, ...]}
RATE_LIMIT_MAX = 50     # max requests per window
RATE_LIMIT_WINDOW = 60  # window in seconds


# ═══════════════════════════════════════════════════════════════════════════════
#  AUTHENTICATION
# ═══════════════════════════════════════════════════════════════════════════════

def authenticate(username: str, password: str) -> dict:
    """
    Authenticate a user and return a JWT token.
    Returns: {"success": bool, "token": str, "role": str, "message": str}
    """
    user = USERS.get(username)
    if not user:
        audit_logger.warning(f"AUTH FAILED — Unknown user: {username}")
        return {"success": False, "token": None, "message": "Invalid credentials"}

    password_hash = hashlib.sha256(password.encode()).hexdigest()
    if password_hash != user["password_hash"]:
        audit_logger.warning(f"AUTH FAILED — Wrong password for user: {username}")
        return {"success": False, "token": None, "message": "Invalid credentials"}

    # Generate JWT
    payload = {
        "sub": username,
        "role": user["role"],
        "name": user["full_name"],
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    audit_logger.info(f"AUTH SUCCESS — User: {username} | Role: {user['role']}")
    return {
        "success": True,
        "token": token,
        "role": user["role"],
        "message": f"Welcome, {user['full_name']}",
    }


def validate_token(token: str) -> dict:
    """
    Validate a JWT token and return the decoded payload.
    Returns: {"valid": bool, "payload": dict, "message": str}
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        audit_logger.info(f"TOKEN VALID — User: {payload['sub']} | Role: {payload['role']}")
        return {"valid": True, "payload": payload, "message": "Token is valid"}
    except jwt.ExpiredSignatureError:
        audit_logger.warning("TOKEN EXPIRED")
        return {"valid": False, "payload": None, "message": "Token has expired"}
    except jwt.InvalidTokenError as e:
        audit_logger.warning(f"TOKEN INVALID — {e}")
        return {"valid": False, "payload": None, "message": "Invalid token"}


def require_role(token: str, required_role: str) -> dict:
    """Check if the token holder has the required role."""
    result = validate_token(token)
    if not result["valid"]:
        return result
    user_role = result["payload"].get("role", "")
    # Admin has access to everything
    if user_role == "Admin" or user_role == required_role:
        return result
    audit_logger.warning(
        f"ACCESS DENIED — User: {result['payload']['sub']} "
        f"(Role: {user_role}) tried to access {required_role}-only resource"
    )
    return {"valid": False, "payload": result["payload"],
            "message": f"Access denied. Required role: {required_role}"}


# ═══════════════════════════════════════════════════════════════════════════════
#  RATE LIMITING
# ═══════════════════════════════════════════════════════════════════════════════

def check_rate_limit(username: str) -> bool:
    """
    Check if a user has exceeded the rate limit.
    Returns True if allowed, False if rate-limited.
    """
    now = time.time()
    if username not in _rate_limit_store:
        _rate_limit_store[username] = []

    # Remove old entries outside the window
    _rate_limit_store[username] = [
        t for t in _rate_limit_store[username] if now - t < RATE_LIMIT_WINDOW
    ]

    if len(_rate_limit_store[username]) >= RATE_LIMIT_MAX:
        audit_logger.warning(f"RATE LIMITED — User: {username}")
        return False

    _rate_limit_store[username].append(now)
    return True


# ═══════════════════════════════════════════════════════════════════════════════
#  DATA PROTECTION
# ═══════════════════════════════════════════════════════════════════════════════

def mask_patient_name(name: str) -> str:
    """Mask a patient name for display (e.g., 'Aarav Sharma' → 'A**** S*****')."""
    if not name or not isinstance(name, str):
        return "***"
    parts = name.split()
    masked = []
    for part in parts:
        if len(part) <= 1:
            masked.append("*")
        else:
            masked.append(part[0] + "*" * (len(part) - 1))
    return " ".join(masked)


def mask_patient_id(pid: str) -> str:
    """Partially mask a patient ID (e.g., 'P001' → 'P***')."""
    if not pid or len(pid) <= 1:
        return "***"
    return pid[0] + "*" * (len(pid) - 1)


def encrypt_field(value: str) -> str:
    """Encrypt a string field using Fernet symmetric encryption."""
    if not isinstance(value, str):
        value = str(value)
    return _cipher.encrypt(value.encode()).decode()


def decrypt_field(encrypted_value: str) -> str:
    """Decrypt a Fernet-encrypted field."""
    return _cipher.decrypt(encrypted_value.encode()).decode()


def mask_dataframe(df, columns_to_mask=None):
    """
    Return a copy of the DataFrame with sensitive columns masked.
    Default columns: patient_name
    """
    import pandas as pd
    masked_df = df.copy()
    if columns_to_mask is None:
        columns_to_mask = ["patient_name"]
    for col in columns_to_mask:
        if col in masked_df.columns:
            if col == "patient_name":
                masked_df[col] = masked_df[col].apply(mask_patient_name)
            else:
                masked_df[col] = masked_df[col].apply(lambda x: mask_patient_id(str(x)))
    return masked_df


# ═══════════════════════════════════════════════════════════════════════════════
#  ACCESS LOGGING
# ═══════════════════════════════════════════════════════════════════════════════

def log_data_access(username: str, action: str, resource: str, success: bool = True):
    """Log an access event to the audit trail."""
    status = "SUCCESS" if success else "DENIED"
    audit_logger.info(f"ACCESS {status} — User: {username} | Action: {action} | Resource: {resource}")


def log_unauthorized_attempt(username: str, action: str, details: str = ""):
    """Log an unauthorized access attempt."""
    audit_logger.warning(
        f"UNAUTHORIZED — User: {username} | Action: {action} | Details: {details}"
    )


def get_audit_log() -> list:
    """Read and return recent audit log entries."""
    log_path = os.path.join(LOG_DIR, "audit_log.txt")
    if not os.path.exists(log_path):
        return []
    with open(log_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    return [line.strip() for line in lines[-100:]]  # Last 100 entries


# ═══════════════════════════════════════════════════════════════════════════════
#  DEMO FUNCTION
# ═══════════════════════════════════════════════════════════════════════════════

def demo_security():
    """Demonstrate all security features."""
    print("\n" + "=" * 70)
    print("  SECURITY MODULE DEMO")
    print("=" * 70)

    # 1. Authentication
    print("\n--- Authentication ---")
    result = authenticate("admin", "admin123")
    print(f"  Admin login: {result['message']}")
    admin_token = result["token"]

    result = authenticate("dr.sharma", "wrongpass")
    print(f"  Bad password: {result['message']}")

    result = authenticate("hacker", "password")
    print(f"  Unknown user: {result['message']}")

    # 2. Token Validation
    print("\n--- Token Validation ---")
    validation = validate_token(admin_token)
    print(f"  Valid token: {validation['message']} (Role: {validation['payload']['role']})")

    validation = validate_token("invalid.token.here")
    print(f"  Invalid token: {validation['message']}")

    # 3. Role-Based Access
    print("\n--- Role-Based Access ---")
    doctor_result = authenticate("dr.sharma", "doctor456")
    doctor_token = doctor_result["token"]

    admin_check = require_role(admin_token, "Admin")
    print(f"  Admin accessing Admin resource: {admin_check['message']}")

    doctor_check = require_role(doctor_token, "Admin")
    print(f"  Doctor accessing Admin resource: {doctor_check['message']}")

    # 4. Data Masking
    print("\n--- Data Masking ---")
    print(f"  'Aarav Sharma' → '{mask_patient_name('Aarav Sharma')}'")
    print(f"  'Priya Nair'   → '{mask_patient_name('Priya Nair')}'")
    print(f"  'P001'         → '{mask_patient_id('P001')}'")

    # 5. Encryption
    print("\n--- Field Encryption ---")
    original = "Patient SSN: 123-45-6789"
    encrypted = encrypt_field(original)
    decrypted = decrypt_field(encrypted)
    print(f"  Original:  {original}")
    print(f"  Encrypted: {encrypted[:50]}...")
    print(f"  Decrypted: {decrypted}")
    print(f"  Match: {original == decrypted}")

    print("\n" + "=" * 70)
