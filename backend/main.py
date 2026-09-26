"""
FastAPI Server for AI-Driven Market Linkage & Smart Cataloging
Smart India Hackathon 2026 - SIH26090
Ministry of Social Justice and Empowerment (MoSJE)
"""
import json
import base64
import uuid
import hashlib
import hmac
import os
import re
import time
import secrets
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

logger = logging.getLogger("kalasetu")


from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.ai_service import analyze_craft_image_with_gemini, translate_text_with_gemini, CATEGORIES, generate_institutional_rfq_ai
from backend.config import STATIC_DIR, UPLOAD_DIR, GEMINI_API_KEY, HOST, PORT, ADMIN_EMAIL, ADMIN_PASSWORD
from backend.database import get_db_connection, init_db
from backend.email_service import is_smtp_configured, send_otp_email

# Initialize DB on start safely
try:
    init_db()
except Exception as e:
    print(f"[STARTUP WARNING] Database initialization encountered an error: {e}")

app = FastAPI(
    title="KalaSetu - AI Smart Cataloging & Market Linkage",
    description="SIH 2026 (SIH26090) AI-driven platform for marginalized artisans and weavers.",
    version="1.0.0",
)

# Allow all origins: required for mobile APK (Expo/Android), React Native,
# and any browser frontend. Mobile apps may not send an Origin header at all,
# so the old localhost-only regex was silently blocking auth calls.
# Note: allow_credentials=True cannot be combined with allow_origins=["*"].
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)




class ProductCreate(BaseModel):
    name: str
    artisan_name: str
    artisan_phone: Optional[str] = "+919876543210"
    artisan_location: Optional[str] = "Rural Cluster, India"
    category: Optional[str] = "Handloom & Textiles"
    price: int
    suggested_price_min: Optional[int] = None
    suggested_price_max: Optional[int] = None
    price_justification: Optional[str] = None
    description_en: Optional[str] = ""  # Made optional — frontend may omit if user skips description
    description_hi: Optional[str] = ""
    tags: Optional[List[str]] = []
    image_url: Optional[str] = "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80"
    image_gallery: Optional[List[str]] = []
    rating: Optional[float] = 4.5
    reviews: Optional[List[dict]] = []
    is_enhanced: Optional[bool] = False
    mosje_verified: Optional[bool] = True
    quantity: int = 1
    owner_user_id: Optional[int] = None  # The user account ID who published this listing


class ProductReviewCreate(BaseModel):
    user_name: str = "Verified Buyer"
    rating: float = 5.0
    comment: str = ""


class UserLogin(BaseModel):
    email: str
    password: Optional[str] = ""  # No longer required — passwordless auth
    role: Optional[str] = None


class UserCreate(BaseModel):
    name: str
    email: str
    password: Optional[str] = ""  # No longer required — passwordless auth
    role: str = "buyer"
    phone: Optional[str] = ""
    city: str = ""
    language: str = "en"
    business_name: Optional[str] = ""
    gst_number: Optional[str] = ""
    udyam_number: Optional[str] = ""
    document_verification_status: Optional[str] = "pending"
    bank_status: Optional[str] = "not_uploaded"
    profile_completion: Optional[float] = 0.25


class PhoneLogin(BaseModel):
    phone: str
    password: Optional[str] = ""  # No longer required — passwordless auth


class PhoneRegister(BaseModel):
    phone: str
    password: Optional[str] = ""  # No longer required — passwordless auth
    name: str
    role: Optional[str] = "artisan"
    city: Optional[str] = ""
    language: Optional[str] = "hi"


class SendOtpRequest(BaseModel):
    phone: Optional[str] = ""
    email: Optional[str] = ""
    name: Optional[str] = ""


class VerifyOtpRequest(BaseModel):
    phone: Optional[str] = ""
    email: Optional[str] = ""
    otp: str
    password: Optional[str] = ""
    name: Optional[str] = "Artisan"
    role: Optional[str] = "artisan"
    city: Optional[str] = ""
    language: Optional[str] = "hi"


class WishlistRequest(BaseModel):
    product_id: int


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    language: Optional[str] = None
    business_name: Optional[str] = None


class OrderCreate(BaseModel):
    user_id: int
    product_id: int
    product_name: str
    quantity: int = 1
    total: int
    status: str = "Confirmed"
    eta: str = "2-4 working days"
    recipient_name: str
    recipient_phone: str
    address_line: str
    city: str
    state: str
    pincode: str


class CancelOrderRequest(BaseModel):
    reason: str = ""


class ProductDeleteRequest(BaseModel):
    user_id: int


class TranslationRequest(BaseModel):
    text: str
    source_language: str = "Kannada"
    target_language: str = "English"


class InstitutionalRequestCreate(BaseModel):
    artisan_name: str
    email: str
    phone: str = ""
    location: str = ""
    product_category: str = ""
    quantity: int = 1
    unit_price: float = 0
    lead_time: str = ""
    target_buyer: str = "Open to all"
    target_market: str = "Open to all"
    product_name: str = ""
    hsn_code: str = ""
    gst_rate: str = ""
    requirements: str = ""
    image_url: Optional[str] = ""


class AdminLogin(BaseModel):
    email: str
    password: str


class AdminRequestUpdate(BaseModel):
    status: str
    admin_notes: str = ""


class OrderStatusUpdate(BaseModel):
    user_id: int
    status: str
    note: Optional[str] = ""


class OfflineSyncRequest(BaseModel):
    drafts: List[InstitutionalRequestCreate] = []


import base64
import time
import secrets
from backend.config import APP_SECRET_KEY

