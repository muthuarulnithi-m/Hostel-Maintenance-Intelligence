import smtplib
from email.message import EmailMessage

from app.core.config import settings


def send_email(
    recipient: str,
    subject: str,
    body: str,
):

    if not settings.SMTP_USERNAME:
        raise RuntimeError(
            "SMTP_USERNAME is not configured"
        )

    if not settings.SMTP_PASSWORD:
        raise RuntimeError(
            "SMTP_PASSWORD is not configured"
        )

    message = EmailMessage()

    message["From"] = (
        settings.SMTP_FROM_EMAIL
        or settings.SMTP_USERNAME
    )

    message["To"] = recipient

    message["Subject"] = subject

    message.set_content(body)

    with smtplib.SMTP(
        settings.SMTP_HOST,
        settings.SMTP_PORT,
    ) as server:

        server.starttls()

        server.login(
            settings.SMTP_USERNAME,
            settings.SMTP_PASSWORD,
        )

        server.send_message(message)
        