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

# Load .env file
load_dotenv(BASE_DIR / ".env")


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

# Gemini Model endpoint: use a currently supported model for new users.
# Example: gemini-3.6-flash
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

# Application Settings
# Bind on all interfaces so a phone on the same Wi-Fi can reach the API.
HOST = os.getenv("HOST", "0.0.0.0")
configured_port = os.getenv("PORT")
PORT = int(configured_port) if configured_port else find_available_port(8000, HOST)
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", str(BASE_DIR / "artisan_catalog.db")))
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@kalasetu.gov.in").strip().lower()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
if not ADMIN_PASSWORD:
    # Do NOT provide a known static default password in code
    ADMIN_PASSWORD = secrets.token_urlsafe(16)
    print(f"[SECURITY WARNING] No ADMIN_PASSWORD set in .env! Temporary generated admin password: {ADMIN_PASSWORD}")

# SMTP Email Configuration (for Real Gmail / Email OTP Delivery)
SMTP_HOST = os.getenv("SMTP_HOST", os.getenv("SMTP_SERVER", "smtp.gmail.com")).strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", os.getenv("SMTP_USERNAME", os.getenv("GMAIL_USER", ""))).strip()
SMTP_PASS = os.getenv("SMTP_PASS", os.getenv("SMTP_PASSWORD", os.getenv("GMAIL_APP_PASSWORD", ""))).strip()
EMAIL_FROM = os.getenv("EMAIL_FROM", SMTP_USER or "noreply@kalasetu.in").strip()