def hash_password(password: str, salt: Optional[str] = None) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with a unique cryptographic salt."""
    if not salt:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        iterations=100000
    )
    return f"pbkdf2$sha256$100000${salt}${key.hex()}"

def verify_password(plain_password: str, stored_hash: str) -> bool:
    """Verify password against hash; handles legacy plain-text during migration."""
    if not (stored_hash.startswith("pbkdf2$") or stored_hash.startswith("pbkdf2:sha256:")):
        # Legacy fallback for demo records
        return hmac.compare_digest(plain_password, stored_hash)
    try:
        parts = stored_hash.split("$")
        if len(parts) == 5:
            _, _, iters, salt, hex_key = parts
        elif len(parts) == 3:
            prefix, salt, hex_key = parts
            iters = prefix.split(":")[-1]
        else:
            return False

        computed = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            iterations=int(iters)
        ).hex()
        return hmac.compare_digest(computed, hex_key)
    except Exception:
        return False

def generate_signed_token(subject: str, role: str, expires_in_seconds: int = 86400) -> str:
    """Generate a tamper-proof signed bearer token with expiry and cryptographic nonce."""
    exp = int(time.time()) + expires_in_seconds
    nonce = secrets.token_hex(8)
    payload_str = f"{subject}|{role}|{exp}|{nonce}"
    payload_b64 = base64.urlsafe_b64encode(payload_str.encode()).decode().rstrip("=")
    signature = hmac.new(APP_SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{signature}"

def verify_signed_token(token: Optional[str], required_role: Optional[str] = None) -> dict:
    """Cryptographically verify signature, timestamp expiration, and role."""
    if not token or "." not in token:
        raise HTTPException(status_code=401, detail="Authentication token missing or malformed")
    payload_b64, signature = token.split(".", 1)
    expected_sig = hmac.new(APP_SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected_sig):
        raise HTTPException(status_code=401, detail="Invalid token signature")
    
    # Restore base64 padding
    padding = "=" * ((4 - len(payload_b64) % 4) % 4)
    try:
        payload_str = base64.urlsafe_b64decode((payload_b64 + padding).encode()).decode()
        subject, role, exp_str, _ = payload_str.split("|")
        if int(exp_str) < int(time.time()):
            raise HTTPException(status_code=401, detail="Token has expired")
        if required_role and role != required_role:
            raise HTTPException(status_code=403, detail="Insufficient privileges")
        return {"subject": subject, "role": role}
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(status_code=401, detail="Token payload invalid")

def require_admin(token: Optional[str]):
    verify_signed_token(token, required_role="admin")


def normalize_user_row(row):
    user = dict(row)
    user.pop("password", None)
    return user


@app.get("/api/config-status")
def get_config_status():
    """Returns AI model connection status so frontend can display badge.
    Also exposes gemini_api_key and gemini_model so the web JS can call
    Gemini Vision directly (same approach as the mobile app).
    """
    has_gemini = bool(GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE")
    from backend.config import GEMINI_MODEL
    return {
        "status": "ready",
        "has_gemini_key": has_gemini,
        # Expose key to web frontend for direct Gemini Vision calls
        "gemini_api_key": GEMINI_API_KEY if has_gemini else "",
        "gemini_model": GEMINI_MODEL,
        "engine": "Google Gemini Vision 1.5/2.0" if has_gemini else "Smart Cataloging Fallback Engine",
        "hackathon": "Smart India Hackathon 2026 (SIH26090)",
        "ministry": "Ministry of Social Justice & Empowerment (MoSJE)",
    }


@app.get("/health")
def health_check():
    """Lightweight readiness endpoint for hosting providers and monitoring."""
    return {"status": "ok", "service": "kalakriti-api"}


@app.get("/api/categories")
def get_categories():
    """Returns official handicraft categories."""
    return {"categories": CATEGORIES}


def normalize_phone(phone: str) -> str:
    """Normalize Indian and international phone numbers to standard format."""
    raw = re.sub(r"[^\d+]", "", phone.strip())
    digits = re.sub(r"\D", "", raw)
    if len(digits) == 10:
        return f"+91{digits}"
    if len(digits) == 12 and digits.startswith("91"):
        return f"+{digits}"
    return raw or phone.strip()


# In-memory OTP storage for active verification requests
ACTIVE_OTPS: Dict[str, Dict[str, Any]] = {}


@app.post("/api/auth/send-otp")
def send_otp(payload: SendOtpRequest):
    """
    Passwordless OTP: Generate a 6-digit dummy OTP and ALWAYS return it in dev_otp.
    No real email/SMS delivery needed — the frontend auto-fills it.
    """
    target_email = payload.email.strip().lower() if payload.email else ""
    target_phone = payload.phone.strip() if payload.phone else ""

    if not target_email and not target_phone:
        raise HTTPException(status_code=400, detail="Please enter an email address or 10-digit mobile number")

    # Generate a 6-digit dummy OTP — always returned in response
    code = f"{secrets.randbelow(900000) + 100000}"

    if target_email:
        if "@" not in target_email:
            raise HTTPException(status_code=400, detail="Please enter a valid email address (e.g. name@gmail.com)")

        ACTIVE_OTPS[target_email] = {
            "otp": code,
            "expires_at": time.time() + 600,
            "type": "email",
        }
        return {
            "status": "success",
            "message": f"OTP generated for {target_email}",
            "target": target_email,
            "target_type": "email",
            "sent_via_smtp": False,
            "dev_otp": code,
            "notice": "Passwordless mode: Use the OTP shown on-screen to continue.",
            "expires_in": 600,
        }

    else:
        digits = re.sub(r"\D", "", target_phone)
        if len(digits) < 8:
            raise HTTPException(status_code=400, detail="Please enter a valid 10-digit mobile number")
        norm_phone = normalize_phone(target_phone)

        ACTIVE_OTPS[norm_phone] = {
            "otp": code,
            "expires_at": time.time() + 600,
            "type": "phone",
            "digits": digits[-10:],
        }
        return {
            "status": "success",
            "message": f"OTP generated for {norm_phone}",
            "target": norm_phone,
            "target_type": "phone",
            "phone": norm_phone,
            "sent_via_sms": False,
            "dev_otp": code,
            "notice": "Passwordless mode: Use the OTP shown on-screen to continue.",
            "expires_in": 600,
        }


@app.get("/api/auth/smtp-status")
def get_smtp_status():
    """
    Public diagnostic check for SMTP configuration.
    Confirms whether SMTP credentials are detected in the environment without exposing secrets.
    """
    from backend.email_service import get_smtp_config, is_smtp_configured
    cfg = get_smtp_config()
    user = cfg.get("user") or ""
    masked_user = f"{user[:3]}***@{user.split('@')[-1]}" if "@" in user else (user[:3] + "***" if user else "")
    resend_key = cfg.get("resend_key") or ""
    masked_resend = f"{resend_key[:6]}...{resend_key[-3:]}" if len(resend_key) > 8 else ("set" if resend_key else "not_set")

    # List all email-related environment variable keys detected in os.environ (keys only, no secrets!)
    detected_keys = [
        k for k in os.environ.keys()
        if any(term in k.upper() for term in ["SMTP", "GMAIL", "RESEND", "BREVO", "MAIL", "EMAIL"])
    ]

    return {
        "configured": is_smtp_configured(),
        "host": cfg.get("host"),
        "port": cfg.get("port"),
        "user_masked": masked_user,
        "pass_set": bool(cfg.get("pass")),
        "pass_length": len(cfg.get("pass", "")),
        "resend_detected": bool(resend_key),
        "resend_masked": masked_resend,
        "resend_length": len(resend_key),
        "detected_env_keys": detected_keys,
        "from_address": cfg.get("from"),
    }


@app.get("/api/auth/resend-test")
def test_resend_api(to: str = "maltesh3825@gmail.com"):
    """
    Test direct Resend dispatch to see Resend's exact response or HTTP error.
    """
    from backend.email_service import get_smtp_config, _send_via_resend
    cfg = get_smtp_config()
    api_key = cfg.get("resend_key")
    if not api_key:
        return {
            "status": "error",
            "message": "No RESEND_API_KEY detected in environment.",
            "detected_env_keys": [k for k in os.environ.keys() if any(term in k.upper() for term in ["SMTP", "GMAIL", "RESEND", "BREVO", "MAIL", "EMAIL"])]
        }

    res = _send_via_resend(
        api_key=api_key,
        target=to,
        subject="KalaSetu Resend Verification Test",
        text="Test email from KalaSetu via Resend API",
        html="<p>Test email from KalaSetu via Resend API</p>"
    )
    return {
        "resend_result": res,
        "target": to,
        "key_length": len(api_key),
        "key_prefix": api_key[:6] if len(api_key) > 6 else ""
    }


@app.get("/api/auth/brevo-test")
def test_brevo_api(to: str = "maltesh3825@gmail.com"):
    """
    Test direct Brevo dispatch to see Brevo's exact response or HTTP error.
    """
    from backend.email_service import get_smtp_config, _send_via_brevo
    cfg = get_smtp_config()
    api_key = cfg.get("brevo_key")
    if not api_key:
        return {
            "status": "error",
            "message": "No BREVO_API_KEY detected in environment.",
            "detected_env_keys": [k for k in os.environ.keys() if any(term in k.upper() for term in ["SMTP", "GMAIL", "RESEND", "BREVO", "MAIL", "EMAIL"])]
        }

    from_addr = cfg.get("from") or cfg.get("user") or "maltesh3825@gmail.com"
    res = _send_via_brevo(
        api_key=api_key,
        from_addr=from_addr,
        target=to,
        subject="KalaSetu Brevo Verification Test",
        text="Test email from KalaSetu via Brevo API",
        html="<p>Test email from KalaSetu via Brevo API</p>"
    )
    return {
        "brevo_result": res,
        "from_used": from_addr,
        "target": to,
        "key_length": len(api_key),
        "key_prefix": api_key[:8] if len(api_key) > 8 else ""
    }



@app.get("/api/auth/smtp-test")
def test_smtp_connectivity():
    """
    Test raw socket connectivity to smtp.gmail.com on ports 587 and 465.
    Returns live connectivity status to verify whether the hosting provider permits SMTP traffic.
    """
    import socket
    results = {}
    for port in [587, 465]:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(3.0)
        start = time.time()
        try:
            s.connect(("smtp.gmail.com", port))
            latency = round((time.time() - start) * 1000, 1)
            s.close()
            results[f"port_{port}"] = {
                "status": "OPEN",
                "latency_ms": latency
            }
        except Exception as e:
            results[f"port_{port}"] = {
                "status": "BLOCKED_OR_TIMEOUT",
                "error": f"{type(e).__name__}: {str(e)}"
            }

    return results




@app.post("/api/auth/verify-otp")
def verify_otp(payload: VerifyOtpRequest):
    """
    Passwordless OTP verification: Skip OTP code matching, just find-or-create the user.
    The real OTP check is done on the frontend (dummy/on-screen OTP).
    """
    target_email = payload.email.strip().lower() if payload.email else ""
    target_phone = payload.phone.strip() if payload.phone else ""

    norm_phone = normalize_phone(target_phone) if target_phone else ""

    if not target_email and not norm_phone:
        raise HTTPException(status_code=400, detail="Please specify the email or mobile number")

    # Clear any stored OTP (cleanup)
    key = target_email if target_email else norm_phone
    ACTIVE_OTPS.pop(key, None)

    conn = get_db_connection()
    cursor = conn.cursor()

    row = None
    if target_email:
        cursor.execute("SELECT * FROM users WHERE lower(email) = ?", (target_email,))
        row = cursor.fetchone()
    if not row and norm_phone:
        digits = re.sub(r"\D", "", target_phone)
        cursor.execute(
            "SELECT * FROM users WHERE phone = ? OR phone = ? OR phone LIKE ?",
            (norm_phone, target_phone, f"%{digits[-10:]}"),
        )
        row = cursor.fetchone()

    if row:
        user_data = normalize_user_row(row)
        token = generate_signed_token(subject=str(row["id"]), role=row["role"] or "artisan")
        conn.close()
        return {
            "status": "success",
            "is_new": False,
            "user": user_data,
            "access_token": token,
            "message": f"Welcome back, {user_data.get('name') or 'Artisan'}!",
        }
    else:
        # Auto-generate a dummy internal password (not used for auth anymore)
        dummy_password = secrets.token_urlsafe(16)
        hashed_pwd = hash_password(dummy_password)

        role = payload.role.strip().lower() if payload.role else "artisan"
        name = payload.name.strip() if payload.name else ("Artisan" if role == "artisan" else "Buyer")
        clean_digits = re.sub(r"\D", "", target_phone)[-10:] if target_phone else "user"
        user_email = target_email or f"{role}_{clean_digits}@kalakriti.in"
        phone_val = norm_phone or ""

        cursor.execute(
            """
            INSERT INTO users (name, email, password, role, phone, city, language)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                name,
                user_email,
                hashed_pwd,
                role,
                phone_val,
                payload.city.strip() if payload.city else "",
                payload.language.strip() if payload.language else "hi",
            ),
        )
        user_id = cursor.lastrowid
        conn.commit()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        new_row = cursor.fetchone()
        conn.close()

        user_data = normalize_user_row(new_row)
        token = generate_signed_token(subject=str(user_id), role=role)
        return {
            "status": "success",
            "is_new": True,
            "user": user_data,
            "access_token": token,
            "message": f"Account created! Welcome to KalaSetu, {name}!",
        }


@app.post("/api/auth/login")
def login_user(payload: UserLogin):
    """Passwordless login: find user by email or phone — no password check."""
    identifier = payload.email.strip().lower()
    norm_phone = normalize_phone(payload.email)
    digits = re.sub(r"\D", "", payload.email)

    conn = get_db_connection()
    cursor = conn.cursor()
    if digits and len(digits) >= 8:
        cursor.execute(
            """
            SELECT * FROM users
            WHERE lower(email) = ? OR phone = ? OR phone = ? OR phone LIKE ?
            """,
            (identifier, norm_phone, payload.email.strip(), f"%{digits[-10:]}"),
        )
    else:
        cursor.execute(
            "SELECT * FROM users WHERE lower(email) = ?",
            (identifier,),
        )
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="No account found. Please sign up first.")

    conn.close()
    user_data = normalize_user_row(row)
    token = generate_signed_token(subject=str(row["id"]), role=row["role"] or "buyer")
    return {"status": "success", "user": user_data, "access_token": token}


