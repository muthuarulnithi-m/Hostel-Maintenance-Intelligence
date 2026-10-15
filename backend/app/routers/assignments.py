from datetime import date

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.user import User, UserRole
from app.schemas.assignments import (
    AssignmentCreate,
    AssignmentResponse,
)
from app.services.assignment_service import (
    create_assignment,
    end_assignment,
    get_student_assignments,
    list_assignments,
)


router = APIRouter(
    prefix="/assignments",
    tags=["Student Room Assignments"],
)


# ---------------------------------------------------------
# ASSIGN STUDENT
# ---------------------------------------------------------

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
    return create_assignment(
        db=db,
        data=data,
    )


# ---------------------------------------------------------
# LIST ASSIGNMENTS
# ---------------------------------------------------------

@router.get(
    "",
    response_model=list[AssignmentResponse],
)
def get_assignments(
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
    return list_assignments(
        db=db,
        student_id=student_id,
        room_id=room_id,
        active_only=active_only,
    )


# ---------------------------------------------------------
# GET STUDENT ASSIGNMENTS
# ---------------------------------------------------------

@router.get(
    "/student/{student_id}",
    response_model=list[AssignmentResponse],
)
def get_student_assignment_history(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
        )
    ),
):
    return get_student_assignments(
        db=db,
        student_id=student_id,
    )


# ---------------------------------------------------------
# END ASSIGNMENT
# ---------------------------------------------------------

@router.patch(
    "/{assignment_id}/end",
    response_model=AssignmentResponse,
)
def end_student_assignment(
    assignment_id: int,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    ),
):
    return end_assignment(
        db=db,
        assignment_id=assignment_id,
        end_date=end_date,
    )