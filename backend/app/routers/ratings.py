from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.complaint import Complaint, ComplaintStatus
from app.models.rating import Rating
from app.models.user import User, UserRole
from app.schemas.rating import RatingCreate, RatingResponse


router = APIRouter(
    prefix="/ratings",
    tags=["Ratings"],
)


# ---------------------------------------------------------------------------
# CREATE RATING
# ---------------------------------------------------------------------------

@router.post(
    "/complaints/{complaint_id}",
    response_model=RatingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_rating(
    complaint_id: int,
    data: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.STUDENT)
    ),
):
    """
    Submit a rating for a completed complaint.

    Rules:
    - Only the complaint owner can rate it.
    - Complaint must be CLOSED.
    - Complaint must have assigned staff.
    - One rating is allowed per complaint.
    """

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
            detail="You can only rate your own complaints",
        )

    if complaint.status != ComplaintStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complaint must be closed before it can be rated",
        )

    if complaint.assigned_staff_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complaint does not have an assigned staff member",
        )

    existing_rating = db.scalar(
        select(Rating).where(
            Rating.complaint_id == complaint.id
        )
    )

    if existing_rating:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This complaint has already been rated",
        )

    rating = Rating(
        complaint_id=complaint.id,
        student_id=current_user.id,
        staff_id=complaint.assigned_staff_id,
        rating=data.rating,
        feedback=(
            data.feedback.strip()
            if data.feedback
            else None
        ),
    )

    db.add(rating)
    db.commit()
    db.refresh(rating)

    return rating


# ---------------------------------------------------------------------------
# GET MY RATINGS
# ---------------------------------------------------------------------------

@router.get(
    "/my",
    response_model=list[RatingResponse],
)
def get_my_ratings(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.STUDENT)
    ),
):
    """
    Return ratings submitted by the current student.
    """

    return db.scalars(
        select(Rating)
        .where(
            Rating.student_id == current_user.id
        )
        .order_by(
            Rating.created_at.desc()
        )
    ).all()


# ---------------------------------------------------------------------------
# GET RATING FOR A COMPLAINT
# ---------------------------------------------------------------------------

@router.get(
    "/complaints/{complaint_id}",
    response_model=RatingResponse,
)
def get_complaint_rating(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
            UserRole.STUDENT,
        )
    ),
):
    """
    Get the rating associated with a complaint.

    Students can only access ratings for their own complaints.
    Admin and Warden can access ratings for management/analytics.
    """

    complaint = db.get(
        Complaint,
        complaint_id,
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    if (
        current_user.role == UserRole.STUDENT
        and complaint.student_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot access this complaint rating",
        )

    rating = db.scalar(
        select(Rating).where(
            Rating.complaint_id == complaint_id
        )
    )

    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating not found for this complaint",
        )

    return rating