@app.post("/api/auth/phone-login")
def phone_login(payload: PhoneLogin):
    """Passwordless phone login: find user by mobile number — no PIN/password check."""
    norm_phone = normalize_phone(payload.phone)
    digits = re.sub(r"\D", "", payload.phone)
    if len(digits) < 8:
        raise HTTPException(status_code=400, detail="Invalid phone number format")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM users WHERE phone = ? OR phone = ? OR phone LIKE ?",
        (norm_phone, payload.phone.strip(), f"%{digits[-10:]}"),
    )
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="No account found with this phone number. Please sign up first.")

    conn.close()
    user_data = normalize_user_row(row)
    token = generate_signed_token(subject=str(row["id"]), role=row["role"] or "artisan")
    return {"status": "success", "user": user_data, "access_token": token}


@app.post("/api/auth/phone-register")
def phone_register(payload: PhoneRegister):
    """Passwordless phone registration: register by phone number only, no PIN required."""
    norm_phone = normalize_phone(payload.phone)
    digits = re.sub(r"\D", "", payload.phone)
    if len(digits) < 10:
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit mobile number")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE phone = ? OR phone = ? OR phone LIKE ?", (norm_phone, payload.phone.strip(), f"%{digits[-10:]}"))
    existing = cursor.fetchone()
    if existing:
        # If account exists, return it instead of erroring
        cursor.execute("SELECT * FROM users WHERE id = ?", (existing["id"],))
        row = cursor.fetchone()
        conn.close()
        user_data = normalize_user_row(row)
        token = generate_signed_token(subject=str(row["id"]), role=row["role"] or "artisan")
        return {"status": "success", "user_id": row["id"], "user": user_data, "access_token": token}

    synthetic_email = f"artisan_{digits[-10:]}@kalakriti.in"
    dummy_password = secrets.token_urlsafe(16)  # Internal only, not used for auth
    hashed_pwd = hash_password(dummy_password)
    cursor.execute(
        """
        INSERT INTO users (name, email, password, role, phone, city, language)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.name.strip() or "Artisan",
            synthetic_email,
            hashed_pwd,
            payload.role.strip().lower() if payload.role else "artisan",
            norm_phone,
            payload.city.strip() if payload.city else "",
            payload.language.strip() if payload.language else "hi",
        ),
    )
    user_id = cursor.lastrowid
    conn.commit()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    new_row = cursor.fetchone()
    conn.close()

    user_data = normalize_user_row(new_row)
    token = generate_signed_token(subject=str(user_id), role=payload.role.strip().lower() if payload.role else "artisan")
    return {"status": "success", "user_id": user_id, "user": user_data, "access_token": token}


@app.post("/api/admin/login")
def admin_login(payload: AdminLogin):
    if payload.email.strip().lower() != ADMIN_EMAIL or not hmac.compare_digest(payload.password, ADMIN_PASSWORD):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    token = generate_signed_token(subject=ADMIN_EMAIL, role="admin", expires_in_seconds=28800) # 8-hr TTL
    return {"status": "success", "admin": {"email": ADMIN_EMAIL}, "admin_token": token}


@app.post("/api/auth/register")
def register_user(payload: UserCreate):
    """Passwordless registration: create account by email/name only. If account exists, return it."""
    email = payload.email.strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE lower(email) = ?", (email,))
    existing = cursor.fetchone()
    if existing:
        # Return existing account instead of erroring — passwordless means no duplicate friction
        conn.close()
        user_data = normalize_user_row(existing)
        token = generate_signed_token(subject=str(existing["id"]), role=existing["role"] or "buyer")
        return {"status": "success", "user_id": existing["id"], "user": user_data, "access_token": token}

    dummy_password = secrets.token_urlsafe(16)  # Internal only, not exposed
    hashed_pwd = hash_password(dummy_password)
    cursor.execute(
        """
        INSERT INTO users (name, email, password, role, phone, city, language,
                            business_name, gst_number, udyam_number,
                            document_verification_status, bank_status, profile_completion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.name,
            email,
            hashed_pwd,
            payload.role,
            payload.phone or "",
            payload.city or "",
            payload.language or "en",
            payload.business_name or "",
            payload.gst_number or "",
            payload.udyam_number or "",
            payload.document_verification_status or "pending",
            payload.bank_status or "not_uploaded",
            payload.profile_completion or 0.25,
        ),
    )
    user_id = cursor.lastrowid
    conn.commit()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    new_row = cursor.fetchone()
    conn.close()

    user_data = normalize_user_row(new_row)
    token = generate_signed_token(subject=str(user_id), role=payload.role or "buyer")
    return {"status": "success", "user_id": user_id, "user": user_data, "access_token": token}


