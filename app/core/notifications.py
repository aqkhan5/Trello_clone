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
            f"_________________________________________"
        )
        return
    
    msg = EmailMessage()
    from_name = getattr(settings, "SMTP_FROM_NAME", "Trello clone")
    from_email = getattr(settings, "SMTP_FROM_EMAIL", None) or settings.SMTP_USER
    msg["From"] = f"{from_name}<{from_email}>"
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.set_content(text_content)
    msg.add_alternative(html_content, subtype = "html")

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=int(settings.SMTP_PORT),
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,  # Hardcode True so STARTTLS is guaranteed over port 587
        )
        logger.info(f"Notification info has successfully dispatched to {to_email}")
    except Exception as exc:
        logger.error(f"failed to dispatch email to {to_email}: {exc}")



# Invitation Notification
async def send_invitation_email(
        recipient_email: str, workspace_name: str, token: str
) -> None:
    """Dispatching transactional email with the Dispatching URL"""
    invite_url = f"http://localhost:3000/invitations/accept?token={token}"
    subject = f"You have been invited to join the {workspace_name} workspace"

    text_content = (
        f" You have been invited to join {workspace_name}\n"
        f" Click the link below to accept you invitation: \n"
        f"{invite_url}\n\n"
        f"This link will expire in 7 days"
    )

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0052cc; margin-top: 0;">Trello Workspace Invitation</h2>
        <p style="font-size: 16px; color: #334155;">
            You have been invited to join and collaborate on the <strong>{workspace_name}</strong> workspace.
        </p>
        <div style="margin: 30px 0;">
            <a href="{invite_url}" style="background-color: #0052cc; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                Join Workspace
            </a>
        </div>
        <p style="color: #64748b; font-size: 13px;">
            Or copy and paste this link into your browser:<br/>
            <a href="{invite_url}" style="color: #0052cc;">{invite_url}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">This invitation link will expire in 7 days.</p>
    </div>
    """

    await _send_smtp_email(recipient_email, subject, html_content, text_content)

# Registion Notification
async def send_welcome_email(
        recipient_email: str, 
        full_name: str
) ->  None:
    """Dispatching a welcome email upon the successfull registration of the user"""
    subject = "Welcome to trello"

    text_content = (
        f"Hi {full_name}\n\n"
        f"Welcome to Trello clone. Your account is now active. \n"
        f"Now you can create workspaces, organize boards and invite members"

    )
    html_content =  f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0052cc; margin-top: 0;">Welcome, {full_name}!</h2>
        <p style="font-size: 15px; color: #334155;">
            Your account has been created successfully. You can now start creating boards, managing tasks, and collaborating with your team.
        </p>
    </div>
    """
    await _send_smtp_email(recipient_email, subject, html_content, text_content)


# Login Notification
async def send_login_alert_email(
        recipient_email: str, 
        full_name: str, 
        ip_address: str = "unknown"
) -> None:
    """ Dispatching the security notification email for user sign-in"""
    subject = f" Security alert!  A new sign-in to your Trello account "

    text_content = (
        f"Hi {full_name}/n/n"
        f"A new sign-in has been detected from you IP address {ip_address}.\n"
        f"If this is not you please secure your account!"
    )

    html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h3 style="color: #dc2626; margin-top: 0;">Security Alert: New Sign-in</h3>
        <p style="font-size: 14px; color: #334155;">Hi {full_name},</p>
        <p style="font-size: 14px; color: #334155;">
            We noticed a successful login to your account from IP address: <strong>{ip_address}</strong>.
        </p>
        <p style="font-size: 13px; color: #64748b;">
            If this was you, you can safely ignore this email. If not, please change your password immediately.
        </p>
    </div>
    """
    await _send_smtp_email(recipient_email, subject, html_content, text_content)


# Password Reset Notification
async def send_password_reset_email(
    recipient_email: str,
    full_name: str,
    token: str,
) -> None:
    """Dispatches a password reset link with a 15-minute expiration."""
    reset_url = f"http://localhost:3000/reset-password?token={token}"
    subject = "Password Reset Request for Trello Clone"

    text_content = (
        f"Hi {full_name},\n\n"
        f"A password reset request was initiated for your account.\n"
        f"Click the link below to set a new password:\n"
        f"{reset_url}\n\n"
        f"This link will expire in 15 minutes. If you did not make this request, you can safely ignore this email."
    )

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0052cc; margin-top: 0;">Password Reset Request</h2>
        <p style="font-size: 15px; color: #334155;">Hi {full_name},</p>
        <p style="font-size: 15px; color: #334155;">
            We received a request to reset your password. Click the button below to choose a new password:
        </p>
        <div style="margin: 30px 0;">
            <a href="{reset_url}" style="background-color: #0052cc; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                Reset Password
            </a>
        </div>
        <p style="color: #64748b; font-size: 13px;">
            Or copy and paste this link into your browser:<br/>
            <a href="{reset_url}" style="color: #0052cc;">{reset_url}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">This link will expire in 15 minutes. If you did not make this request, please disregard this email.</p>
    </div>
    """

    await _send_smtp_email(recipient_email, subject, html_content, text_content)