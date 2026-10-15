from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.room import Room
from app.models.student_assignment import StudentRoomAssignment
from app.models.user import User, UserRole
from app.schemas.assignments import AssignmentCreate


def create_assignment(
    db: Session,
    data: AssignmentCreate,
) -> StudentRoomAssignment:
    """
    Assign a student to an active hostel room.

    Rules:
    - Student must exist.
    - User must have STUDENT role.
    - Room must exist and be active.
    - Student can have only one active room assignment.
    - Room cannot exceed its configured capacity.
    """

    # ---------------------------------------------------------
    # Validate student
    # ---------------------------------------------------------

    student = db.get(User, data.student_id)

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    if student.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected user is not a student",
        )

    if not student.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student account is inactive",
        )

    # ---------------------------------------------------------
    # Validate room
    # ---------------------------------------------------------

    room = db.get(Room, data.room_id)

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    if not room.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room is inactive",
        )

    if room.capacity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room capacity must be greater than zero",
        )

    # ---------------------------------------------------------
    # Check existing active assignment for student
    # ---------------------------------------------------------

    current_assignment = db.scalar(
        select(StudentRoomAssignment).where(
            StudentRoomAssignment.student_id == data.student_id,
            StudentRoomAssignment.is_active.is_(True),
        )
    )

    if current_assignment:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student already has an active room assignment",
        )

    # ---------------------------------------------------------
    # Check room capacity
    # ---------------------------------------------------------

    occupant_count = db.scalar(
        select(func.count(StudentRoomAssignment.id)).where(
            StudentRoomAssignment.room_id == data.room_id,
            StudentRoomAssignment.is_active.is_(True),
        )
    )

    occupant_count = occupant_count or 0

    if occupant_count >= room.capacity:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Room capacity is full",
        )

    # ---------------------------------------------------------
    # Create assignment
    # ---------------------------------------------------------

    assignment = StudentRoomAssignment(
        student_id=data.student_id,
        room_id=data.room_id,
        start_date=data.start_date,
        is_active=True,
    )

    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return assignment


def list_assignments(
    db: Session,
    student_id: int | None = None,
    room_id: int | None = None,
    active_only: bool = True,
) -> list[StudentRoomAssignment]:
    """
    Return student-room assignments with optional filters.
    """

    query = select(StudentRoomAssignment)

    if student_id is not None:
        query = query.where(
            StudentRoomAssignment.student_id == student_id
        )

    if room_id is not None:
        query = query.where(
            StudentRoomAssignment.room_id == room_id
        )

    if active_only:
        query = query.where(
            StudentRoomAssignment.is_active.is_(True)
        )

    return db.scalars(
        query.order_by(
            StudentRoomAssignment.id.desc()
        )
    ).all()


def get_student_assignments(
    db: Session,
    student_id: int,
) -> list[StudentRoomAssignment]:
    """
    Return all room assignments belonging to a student.
    """

    return db.scalars(
        select(StudentRoomAssignment)
        .where(
            StudentRoomAssignment.student_id == student_id
        )
        .order_by(
            StudentRoomAssignment.id.desc()
        )
    ).all()


def end_assignment(
    db: Session,
    assignment_id: int,
    end_date: date,
) -> StudentRoomAssignment:
    """
    End an active student-room assignment.
    """

    assignment = db.get(
        StudentRoomAssignment,
        assignment_id,
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )

    if not assignment.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment is already inactive",
        )

    if end_date < assignment.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date cannot be before start date",
        )

    assignment.end_date = end_date
    assignment.is_active = False

    db.commit()
    db.refresh(assignment)

    return assignment