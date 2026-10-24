import smtplib
from email.message import EmailMessage
from email.utils import formataddr

from app.core.config import settings


class EmailConfigurationError(RuntimeError):
    """Raised when SMTP settings are absent or still use sample values."""


_PLACEHOLDER_VALUES = {
    "change_me",
    "changeme",
    "example.com",
    "your_host",
    "your_password",
    "your_username",
    "you@example.com",
}


def _configured(value: str | None) -> bool:
    if not value or not value.strip():
        return False
    normalized = value.strip().lower()
    return (
        normalized not in _PLACEHOLDER_VALUES
        and "your_" not in normalized
        and "example.com" not in normalized
    )


def send_email(recipient: str, subject: str, body: str) -> None:
    required = {
        "SMTP_HOST": settings.SMTP_HOST,
        "SMTP_PORT": str(settings.SMTP_PORT) if settings.SMTP_PORT else None,
        "SMTP_USERNAME": settings.SMTP_USERNAME,
        "SMTP_PASSWORD": settings.SMTP_PASSWORD,
        "SMTP_FROM_EMAIL": settings.SMTP_FROM_EMAIL,
        "WARDEN_NOTIFICATION_EMAIL": settings.WARDEN_NOTIFICATION_EMAIL,
    }
    missing = [name for name, value in required.items() if not _configured(value)]
    if missing:
        raise EmailConfigurationError(
            "Email delivery is not configured: " + ", ".join(missing)
        )
    if recipient != settings.WARDEN_NOTIFICATION_EMAIL:
        raise EmailConfigurationError("Recipient is not the configured warden address")
    if not 1 <= settings.SMTP_PORT <= 65535:
        raise EmailConfigurationError("SMTP_PORT must be between 1 and 65535")

    message = EmailMessage()
    message["From"] = formataddr((settings.SMTP_FROM_NAME or "HMIS", settings.SMTP_FROM_EMAIL))
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(body)

    if settings.SMTP_PORT == 465:
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(message)
        return

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(message)
