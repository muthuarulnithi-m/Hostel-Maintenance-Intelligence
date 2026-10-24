from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.complaint_config import (
    REPEAT_COMPLAINT_LOOKBACK_DAYS,
    REPEAT_COMPLAINT_THRESHOLD,
)
from app.models.complaint import (
    Complaint,
    ComplaintCategory,
    ComplaintStatus,
)
from app.models.complaint_alert import (
    ComplaintAlert,
)
from app.models.user import (
    User,
    UserRole,
)

from app.services.notification_service import (
    create_notification,
)

def utc_now():

    return datetime.now(timezone.utc)


def detect_repeat_complaint(
    db: Session,
    complaint: Complaint,
):

    since = (
        utc_now()
        - timedelta(
            days=REPEAT_COMPLAINT_LOOKBACK_DAYS
        )
    )

    excluded_statuses = [
        ComplaintStatus.CANCELLED,
    ]

    query = select(
        func.count(Complaint.id)
    ).where(
        Complaint.room_id == complaint.room_id,
        Complaint.category == complaint.category,
        Complaint.created_at >= since,
        Complaint.status.not_in(
            excluded_statuses
        ),
    )

    repeat_count = db.scalar(query) or 0

    if repeat_count < REPEAT_COMPLAINT_THRESHOLD:

        return None

    existing_alert = db.scalar(
        select(ComplaintAlert)
        .where(
            ComplaintAlert.complaint_id
            == complaint.id
        )
    )

    if existing_alert:

        return existing_alert

    message = (
        f"Repeated {complaint.category.value.lower()} "
        f"complaints detected for room "
        f"{complaint.room_id}. "
        f"Total complaints in the last "
        f"{REPEAT_COMPLAINT_LOOKBACK_DAYS} days: "
        f"{repeat_count}."
    )

    alert = ComplaintAlert(
        complaint_id=complaint.id,
        room_id=complaint.room_id,
        category=complaint.category.value,
        repeat_count=repeat_count,
        message=message,
    )

    db.add(alert)
    db.flush()

    wardens = db.scalars(
        select(User).where(
            User.role == UserRole.WARDEN,
            User.is_active.is_(True),
        )
    ).all()
    for warden in wardens:
        create_notification(
            db=db,
            user_id=warden.id,
            title="Repeated Complaint Detected",
            message=message,
            notification_type="REPEAT_COMPLAINT",
            complaint_id=complaint.id,
            alert_id=alert.id,
            event_key=f"complaint-alert:{alert.id}:user:{warden.id}",
        )
    return alert
