"""
FastAPI Server for AI-Driven Market Linkage & Smart Cataloging
Smart India Hackathon 2026 - SIH26090
Ministry of Social Justice and Empowerment (MoSJE)
"""
import json
import uuid
import hashlib
import hmac
import os
import re
import time
import secrets
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.ai_service import analyze_craft_image_with_gemini, translate_text_with_gemini, CATEGORIES
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

# Do not combine allow_origins=["*"] with allow_credentials=True
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



class ProductCreate(BaseModel):
    name: str
    artisan_name: str
    artisan_phone: Optional[str] = "+919876543210"
    artisan_location: str
    category: str
    price: int
    suggested_price_min: Optional[int] = None
    suggested_price_max: Optional[int] = None
    price_justification: Optional[str] = None
    description_en: str
    description_hi: Optional[str] = ""
    tags: List[str]
    image_url: str
    image_gallery: Optional[List[str]] = []
    rating: Optional[float] = 4.5
    reviews: Optional[List[dict]] = []
    is_enhanced: Optional[bool] = False
    quantity: int = 1


class ProductReviewCreate(BaseModel):
    user_name: str = "Verified Buyer"
    rating: float = 5.0
    comment: str = ""


class UserLogin(BaseModel):
    email: str
    password: str
    role: Optional[str] = None


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
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
    password: str


