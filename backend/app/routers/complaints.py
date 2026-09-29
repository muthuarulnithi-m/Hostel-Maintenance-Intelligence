from datetime import datetime, timedelta, timezone

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.complaint import (
    Complaint,
    ComplaintStatus,
)
from app.models.room import Room
from app.models.staff import (
    AvailabilityStatus,
    StaffProfile,
)
from app.models.student_assignment import (
    StudentRoomAssignment,
)
from app.models.user import User, UserRole
from app.schemas.complaint import (
    AssignComplaintRequest,
    CancelComplaintRequest,
    ComplaintCreate,
    ComplaintResponse,
    HoldComplaintRequest,
    ResolveComplaintRequest,
)
from app.services.complaint_service import (
    change_status,
)

from fastapi import File, UploadFile

from app.core.storage import (
    save_complaint_image,
)

from app.models.complaint_attachment import (
    ComplaintAttachment,
)
router = APIRouter(
    prefix="/complaints",
    tags=["Complaints"],
)

from fastapi.responses import FileResponse
from pathlib import Path
from app.models.complaint_history import (
    ComplaintHistory,
)

from app.schemas.complaint_history import (
    ComplaintHistoryResponse,
)
from app.services.complaint_alert_service import (
    detect_repeat_complaint,
    REPEAT_COMPLAINT_LOOKBACK_DAYS,
    REPEAT_COMPLAINT_THRESHOLD,

)

from datetime import datetime, timezone

from app.models.complaint_alert import (
    ComplaintAlert,
)

from app.schemas.complaint_alert import (
    ComplaintAlertResponse,
)
from sqlalchemy import select, func

def utc_now():

    return datetime.now(timezone.utc)


# ---------------------------------------------------------
# CREATE COMPLAINT
# ---------------------------------------------------------

@router.post(
    "",
    response_model=ComplaintResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_complaint(
    data: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.STUDENT)
    ),
):

    assignment = db.scalar(
        select(StudentRoomAssignment)
        .where(
            StudentRoomAssignment.student_id
            == current_user.id,
            StudentRoomAssignment.is_active.is_(True),
        )
    )

    if not assignment:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student does not have an active room assignment",
        )

    room = db.get(
        Room,
        assignment.room_id,
    )

    if not room or not room.is_active:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assigned room is not active",
        )

    complaint = Complaint(
        student_id=current_user.id,
        room_id=room.id,
        category=data.category,
        priority=data.priority,
        status=ComplaintStatus.SUBMITTED,
        title=data.title.strip(),
        description=data.description.strip(),
    )

    db.add(complaint)
    db.flush()
   
    history = ComplaintHistory(
    complaint_id=complaint.id,
    changed_by_user_id=current_user.id,
    old_status=None,
    new_status=ComplaintStatus.SUBMITTED,
    note="Complaint submitted",
    )
    db.add(history)
    repeat_alert = detect_repeat_complaint(
    db=db,
    complaint=complaint,
    )
    db.commit()
    db.refresh(complaint)

    return complaint


# ---------------------------------------------------------
# STUDENT: MY COMPLAINTS
# ---------------------------------------------------------

@router.get(
    "/my",
    response_model=list[ComplaintResponse],
)
def my_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.STUDENT)
    ),
):

    return db.scalars(
        select(Complaint)
        .where(
            Complaint.student_id == current_user.id
        )
        .order_by(
            Complaint.created_at.desc()
        )
    ).all()


# ---------------------------------------------------------
# GET SINGLE COMPLAINT
# ---------------------------------------------------------

@router.get(
    "/{complaint_id}",
    response_model=ComplaintResponse,
)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
            UserRole.STAFF,
            UserRole.STUDENT,
        )
    ),
):

    complaint = db.get(
        Complaint,
        complaint_id,
    )

    if not complaint:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    # Student can only see their own complaint.

    if (
        current_user.role == UserRole.STUDENT
        and complaint.student_id != current_user.id
    ):

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot access this complaint",
        )

    # Staff can only see complaints assigned to them.

    if current_user.role == UserRole.STAFF:

        staff = db.scalar(
            select(StaffProfile)
            .where(
                StaffProfile.user_id
                == current_user.id
            )
        )

        if (
            not staff
            or complaint.assigned_staff_id
            != staff.id
        ):

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Complaint is not assigned to you",
            )

    return complaint


