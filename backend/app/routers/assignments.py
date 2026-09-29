from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.room import Room
from app.models.student_assignment import StudentRoomAssignment
from app.models.user import User, UserRole
from app.schemas.assignments import (
    AssignmentCreate,
    AssignmentResponse,
)


router = APIRouter(
    prefix="/assignments",
    tags=["Student Room Assignments"],
)


@router.post(
    "",
    response_model=AssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_student(
    data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    ),
):

    student = db.get(
        User,
        data.student_id,
    )

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

    room = db.get(
        Room,
        data.room_id,
    )

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

    current_assignment = db.scalar(
        select(StudentRoomAssignment).where(
            StudentRoomAssignment.student_id
            == data.student_id,
            StudentRoomAssignment.is_active.is_(True),
        )
    )

    if current_assignment:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student already has an active room assignment",
        )

    # current_occupants = db.scalar(
    #     select(
    #         StudentRoomAssignment.id
    #     ).where(
    #         StudentRoomAssignment.room_id
    #         == data.room_id,
    #         StudentRoomAssignment.is_active.is_(True),
    #     ).limit(room.capacity)
    # )

    occupant_count = len(
        db.scalars(
            select(StudentRoomAssignment).where(
                StudentRoomAssignment.room_id
                == data.room_id,
                StudentRoomAssignment.is_active.is_(True),
            )
        ).all()
    )

    if occupant_count >= room.capacity:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Room capacity is full",
        )

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


@router.get(
    "",
    response_model=list[AssignmentResponse],
)
def list_assignments(
    student_id: int | None = None,
    room_id: int | None = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
        )
    ),
):

    query = select(
        StudentRoomAssignment
    )

    if student_id is not None:

        query = query.where(
            StudentRoomAssignment.student_id
            == student_id
        )

    if room_id is not None:

        query = query.where(
            StudentRoomAssignment.room_id
            == room_id
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


@router.get(
    "/student/{student_id}",
    response_model=list[AssignmentResponse],
)
def get_student_assignments(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
        )
    ),
):

    return db.scalars(
        select(StudentRoomAssignment)
        .where(
            StudentRoomAssignment.student_id
            == student_id
        )
        .order_by(
            StudentRoomAssignment.id.desc()
        )
    ).all()


@router.patch(
    "/{assignment_id}/end",
    response_model=AssignmentResponse,
)
def end_assignment(
    assignment_id: int,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    ),
):

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
