import logging

# Use the existing Uvicorn logger so messages appear cleanly in the active terminal
logger = logging.getLogger("uvicorn")


async def send_invitation_email(
    recipient_email: str, workspace_name: str, token: str
) -> None:
    """Dispatches a transactional invitation email containing an actionable URL.

    During development, this outputs the email to the terminal corkboard.
    In production, this is the single place to plug in SendGrid, Resend, or AWS SES.
    """
    # Actionable URL pointing to your frontend client
    invite_url = f"http://localhost:3000/invitations/accept?token={token}"

    logger.info(
        f"\n==================== [TRELLO NOTIFICATION EMAIL] ====================\n"
        f"To: {recipient_email}\n"
        f"Subject: You have been invited to join the '{workspace_name}' workspace!\n"
        f"Click the link below to accept your invitation:\n"
        f"--> {invite_url} <--\n"
        f"=====================================================================\n"
    )