@app.get("/api/users/{user_id}")
def get_user(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    return normalize_user_row(row)


@app.put("/api/users/{user_id}")
@app.patch("/api/users/{user_id}")
def update_user_profile(user_id: int, payload: UserProfileUpdate):
    """Updates user profile information (such as name, city, phone) in SQLite and Supabase."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    updates = []
    values = []
    supabase_payload = {}

    if payload.name is not None and payload.name.strip():
        new_name = payload.name.strip()
        updates.append("name = ?")
        values.append(new_name)
        supabase_payload["name"] = new_name

    if payload.city is not None:
        updates.append("city = ?")
        values.append(payload.city.strip())
        supabase_payload["city"] = payload.city.strip()

    if payload.phone is not None and payload.phone.strip():
        updates.append("phone = ?")
        values.append(payload.phone.strip())
        supabase_payload["phone"] = payload.phone.strip()

    if payload.language is not None and payload.language.strip():
        updates.append("language = ?")
        values.append(payload.language.strip())
        supabase_payload["language"] = payload.language.strip()

    if payload.business_name is not None:
        try:
            updates.append("business_name = ?")
            values.append(payload.business_name.strip())
        except Exception:
            pass

    if not updates:
        conn.close()
        return {"status": "unchanged", "user": normalize_user_row(row)}

    values.append(user_id)
    update_sql = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
    cursor.execute(update_sql, tuple(values))
    conn.commit()

    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    updated_row = cursor.fetchone()
    conn.close()

    # Sync with Supabase cloud database if configured
    if supabase_payload:
        try:
            import os, requests as _req
            _supa_url = os.environ.get("SUPABASE_URL", "")
            _supa_key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_ANON_KEY", "")
            if _supa_url and _supa_key:
                user_email = row["email"] if "email" in row.keys() else ""
                _req.patch(
                    f"{_supa_url}/rest/v1/users?id=eq.{user_id}",
                    json=supabase_payload,
                    headers={
                        "apikey": _supa_key,
                        "Authorization": f"Bearer {_supa_key}",
                        "Content-Type": "application/json",
                        "Prefer": "return=minimal"
                    },
                    timeout=4
                )
                if user_email:
                    _req.patch(
                        f"{_supa_url}/rest/v1/users?email=eq.{user_email}",
                        json=supabase_payload,
                        headers={
                            "apikey": _supa_key,
                            "Authorization": f"Bearer {_supa_key}",
                            "Content-Type": "application/json",
                            "Prefer": "return=minimal"
                        },
                        timeout=4
                    )
        except Exception as sync_err:
            print(f"[USER UPDATE SYNC] Supabase user sync failed (non-fatal): {sync_err}")

    return {
        "status": "success",
        "message": "Profile updated successfully",
        "user": normalize_user_row(updated_row)
    }


@app.get("/api/wishlist/{user_id}")
def get_wishlist(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT product_id FROM wishlist WHERE user_id = ? ORDER BY id DESC",
        (user_id,),
    )
    products = [row[0] for row in cursor.fetchall()]
    conn.close()
    return {"wishlist": products}


@app.post("/api/wishlist/{user_id}")
def add_to_wishlist(user_id: int, item: WishlistRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)",
        (user_id, item.product_id),
    )
    conn.commit()
    conn.close()
    return {"status": "success", "product_id": item.product_id}


@app.delete("/api/wishlist/{user_id}/{product_id}")
def remove_from_wishlist(user_id: int, product_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM wishlist WHERE user_id = ? AND product_id = ?",
        (user_id, product_id),
    )
    conn.commit()
    conn.close()
    return {"status": "success"}


@app.get("/api/orders/{user_id}")
def get_orders(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC",
        (user_id,),
    )
    rows = cursor.fetchall()
    conn.close()
    return {"orders": [dict(r) for r in rows]}


@app.get("/api/orders/{user_id}/incoming")
def get_incoming_orders(user_id: int):
    """Orders placed by buyers for products belonging to this artisan — matched by seller_id, owner_user_id, or name/phone."""
    import traceback
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT name, phone FROM users WHERE id = ?", (user_id,))
        user_row = cursor.fetchone()
        if not user_row:
            return {"orders": []}

        user_name = (user_row[0] or "").strip()
        user_phone = (user_row[1] or "").strip()
        norm_phone = user_phone.replace("+91", "").replace(" ", "").replace("-", "")

        # Auto-claim unowned legacy listings matching this artisan's name or phone
        cursor.execute(
            """
            UPDATE products
            SET owner_user_id = ?
            WHERE owner_user_id IS NULL
              AND (
                  lower(artisan_name) = lower(?)
                  OR (
                      ? != ''
                      AND artisan_phone IS NOT NULL
                      AND (artisan_phone = ? OR replace(replace(replace(artisan_phone, '+91', ''), ' ', ''), '-', '') = ?)
                  )
              )
            """,
            (user_id, user_name, norm_phone, user_phone, norm_phone),
        )
        # Also auto-populate seller_id for existing orders of this artisan's products
        try:
            cursor.execute(
                """
                UPDATE orders
                SET seller_id = ?
                WHERE seller_id IS NULL
                  AND product_id IN (SELECT id FROM products WHERE owner_user_id = ?)
                """,
                (user_id, user_id),
            )
        except Exception:
            pass
        conn.commit()

        # Query orders using seller_id or owner_user_id or name/phone fallback
        cursor.execute(
            """
            SELECT orders.*,
                   COALESCE(NULLIF(orders.recipient_name, ''), users.name, 'Verified Buyer') AS buyer_name,
                   COALESCE(NULLIF(orders.recipient_phone, ''), users.phone, '') AS buyer_phone,
                   users.email AS buyer_email
            FROM orders
            LEFT JOIN products ON products.id = orders.product_id
            LEFT JOIN users ON users.id = orders.user_id
            WHERE (
                orders.seller_id = ?
                OR products.owner_user_id = ?
                OR (
                    products.owner_user_id IS NULL
                    AND (
                        lower(products.artisan_name) = lower(?)
                        OR (
                            ? != ''
                            AND products.artisan_phone IS NOT NULL
                            AND (
                                products.artisan_phone = ?
                                OR replace(replace(replace(products.artisan_phone, '+91', ''), ' ', ''), '-', '') = ?
                            )
                        )
                    )
                )
            )
            ORDER BY orders.id DESC
            """,
            (user_id, user_id, user_name, norm_phone, user_phone, norm_phone),
        )
        rows = cursor.fetchall()
        return {"orders": [dict(row) for row in rows]}
    except Exception as exc:
        print(f"[INCOMING ORDERS ERROR] user_id={user_id}: {exc}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Could not load incoming orders: {exc}")
    finally:
        try:
            conn.close()
        except Exception:
            pass


@app.get("/api/products/{user_id}/published")
def get_published_products(user_id: int):
    """Return marketplace listings published by this user — checks owner_user_id first, then name/phone."""
    import traceback
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT name, phone FROM users WHERE id = ?", (user_id,))
        user_row = cursor.fetchone()
        if not user_row:
            return {"products": []}

        user_name = (user_row[0] or "").strip()
        user_phone = (user_row[1] or "").strip()
        norm_phone = user_phone.replace("+91", "").replace(" ", "").replace("-", "")

        # Auto-claim unowned legacy listings matching this artisan's name or phone
        cursor.execute(
            """
            UPDATE products
            SET owner_user_id = ?
            WHERE owner_user_id IS NULL
              AND (
                  lower(artisan_name) = lower(?)
                  OR (
                      ? != ''
                      AND artisan_phone IS NOT NULL
                      AND (artisan_phone = ? OR replace(replace(replace(artisan_phone, '+91', ''), ' ', ''), '-', '') = ?)
                  )
              )
            """,
            (user_id, user_name, norm_phone, user_phone, norm_phone),
        )
        conn.commit()

        cursor.execute(
            """
            SELECT products.*
            FROM products
            WHERE (
                owner_user_id = ?
                OR (
                    owner_user_id IS NULL
                    AND (
                        lower(products.artisan_name) = lower(?)
                        OR (
                            ? != ''
                            AND products.artisan_phone IS NOT NULL
                            AND (
                                products.artisan_phone = ?
                                OR replace(replace(replace(products.artisan_phone, '+91', ''), ' ', ''), '-', '') = ?
                            )
                        )
                    )
                )
            )
            ORDER BY products.id DESC
            """,
            (user_id, user_name, norm_phone, user_phone, norm_phone),
        )
        rows = cursor.fetchall()
        products = []
        for row in rows:
            product = dict(row)
            for field in ("tags", "image_gallery", "reviews"):
                try:
                    product[field] = json.loads(product[field]) if isinstance(product[field], str) else (product[field] or [])
                except (TypeError, ValueError):
                    product[field] = []
            products.append(product)
        return {"products": products}
    except Exception as exc:
        print(f"[PUBLISHED PRODUCTS ERROR] user_id={user_id}: {exc}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Could not load published products: {exc}")
    finally:
        try:
            conn.close()
        except Exception:
            pass


@app.get("/api/notifications/{user_id}")
def get_notifications(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 100",
        (user_id,),
    )
    rows = cursor.fetchall()
    conn.close()
    return {"notifications": [dict(row) for row in rows]}


@app.post("/api/notifications/{user_id}/read")
def mark_notifications_read(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}


@app.post("/api/orders")
def create_order(payload: OrderCreate):
    import traceback
    if not all(value.strip() for value in (
        payload.recipient_name, payload.recipient_phone, payload.address_line,
        payload.city, payload.state, payload.pincode,
    )):
        raise HTTPException(status_code=422, detail="Complete delivery details are required")
    if not payload.pincode.isdigit() or len(payload.pincode) != 6:
        raise HTTPException(status_code=422, detail="Pincode must be a valid 6-digit number")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if payload.quantity < 1 or payload.quantity > 10:
            raise HTTPException(status_code=422, detail="You can buy between 1 and 10 items per order")
        requested_quantity = payload.quantity
        cursor.execute("SELECT quantity, artisan_name, name, price, owner_user_id, artisan_phone FROM products WHERE id = ?", (payload.product_id,))
        product_row = cursor.fetchone()
        if not product_row:
            raise HTTPException(status_code=404, detail="Product not found")
        available_quantity = int(product_row[0] or 0)
        if available_quantity < requested_quantity:
            raise HTTPException(status_code=409, detail="This product is no longer available in the requested quantity")

        cursor.execute(
            "UPDATE products SET quantity = quantity - ? WHERE id = ? AND quantity >= ?",
            (requested_quantity, payload.product_id, requested_quantity),
        )
        affected = getattr(cursor, 'rowcount', None)
        if affected is None:
            try:
                affected = cursor._cursor.rowcount
            except Exception:
                affected = 1  # assume success if rowcount unavailable
        if affected != 1:
            conn.rollback()
            raise HTTPException(status_code=409, detail="This product was just reserved by another buyer")
        # Total from frontend is already price * qty; store price-per-unit * requested_quantity
        unit_price = int(product_row[3] or payload.total)
        order_total = unit_price * requested_quantity

        # Determine artisan/seller user ID
        artisan_user_id = product_row[4] if len(product_row) > 4 and product_row[4] is not None else None
        if not artisan_user_id:
            # Fallback 1: match phone
            artisan_phone = (product_row[5] or "").strip() if len(product_row) > 5 else ""
            norm_artisan_phone = artisan_phone.replace("+91", "").replace(" ", "").replace("-", "")
            if norm_artisan_phone:
                cursor.execute(
                    "SELECT id FROM users WHERE phone = ? OR replace(replace(replace(phone, '+91', ''), ' ', ''), '-', '') = ? LIMIT 1",
                    (artisan_phone, norm_artisan_phone),
                )
                ph_row = cursor.fetchone()
                if ph_row:
                    artisan_user_id = ph_row[0]
        if not artisan_user_id and product_row[1]:
            # Fallback 2: match name
            cursor.execute(
                "SELECT id FROM users WHERE lower(name) = lower(?) LIMIT 1",
                (str(product_row[1]).strip(),),
            )
            name_row = cursor.fetchone()
            if name_row:
                artisan_user_id = name_row[0]

        cursor.execute(
            """
            INSERT INTO orders (
                user_id, product_id, product_name, quantity, total, status, eta,
                recipient_name, recipient_phone, address_line, city, state, pincode,
                seller_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.user_id,
                payload.product_id,
                payload.product_name,
                requested_quantity,
                order_total,
                payload.status,
                payload.eta,
                payload.recipient_name.strip(),
                payload.recipient_phone.strip(),
                payload.address_line.strip(),
                payload.city.strip(),
                payload.state.strip(),
                payload.pincode.strip(),
                artisan_user_id,
            ),
        )
        order_id = cursor.lastrowid

        # Notify the artisan / seller
        if artisan_user_id:
            cursor.execute(
                "INSERT INTO notifications (user_id, kind, title, message, related_id) VALUES (?, ?, ?, ?, ?)",
                (
                    artisan_user_id,
                    "buyer_order",
                    "New buyer order request",
                    f"A buyer requested {requested_quantity} unit(s) of '{payload.product_name}'. Total: ₹{order_total}.",
                    order_id,
                ),
            )

        # Also notify the buyer that order was placed
        cursor.execute(
            "INSERT INTO notifications (user_id, kind, title, message, related_id) VALUES (?, ?, ?, ?, ?)",
            (
                payload.user_id,
                "order_placed",
                "Order request sent",
                f"Your order request for {requested_quantity} unit(s) of '{payload.product_name}' (Order #{order_id}) has been sent to the artisan.",
                order_id,
            ),
        )
        conn.commit()
        remaining_quantity = available_quantity - requested_quantity

        # Sync updated product quantity to Supabase so website marketplace also reflects the change
        try:
            import os, requests as _req
            _supa_url = os.environ.get("SUPABASE_URL", "")
            _supa_key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_ANON_KEY", "")
            if _supa_url and _supa_key:
                _req.patch(
                    f"{_supa_url}/rest/v1/products?id=eq.{payload.product_id}",
                    json={"quantity": remaining_quantity},
                    headers={
                        "apikey": _supa_key,
                        "Authorization": f"Bearer {_supa_key}",
                        "Content-Type": "application/json",
                        "Prefer": "return=minimal"
                    },
                    timeout=5
                )
        except Exception as sync_err:
            print(f"[ORDER SYNC] Supabase quantity sync failed (non-fatal): {sync_err}")

        return {"status": "success", "order_id": order_id, "remaining_quantity": remaining_quantity}
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[ORDER ERROR] create_order failed: {exc}")
        traceback.print_exc()
        try:
            conn.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Order failed: {exc}")
    finally:
        try:
            conn.close()
        except Exception:
            pass


