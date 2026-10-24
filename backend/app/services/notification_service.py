from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.complaint import Complaint
from app.models.notification import (
    Notification,
)
from app.models.user import User, UserRole


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str,
    complaint_id: int | None = None,
    alert_id: int | None = None,
    event_key: str | None = None,
):

    if event_key:
        existing = db.scalar(
            select(Notification).where(Notification.event_key == event_key)
        )
        if existing:
            return existing

    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        complaint_id=complaint_id,
        alert_id=alert_id,
        event_key=event_key,
    )

    if event_key:
        try:
            with db.begin_nested():
                db.add(notification)
                db.flush()
        except IntegrityError:
            existing = db.scalar(
                select(Notification).where(Notification.event_key == event_key)
            )
            if existing:
                return existing
            raise
    else:
        db.add(notification)
        db.flush()

    return notification


def notify_complaint_users(
    db: Session,
    complaint: Complaint,
    event_id: str | int,
    user_ids: list[int | None],
    title: str,
    message: str,
    notification_type: str,
    include_complaint_ref: bool = True,
):
    """Create one in-app notification per recipient for a persisted event."""
    created = []
    for user_id in dict.fromkeys(uid for uid in user_ids if uid is not None):
        created.append(
            create_notification(
                db=db,
                user_id=user_id,
                title=title,
                message=message,
                notification_type=notification_type,
                complaint_id=complaint.id if include_complaint_ref else None,
                event_key=f"complaint-event:{event_id}:user:{user_id}",
            )
        )
    return created


def notify_active_wardens(
    db: Session,
    complaint: Complaint,
    event_id: str | int,
    title: str,
    message: str,
    notification_type: str,
):
    warden_ids = db.scalars(
        select(User.id).where(
            User.role == UserRole.WARDEN,
            User.is_active.is_(True),
        )
    ).all()
    return notify_complaint_users(
        db=db,
        complaint=complaint,
        event_id=event_id,
        user_ids=warden_ids,
        title=title,
        message=message,
        notification_type=notification_type,
    )