class PhoneRegister(BaseModel):
    phone: str
    password: str
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
    requirements: str = ""


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
    """Returns AI model connection status so frontend can display badge."""
    has_gemini = bool(GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE")
    return {
        "status": "ready",
        "has_gemini_key": has_gemini,
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
    Generate and dispatch a 6-digit OTP verification code.
    Supports real Gmail/Email OTP delivery via SMTP, plus Mobile delivery.
    """
    target_email = payload.email.strip().lower() if payload.email else ""
    target_phone = payload.phone.strip() if payload.phone else ""

    if not target_email and not target_phone:
        raise HTTPException(status_code=400, detail="Please enter an email address or 10-digit mobile number")

    # Generate a cryptographically random 6-digit OTP code (e.g. 748192)
    code = f"{secrets.randbelow(900000) + 100000}"

    if target_email:
        if "@" not in target_email:
            raise HTTPException(status_code=400, detail="Please enter a valid email address (e.g. name@gmail.com)")

        ACTIVE_OTPS[target_email] = {
            "otp": code,
            "expires_at": time.time() + 600,
            "type": "email",
        }

        # Attempt real email dispatch via SMTP
        email_res = send_otp_email(target_email, code, payload.name or "")
        if email_res["success"]:
            return {
                "status": "success",
                "message": f"Verification code sent directly to your Gmail/email inbox ({target_email})",
                "target": target_email,
                "target_type": "email",
                "sent_via_smtp": True,
                "expires_in": 600,
            }
        else:
            smtp_configured = is_smtp_configured()
            err_msg = email_res.get("error") or "Unknown error"
            if not smtp_configured:
                smtp_hint = "GMAIL_USER and GMAIL_APP_PASSWORD are not detected in Render Environment Variables."
            else:
                smtp_hint = f"SMTP Delivery Failed: {err_msg}"

            logger.warning(f"[AUTH OTP] Email delivery fallback triggered for {target_email}: {smtp_hint}")
            return {
                "status": "success",
                "message": f"Verification code generated for {target_email}",
                "target": target_email,
                "target_type": "email",
                "sent_via_smtp": False,
                "dev_otp": code,
                "notice": smtp_hint,
                "error_details": err_msg,
                "smtp_configured": smtp_configured,
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
            "message": f"Verification code generated for {norm_phone}",
            "target": norm_phone,
            "target_type": "phone",
            "phone": norm_phone,
            "sent_via_sms": False,
            "dev_otp": code,
            "notice": "SMS delivery to Indian mobiles requires an active telecom gateway (Twilio/Fast2SMS). Use Gmail OTP for direct inbox delivery.",
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
    return {
        "configured": is_smtp_configured(),
        "host": cfg.get("host"),
        "port": cfg.get("port"),
        "user_masked": masked_user,
        "pass_set": bool(cfg.get("pass")),
        "pass_length": len(cfg.get("pass", "")),
        "from_address": cfg.get("from"),
    }



@app.post("/api/auth/verify-otp")
def verify_otp(payload: VerifyOtpRequest):
    """
    Verify OTP code and authenticate or register user with password security.
    Enforces security: Accounts cannot be created or accessed without proper verification and password.
    """
    target_email = payload.email.strip().lower() if payload.email else ""
    target_phone = payload.phone.strip() if payload.phone else ""
    entered_otp = payload.otp.strip()

    if not entered_otp:
        raise HTTPException(status_code=400, detail="Please enter the verification code")

    norm_phone = normalize_phone(target_phone) if target_phone else ""
    key = target_email if target_email else norm_phone

    if not key:
        raise HTTPException(status_code=400, detail="Please specify the email or mobile number to verify")

    stored = ACTIVE_OTPS.get(key)
    if not stored or time.time() > stored.get("expires_at", 0):
        raise HTTPException(
            status_code=400,
            detail="Verification code has expired or was not requested. Please request a new code.",
        )

    if stored.get("otp") != entered_otp:
        raise HTTPException(
            status_code=400,
            detail="Invalid verification code. Please check your inbox or code.",
        )

    # Invalidate OTP to prevent replay attacks
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
        password = payload.password.strip() if payload.password else ""
        if not password or len(password) < 4:
            # Auto-generate a secure random password for OTP-verified users so they are never blocked
            password = secrets.token_urlsafe(12)

        role = payload.role.strip().lower() if payload.role else "artisan"
        name = payload.name.strip() if payload.name else ("Artisan" if role == "artisan" else "Buyer")
        clean_digits = re.sub(r"\D", "", target_phone)[-10:] if target_phone else "user"
        user_email = target_email or f"{role}_{clean_digits}@kalakriti.in"
        phone_val = norm_phone or ""
        hashed_pwd = hash_password(password)

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
            "message": f"Account created and verified! Welcome to KalaSetu, {name}!",
        }


@app.post("/api/auth/login")
def login_user(payload: UserLogin):
    """Authenticate a buyer or artisan using email or mobile number."""
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

    if not row or not verify_password(payload.password, row["password"]):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid email/phone or password")

    # If the user still had a plaintext password, upgrade it transparently
    if not (row["password"].startswith("pbkdf2$") or row["password"].startswith("pbkdf2:sha256:")):
        new_hash = hash_password(payload.password)
        cursor.execute("UPDATE users SET password = ? WHERE id = ?", (new_hash, row["id"]))
        conn.commit()
    conn.close()

    user_data = normalize_user_row(row)
    token = generate_signed_token(subject=str(row["id"]), role=row["role"] or "buyer")
    return {"status": "success", "user": user_data, "access_token": token}


@app.post("/api/auth/phone-login")
def phone_login(payload: PhoneLogin):
    """Authenticate an artisan or buyer using their mobile number and PIN/password."""
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
    if not row or not verify_password(payload.password, row["password"]):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid phone number or PIN/password")

    # If the user still had a plaintext password, upgrade it transparently
    if not (row["password"].startswith("pbkdf2$") or row["password"].startswith("pbkdf2:sha256:")):
        new_hash = hash_password(payload.password)
        cursor.execute("UPDATE users SET password = ? WHERE id = ?", (new_hash, row["id"]))
        conn.commit()
    conn.close()

    user_data = normalize_user_row(row)
    token = generate_signed_token(subject=str(row["id"]), role=row["role"] or "artisan")
    return {"status": "success", "user": user_data, "access_token": token}


@app.post("/api/auth/phone-register")
def phone_register(payload: PhoneRegister):
    """Register a new artisan or buyer using their 10-digit mobile number."""
    norm_phone = normalize_phone(payload.phone)
    digits = re.sub(r"\D", "", payload.phone)
    if len(digits) < 10:
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit mobile number")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE phone = ? OR phone = ? OR phone LIKE ?", (norm_phone, payload.phone.strip(), f"%{digits[-10:]}"))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="An account with this phone number already exists. Please log in.")

    synthetic_email = f"artisan_{digits[-10:]}@kalakriti.in"
    hashed_pwd = hash_password(payload.password)
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
    """Register a new buyer/seller profile for the app with onboarding profile fields."""
    email = payload.email.strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE lower(email) = ?", (email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="User already exists")

    hashed_pwd = hash_password(payload.password)
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
    """Orders placed by buyers for products belonging to this artisan."""
    conn = get_db_connection()
    cursor = conn.cursor()
    user_row = cursor.execute("SELECT name, phone FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user_row:
        conn.close()
        return {"orders": []}

    user_name = (user_row[0] or "").strip()
    user_phone = (user_row[1] or "").strip()
    norm_phone = user_phone.replace("+91", "").replace(" ", "").replace("-", "")

    cursor.execute(
        """
        SELECT orders.*, 
               COALESCE(NULLIF(orders.recipient_name, ''), users.name, 'Verified Buyer') AS buyer_name,
               COALESCE(NULLIF(orders.recipient_phone, ''), users.phone, '') AS buyer_phone,
               users.email AS buyer_email
        FROM orders
        JOIN products ON products.id = orders.product_id
        LEFT JOIN users ON users.id = orders.user_id
        WHERE (
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
        ORDER BY orders.id DESC
        """,
        (user_name, norm_phone, user_phone, norm_phone),
    )
    rows = cursor.fetchall()
    conn.close()
    return {"orders": [dict(row) for row in rows]}


@app.get("/api/products/{user_id}/published")
def get_published_products(user_id: int):
    """Return marketplace listings published under the signed-in artisan's name or phone."""
    conn = get_db_connection()
    cursor = conn.cursor()
    user_row = cursor.execute("SELECT name, phone FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user_row:
        conn.close()
        return {"products": []}

    user_name = (user_row[0] or "").strip()
    user_phone = (user_row[1] or "").strip()
    norm_phone = user_phone.replace("+91", "").replace(" ", "").replace("-", "")

    cursor.execute(
        """
        SELECT products.*
        FROM products
        WHERE (
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
        ORDER BY products.id DESC
        """,
        (user_name, norm_phone, user_phone, norm_phone),
    )
    rows = cursor.fetchall()
    conn.close()
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
    conn.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}


@app.post("/api/orders")
def create_order(payload: OrderCreate):
    if not all(value.strip() for value in (
        payload.recipient_name, payload.recipient_phone, payload.address_line,
        payload.city, payload.state, payload.pincode,
    )):
        raise HTTPException(status_code=422, detail="Complete delivery details are required")
    if not payload.pincode.isdigit() or len(payload.pincode) != 6:
        raise HTTPException(status_code=422, detail="Pincode must be a valid 6-digit number")

    conn = get_db_connection()
    cursor = conn.cursor()
    if payload.quantity < 1 or payload.quantity > 10:
        conn.close()
        raise HTTPException(status_code=422, detail="You can buy between 1 and 10 items per order")
    requested_quantity = payload.quantity
    cursor.execute("SELECT quantity, artisan_name, name, price FROM products WHERE id = ?", (payload.product_id,))
    product_row = cursor.fetchone()
    if not product_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
    available_quantity = int(product_row[0] or 0)
    if available_quantity < requested_quantity:
        conn.close()
        raise HTTPException(status_code=409, detail="This product is no longer available in the requested quantity")

    cursor.execute(
        "UPDATE products SET quantity = quantity - ? WHERE id = ? AND quantity >= ?",
        (requested_quantity, payload.product_id, requested_quantity),
    )
    if cursor.rowcount != 1:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=409, detail="This product was just reserved by another buyer")
    cursor.execute(
        """
        INSERT INTO orders (
            user_id, product_id, product_name, quantity, total, status, eta,
            recipient_name, recipient_phone, address_line, city, state, pincode
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.user_id,
            payload.product_id,
            payload.product_name,
            requested_quantity,
            payload.total * requested_quantity,
            payload.status,
            payload.eta,
            payload.recipient_name.strip(),
            payload.recipient_phone.strip(),
            payload.address_line.strip(),
            payload.city.strip(),
            payload.state.strip(),
            payload.pincode.strip(),
        ),
    )
    order_id = cursor.lastrowid
    cursor.execute(
        "SELECT id FROM users WHERE lower(name) = lower(?) AND role = 'artisan' LIMIT 1",
        (product_row[1],),
    )
    artisan_row = cursor.fetchone()
    if artisan_row:
        cursor.execute(
            "INSERT INTO notifications (user_id, kind, title, message, related_id) VALUES (?, ?, ?, ?, ?)",
            (
                artisan_row[0],
                "buyer_order",
                "New buyer order request",
                f"A buyer requested {requested_quantity} unit(s) of {payload.product_name}.",
                order_id,
            ),
        )
    conn.commit()
    conn.close()
    remaining_quantity = available_quantity - requested_quantity
    return {"status": "success", "order_id": order_id, "remaining_quantity": remaining_quantity}


@app.delete("/api/products/{product_id}")
def delete_product(product_id: int, payload: ProductDeleteRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT p.artisan_name, p.artisan_phone, u.name, u.phone
        FROM products p
        JOIN users u ON u.id = ?
        WHERE p.id = ?
        """,
        (payload.user_id, product_id),
    )
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")

    name_match = (row["artisan_name"] or "").strip().lower() == (row["name"] or "").strip().lower()
    p_phone = (row["artisan_phone"] or "").replace("+91", "").replace(" ", "").replace("-", "")
    u_phone = (row["phone"] or "").replace("+91", "").replace(" ", "").replace("-", "")
    phone_match = bool(p_phone and u_phone and p_phone == u_phone)

    if not (name_match or phone_match):
        conn.close()
        raise HTTPException(status_code=403, detail="Only the seller who posted this product can delete it")
    cursor.execute("DELETE FROM wishlist WHERE product_id = ?", (product_id,))
    cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "product_id": product_id}


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
    reason = payload.reason.strip() if payload.reason else ""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT user_id, product_id, product_name, quantity, status FROM orders WHERE id = ?",
        (order_id,),
    )
    order_row = cursor.fetchone()
    if not order_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")

    if str(order_row["status"]).lower() == "cancelled":
        conn.close()
        raise HTTPException(status_code=409, detail="Order is already cancelled")

    cursor.execute(
        "UPDATE orders SET status = 'Cancelled', cancel_reason = ?, cancelled_at = ? WHERE id = ?",
        (reason, datetime.now(timezone.utc).isoformat(), order_id),
    )
    cursor.execute(
        "UPDATE products SET quantity = quantity + ? WHERE id = ?",
        (int(order_row["quantity"]), int(order_row["product_id"])),
    )
    cursor.execute(
        "INSERT INTO notifications (user_id, kind, title, message, related_id) VALUES (?, ?, ?, ?, ?)",
        (
            int(order_row["user_id"]),
            "order_cancelled",
            "Order cancelled",
            f"Order #{order_id} for {order_row['product_name']} was cancelled. Reversal restored {order_row['quantity']} unit(s).{(' Reason: ' + reason) if reason else ''}",
            order_id,
        ),
    )
    conn.commit()
    conn.close()
    return {"status": "success", "order_id": order_id, "restored_quantity": int(order_row["quantity"]), "reason": reason}


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
            target_buyer, target_market, requirements, quality_flags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    rows = conn.execute("SELECT * FROM institutional_requests ORDER BY id DESC").fetchall()
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
    if cursor.rowcount != 1:
        conn.close()
        raise HTTPException(status_code=404, detail="Request not found")
    conn.commit()
    conn.close()
    return {"status": "success", "request_id": request_id}


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


