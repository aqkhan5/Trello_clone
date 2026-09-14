import logging

logger = logging.getLogger("uvicorn")

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