# ---------------------------------------------------------
# WARDEN: LIST COMPLAINTS
# ---------------------------------------------------------

@router.get(
    "",
    response_model=list[ComplaintResponse],
)
def list_complaints(
    complaint_status: ComplaintStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
        )
    ),
):

    query = select(Complaint)

    if complaint_status:

        query = query.where(
            Complaint.status
            == complaint_status
        )

    return db.scalars(
        query.order_by(
            Complaint.created_at.desc()
        )
    ).all()


# ---------------------------------------------------------
# ASSIGN STAFF
# ---------------------------------------------------------

@router.patch(
    "/{complaint_id}/assign",
    response_model=ComplaintResponse,
)
def assign_staff(
    complaint_id: int,
    data: AssignComplaintRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
        )
    ),
):

    complaint = db.get(
        Complaint,
        complaint_id,
    )

    if not complaint:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    if complaint.status in {
        ComplaintStatus.CLOSED,
        ComplaintStatus.CANCELLED,
    }:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign a closed or cancelled complaint",
        )

    staff = db.get(
        StaffProfile,
        data.staff_id,
    )

    if not staff:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found",
        )

    if staff.availability_status in {
        AvailabilityStatus.ON_LEAVE,
        AvailabilityStatus.INACTIVE,
    }:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Staff member is not available",
        )

    complaint.assigned_staff_id = staff.id
    complaint.assigned_at = utc_now()

    change_status(
        db=db,
        complaint=complaint,
        changed_by_user_id=current_user.id,
        new_status=ComplaintStatus.ASSIGNED,
        note=f"Assigned to staff #{staff.id}",
    )

    db.commit()
    db.refresh(complaint)

    return complaint


# ---------------------------------------------------------
# STAFF: START WORK
# ---------------------------------------------------------

@router.patch(
    "/{complaint_id}/start",
    response_model=ComplaintResponse,
)
def start_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.STAFF)
    ),
):

    complaint = db.get(
        Complaint,
        complaint_id,
    )

    if not complaint:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    staff = db.scalar(
        select(StaffProfile)
        .where(
            StaffProfile.user_id
            == current_user.id
        )
    )

    if (
        not staff
        or complaint.assigned_staff_id
        != staff.id
    ):

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Complaint is not assigned to you",
        )

    if complaint.status not in {
        ComplaintStatus.ASSIGNED,
        ComplaintStatus.ON_HOLD,
    }:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complaint cannot be started from its current status",
        )

    complaint.started_at = (
        complaint.started_at
        or utc_now()
    )

    complaint.hold_reason = None

    change_status(
        db=db,
        complaint=complaint,
        changed_by_user_id=current_user.id,
        new_status=ComplaintStatus.IN_PROGRESS,
        note="Staff started/resumed work",
    )

    db.commit()
    db.refresh(complaint)

    return complaint


# ---------------------------------------------------------
# WARDEN: HOLD
# ---------------------------------------------------------

@router.patch(
    "/{complaint_id}/hold",
    response_model=ComplaintResponse,
)
def hold_complaint(
    complaint_id: int,
    data: HoldComplaintRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
        )
    ),
):

    complaint = db.get(
        Complaint,
        complaint_id,
    )

    if not complaint:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    if complaint.status in {
        ComplaintStatus.CLOSED,
        ComplaintStatus.CANCELLED,
        ComplaintStatus.RESOLVED,
    }:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complaint cannot be put on hold",
        )

    complaint.hold_reason = data.reason.strip()
    complaint.held_at = utc_now()

    change_status(
        db=db,
        complaint=complaint,
        changed_by_user_id=current_user.id,
        new_status=ComplaintStatus.ON_HOLD,
        note=data.reason.strip(),
    )

    db.commit()
    db.refresh(complaint)

    return complaint


