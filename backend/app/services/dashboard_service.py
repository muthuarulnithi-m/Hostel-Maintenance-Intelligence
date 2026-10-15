from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.block import Block
from app.models.complaint import Complaint, ComplaintStatus
from app.models.hostel import Hostel
from app.models.room import Room
from app.models.staff import AvailabilityStatus, StaffProfile
from app.models.student_assignment import StudentRoomAssignment
from app.models.user import User, UserRole


# A complaint is considered overdue after 48 hours while it is still actively
# waiting for assignment/work. ON_HOLD is intentionally excluded.
OVERDUE_HOURS = 48

ACTIVE_COMPLAINT_STATUSES = (
    ComplaintStatus.SUBMITTED,
    ComplaintStatus.ASSIGNED,
    ComplaintStatus.IN_PROGRESS,
)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _status_counts(db: Session, complaint_query=None) -> dict[str, int]:
    query = select(
        Complaint.status,
        func.count(Complaint.id),
    )

    if complaint_query is not None:
        query = complaint_query(query)

    rows = db.execute(
        query.group_by(Complaint.status)
    ).all()

    counts = {status.value: 0 for status in ComplaintStatus}

    for status, count in rows:
        counts[status.value] = int(count)

    return counts


def _common_category(db: Session, complaint_query=None):
    query = select(
        Complaint.category,
        func.count(Complaint.id).label("count"),
    )

    if complaint_query is not None:
        query = complaint_query(query)

    row = db.execute(
        query.group_by(Complaint.category)
        .order_by(func.count(Complaint.id).desc())
        .limit(1)
    ).first()

    if not row:
        return None

    return {
        "category": row[0].value,
        "count": int(row[1]),
    }


def _complaint_metrics(db: Session, complaint_query=None) -> dict:
    now = _utc_now()
    overdue_cutoff = now - timedelta(hours=OVERDUE_HOURS)
    today_start = datetime.combine(
        now.date(),
        datetime.min.time(),
        tzinfo=timezone.utc,
    )

    def add_base(query):
        if complaint_query is not None:
            return complaint_query(query)
        return query

    status_counts = _status_counts(db, complaint_query)

    open_query = select(func.count(Complaint.id)).where(
        Complaint.status.in_(ACTIVE_COMPLAINT_STATUSES)
    )
    open_query = add_base(open_query)
    open_count = int(db.scalar(open_query) or 0)

    urgent_query = select(func.count(Complaint.id)).where(
        Complaint.status.in_(ACTIVE_COMPLAINT_STATUSES),
        Complaint.priority.in_(
            ["HIGH", "URGENT"]
        ),
    )
    urgent_query = add_base(urgent_query)
    high_priority_open = int(db.scalar(urgent_query) or 0)

    overdue_query = select(func.count(Complaint.id)).where(
        Complaint.status.in_(ACTIVE_COMPLAINT_STATUSES),
        Complaint.created_at < overdue_cutoff,
    )
    overdue_query = add_base(overdue_query)
    overdue = int(db.scalar(overdue_query) or 0)

    resolved_today_query = select(func.count(Complaint.id)).where(
        Complaint.resolved_at >= today_start,
        Complaint.resolved_at <= now,
    )
    resolved_today_query = add_base(resolved_today_query)
    resolved_today = int(db.scalar(resolved_today_query) or 0)

    resolution_rows_query = select(
        Complaint.created_at,
        Complaint.closed_at,
    ).where(
        Complaint.closed_at.is_not(None),
        Complaint.created_at.is_not(None),
    )
    resolution_rows_query = add_base(resolution_rows_query)

    resolution_rows = db.execute(resolution_rows_query).all()

    durations = []
    for created_at, closed_at in resolution_rows:
        if created_at and closed_at:
            durations.append(
                (closed_at - created_at).total_seconds() / 3600
            )

    average_resolution_hours = (
        round(sum(durations) / len(durations), 2)
        if durations
        else 0
    )

    return {
        "total": sum(status_counts.values()),
        "open": open_count,
        "status_counts": status_counts,
        "high_priority_open": high_priority_open,
        "overdue": overdue,
        "resolved_today": resolved_today,
        "average_resolution_hours": average_resolution_hours,
        "most_common_category": _common_category(
            db,
            complaint_query,
        ),
    }


