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

    ComplaintPriority,

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

    ComplaintDetailResponse,

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

from app.services.notification_service import (
    notify_active_wardens,
    notify_complaint_users,
)

from app.services.notification_email import send_warden_complaint_email

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

    background_tasks: BackgroundTasks,

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

    db.flush()

    priority_attention = complaint.priority in {
        ComplaintPriority.HIGH,
        ComplaintPriority.URGENT,
    }

    notify_complaint_users(
        db=db,
        complaint=complaint,
        event_id=f"history:{history.id}",
        user_ids=[current_user.id],
        title="Complaint submitted",
        message=f"Your complaint #{complaint.id} was submitted and is awaiting review.",
        notification_type="COMPLAINT_SUBMITTED",
    )

    warden_message = f"Complaint #{complaint.id} needs assignment: {complaint.title}."
    if priority_attention:
        warden_message = (
            f"{complaint.priority.value} priority complaint #{complaint.id} "
            f"needs prompt review: {complaint.title}."
        )
    notify_active_wardens(
        db=db,
        complaint=complaint,
        event_id=f"history:{history.id}",
        title=(
            "Urgent complaint needs attention"
            if priority_attention
            else "New complaint needs assignment"
        ),
        message=warden_message,
        notification_type="COMPLAINT_REQUIRES_ASSIGNMENT",
    )

    repeat_alert = detect_repeat_complaint(

    db=db,

    complaint=complaint,

    )

    db.commit()

    db.refresh(complaint)

    if priority_attention or repeat_alert:
        background_tasks.add_task(
            send_warden_complaint_email,
            complaint.id,
            complaint.title,
            complaint.category.value,
            complaint.priority.value,
            complaint.room_id,
            repeat_alert.repeat_count if repeat_alert else None,
        )

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
# STAFF: MY ASSIGNED COMPLAINTS
# NOTE: Must be BEFORE /{complaint_id} to avoid route conflict
# ---------------------------------------------------------

@router.get(
    "/assigned/me",
    response_model=list[ComplaintResponse],
)
def my_assigned_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.STAFF)
    ),
):
    """Return all complaints assigned to the currently logged-in staff member."""
    staff = db.scalar(
        select(StaffProfile).where(StaffProfile.user_id == current_user.id)
    )
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff profile not found",
        )
    return db.scalars(
        select(Complaint)
        .where(Complaint.assigned_staff_id == staff.id)
        .order_by(Complaint.created_at.desc())
    ).all()

# ---------------------------------------------------------

# GET SINGLE COMPLAINT