# ---------------------------------------------------------
# STAFF: RESOLVE
# ---------------------------------------------------------

@router.patch(
    "/{complaint_id}/resolve",
    response_model=ComplaintResponse,
)
def resolve_complaint(
    complaint_id: int,
    data: ResolveComplaintRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.STAFF)
    ),
):

    complaint = db.get(
        Complaint,
        complaint_id,
    )

    if not complaint:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    staff = db.scalar(
        select(StaffProfile)
        .where(
            StaffProfile.user_id
            == current_user.id
        )
    )

    if (
        not staff
        or complaint.assigned_staff_id
        != staff.id
    ):

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Complaint is not assigned to you",
        )

    if complaint.status != ComplaintStatus.IN_PROGRESS:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only in-progress complaints can be resolved",
        )

    complaint.resolved_description = (
        data.description.strip()
    )

    complaint.resolved_at = utc_now()

    change_status(
        db=db,
        complaint=complaint,
        changed_by_user_id=current_user.id,
        new_status=ComplaintStatus.RESOLVED,
        note=data.description.strip(),
    )

    db.commit()
    db.refresh(complaint)

    return complaint


# ---------------------------------------------------------
# STUDENT: VERIFY RESOLUTION
# ---------------------------------------------------------

@router.patch(
    "/{complaint_id}/verify",
    response_model=ComplaintResponse,
)
def verify_resolution(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.STUDENT)
    ),
):

    complaint = db.get(
        Complaint,
        complaint_id,
    )

    if not complaint:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    if complaint.student_id != current_user.id:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot verify this complaint",
        )

    if complaint.status != ComplaintStatus.RESOLVED:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complaint has not been marked as resolved",
        )

    complaint.closed_at = utc_now()

    change_status(
        db=db,
        complaint=complaint,
        changed_by_user_id=current_user.id,
        new_status=ComplaintStatus.CLOSED,
        note="Student verified the resolution",
    )

    db.commit()
    db.refresh(complaint)

    return complaint


# ---------------------------------------------------------
# STUDENT: CANCEL
# ---------------------------------------------------------

@router.patch(
    "/{complaint_id}/cancel",
    response_model=ComplaintResponse,
)
def cancel_complaint(
    complaint_id: int,
    data: CancelComplaintRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.STUDENT)
    ),
):

    complaint = db.get(
        Complaint,
        complaint_id,
    )

    if not complaint:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    if complaint.student_id != current_user.id:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot cancel this complaint",
        )

    if complaint.status not in {
        ComplaintStatus.SUBMITTED,
        ComplaintStatus.ASSIGNED,
    }:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complaint cannot be cancelled now",
        )

    cancellation_deadline = (
        complaint.created_at
        + timedelta(minutes=30)
    )

    now = utc_now()

    if now > cancellation_deadline:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancellation period has expired",
        )

    complaint.cancelled_reason = (
        data.reason.strip()
    )

    complaint.cancelled_at = now

    change_status(
        db=db,
        complaint=complaint,
        changed_by_user_id=current_user.id,
        new_status=ComplaintStatus.CANCELLED,
        note=data.reason.strip(),
    )

    db.commit()
    db.refresh(complaint)

    return complaint
