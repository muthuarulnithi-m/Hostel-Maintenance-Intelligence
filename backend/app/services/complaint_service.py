from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.complaint import (
    Complaint,
    ComplaintStatus,
)
from app.models.complaint_history import ComplaintHistory


def now_utc():

    return datetime.now(timezone.utc)


def add_history(
    db: Session,
    complaint: Complaint,
    changed_by_user_id: int,
    old_status: ComplaintStatus | None,
    new_status: ComplaintStatus,
    note: str | None = None,
):

    history = ComplaintHistory(
        complaint_id=complaint.id,
        changed_by_user_id=changed_by_user_id,
        old_status=old_status,
        new_status=new_status,
        note=note,
    )

    db.add(history)
    return history


def change_status(
    db: Session,
    complaint: Complaint,
    changed_by_user_id: int,
    new_status: ComplaintStatus,
    note: str | None = None,
):

    old_status = complaint.status

    complaint.status = new_status

    history = add_history(
        db=db,
        complaint=complaint,
        changed_by_user_id=changed_by_user_id,
        old_status=old_status,
        new_status=new_status,
        note=note,
    )
    db.flush()
    return history
