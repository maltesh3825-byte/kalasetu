"""
KalaSetu Email Service for OTP Delivery
Smart India Hackathon 2026 - Problem Statement SIH26090
Ministry of Social Justice and Empowerment (MoSJE)
"""
import os
import re
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


import json
import urllib.request
import urllib.error


def _get_env_non_empty(*keys, default: str = "") -> str:
    """Return first non-empty environment variable value, stripped of whitespace and quotes. Supports case-insensitivity on Linux."""
    for k in keys:
        v = os.getenv(k)
        if v is not None:
            cleaned = v.strip().strip("\"'")
            if cleaned:
                return cleaned

    # Check case-insensitive match in os.environ (Linux is case-sensitive, but users may type lower/mixed case)
    lower_target_keys = [k.lower() for k in keys]
    for env_k, env_v in os.environ.items():
        if env_k.lower() in lower_target_keys and env_v:
            cleaned = str(env_v).strip().strip("\"'")
            if cleaned:
                return cleaned
    return default


def get_smtp_config():
    """
    Dynamically get current email settings directly from system environment.
    Supports standard SMTP (Gmail/Custom) as well as HTTPS Email APIs (Resend, Brevo)
    which bypass cloud provider SMTP port firewalls.
    """
    try:
        from pathlib import Path
        from dotenv import load_dotenv
        env_file = Path(__file__).resolve().parent.parent / ".env"
        if env_file.exists():
            load_dotenv(env_file, override=False)
    except Exception:
        pass

    host = _get_env_non_empty("SMTP_HOST", "SMTP_SERVER", default="smtp.gmail.com")
    raw_port = _get_env_non_empty("SMTP_PORT", default="587")
    try:
        port = int(raw_port)
    except (ValueError, TypeError):
        port = 587

    # Prioritize GMAIL_USER / GMAIL_APP_PASSWORD, then SMTP_* aliases
    user = _get_env_non_empty("GMAIL_USER", "SMTP_USER", "SMTP_USERNAME", "MAIL_USERNAME", "EMAIL_USER")
    raw_pass = _get_env_non_empty("GMAIL_APP_PASSWORD", "SMTP_PASS", "SMTP_PASSWORD", "MAIL_PASSWORD", "EMAIL_PASS")
    # Remove all spaces (Google displays app passwords in 4 groups e.g. 'cczi zkjs kiab isjo')
    password = re.sub(r"\s+", "", raw_pass)

    resend_key = _get_env_non_empty("RESEND_API_KEY", "RESEND_KEY", "RESEND_TOKEN", "RESEND_API", "RESEND")
    brevo_key = _get_env_non_empty("BREVO_API_KEY", "SENDINBLUE_API_KEY", "BREVO_KEY")


    from_email = _get_env_non_empty("EMAIL_FROM", default=user or "noreply@kalasetu.in")
    return {
        "host": host,
        "port": port,
        "user": user,
        "pass": password,
        "from": from_email,
        "resend_key": resend_key,
        "brevo_key": brevo_key,
    }


def is_smtp_configured() -> bool:
    """Check whether real email credentials (SMTP or HTTPS API) are provided in the environment."""
    cfg = get_smtp_config()
    return bool((cfg["user"] and cfg["pass"]) or cfg["resend_key"] or cfg["brevo_key"])




def _send_via_resend(api_key: str, target: str, subject: str, text: str, html: str) -> dict:
    try:
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "KalaSetu-App/1.0"
        }
        data = {
            "from": "KalaSetu AI Studio <onboarding@resend.dev>",
            "to": [target],
            "subject": subject,
            "text": text,
            "html": html,
        }
        req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=8) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return {"success": True, "id": body.get("id")}
    except urllib.error.HTTPError as e:
        err_body = ""
        try:
            err_body = e.read().decode("utf-8")
        except Exception:
            pass
        err_msg = f"Resend HTTP {e.code}: {err_body or e.reason}"
        print(f"[RESEND HTTP ERROR] {err_msg}")
        return {"success": False, "error": err_msg}
    except Exception as e:
        print(f"[RESEND ERROR] Failed: {e}")
        return {"success": False, "error": str(e)}