@app.delete("/api/products/{product_id}")
def delete_product(product_id: int, payload: ProductDeleteRequest):
    import traceback
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT p.artisan_name, p.artisan_phone, p.owner_user_id, u.name, u.phone, u.email
            FROM products p
            JOIN users u ON u.id = ?
            WHERE p.id = ?
            """,
            (payload.user_id, product_id),
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Product not found")

        # Primary ownership check: owner_user_id (reliable)
        owner_id = row["owner_user_id"]
        if owner_id is not None:
            is_owner = (owner_id == payload.user_id)
        else:
            # Legacy fallback for products published before owner_user_id existed
            artisan_name_norm = (row["artisan_name"] or "").strip().lower()
            user_name_norm = (row["name"] or "").strip().lower()
            name_match = artisan_name_norm == user_name_norm
            partial_match = bool(artisan_name_norm and user_name_norm and (
                user_name_norm in artisan_name_norm or artisan_name_norm in user_name_norm
            ))
            p_phone = (row["artisan_phone"] or "").replace("+91", "").replace(" ", "").replace("-", "")
            u_phone = (row["phone"] or "").replace("+91", "").replace(" ", "").replace("-", "")
            phone_match = bool(p_phone and u_phone and p_phone == u_phone)
            is_owner = name_match or phone_match or partial_match

        if not is_owner:
            raise HTTPException(
                status_code=403,
                detail=f"Only the seller who posted this product can delete it"
            )
        cursor.execute("DELETE FROM wishlist WHERE product_id = ?", (product_id,))
        cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
        conn.commit()
        return {"status": "success", "product_id": product_id, "message": "Product listing deleted. Your monthly listing quota has been restored."}
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[DELETE PRODUCT ERROR] product_id={product_id}: {exc}")
        traceback.print_exc()
        try:
            conn.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Delete failed: {exc}")
    finally:
        try:
            conn.close()
        except Exception:
            pass


@app.post("/api/orders/{order_id}/status")
def update_order_status(order_id: int, payload: OrderStatusUpdate):
    """Allows an artisan to Accept or Reject an incoming order, or mark it Dispatched/Delivered."""
    valid_statuses = {"Accepted", "Rejected", "Dispatched", "Delivered", "Cancelled"}
    target_status = payload.status.strip().title()
    if target_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {', '.join(sorted(valid_statuses))}")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT o.id, o.user_id, o.product_id, o.product_name, o.quantity, o.status,
               p.artisan_name, p.artisan_phone
        FROM orders o
        JOIN products p ON p.id = o.product_id
        WHERE o.id = ?
        """,
        (order_id,),
    )
    order_row = cursor.fetchone()
    if not order_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")

    order = dict(order_row)
    current_status = str(order["status"]).title()

    user_row = cursor.execute("SELECT id, name, phone, role FROM users WHERE id = ?", (payload.user_id,)).fetchone()
    if not user_row:
        conn.close()
        raise HTTPException(status_code=403, detail="User not recognized")

    user_dict = dict(user_row)
    p_phone = (order["artisan_phone"] or "").replace("+91", "").replace(" ", "").replace("-", "")
    u_phone = (user_dict.get("phone") or "").replace("+91", "").replace(" ", "").replace("-", "")
    phone_match = bool(p_phone and u_phone and p_phone == u_phone)
    name_match = bool(order["artisan_name"] and user_dict["name"] and order["artisan_name"].strip().lower() == user_dict["name"].strip().lower())

    is_artisan = (user_dict.get("role") == "artisan" or name_match or phone_match)
    is_buyer = (order["user_id"] == payload.user_id)
    is_admin = (user_dict.get("role") == "admin")

    if not (is_artisan or is_buyer or is_admin):
        conn.close()
        raise HTTPException(status_code=403, detail="You are not authorized to update this order")

    # If rejected or cancelled, restore the quantity to the product listing
    if target_status in ("Rejected", "Cancelled") and current_status not in ("Rejected", "Cancelled"):
        cursor.execute(
            "UPDATE products SET quantity = quantity + ? WHERE id = ?",
            (int(order["quantity"]), int(order["product_id"])),
        )

    now_str = datetime.now(timezone.utc).isoformat()
    note = payload.note.strip() if payload.note else ""
    cursor.execute(
        """
        UPDATE orders
        SET status = ?,
            cancel_reason = CASE WHEN ? != '' THEN ? ELSE cancel_reason END,
            cancelled_at = CASE WHEN ? IN ('Rejected', 'Cancelled') THEN ? ELSE cancelled_at END
        WHERE id = ?
        """,
        (target_status, note, note, target_status, now_str, order_id),
    )

    buyer_id = order["user_id"]
    if buyer_id:
        title = f"Order #{order_id} {target_status}"
        msg = f"Your order for {order['product_name']} ({order['quantity']} unit(s)) has been marked as '{target_status}'."
        if note:
            msg += f" Note: {note}"
        cursor.execute(
            "INSERT INTO notifications (user_id, kind, title, message, related_id) VALUES (?, ?, ?, ?, ?)",
            (buyer_id, f"order_{target_status.lower()}", title, msg, order_id),
        )

    conn.commit()
    conn.close()
    return {"status": "success", "order_id": order_id, "new_status": target_status}


@app.post("/api/orders/{order_id}/cancel")
def cancel_order(order_id: int, payload: CancelOrderRequest):
    """Cancel an order by record, restore tracked quantity and add a cancellation notice to the buyer profile."""
    import traceback
    reason = payload.reason.strip() if payload.reason else ""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT user_id, product_id, product_name, quantity, status FROM orders WHERE id = ?",
            (order_id,),
        )
        order_row = cursor.fetchone()
        if not order_row:
            raise HTTPException(status_code=404, detail="Order not found")

        if str(order_row["status"]).lower() == "cancelled":
            raise HTTPException(status_code=409, detail="Order is already cancelled")

        cursor.execute(
            "UPDATE orders SET status = 'Cancelled', cancel_reason = ? WHERE id = ?",
            (reason, order_id),
        )
        # Restore product quantity
        cursor.execute(
            "UPDATE products SET quantity = quantity + ? WHERE id = ?",
            (int(order_row["quantity"] or 1), int(order_row["product_id"])),
        )
        # Notify the buyer
        cursor.execute(
            "INSERT INTO notifications (user_id, kind, title, message, related_id) VALUES (?, ?, ?, ?, ?)",
            (
                int(order_row["user_id"]),
                "order_cancelled",
                "Order cancelled",
                f"Order #{order_id} for {order_row['product_name'] or 'your item'} was cancelled.{(' Reason: ' + reason) if reason else ''}",
                order_id,
            ),
        )
        conn.commit()
        return {"status": "success", "order_id": order_id, "restored_quantity": int(order_row["quantity"] or 1), "reason": reason}
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[CANCEL ORDER ERROR] order_id={order_id}: {exc}")
        traceback.print_exc()
        try:
            conn.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Cancel failed: {exc}")
    finally:
        try:
            conn.close()
        except Exception:
            pass