@router.post(
    "/{complaint_id}/attachments",
)
async def upload_complaint_attachment(
    complaint_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.STUDENT)
    ),
):

    complaint = db.get(
        Complaint,
        complaint_id,
    )

    if not complaint:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    if complaint.student_id != current_user.id:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot attach a file to this complaint",
        )

    if complaint.status in {
        ComplaintStatus.CLOSED,
        ComplaintStatus.CANCELLED,
    }:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot attach files to a closed or cancelled complaint",
        )

    try:

        saved_file = await save_complaint_image(
            file
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    attachment = ComplaintAttachment(
        complaint_id=complaint.id,
        file_name=saved_file["file_name"],
        file_path=saved_file["file_path"],
        content_type=saved_file["content_type"],
    )

    db.add(attachment)

    db.commit()
    db.refresh(attachment)

    return {
        "message": "Attachment uploaded successfully",
        "attachment_id": attachment.id,
        "file_name": attachment.file_name,
        "file_path": attachment.file_path,
    }
@router.get(
    "/{complaint_id}/attachments/{attachment_id}",
)
def view_complaint_attachment(
    complaint_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
            UserRole.STAFF,
            UserRole.STUDENT,
        )
    ),
):

    complaint = db.get(
        Complaint,
        complaint_id,
    )

    if not complaint:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    attachment = db.get(
        ComplaintAttachment,
        attachment_id,
    )

    if not attachment:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found",
        )

    if attachment.complaint_id != complaint.id:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attachment does not belong to this complaint",
        )

    # Student
    if current_user.role == UserRole.STUDENT:

        if complaint.student_id != current_user.id:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

    # Staff
    if current_user.role == UserRole.STAFF:

        staff = db.scalar(
            select(StaffProfile)
            .where(
                StaffProfile.user_id
                == current_user.id
            )
        )

        if (
            not staff
            or complaint.assigned_staff_id
            != staff.id
        ):

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

    file_path = attachment.file_path

    if not Path(file_path).exists():

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File no longer exists",
        )

    return FileResponse(
        path=file_path,
        media_type=attachment.content_type,
        filename=attachment.file_name,
    )
@router.get(
    "/{complaint_id}/history",
    response_model=list[ComplaintHistoryResponse],
)
def complaint_history(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
            UserRole.STAFF,
            UserRole.STUDENT,
        )
    ),
):

    complaint = db.get(
        Complaint,
        complaint_id,
    )

    if not complaint:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    # Student ownership
    if (
        current_user.role == UserRole.STUDENT
        and complaint.student_id != current_user.id
    ):

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    # Staff assignment
    if current_user.role == UserRole.STAFF:

        staff = db.scalar(
            select(StaffProfile)
            .where(
                StaffProfile.user_id
                == current_user.id
            )
        )

        if (
            not staff
            or complaint.assigned_staff_id
            != staff.id
        ):

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

    return db.scalars(
        select(ComplaintHistory)
        .where(
            ComplaintHistory.complaint_id
            == complaint_id
        )
        .order_by(
            ComplaintHistory.created_at.asc()
        )
    ).all()
@router.get(
    "/alerts",
    response_model=list[ComplaintAlertResponse],
)
def list_complaint_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
        )
    ),
):

    return db.scalars(
        select(ComplaintAlert)
        .where(
            ComplaintAlert.is_acknowledged.is_(False)
        )
        .order_by(
            ComplaintAlert.created_at.desc()
        )
    ).all()
@router.patch(
    "/alerts/{alert_id}/acknowledge",
    response_model=ComplaintAlertResponse,
)
def acknowledge_complaint_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
        )
    ),
):

    alert = db.get(
        ComplaintAlert,
        alert_id,
    )

    if not alert:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint alert not found",
        )

    if alert.is_acknowledged:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Alert already acknowledged",
        )

    alert.is_acknowledged = True

    alert.acknowledged_by = current_user.id

    alert.acknowledged_at = (
        datetime.now(timezone.utc)
    )

    db.commit()
    db.refresh(alert)

    return alert
@router.get(
    "/repeat",
)
def repeated_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
        )
    ),
):

    since = (
        datetime.now(timezone.utc)
        - timedelta(
            days=REPEAT_COMPLAINT_LOOKBACK_DAYS
        )
    )

    rows = db.execute(
        select(
            Complaint.room_id,
            Complaint.category,
            func.count(Complaint.id).label(
                "complaint_count"
            ),
        )
        .where(
            Complaint.created_at >= since,
            Complaint.status
            != ComplaintStatus.CANCELLED,
        )
        .group_by(
            Complaint.room_id,
            Complaint.category,
        )
        .having(
            func.count(Complaint.id)
            >= REPEAT_COMPLAINT_THRESHOLD
        )
        .order_by(
            func.count(Complaint.id).desc()
        )
    ).all()

    return [
        {
            "room_id": row.room_id,
            "category": row.category.value,
            "complaint_count": row.complaint_count,
        }
        for row in rows
    ]
