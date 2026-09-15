"""
Application Configuration
Smart India Hackathon 2026 - SIH26090
"""
import os
import socket
from pathlib import Path
from dotenv import load_dotenv

# Base Directory paths
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = Path(os.getenv("STATIC_DIR", str(BASE_DIR / "static")))
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", str(STATIC_DIR / "uploads")))

# Ensure upload directory exists
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

import re

# Load .env file (override=False ensures Render's dashboard environment variables ALWAYS take priority)
load_dotenv(BASE_DIR / ".env", override=False)

DATABASE_URL = (os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL") or "").strip()


def find_available_port(start_port: int, host: str = "0.0.0.0", max_tries: int = 20) -> int:
    """Return the first free port starting from start_port."""
    port = start_port
    for _ in range(max_tries):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind((host, port))
                return port
            except OSError:
                port += 1
    raise RuntimeError(f"No available port found starting at {start_port}.")


# =========================================================================
# 🔑 API KEY & SECRET CONFIGURATION
# Keep credentials strictly out of source control.
# =========================================================================
import secrets

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

# Secret key for signing session tokens and admin tokens
# In production, set APP_SECRET_KEY as a high-entropy 64-char hex string in .env
APP_SECRET_KEY = os.getenv("APP_SECRET_KEY") or os.getenv("ADMIN_TOKEN_SECRET")
if not APP_SECRET_KEY:
    # Ephemeral fallback for local dev; invalidates tokens on restart to prevent static token attacks
    APP_SECRET_KEY = secrets.token_hex(32)

# Gemini Model endpoint: use gemini-3.6-flash (current supported model for Gemini API)
DEFAULT_GEMINI_MODEL = "gemini-3.6-flash"
GEMINI_MODEL = (os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL) or DEFAULT_GEMINI_MODEL).strip()
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

# Application Settings
# Bind on all interfaces so a phone on the same Wi-Fi can reach the API.
HOST = os.getenv("HOST", "0.0.0.0")
configured_port = os.getenv("PORT")
PORT = int(configured_port) if configured_port else find_available_port(8000, HOST)
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", str(BASE_DIR / "artisan_catalog.db")))

# Supabase REST API Configuration (allows direct storage/sync to Supabase table)
SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").strip().rstrip("/")
SUPABASE_KEY = (
    os.getenv("SUPABASE_KEY")
    or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("SUPABASE_ANON_KEY")
    or ""
).strip()
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@kalasetu.gov.in").strip().lower()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
if not ADMIN_PASSWORD:
    # Do NOT provide a known static default password in code
    ADMIN_PASSWORD = secrets.token_urlsafe(16)
    print(f"[SECURITY WARNING] No ADMIN_PASSWORD set in .env! Temporary generated admin password: {ADMIN_PASSWORD}")

def _get_env_non_empty(*keys, default: str = "") -> str:
    """Return first non-empty environment variable value, stripped of whitespace and quotes."""
    for k in keys:
        v = os.getenv(k)
        if v is not None:
            cleaned = v.strip().strip("\"'")
            if cleaned:
                return cleaned
    return default


# SMTP Email Configuration (for Real Gmail / Email OTP Delivery)
SMTP_HOST = _get_env_non_empty("SMTP_HOST", "SMTP_SERVER", default="smtp.gmail.com")
try:
    SMTP_PORT = int(_get_env_non_empty("SMTP_PORT", default="587"))
except (ValueError, TypeError):
    SMTP_PORT = 587
SMTP_USER = _get_env_non_empty("GMAIL_USER", "SMTP_USER", "SMTP_USERNAME", "MAIL_USERNAME", "EMAIL_USER")
_raw_pass = _get_env_non_empty("GMAIL_APP_PASSWORD", "SMTP_PASS", "SMTP_PASSWORD", "MAIL_PASSWORD", "EMAIL_PASS")
SMTP_PASS = re.sub(r"\s+", "", _raw_pass)
EMAIL_FROM = _get_env_non_empty("EMAIL_FROM", default=SMTP_USER or "noreply@kalasetu.in")