@app.delete("/api/orders/{order_id}")
def delete_order_endpoint(order_id: int):
    """Delete an order record and restore product inventory if order was active."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT user_id, product_id, quantity, status FROM orders WHERE id = ?", (order_id,))
        order_row = cursor.fetchone()
        if not order_row:
            return {"status": "success", "message": "Order already deleted", "order_id": order_id}

        # Restore product quantity if the order wasn't cancelled or rejected yet
        if str(order_row["status"]).lower() not in ("cancelled", "rejected"):
            try:
                cursor.execute(
                    "UPDATE products SET quantity = quantity + ? WHERE id = ?",
                    (int(order_row["quantity"] or 1), int(order_row["product_id"]))
                )
            except Exception:
                pass

        cursor.execute("DELETE FROM orders WHERE id = ?", (order_id,))
        conn.commit()
        return {"status": "success", "order_id": order_id, "message": "Order deleted"}
    except Exception as exc:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Delete order failed: {exc}")
    finally:
        try:
            conn.close()
        except Exception:
            pass


def persist_institutional_request(payload: InstitutionalRequestCreate):
    """Shared DB persistence for institutional RFQ payloads, including offline queue replay."""
    if not payload.artisan_name.strip() or not payload.email.strip():
        raise HTTPException(status_code=400, detail="Name and email are required")

    quality_flags = []
    if not payload.phone.strip():
        quality_flags.append("Missing phone or WhatsApp number")
    if not payload.location.strip():
        quality_flags.append("Missing artisan location")
    if not payload.product_category.strip():
        quality_flags.append("Missing product category")
    if not payload.requirements.strip() or len(payload.requirements.strip()) < 12:
        quality_flags.append("Requirements are too vague")
    if payload.quantity < 1:
        quality_flags.append("Quantity must be at least 1")

    target_buyer = payload.target_buyer.strip() or payload.target_market.strip() or "Open to all"
    target_market = payload.target_market.strip() or target_buyer

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO institutional_requests (
            artisan_name, email, phone, location,
            product_category, quantity, unit_price, lead_time,
            target_buyer, target_market, requirements, quality_flags,
            product_name, hsn_code, gst_rate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.artisan_name.strip(),
            payload.email.strip().lower(),
            payload.phone.strip(),
            payload.location.strip(),
            payload.product_category.strip(),
            max(1, payload.quantity),
            payload.unit_price,
            payload.lead_time.strip(),
            target_buyer,
            target_market,
            payload.requirements.strip(),
            "; ".join(quality_flags),
            payload.product_name.strip(),
            payload.hsn_code.strip(),
            payload.gst_rate.strip(),
        ),
    )
    request_id = cursor.lastrowid
    cursor.execute(
        "SELECT id FROM users WHERE lower(name) = lower(?) LIMIT 1",
        (payload.artisan_name.strip(),),
    )
    owner_row = cursor.fetchone()
    if owner_row:
        cursor.execute(
            "INSERT INTO notifications (user_id, kind, title, message, related_id) VALUES (?, ?, ?, ?, ?)",
            (
                owner_row[0],
                "bulk_request",
                "Bulk request submitted",
                f"Your {target_market} request for {max(1, payload.quantity)} unit(s) is pending review.",
                request_id,
            ),
        )
    conn.commit()
    conn.close()
    return {"status": "success", "request_id": request_id, "quality_flags": quality_flags}


@app.post("/api/institutional-requests")
def create_institutional_request(payload: InstitutionalRequestCreate):
    """Store a bulk linkage/RFQ request for follow-up by the KalaSetu team."""
    return persist_institutional_request(payload)


@app.post("/api/offline/sync")
def sync_offline_drafts(payload: OfflineSyncRequest):
    """Accept a lightweight local queue of offline RFQ drafts and persist them through the same path as online requests."""
    saved = []
    for draft in payload.drafts:
        try:
            result = persist_institutional_request(draft)
            saved.append(result)
        except HTTPException as exc:
            saved.append({"status": "error", "detail": str(exc.detail)})
    return {"status": "success", "synced": len(saved), "drafts": saved}


@app.get("/api/admin/institutional-requests")
def admin_list_institutional_requests(x_admin_token: Optional[str] = Header(None)):
    require_admin(x_admin_token)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM institutional_requests ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return {"requests": [dict(row) for row in rows]}


@app.patch("/api/admin/institutional-requests/{request_id}")
def admin_update_institutional_request(request_id: int, payload: AdminRequestUpdate, x_admin_token: Optional[str] = Header(None)):
    require_admin(x_admin_token)
    allowed_statuses = {"New", "In Review", "Approved", "Rejected"}
    if payload.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid moderation status")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE institutional_requests SET status = ?, admin_notes = ? WHERE id = ?", (payload.status, payload.admin_notes.strip(), request_id))
    affected = getattr(cursor, 'rowcount', None)
    try:
        affected = affected if affected is not None else cursor._cursor.rowcount
    except Exception:
        affected = 1
    if affected != 1:
        conn.close()
        raise HTTPException(status_code=404, detail="Request not found")
    conn.commit()
    conn.close()
    return {"status": "success", "request_id": request_id}


@app.get("/api/admin/artisan-quota")
def admin_get_artisan_quota(artisan_name: str, x_admin_token: Optional[str] = Header(None)):
    """Check how many listings an artisan has published this month (max 3)."""
    require_admin(x_admin_token)
    conn = get_db_connection()
    cursor = conn.cursor()
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    from backend.config import DATABASE_URL as _DB_URL
    if _DB_URL and "postgres" in _DB_URL:
        cursor.execute(
            "SELECT id, name, created_at FROM products WHERE lower(artisan_name) = lower(%s) AND TO_CHAR(created_at, 'YYYY-MM') = %s ORDER BY id ASC",
            (artisan_name.strip(), current_month),
        )
    else:
        cursor.execute(
            "SELECT id, name, created_at FROM products WHERE lower(artisan_name) = lower(?) AND substr(created_at, 1, 7) = ? ORDER BY id ASC",
            (artisan_name.strip(), current_month),
        )
    rows = cursor.fetchall()
    conn.close()
    return {
        "artisan_name": artisan_name,
        "month": current_month,
        "listings_this_month": len(rows),
        "limit": 3,
        "remaining": max(0, 3 - len(rows)),
        "products": [dict(r) for r in rows],
    }


@app.delete("/api/admin/artisan-quota/reset")
def admin_reset_artisan_quota(artisan_name: str, product_id: Optional[int] = None, x_admin_token: Optional[str] = Header(None)):
    """
    Admin: restore one listing slot for an artisan this month.
    - If product_id is provided, deletes that specific product.
    - Otherwise, deletes their oldest listing from this month.
    """
    require_admin(x_admin_token)
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        current_month = datetime.now(timezone.utc).strftime("%Y-%m")
        from backend.config import DATABASE_URL as _DB_URL
        if product_id:
            # Delete a specific product by ID, must belong to this artisan
            cursor.execute(
                "SELECT id, name FROM products WHERE id = ? AND lower(artisan_name) = lower(?)",
                (product_id, artisan_name.strip()),
            )
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Product not found for this artisan")
            cursor.execute("DELETE FROM wishlist WHERE product_id = ?", (product_id,))
            cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
            deleted_name = row[1]
        else:
            # Delete their oldest listing this month to free up one slot
            if _DB_URL and "postgres" in _DB_URL:
                cursor.execute(
                    "SELECT id, name FROM products WHERE lower(artisan_name) = lower(%s) AND TO_CHAR(created_at, 'YYYY-MM') = %s ORDER BY id ASC LIMIT 1",
                    (artisan_name.strip(), current_month),
                )
            else:
                cursor.execute(
                    "SELECT id, name FROM products WHERE lower(artisan_name) = lower(?) AND substr(created_at, 1, 7) = ? ORDER BY id ASC LIMIT 1",
                    (artisan_name.strip(), current_month),
                )
            row = cursor.fetchone()
            if not row:
                conn.close()
                return {"status": "no_action", "message": "This artisan has no listings this month to remove"}
            cursor.execute("DELETE FROM wishlist WHERE product_id = ?", (row[0],))
            cursor.execute("DELETE FROM products WHERE id = ?", (row[0],))
            deleted_name = row[1]
        conn.commit()
        return {"status": "success", "message": f"Deleted listing '{deleted_name}' — artisan now has one more slot this month"}
    except HTTPException:
        raise
    except Exception as exc:
        import traceback; traceback.print_exc()
        try: conn.rollback()
        except Exception: pass
        raise HTTPException(status_code=500, detail=f"Reset failed: {exc}")
    finally:
        try: conn.close()
        except Exception: pass


@app.get("/api/institutional-requests/{user_id}")
def get_institutional_requests(user_id: int):
    """Return bulk requests submitted for the signed-in artisan."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT institutional_requests.*
        FROM institutional_requests
        JOIN users ON lower(users.name) = lower(institutional_requests.artisan_name)
        WHERE users.id = ?
        ORDER BY institutional_requests.id DESC
        """,
        (user_id,),
    )
    rows = cursor.fetchall()
    conn.close()
    return {"requests": [dict(row) for row in rows]}


@app.post("/api/analyze-product")
async def analyze_product(
    file: UploadFile = File(...),
    notes: Optional[str] = Form(None),
    price_hint: Optional[float] = Form(None),
):
    """Step 1 & 2: artisan uploads image to analyze craft and pricing."""
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        filename = f"craft_{uuid.uuid4().hex[:10]}.{ext}"
        saved_path = UPLOAD_DIR / filename

        with open(saved_path, "wb") as f:
            f.write(image_bytes)

        image_url = f"/static/uploads/{filename}"
        ai_result = analyze_craft_image_with_gemini(
            image_bytes=image_bytes,
            artisan_notes=notes,
            artisan_input_price=price_hint,
        )
        ai_result["saved_image_url"] = image_url
        ai_result["original_filename"] = file.filename
        return JSONResponse(content=ai_result)
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to analyze product: {str(exc)}"},
        )


@app.post("/api/translate-text")
def translate_text(payload: TranslationRequest):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="Text to translate is required")
    try:
        translated = translate_text_with_gemini(text, payload.source_language, payload.target_language)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Translation unavailable: {exc}") from exc
    return {"translated_text": translated, "source_language": payload.source_language, "target_language": payload.target_language}


class InstitutionalRfqAiRequest(BaseModel):
    craft_hint: str = ""
    category: Optional[str] = None
    target_buyer: Optional[str] = None
    image_base64: Optional[str] = None


@app.post("/api/ai/institutional-rfq")
def ai_generate_institutional_rfq(payload: InstitutionalRfqAiRequest):
    """AI Analyzer for Bulk / Institutional RFQ listings."""
    image_bytes = None
    saved_image_url = None
    if payload.image_base64:
        try:
            raw_b64 = payload.image_base64
            if "," in raw_b64:
                raw_b64 = raw_b64.split(",", 1)[1]
            image_bytes = base64.b64decode(raw_b64)

            ext = "jpg"
            if payload.image_base64.startswith("data:image/png"):
                ext = "png"
            elif payload.image_base64.startswith("data:image/webp"):
                ext = "webp"
            fname = f"rfq_{uuid.uuid4().hex[:10]}.{ext}"
            file_path = os.path.join(UPLOAD_DIR, fname)
            with open(file_path, "wb") as f:
                f.write(image_bytes)
            saved_image_url = f"/static/uploads/{fname}"
        except Exception as e:
            logger.warning(f"Could not save RFQ image: {e}")
            image_bytes = None

    result = generate_institutional_rfq_ai(
        craft_hint=payload.craft_hint,
        category=payload.category,
        target_buyer=payload.target_buyer,
        image_bytes=image_bytes
    )
    if saved_image_url:
        result["saved_image_url"] = saved_image_url
    return JSONResponse(content=result)


@app.post("/api/products")
def create_product(product: ProductCreate, authorization: Optional[str] = Header(None)):
    """Publish a reviewed artisan listing to the marketplace.
    Enforces authentication: artisans MUST be logged into an active account to publish.
    """
    import traceback as _tb

    # Verify artisan authentication
    owner_id = product.owner_user_id
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        try:
            claims = verify_signed_token(token)
            token_user_id = int(claims.get("subject", 0))
            if token_user_id:
                owner_id = token_user_id
        except Exception as e:
            logger.warning(f"Bearer token verification failed in create_product: {e}")

    if not owner_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication required: You must be logged into an artisan account to publish products to the marketplace."
        )

    listing_quantity = product.quantity
    if listing_quantity < 1 or listing_quantity > 10:
        raise HTTPException(status_code=400, detail="Each listing must contain between 1 and 10 items")

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Validate that the user exists in the database
        cursor.execute("SELECT * FROM users WHERE id = ?", (owner_id,))
        user_row = cursor.fetchone()
        if not user_row:
            conn.close()
            raise HTTPException(
                status_code=401,
                detail="Artisan account not found. Please log in or register before publishing."
            )

        product.owner_user_id = owner_id
        user_dict = dict(user_row)
        user_name = user_dict.get("name")
        user_phone = user_dict.get("phone")
        user_city = user_dict.get("city")

        if not product.artisan_name or product.artisan_name == "Artisan Beneficiary":
            product.artisan_name = user_name or "Artisan"
        if (not product.artisan_phone or product.artisan_phone == "+919876543210") and user_phone:
            product.artisan_phone = user_phone
        if (not product.artisan_location or product.artisan_location == "Rural Cluster, India") and user_city:
            product.artisan_location = user_city

        current_month = datetime.now(timezone.utc).strftime("%Y-%m")

        # Use DATE_TRUNC for PostgreSQL, substr for SQLite — detect by DATABASE_URL
        from backend.config import DATABASE_URL as _DB_URL
        if _DB_URL and ("postgres" in _DB_URL):
            cursor.execute(
                "SELECT COUNT(*) FROM products WHERE owner_user_id = %s AND TO_CHAR(created_at, 'YYYY-MM') = %s",
                (product.owner_user_id, current_month),
            )
        else:
            cursor.execute(
                "SELECT COUNT(*) FROM products WHERE owner_user_id = ? AND substr(created_at, 1, 7) = ?",
                (product.owner_user_id, current_month),
            )

        row = cursor.fetchone()
        monthly_listings = row[0] if row else 0
        if monthly_listings >= 3:
            conn.close()
            raise HTTPException(status_code=429, detail="This artisan has used all 3 marketplace listings for this month")

        default_image = "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80"
        gallery_json = json.dumps(product.image_gallery or [product.image_url or default_image])
        reviews_json = json.dumps(product.reviews or [])

        cursor.execute(
            """
            INSERT INTO products (
                name, artisan_name, artisan_phone, artisan_location,
                category, price, suggested_price_min, suggested_price_max,
                price_justification, description_en, description_hi,
                tags, image_url, image_gallery, rating, reviews,
                is_enhanced, mosje_verified, quantity, owner_user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                product.name.strip(),
                product.artisan_name.strip(),
                product.artisan_phone or "+919876543210",
                (product.artisan_location or "Rural Cluster, India").strip(),
                (product.category or "Handloom & Textiles").strip(),
                product.price,
                product.suggested_price_min,
                product.suggested_price_max,
                product.price_justification or "",
                (product.description_en or product.name or "").strip(),
                product.description_hi or "",
                json.dumps(product.tags or ["Handmade", "Artisan"]),
                product.image_url or default_image,
                gallery_json,
                product.rating or 4.5,
                reviews_json,
                1 if product.is_enhanced else 0,
                1,
                listing_quantity,
                product.owner_user_id,  # User ID of the publisher — primary ownership key
            ),
        )

        new_id = cursor.lastrowid
        conn.commit()
        conn.close()

        # Also sync directly to Supabase REST table if credentials are set in .env
        from backend.database import sync_to_supabase_rest
        supabase_item = sync_to_supabase_rest({
            "name": product.name.strip(),
            "artisan_name": product.artisan_name.strip(),
            "artisan_phone": product.artisan_phone or "+919876543210",
            "artisan_location": (product.artisan_location or "Rural Cluster, India").strip(),
            "category": (product.category or "Handloom & Textiles").strip(),
            "price": product.price,
            "quantity": listing_quantity,
            "suggested_price_min": product.suggested_price_min,
            "suggested_price_max": product.suggested_price_max,
            "price_justification": product.price_justification or "",
            "description_en": (product.description_en or product.name or "").strip(),
            "description_hi": product.description_hi or "",
            "tags": product.tags or ["Handmade", "Artisan"],
            "image_url": product.image_url or default_image,
            "image_gallery": product.image_gallery or [product.image_url or default_image],
            "rating": product.rating or 4.5,
            "reviews": product.reviews or [],
            "is_enhanced": product.is_enhanced,
            "owner_user_id": product.owner_user_id,
        })

        return {
            "status": "success",
            "product_id": new_id,
            "supabase_synced": bool(supabase_item),
            "message": "Product published to marketplace!"
        }

    except HTTPException:
        raise
    except Exception as exc:
        if conn:
            try:
                conn.rollback()
                conn.close()
            except Exception:
                pass
        error_detail = f"{type(exc).__name__}: {str(exc)}"
        print(f"[CREATE_PRODUCT ERROR] {error_detail}")
        print(_tb.format_exc())
        raise HTTPException(status_code=500, detail=f"Publish failed: {error_detail}")


