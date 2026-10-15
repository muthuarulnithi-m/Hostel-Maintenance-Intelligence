from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.complaint import (
    Complaint,
    ComplaintCategory,
    ComplaintStatus,
)


# ---------------------------------------------------------------------------
# Recurring complaint configuration
# ---------------------------------------------------------------------------

DEFAULT_LOOKBACK_DAYS = 30
DEFAULT_REPEAT_THRESHOLD = 3


def utc_now() -> datetime:
    """
    Return the current UTC time.

    Keeping this in one place makes the recurring service easier to test
    and avoids mixing naive and timezone-aware datetime values.
    """
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Detect recurring complaint patterns
# ---------------------------------------------------------------------------

def find_recurring_complaints(
    db: Session,
    lookback_days: int = DEFAULT_LOOKBACK_DAYS,
    repeat_threshold: int = DEFAULT_REPEAT_THRESHOLD,
):
    """
    Find complaint patterns that repeatedly occur in the same room
    and category within a given time period.

    A pattern is considered recurring when:

        same room
        + same complaint category
        + complaint count >= repeat_threshold

    Cancelled complaints are ignored.

    This function does not create database records or modify existing
    complaints. It only returns detected patterns.
    """

    if lookback_days <= 0:
        raise ValueError("lookback_days must be greater than zero")

    if repeat_threshold < 2:
        raise ValueError("repeat_threshold must be at least 2")

    since = utc_now() - timedelta(days=lookback_days)

    rows = db.execute(
        select(
            Complaint.room_id,
            Complaint.category,
            func.count(Complaint.id).label("complaint_count"),
            func.min(Complaint.created_at).label("first_reported_at"),
            func.max(Complaint.created_at).label("last_reported_at"),
        )
        .where(
            Complaint.created_at >= since,
            Complaint.status != ComplaintStatus.CANCELLED,
        )
        .group_by(
            Complaint.room_id,
            Complaint.category,
        )
        .having(
            func.count(Complaint.id) >= repeat_threshold
        )
        .order_by(
            func.count(Complaint.id).desc()
        )
    ).all()

    return [
        {
            "room_id": row.room_id,
            "category": (
                row.category.value
                if isinstance(row.category, ComplaintCategory)
                else str(row.category)
            ),
            "complaint_count": row.complaint_count,
            "first_reported_at": row.first_reported_at,
            "last_reported_at": row.last_reported_at,
            "lookback_days": lookback_days,
        }
        for row in rows
    ]


# ---------------------------------------------------------------------------
# Check one room/category combination
# ---------------------------------------------------------------------------

def get_recurring_complaint_count(
    db: Session,
    room_id: int,
    category: ComplaintCategory,
    lookback_days: int = DEFAULT_LOOKBACK_DAYS,
) -> int:
    """
    Return the number of complaints for a specific room and category
    within the configured lookback period.

    Cancelled complaints are ignored.
    """

    if lookback_days <= 0:
        raise ValueError("lookback_days must be greater than zero")

    since = utc_now() - timedelta(days=lookback_days)

    count = db.scalar(
        select(func.count(Complaint.id))
        .where(
            Complaint.room_id == room_id,
            Complaint.category == category,
            Complaint.created_at >= since,
            Complaint.status != ComplaintStatus.CANCELLED,
        )
    )

    return int(count or 0)


# ---------------------------------------------------------------------------
# Determine whether a complaint is part of a recurring pattern
# ---------------------------------------------------------------------------

def is_recurring_complaint(
    db: Session,
    complaint: Complaint,
    lookback_days: int = DEFAULT_LOOKBACK_DAYS,
    repeat_threshold: int = DEFAULT_REPEAT_THRESHOLD,
) -> bool:
    """
    Determine whether the complaint belongs to a recurring
    room/category complaint pattern.

    The complaint itself is included in the count.

    Example:

        Room 204
        ELECTRICAL

        Complaint 1
        Complaint 2
        Complaint 3

    With repeat_threshold=3, the third complaint is considered
    part of a recurring pattern.
    """

    if not complaint.room_id or not complaint.category:
        return False

    count = get_recurring_complaint_count(
        db=db,
        room_id=complaint.room_id,
        category=complaint.category,
        lookback_days=lookback_days,
    )

    return count >= repeat_threshold


# ---------------------------------------------------------------------------
# Get recurring information for a specific complaint
# ---------------------------------------------------------------------------

def get_recurring_context(
    db: Session,
    complaint: Complaint,
    lookback_days: int = DEFAULT_LOOKBACK_DAYS,
    repeat_threshold: int = DEFAULT_REPEAT_THRESHOLD,
):
    """
    Return structured recurring information for one complaint.

    This is useful for:

        - intelligence processing
        - dashboard analytics
        - staff recommendation
        - future notification automation
    """

    count = get_recurring_complaint_count(
        db=db,
        room_id=complaint.room_id,
        category=complaint.category,
        lookback_days=lookback_days,
    )

    return {
        "complaint_id": complaint.id,
        "room_id": complaint.room_id,
        "category": (
            complaint.category.value
            if isinstance(complaint.category, ComplaintCategory)
            else str(complaint.category)
        ),
        "complaint_count": count,
        "is_recurring": count >= repeat_threshold,
        "repeat_threshold": repeat_threshold,
        "lookback_days": lookback_days,
    }