# ---------------------------------------------------------

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
    """Return unacknowledged complaint alerts for admins and wardens."""
    return db.scalars(
        select(ComplaintAlert)
        .where(ComplaintAlert.is_acknowledged.is_(False))
        .order_by(ComplaintAlert.created_at.desc())
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

@router.get(
    "/{complaint_id}/details",
    response_model=ComplaintDetailResponse,
)
def get_complaint_details(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.WARDEN)
    ),
):
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    student = complaint.student
    room = complaint.room
    block = room.block if room else None
    hostel = block.hostel if block else None
    staff = complaint.assigned_staff
    staff_user = staff.user if staff else None

    result = ComplaintResponse.model_validate(complaint).model_dump()
    result.update({
        "student": {
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "phone": student.phone,
        },
        "room": {
            "id": room.id,
            "room_number": room.room_number,
            "floor": room.floor,
            "capacity": room.capacity,
            "block_name": block.name if block else None,
            "block_code": block.code if block else None,
            "hostel_name": hostel.name if hostel else None,
            "hostel_code": hostel.code if hostel else None,
        },
        "assigned_staff": (
            {
                "id": staff.id,
                "user_id": staff.user_id,
                "name": staff_user.name if staff_user else None,
                "email": staff_user.email if staff_user else None,
                "employee_code": staff.employee_code,
                "availability_status": staff.availability_status.value,
            }
            if staff else None
        ),
        "attachments": [
            {
                "id": attachment.id,
                "file_name": attachment.file_name,
                "content_type": attachment.content_type,
                "uploaded_at": attachment.uploaded_at,
            }
            for attachment in complaint.attachments
        ],
    })
    return result


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

    previous_staff_id = complaint.assigned_staff_id
    if previous_staff_id == staff.id:
        return complaint

    complaint.assigned_staff_id = staff.id

    complaint.assigned_at = utc_now()

    history = change_status(

        db=db,

        complaint=complaint,

        changed_by_user_id=current_user.id,

        new_status=ComplaintStatus.ASSIGNED,

        note=f"Assigned to staff #{staff.id}",

    )

    previous_staff = (
        db.get(StaffProfile, previous_staff_id)
        if previous_staff_id is not None
        else None
    )
    event_id = f"history:{history.id}"
    is_reassignment = previous_staff_id is not None and previous_staff_id != staff.id
    event_type = "COMPLAINT_REASSIGNED" if is_reassignment else "COMPLAINT_ASSIGNED"
    event_title = "Complaint reassigned" if is_reassignment else "New work assigned"
    event_message = (
        f"Complaint #{complaint.id} was assigned to {staff.employee_code}."
    )
    notify_complaint_users(
        db=db,
        complaint=complaint,
        event_id=event_id,
        user_ids=[staff.user_id],
        title=event_title,
        message=event_message,
        notification_type=event_type,
    )
    notify_complaint_users(
        db=db,
        complaint=complaint,
        event_id=event_id,
        user_ids=[previous_staff.user_id if previous_staff else None],
        title="Complaint reassigned",
        message=f"Complaint #{complaint.id} has been reassigned to another staff member.",
        notification_type="COMPLAINT_REASSIGNED",
        include_complaint_ref=False,
    )
    notify_complaint_users(
        db=db,
        complaint=complaint,
        event_id=event_id,
        user_ids=[complaint.student_id],
        title="Complaint reassigned" if is_reassignment else "Staff assigned",
        message=(
            f"A staff member has been assigned to complaint #{complaint.id}."
            if not is_reassignment
            else f"The staff member handling complaint #{complaint.id} has changed."
        ),
        notification_type=event_type,
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

    history = change_status(

        db=db,

        complaint=complaint,

        changed_by_user_id=current_user.id,

        new_status=ComplaintStatus.IN_PROGRESS,

        note="Staff started/resumed work",

    )

    resumed = history.old_status == ComplaintStatus.ON_HOLD
    notify_complaint_users(
        db=db,
        complaint=complaint,
        event_id=f"history:{history.id}",
        user_ids=[complaint.student_id],
        title="Work resumed" if resumed else "Work started",
        message=(
            f"Work has resumed on complaint #{complaint.id}."
            if resumed
            else f"A staff member has started work on complaint #{complaint.id}."
        ),
        notification_type="COMPLAINT_RESUMED" if resumed else "COMPLAINT_STARTED",
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

            UserRole.STAFF,

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

    if current_user.role == UserRole.STAFF:

        staff = db.scalar(

            select(StaffProfile).where(

                StaffProfile.user_id == current_user.id

            )

        )

        if not staff or complaint.assigned_staff_id != staff.id:

            raise HTTPException(

                status_code=status.HTTP_403_FORBIDDEN,

                detail="Complaint is not assigned to you",

            )

    if complaint.status not in {

        ComplaintStatus.ASSIGNED,

        ComplaintStatus.IN_PROGRESS,

    }:

        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail="Only assigned or in-progress complaints can be put on hold",

        )

    complaint.hold_reason = data.reason.strip()

    complaint.held_at = utc_now()

    history = change_status(

        db=db,

        complaint=complaint,

        changed_by_user_id=current_user.id,

        new_status=ComplaintStatus.ON_HOLD,

        note=data.reason.strip(),

    )

    event_id = f"history:{history.id}"
    hold_message = f"Complaint #{complaint.id} has been placed on hold."
    notify_complaint_users(
        db=db,
        complaint=complaint,
        event_id=event_id,
        user_ids=[complaint.student_id],
        title="Complaint on hold",
        message=hold_message,
        notification_type="COMPLAINT_ON_HOLD",
    )
    if current_user.role == UserRole.STAFF:
        notify_active_wardens(
            db=db,
            complaint=complaint,
            event_id=event_id,
            title="Staff placed a complaint on hold",
            message=f"{hold_message} Reason: {data.reason.strip()}",
            notification_type="COMPLAINT_ON_HOLD",
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

    history = change_status(

        db=db,

        complaint=complaint,

        changed_by_user_id=current_user.id,

        new_status=ComplaintStatus.RESOLVED,

        note=data.description.strip(),

    )

    event_id = f"history:{history.id}"
    resolved_message = f"Complaint #{complaint.id} has been marked resolved. Please verify the repair."
    notify_complaint_users(
        db=db,
        complaint=complaint,
        event_id=event_id,
        user_ids=[complaint.student_id],
        title="Complaint resolved",
        message=resolved_message,
        notification_type="COMPLAINT_RESOLVED",
    )
    notify_active_wardens(
        db=db,
        complaint=complaint,
        event_id=event_id,
        title="Staff reported a complaint resolved",
        message=f"Complaint #{complaint.id} was reported resolved by staff.",
        notification_type="COMPLAINT_RESOLVED",
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

    history = change_status(

        db=db,

        complaint=complaint,

        changed_by_user_id=current_user.id,

        new_status=ComplaintStatus.CLOSED,

        note="Student verified the resolution",

    )

    event_id = f"history:{history.id}"
    notify_complaint_users(
        db=db,
        complaint=complaint,
        event_id=event_id,
        user_ids=[complaint.student_id],
        title="Complaint closed",
        message=f"You confirmed the resolution of complaint #{complaint.id}.",
        notification_type="COMPLAINT_CLOSED",
    )
    # Ratings are supported by this app and become available only after the
    # student verifies the resolution. Keep the optional feedback request as
    # a separate, deduplicated notification so it has a direct action in UI.
    notify_complaint_users(
        db=db,
        complaint=complaint,
        event_id=f"{event_id}:rating",
        user_ids=[complaint.student_id],
        title="Rate your completed complaint",
        message=f"If you have a moment, rate the service for complaint #{complaint.id}.",
        notification_type="RATING_REQUEST",
    )
    assigned_staff = (
        db.get(StaffProfile, complaint.assigned_staff_id)
        if complaint.assigned_staff_id is not None
        else None
    )
    notify_complaint_users(
        db=db,
        complaint=complaint,
        event_id=event_id,
        user_ids=[assigned_staff.user_id if assigned_staff else None],
        title="Resolution verified",
        message=f"The student verified complaint #{complaint.id}; it is now closed.",
        notification_type="COMPLAINT_CLOSED",
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

    created_at = complaint.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    cancellation_deadline = created_at + timedelta(minutes=30)

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

    history = change_status(

        db=db,

        complaint=complaint,

        changed_by_user_id=current_user.id,

        new_status=ComplaintStatus.CANCELLED,

        note=data.reason.strip(),

    )

    event_id = f"history:{history.id}"
    notify_complaint_users(
        db=db,
        complaint=complaint,
        event_id=event_id,
        user_ids=[complaint.student_id],
        title="Complaint cancelled",
        message=f"Your complaint #{complaint.id} was cancelled.",
        notification_type="COMPLAINT_CANCELLED",
    )
    assigned_staff = (
        db.get(StaffProfile, complaint.assigned_staff_id)
        if complaint.assigned_staff_id is not None
        else None
    )
    notify_complaint_users(
        db=db,
        complaint=complaint,
        event_id=event_id,
        user_ids=[assigned_staff.user_id if assigned_staff else None],
        title="Assigned complaint cancelled",
        message=f"Complaint #{complaint.id} was cancelled by the student.",
        notification_type="COMPLAINT_CANCELLED",
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