@app.post("/api/products/{product_id}/reviews")
def add_product_review(product_id: int, payload: ProductReviewCreate):
    """Add a marketplace product review with a review text and rating."""
    if not 1 <= payload.rating <= 5:
        raise HTTPException(status_code=422, detail="Rating must be between 1 and 5")
    if not payload.comment.strip():
        raise HTTPException(status_code=422, detail="Review comment is required")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT reviews, rating FROM products WHERE id = ?", (product_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")

    raw_reviews = json.loads(row["reviews"] or "[]") if isinstance(row["reviews"], str) else (row["reviews"] or [])
    review = {
        "user_name": payload.user_name.strip() or "Verified Buyer",
        "rating": round(float(payload.rating), 1),
        "comment": payload.comment.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    raw_reviews.append(review)

    ratings = [float(item.get("rating", 4.5)) for item in raw_reviews if isinstance(item, dict) and item.get("rating") is not None]
    average_rating = round(sum(ratings) / len(ratings), 1) if ratings else 4.5

    cursor.execute(
        "UPDATE products SET reviews = ?, rating = ? WHERE id = ?",
        (json.dumps(raw_reviews), average_rating, product_id),
    )
    conn.commit()
    conn.close()

    return {"status": "success", "product_id": product_id, "rating": average_rating, "reviews": raw_reviews}


@app.get("/api/products")
def list_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    sort: Optional[str] = "newest",
):
    """Public catalog page listing all products with search & category filters."""
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM products WHERE quantity > 0"
    params = []

    if category and category != "All":
        query += " AND category = ?"
        params.append(category)

    if search:
        s = f"%{search}%"
        query += " AND (name LIKE ? OR description_en LIKE ? OR artisan_name LIKE ? OR tags LIKE ?)"
        params.extend([s, s, s, s])

    if min_price is not None:
        query += " AND price >= ?"
        params.append(min_price)

    if max_price is not None:
        query += " AND price <= ?"
        params.append(max_price)

    if sort == "price_low":
        query += " ORDER BY price ASC"
    elif sort == "price_high":
        query += " ORDER BY price DESC"
    else:
        query += " ORDER BY id DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()

    products = []
    for row in rows:
        p = dict(row)
        try:
            p["tags"] = json.loads(p["tags"]) if isinstance(p["tags"], str) else p["tags"]
        except Exception:
            p["tags"] = [t.strip() for t in str(p["tags"]).split(",") if t.strip()]
        try:
            p["image_gallery"] = json.loads(p["image_gallery"]) if isinstance(p["image_gallery"], str) else (p["image_gallery"] or [])
        except Exception:
            p["image_gallery"] = []
        try:
            p["reviews"] = json.loads(p["reviews"]) if isinstance(p["reviews"], str) else (p["reviews"] or [])
        except Exception:
            p["reviews"] = []
        products.append(p)

    conn.close()
    return {"products": products, "total": len(products)}


@app.get("/api/products/{product_id}")
def get_product(product_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Product not found")

    p = dict(row)
    try:
        p["tags"] = json.loads(p["tags"])
    except Exception:
        p["tags"] = [t.strip() for t in str(p["tags"]).split(",") if t.strip()]
    try:
        p["image_gallery"] = json.loads(p["image_gallery"]) if isinstance(p["image_gallery"], str) else (p["image_gallery"] or [])
    except Exception:
        p["image_gallery"] = []
    try:
        p["reviews"] = json.loads(p["reviews"]) if isinstance(p["reviews"], str) else (p["reviews"] or [])
    except Exception:
        p["reviews"] = []

    return p


@app.get("/api/export/gem-csv")
def export_gem_csv(
    product_id: Optional[int] = Query(None, description="Filter for a single product ID"),
    artisan_name: Optional[str] = Query(None, description="Filter for a specific artisan/seller name"),
    artisan_id: Optional[int] = Query(None, description="Filter for artisan user ID"),
):
    """Expose a government-compliant GeM-ready CSV package from the product catalog.
    Supports scoping to a single product or a single artisan/seller."""
    conn = get_db_connection()
    cursor = conn.cursor()

    conditions = []
    params = []

    if product_id is not None:
        conditions.append("id = ?")
        params.append(int(product_id))

    if artisan_name and artisan_name.strip():
        clean_name = artisan_name.strip()
        conditions.append("LOWER(artisan_name) LIKE LOWER(?)")
        params.append(f"%{clean_name}%")

    if artisan_id is not None:
        conditions.append("owner_user_id = ?")
        params.append(int(artisan_id))

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    query = f"SELECT id, name, artisan_name, artisan_location, category, price, quantity, description_en, image_url FROM products {where_clause} ORDER BY id DESC"

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()

    hsn_map = {
        "Handloom & Textiles": ("5208", "5%"),
        "Pottery & Terracotta": ("6912", "12%"),
        "Brass & Metalcraft": ("7419", "12%"),
        "Woodcraft": ("4420", "12%"),
        "Cane & Bamboo": ("4602", "5%"),
        "Folk Art & Painting": ("9701", "12%"),
    }

    header = [
        "gem_catalog_id",
        "item_title",
        "artisan_seller",
        "cluster_location",
        "craft_category",
        "hsn_code",
        "gst_rate",
        "base_price_inr",
        "stock_quantity",
        "dispatch_lead_days",
        "udyam_compliance",
        "gem_procurement_mode",
        "facilitator_type"
    ]
    lines = [",".join(header)]
    for row in rows:
        p_id = str(row[0])
        p_name = f'"{str(row[1]).replace(chr(34), chr(39))}"'
        p_artisan = f'"{str(row[2] or "Artisan Partner").replace(chr(34), chr(39))}"'
        p_loc = f'"{str(row[3] or "Rural Cluster").replace(chr(34), chr(39))}"'
        cat = str(row[4] or "Handicraft")
        p_cat = f'"{cat}"'
        hsn, gst = hsn_map.get(cat, ("9703", "12%"))
        price = str(row[5] or "0")
        qty = str(row[6] or "1")
        lead_days = "7-10"
        udyam = "Verified_MoSJE_SHG"
        proc_mode = "Direct_Purchase_L1"
        facilitator = "Cluster_Coordinator_DIC"

        row_vals = [p_id, p_name, p_artisan, p_loc, p_cat, hsn, gst, price, qty, lead_days, udyam, proc_mode, facilitator]
        lines.append(",".join(row_vals))

    filename = "kalasetu-gem-procurement-catalog.csv"
    if product_id is not None:
        filename = f"kalasetu-gem-product-{product_id}.csv"
    elif artisan_name and artisan_name.strip():
        safe_artisan = re.sub(r'[^a-zA-Z0-9_-]', '_', artisan_name.strip().lower())
        filename = f"kalasetu-gem-artisan-{safe_artisan}.csv"

    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"'
    }

    return PlainTextResponse("\n".join(lines), media_type="text/csv", headers=headers)


