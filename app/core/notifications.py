# This project is a backend API for a Trello-like task and project management application.
# It allows users to manage workspaces, boards, lists, cards, and team collaboration.

# ---------------------------------------------------------------------------
# Imports & Logger Setup
# ---------------------------------------------------------------------------
import logging

logger = logging.getLogger("uvicorn")

# ---------------------------------------------------------------------------
# Email Notifications
# ---------------------------------------------------------------------------
# Sends transactional invitation emails with an acceptance link
async def send_invitation_email(
    recipient_email: str, workspace_name: str, token: str
) -> None:
    
    invite_url = f"http://localhost:3000/invitations/accept?token={token}"

    logger.info(
        f"\n                       TRELLO NOTIFICATION EMAIL                        \n"
        f"To: {recipient_email}\n"
        f"Subject: You have been invited to join the '{workspace_name}' workspace!\n"
        f"Click the link below to accept your invitation:\n"
        f"--> {invite_url} <--\n"
        f"__________________________________________________________________________\n"
    )
