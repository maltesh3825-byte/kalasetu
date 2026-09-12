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


def get_smtp_config():
    """
    Dynamically get current SMTP settings directly from system environment.
    Guarantees Render dashboard environment variables take precedence (override=False),
    and strips any accidental spaces or quotes (e.g. 'cczi zkjs kiab isjo' -> 'cczizkjskiabisjo').
    """
    try:
        from pathlib import Path
        from dotenv import load_dotenv
        env_file = Path(__file__).resolve().parent.parent / ".env"
        if env_file.exists():
            load_dotenv(env_file, override=False)
    except Exception:
        pass

    host = os.getenv("SMTP_HOST", os.getenv("SMTP_SERVER", "smtp.gmail.com")).strip()
    try:
        port = int(os.getenv("SMTP_PORT", "587"))
    except (ValueError, TypeError):
        port = 587

    user = os.getenv("SMTP_USER", os.getenv("SMTP_USERNAME", os.getenv("GMAIL_USER", ""))).strip().strip("\"'")
    raw_pass = os.getenv("SMTP_PASS", os.getenv("SMTP_PASSWORD", os.getenv("GMAIL_APP_PASSWORD", ""))).strip().strip("\"'")
    # Remove any spaces that user might have copied from Google's 4-group app password display
    password = re.sub(r"\s+", "", raw_pass)

    from_email = os.getenv("EMAIL_FROM", user or "noreply@kalasetu.in").strip().strip("\"'")
    return {
        "host": host,
        "port": port,
        "user": user,
        "pass": password,
        "from": from_email,
    }


def is_smtp_configured() -> bool:
    """Check whether real SMTP credentials are provided in the environment."""
    cfg = get_smtp_config()
    return bool(cfg["user"] and cfg["pass"])


def send_otp_email(target_email: str, otp_code: str, user_name: str = "") -> dict:
    """
    Send a high-priority OTP verification email to the user's Gmail or email address.
    Returns: {"success": bool, "message": str, "error": Optional[str]}
    """
    cfg = get_smtp_config()
    if not cfg["user"] or not cfg["pass"]:
        return {
            "success": False,
            "message": "SMTP not configured in environment.",
            "error": "GMAIL_USER and GMAIL_APP_PASSWORD not set in Render environment variables."
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

    try:
        if cfg["port"] == 465:
            server = smtplib.SMTP_SSL(cfg["host"], cfg["port"], timeout=12)
        else:
            server = smtplib.SMTP(cfg["host"], cfg["port"], timeout=12)
            server.starttls()

        server.login(cfg["user"], cfg["pass"])
        server.sendmail(cfg["from"], [target], msg.as_string())
        server.quit()

        return {
            "success": True,
            "message": f"Verification code successfully delivered to {target}",
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to send email via SMTP ({str(e)})",
            "error": str(e)
        }