def get_admin_dashboard(db: Session) -> dict:
    user_counts = dict(
        db.execute(
            select(
                User.role,
                func.count(User.id),
            ).group_by(User.role)
        ).all()
    )

    total_users = sum(int(value) for value in user_counts.values())

    active_users = int(
        db.scalar(
            select(func.count(User.id)).where(
                User.is_active.is_(True)
            )
        )
        or 0
    )

    hostel_count = int(
        db.scalar(
            select(func.count(Hostel.id)).where(
                Hostel.is_active.is_(True)
            )
        )
        or 0
    )

    block_count = int(
        db.scalar(
            select(func.count(Block.id)).where(
                Block.is_active.is_(True)
            )
        )
        or 0
    )

    active_rooms = int(
        db.scalar(
            select(func.count(Room.id)).where(
                Room.is_active.is_(True)
            )
        )
        or 0
    )

    total_capacity = int(
        db.scalar(
            select(func.coalesce(func.sum(Room.capacity), 0)).where(
                Room.is_active.is_(True)
            )
        )
        or 0
    )

    occupied_places = int(
        db.scalar(
            select(func.count(StudentRoomAssignment.id)).where(
                StudentRoomAssignment.is_active.is_(True)
            )
        )
        or 0
    )

    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "admins": int(user_counts.get(UserRole.ADMIN, 0)),
            "wardens": int(user_counts.get(UserRole.WARDEN, 0)),
            "staff": int(user_counts.get(UserRole.STAFF, 0)),
            "students": int(user_counts.get(UserRole.STUDENT, 0)),
        },
        "hostel_structure": {
            "active_hostels": hostel_count,
            "active_blocks": block_count,
            "active_rooms": active_rooms,
            "total_room_capacity": total_capacity,
            "occupied_places": occupied_places,
            "available_places": max(total_capacity - occupied_places, 0),
        },
        "complaints": _complaint_metrics(db),
    }


def get_warden_dashboard(db: Session) -> dict:
    staff_counts = dict(
        db.execute(
            select(
                StaffProfile.availability_status,
                func.count(StaffProfile.id),
            ).group_by(StaffProfile.availability_status)
        ).all()
    )

    active_assignments = int(
        db.scalar(
            select(func.count(StudentRoomAssignment.id)).where(
                StudentRoomAssignment.is_active.is_(True)
            )
        )
        or 0
    )

    return {
        "complaints": _complaint_metrics(db),
        "staff": {
            "total": sum(int(value) for value in staff_counts.values()),
            "available": int(
                staff_counts.get(AvailabilityStatus.AVAILABLE, 0)
            ),
            "busy": int(
                staff_counts.get(AvailabilityStatus.BUSY, 0)
            ),
            "on_leave": int(
                staff_counts.get(AvailabilityStatus.ON_LEAVE, 0)
            ),
            "inactive": int(
                staff_counts.get(AvailabilityStatus.INACTIVE, 0)
            ),
        },
        "active_student_room_assignments": active_assignments,
    }


def get_staff_dashboard(db: Session, current_user: User) -> dict:
    staff = db.scalar(
        select(StaffProfile).where(
            StaffProfile.user_id == current_user.id
        )
    )

    if not staff:
        return {
            "staff": None,
            "complaints": {
                "total": 0,
                "open": 0,
                "status_counts": {
                    status.value: 0 for status in ComplaintStatus
                },
                "high_priority_open": 0,
                "overdue": 0,
                "resolved_today": 0,
                "average_resolution_hours": 0,
                "most_common_category": None,
            },
        }

    def staff_filter(query):
        return query.where(
            Complaint.assigned_staff_id == staff.id
        )

    return {
        "staff": {
            "id": staff.id,
            "employee_code": staff.employee_code,
            "availability_status": staff.availability_status.value,
            "joined_at": staff.joined_at,
        },
        "complaints": _complaint_metrics(
            db,
            staff_filter,
        ),
    }


def get_student_dashboard(db: Session, current_user: User) -> dict:
    assignment = db.scalar(
        select(StudentRoomAssignment).where(
            StudentRoomAssignment.student_id == current_user.id,
            StudentRoomAssignment.is_active.is_(True),
        )
    )

    room_details = None

    if assignment:
        room = db.get(Room, assignment.room_id)

        if room:
            block = db.get(Block, room.block_id)

            if block:
                hostel = db.get(Hostel, block.hostel_id)

                room_details = {
                    "hostel": (
                        {
                            "id": hostel.id,
                            "name": hostel.name,
                            "code": hostel.code,
                        }
                        if hostel
                        else None
                    ),
                    "block": {
                        "id": block.id,
                        "name": block.name,
                        "code": block.code,
                    },
                    "room": {
                        "id": room.id,
                        "room_number": room.room_number,
                        "floor": room.floor,
                        "capacity": room.capacity,
                    },
                    "assignment": {
                        "id": assignment.id,
                        "start_date": assignment.start_date,
                        "end_date": assignment.end_date,
                    },
                }

    def student_filter(query):
        return query.where(
            Complaint.student_id == current_user.id
        )

    return {
        "room": room_details,
        "complaints": _complaint_metrics(
            db,
            student_filter,
        ),
    }
