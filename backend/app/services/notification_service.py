from sqlalchemy.orm import Session

from app.models.notification import (
    Notification,
)


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str,
    complaint_id: int | None = None,
    alert_id: int | None = None,
):

    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        complaint_id=complaint_id,
        alert_id=alert_id,
    )

    db.add(notification)
    db.flush()

    return notification