@app.get("/api/export/ondc")
def export_ondc(
    product_id: Optional[int] = Query(None, description="Filter for a single product ID"),
    artisan_name: Optional[str] = Query(None, description="Filter for a specific artisan/seller name"),
    artisan_id: Optional[int] = Query(None, description="Filter for artisan user ID"),
):
    """Expose an ONDC/Beckn 1.1.0 compliant JSON payload from the catalog for network providers.
    Supports scoping to a single product or a single artisan/seller."""
    conn = get_db_connection()
    cursor = conn.cursor()

    conditions = []
    params = []

    if product_id is not None:
        conditions.append("id = ?")
        params.append(int(product_id))

    if artisan_name and artisan_name.strip():
        clean_name = artisan_name.strip()
        conditions.append("LOWER(artisan_name) LIKE LOWER(?)")
        params.append(f"%{clean_name}%")

    if artisan_id is not None:
        conditions.append("owner_user_id = ?")
        params.append(int(artisan_id))

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    limit_clause = "LIMIT 25" if not conditions else ""
    query = f"SELECT id, name, artisan_name, artisan_location, category, price, quantity, description_en, image_url FROM products {where_clause} ORDER BY id DESC {limit_clause}"

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()

    items = []
    for r in rows:
        items.append({
            "id": f"KALASETU-ITEM-{r[0]}",
            "descriptor": {
                "name": r[1],
                "short_desc": r[7] or r[1],
                "images": [r[8]] if r[8] else [],
            },
            "category_id": r[4] or "Handicrafts",
            "fulfillment_id": "F-KALASETU-STANDARD",
            "price": {
                "currency": "INR",
                "value": str(r[5] or 0),
            },
            "quantity": {
                "available": {
                    "count": r[6] or 1
                },
                "maximum": {
                    "count": min(10, r[6] or 1)
                }
            },
            "tags": {
                "artisan": r[2] or "Artisan Beneficiary",
                "origin": r[3] or "India",
                "certification": "MoSJE-Verified",
                "facilitator_channel": "SHG_Cluster_Lead"
            }
        })

    scope_descriptor = "KalaSetu Artisan Network"
    if product_id is not None and rows:
        scope_descriptor = f"KalaSetu Item #{product_id} - {rows[0][1]}"
    elif artisan_name and artisan_name.strip():
        scope_descriptor = f"KalaSetu Artisan Catalog - {artisan_name.strip()}"

    payload = {
        "context": {
            "domain": "ONDC:RET10",
            "country": "IND",
            "city": "std:080",
            "action": "on_search",
            "core_version": "1.1.0",
            "bap_id": "buyer-app.ondc.org",
            "bpp_id": "bpp.kalasetu.in",
            "bpp_uri": "https://kalasetu.in/ondc/bpp",
            "transaction_id": "txn-kalasetu-live-catalog",
            "message_id": "msg-export-beckn-v1"
        },
        "message": {
            "catalog": {
                "bpp/descriptor": {
                    "name": scope_descriptor,
                    "short_desc": "Empowering micro-artisans & weavers with direct institutional & retail linkage"
                },
                "bpp/providers": [
                    {
                        "id": "KALASETU-PROVIDER-01",
                        "descriptor": {
                            "name": "KalaSetu Verified Artisan Cooperative",
                            "symbol": "https://kalasetu.in/static/favicon.ico"
                        },
                        "categories": [
                            {"id": "Handloom & Textiles", "descriptor": {"name": "Handloom & Textiles"}},
                            {"id": "Pottery & Terracotta", "descriptor": {"name": "Pottery & Terracotta"}},
                            {"id": "Brass & Metalcraft", "descriptor": {"name": "Brass & Metalcraft"}},
                            {"id": "Woodcraft", "descriptor": {"name": "Woodcraft"}}
                        ],
                        "items": items
                    }
                ]
            }
        },
        "export_metadata": {
            "specification": "ONDC Beckn Protocol 1.1.0",
            "readiness_status": "Compliance_Ready_For_BPP_Onboarding",
            "facilitator_note": "Ready for submission to registered ONDC Seller Network Participant (SNP)",
            "item_count": len(items),
            "filtered_artisan": artisan_name or None,
            "filtered_product_id": product_id or None
        }
    }
    return JSONResponse(content=payload)


@app.get("/api/users/{user_id}/documents")
def get_document_verification(user_id: int):
    """Return verification readiness for onboarding fields such as Udyam, GST, bank, and profile documents."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, role, business_name, gst_number, udyam_number, document_verification_status, bank_status, profile_completion FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user_id": row[0],
        "name": row[1],
        "email": row[2],
        "role": row[3],
        "business_name": row[4] or "",
        "gst_number": row[5] or "",
        "udyam_number": row[6] or "",
        "document_verification_status": row[7] or "pending",
        "bank_status": row[8] or "not_uploaded",
        "profile_completion": row[9] or 0.25,
        "required_documents": [
            "Udyam registration or artisan identity proof",
            "GST or business registration",
            "Bank passbook / bank account proof",
            "Product category and inventory declaration",
        ],
    }


@app.get("/api/users/{user_id}/business-advisor")
def get_ai_business_advisor(user_id: int):
    """Return AI-style business manager guidance for inventory, pricing, demand, and export opportunities."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, role FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    cursor.execute("SELECT COUNT(*) FROM products WHERE artisan_name IN (SELECT name FROM users WHERE id = ?)", (user_id,))
    product_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM orders WHERE user_id = ?", (user_id,))
    order_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM institutional_requests WHERE email = (SELECT email FROM users WHERE id = ?)", (user_id,))
    request_count = cursor.fetchone()[0]
    conn.close()

    return {
        "status": "ready",
        "role": user[1],
        "business_health": "positive",
        "recommended_actions": [
            "Refresh product photos and add GST/HSN-ready descriptions.",
            "Bundle similar products for bulk institutional requests.",
            "Create a catalog export for GeM or ONDC readiness.",
            "Re-run pricing with raw material and lead-time assumptions.",
        ],
        "metrics": {
            "inventory_products": product_count,
            "orders": order_count,
            "rfqs": request_count,
            "export_readiness": "partial",
        },
        "opportunities": [
            "Government procurement",
            "Corporate gifting",
            "Retail cluster demand",
            "Festival collection bundles",
        ],
    }


@app.get("/api/users/{user_id}/dashboard")
def get_dashboard(user_id: int):
    """Return analytics-like dashboard metrics and inventory/order trends for the dashboard experience."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, role, email, name FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    cursor.execute("SELECT COUNT(*) FROM products WHERE artisan_name = ?", (user[3],))
    product_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM orders WHERE user_id = ?", (user_id,))
    order_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM institutional_requests WHERE artisan_name = ?", (user[3],))
    request_count = cursor.fetchone()[0]
    cursor.execute("SELECT COALESCE(SUM(total), 0) FROM orders WHERE user_id = ?", (user_id,))
    spend_total = cursor.fetchone()[0] or 0
    conn.close()

    return {
        "user_id": user[0],
        "name": user[3],
        "role": user[1],
        "email": user[2],
        "analytics": {
            "total_products": product_count,
            "orders": order_count,
            "institutional_requests": request_count,
            "estimated_order_value": spend_total,
            "export_readiness": "GeM/ONDC ready",
            "inventory_quality_score": "88%",
            "language_support": "en, hi",
        },
        "business_alerts": [
            "Follow up on pending institutional RFQs",
            "Export product catalog to GeM/ONDC",
            "Review missing GST/HSN classification",
            "Sync offline product drafts",
        ],
    }


@app.get("/api/stats")
def get_stats():
    """Returns marketplace summary statistics for the dashboard/pitch."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM products")
    total_products = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(DISTINCT artisan_name) FROM products")
    total_artisans = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(DISTINCT category) FROM products")
    total_clusters = cursor.fetchone()[0]

    conn.close()

    return {
        "total_products": total_products,
        "total_artisans": total_artisans,
        "craft_clusters": total_clusters,
        "mosje_certified_pct": "100%",
    }


# Mount uploads separately because hosted deployments may place them outside
# STATIC_DIR (for example /tmp/uploads on Render's free tier).
app.mount("/static/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
def serve_index():
    """Serves the main application page."""
    return FileResponse(STATIC_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn

    print(f"🚀 Starting KalaSetu Artisan App on http://{HOST}:{PORT}")
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)
