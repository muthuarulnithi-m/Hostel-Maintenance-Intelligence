import logging

from app.core.config import settings
from app.services.email_service import EmailConfigurationError, send_email


logger = logging.getLogger(__name__)


def send_warden_complaint_email(
    complaint_id: int,
    title: str,
    category: str,
    priority: str,
    room_id: int,
    repeat_count: int | None = None,
) -> bool:
    """Send one selected operational alert after its DB transaction commits."""
    recipient = settings.WARDEN_NOTIFICATION_EMAIL
    if not recipient:
        logger.info("Warden email skipped: destination is not configured")
        return False

    reasons = []
    if priority in {"HIGH", "URGENT"}:
        reasons.append(f"Priority: {priority}")
    if repeat_count is not None:
        reasons.append(
            f"Repeated complaints for room {room_id}: "
            f"{repeat_count} in the configured lookback window"
        )

    if not reasons:
        return False

    try:
        send_email(
            recipient=recipient,
            subject=(
                "Urgent HMIS complaint requires attention"
                if priority in {"HIGH", "URGENT"}
                else "Repeated HMIS complaint detected"
            ),
            body=(
                "A complaint requires operational review.\n\n"
                f"Complaint: #{complaint_id}\n"
                f"Title: {title}\n"
                f"Category: {category}\n"
                + "\n".join(reasons)
                + "\n\nPlease review it in the Hostel Maintenance System."
            ),
        )
        return True
    except EmailConfigurationError as exc:
        logger.warning("Warden email skipped: %s", str(exc))
        return False
    except Exception as exc:
        # Keep SMTP internals, host details, addresses, and credentials out of logs.
        logger.warning("Warden email delivery failed (%s)", type(exc).__name__)
        return False