def _send_via_brevo(api_key: str, target: str, subject: str, text: str, html: str) -> dict:
    try:
        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "api-key": api_key,
            "Content-Type": "application/json",
            "User-Agent": "KalaSetu-App/1.0"
        }
        data = {
            "sender": {"name": "KalaSetu AI Studio", "email": "noreply@kalasetu.in"},
            "to": [{"email": target}],
            "subject": subject,
            "textContent": text,
            "htmlContent": html,
        }
        req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=8) as resp:
            return {"success": True}
    except Exception as e:
        print(f"[BREVO ERROR] Failed: {e}")
        return {"success": False, "error": str(e)}


def send_otp_email(target_email: str, otp_code: str, user_name: str = "") -> dict:
    """
    Send a high-priority OTP verification email to the user's Gmail or email address.
    Supports both HTTPS APIs (Resend, Brevo) and direct SMTP.
    Returns: {"success": bool, "message": str, "error": Optional[str]}
    """
    cfg = get_smtp_config()
    if not (cfg["user"] and cfg["pass"]) and not cfg["resend_key"] and not cfg["brevo_key"]:
        return {
            "success": False,
            "message": "Email credentials not configured in environment.",
            "error": "GMAIL_USER and GMAIL_APP_PASSWORD (or RESEND_API_KEY) not set in Render environment variables."
        }

    target = target_email.strip().lower()
    if not target or "@" not in target:
        return {
            "success": False,
            "message": "Invalid email address format.",
            "error": "Invalid recipient email address."
        }

    name_display = user_name.strip() if user_name else "KalaSetu Artisan / Buyer"

    msg = MIMEMultipart("alternative")
    from_addr = cfg.get("from") or cfg.get("user") or "noreply@kalasetu.in"
    msg["Subject"] = f"🔐 {otp_code} is your KalaSetu Verification Code"
    msg["From"] = f"KalaSetu AI Studio <{from_addr}>"
    msg["To"] = target

    text_body = f"""Hello {name_display},

Your KalaSetu verification OTP is: {otp_code}

This code is valid for 10 minutes. Enter this code on the KalaSetu platform to complete your authentication.
Please do NOT share this code with anyone.

Smart India Hackathon 2026 (SIH26090)
Ministry of Social Justice & Empowerment (MoSJE)
"""

    html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KalaSetu Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf8f5; margin: 0; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; border: 1px solid #fed7aa; padding: 36px 28px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
    
    <!-- Brand Header -->
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 18px; background: linear-gradient(135deg, #ea580c, #f59e0b); color: #ffffff; font-size: 32px; font-weight: 900; text-align: center; margin-bottom: 12px; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.35);">
        क
      </div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">KalaSetu AI Studio</h1>
      <p style="margin: 4px 0 0; font-size: 11px; font-weight: 800; color: #ea580c; text-transform: uppercase; letter-spacing: 1px;">Smart India Hackathon 2026 • MoSJE</p>
    </div>

    <!-- Greeting & Info -->
    <div style="background-color: #fff7ed; border-radius: 16px; border: 1px solid #ffedd5; padding: 16px 20px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; font-weight: 700; color: #9a3412;">Namaste, {name_display}!</p>
      <p style="margin: 6px 0 0; font-size: 13px; color: #7c2d12; line-height: 1.5;">
        You requested a verification code to access your KalaSetu workspace. Use the one-time code below to verify your account.
      </p>
    </div>

    <!-- OTP Code Display -->
    <div style="text-align: center; margin: 28px 0;">
      <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Your One-Time Password</div>
      <div style="display: inline-block; padding: 14px 28px; background-color: #0f172a; border-radius: 16px; font-family: monospace, Consolas, Courier; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #fed7aa; box-shadow: 0 6px 20px rgba(15, 23, 42, 0.25);">
        {otp_code}
      </div>
      <p style="margin: 10px 0 0; font-size: 12px; font-weight: 600; color: #94a3b8;">
        ⏱️ Valid for 10 minutes • Never share your OTP with anyone
      </p>
    </div>

    <!-- Security Warning -->
    <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 24px;">
      <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.6;">
        🛡️ <strong>Security Tip:</strong> KalaSetu or Ministry officials will never ask for your OTP or password. If you didn't request this code, you can safely disregard this message.
      </p>
    </div>

    <!-- Footer -->
    <div style="margin-top: 28px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
      Problem Statement SIH26090 • Ministry of Social Justice and Empowerment<br>
      Empowering marginalized artisans through AI cataloging and direct market linkage.
    </div>

  </div>
</body>
</html>
"""

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))


    subject_text = f"🔐 {otp_code} is your KalaSetu Verification Code"

    resend_attempted_err = None
    # Method 1: If HTTPS Email API is configured, use it (works reliably on Render cloud without port blocks)
    if cfg.get("resend_key"):
        print(f"[EMAIL] Attempting delivery to {target} via Resend HTTPS API (Port 443)... KeyLen={len(cfg['resend_key'])}")
        resend_res = _send_via_resend(cfg["resend_key"], target, subject_text, text_body, html_body)
        if resend_res.get("success"):
            print(f"[EMAIL SUCCESS] Delivered to {target} via Resend API!")
            return {
                "success": True,
                "message": f"Verification code successfully delivered to {target}",
                "error": None
            }
        else:
            resend_attempted_err = resend_res.get("error")
            print(f"[EMAIL WARNING] Resend failed: {resend_attempted_err}")

    if cfg.get("brevo_key"):
        print(f"[EMAIL] Attempting delivery to {target} via Brevo HTTPS API (Port 443)...")
        brevo_res = _send_via_brevo(cfg["brevo_key"], target, subject_text, text_body, html_body)
        if brevo_res.get("success"):
            print(f"[EMAIL SUCCESS] Delivered to {target} via Brevo API!")
            return {
                "success": True,
                "message": f"Verification code successfully delivered to {target}",
                "error": None
            }

    # Method 2: Standard raw SMTP sockets (for localhost and unblocked servers)
    preferred_port = cfg.get("port") or 587
    fallback_port = 465 if preferred_port != 465 else 587
    ports_to_try = [preferred_port, fallback_port]

    last_error = None
    masked_user = f"{cfg['user'][:3]}***@{cfg['user'].split('@')[-1]}" if "@" in cfg["user"] else cfg["user"][:3] + "***"
    print(f"[SMTP] Preparing OTP dispatch to {target} | Host={cfg['host']} | User={masked_user} | PassLen={len(cfg['pass'])}")

    for port in ports_to_try:
        server = None
        try:
            print(f"[SMTP] Connecting to {cfg['host']}:{port}...")
            if port == 465:
                server = smtplib.SMTP_SSL(cfg["host"], port, timeout=4)
            else:
                server = smtplib.SMTP(cfg["host"], port, timeout=4)
                server.ehlo()
                server.starttls()
                server.ehlo()

            server.login(cfg["user"], cfg["pass"])
            server.sendmail(from_addr, [target], msg.as_string())
            try:
                server.quit()
            except Exception:
                pass

            print(f"[SMTP SUCCESS] Verification email delivered to {target} via port {port}!")
            return {
                "success": True,
                "message": f"Verification code successfully delivered to {target}",
                "error": None
            }
        except Exception as e:
            last_error = e
            print(f"[SMTP WARNING] Port {port} failed: {type(e).__name__}: {e}")
            if server:
                try:
                    server.close()
                except Exception:
                    pass
            continue

    err_str = f"{type(last_error).__name__}: {str(last_error)}" if last_error else "Unknown SMTP error"
    print(f"[SMTP ERROR] All delivery attempts failed for {target}: {err_str}")

    if resend_attempted_err:
        friendly_error = f"Resend API Error: {resend_attempted_err}"
    elif "101" in err_str or "unreachable" in err_str.lower() or "timed out" in err_str.lower():
        friendly_error = (
            "Render cloud firewall blocks raw SMTP ports (587/465). "
            "Use the verification code below to log in, or set RESEND_API_KEY in Render to enable cloud delivery."
        )
    else:
        friendly_error = err_str


    return {
        "success": False,
        "message": f"Failed to send email via SMTP ({err_str})",
        "error": friendly_error
    }