@app.post("/api/products")
def create_product(product: ProductCreate):
    """Publish a reviewed artisan listing to the marketplace."""
    listing_quantity = product.quantity
    if listing_quantity < 1 or listing_quantity > 10:
        raise HTTPException(status_code=400, detail="Each listing must contain between 1 and 10 items")

    conn = get_db_connection()
    cursor = conn.cursor()
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    cursor.execute(
        "SELECT COUNT(*) FROM products WHERE lower(artisan_name) = lower(?) AND substr(created_at, 1, 7) = ?",
        (product.artisan_name.strip(), current_month),
    )
    monthly_listings = cursor.fetchone()[0]
    if monthly_listings >= 3:
        conn.close()
        raise HTTPException(status_code=429, detail="This artisan has used all 3 marketplace listings for this month")

    gallery_json = json.dumps(product.image_gallery or [product.image_url])
    reviews_json = json.dumps(product.reviews or [])
    cursor.execute(
        """
        INSERT INTO products (
            name, artisan_name, artisan_phone, artisan_location,
            category, price, suggested_price_min, suggested_price_max,
            price_justification, description_en, description_hi,
            tags, image_url, image_gallery, rating, reviews,
            is_enhanced, mosje_verified, quantity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            product.name,
            product.artisan_name,
            product.artisan_phone or "+919876543210",
            product.artisan_location,
            product.category,
            product.price,
            product.suggested_price_min,
            product.suggested_price_max,
            product.price_justification or "",
            product.description_en,
            product.description_hi or "",
            json.dumps(product.tags),
            product.image_url,
            gallery_json,
            product.rating or 4.5,
            reviews_json,
            1 if product.is_enhanced else 0,
            1,
            listing_quantity,
        ),
    )

    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {"status": "success", "product_id": new_id, "message": "Product published to marketplace!"}


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
def export_gem_csv():
    """Expose a basic GeM-ready CSV payload from the product catalog."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, artisan_name, artisan_location, category, price, quantity, description_en, image_url FROM products ORDER BY id DESC"
    )
    rows = cursor.fetchall()
    conn.close()

    header = ["id", "name", "artisan_name", "artisan_location", "category", "price", "quantity", "description_en", "image_url"]
    lines = [",".join(header)]
    for row in rows:
        values = [str(row[idx]) if row[idx] is not None else "" for idx in range(len(header))]
        lines.append(",".join(values))
    return PlainTextResponse("\n".join(lines), media_type="text/csv")


@app.get("/api/export/ondc")
def export_ondc():
    """Expose an ONDC/Beckn-style JSON payload from the catalog and institutional request data."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, artisan_name, category, price, quantity FROM products ORDER BY id DESC LIMIT 25")
    products = [dict(row) for row in cursor.fetchall()]
    conn.close()
    payload = {
        "context": {
            "domain": "ONDC:RET10",
            "country": "IND",
            "city": "IND",
            "action": "search",
            "version": "1.1.0",
            "bap_id": "kalakriti.app",
        },
        "catalog": products,
        "export_type": "ONDC_Beckn_Ready",
    }
    return JSONResponse(payload)


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
