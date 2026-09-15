import logging
from email.message import EmailMessage
import aiosmtplib
logger = logging.getLogger("uvicorn")

from app.core.config import settings

async def _send_smtp_email(
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str
) -> None:
    """Core async worker that send email via SMTP or fall back to logger
       Fall back if credentials are not configured in .evn """
    if not getattr(settings, "SMTP_USER", None) or not getattr(settings, "SMTP_PASSWORD", None):
        logger.info(
            f"\n[DEV NOTIFICATION No SMTP Configured]\n"
            f"To: {to_email}\n"
            f"Subject: {subject}\n"
            f"{text_content}\n"
            f"____________________________________________________________________________________"
        )
        return
    
    msg = EmailMessage()
    from_name = getattr(settings, "SMTP_FROM_NAME", "Trello clone")
    from_email = getattr(settings, "SMTP_From_EMAIL", None) or settings.SMTP_USER
    msg["From"] = f"{from_name}<{from_email}>"
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.set_content(text_content)
    msg.add_alternative(html_content, subtype = "html")

    try:
        await aiosmtplib.send(
            msg,
            hostname= settings.SMTP_HOST,
            port= settings.SMTP_PORT,
            username= settings.SMTP_USER,
            password= settings.SMTP_PASSWORD,
            start_tls= getattr(settings, "SMTP_STARTTLS", True),
            )
        logger.info(f"Notification info has successfully dispatched to {to_email}")
    except Exception as exc:
        logger.error(f"failed to dispatch email to {to_email}: {exc}")
