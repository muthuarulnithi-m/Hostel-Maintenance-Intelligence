from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password
from app.dependencies.auth import require_roles
from app.models.staff import (
    AvailabilityStatus,
    StaffProfile,
)
from app.models.staff_skill import (
    StaffSkill,
    StaffSkillType,
)
from app.models.user import User, UserRole
from app.schemas.staff import (
    AvailabilityUpdate,
    SkillCreate,
    SkillResponse,
    StaffCreate,
    StaffResponse,
)


router = APIRouter(
    prefix="/staff",
    tags=["Staff"],
)


@router.post(
    "",
    response_model=StaffResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_staff(
    data: StaffCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    ),
):

    existing_user = db.scalar(
        select(User).where(
            User.email == data.email.lower()
        )
    )

    if existing_user:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    existing_employee = db.scalar(
        select(StaffProfile).where(
            StaffProfile.employee_code
            == data.employee_code.strip()
        )
    )

    if existing_employee:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Employee code already exists",
        )

    user = User(
        name=data.name.strip(),
        email=data.email.lower(),
        phone=data.phone,
        password_hash=hash_password(data.password),
        role=UserRole.STAFF,
    )

    db.add(user)
    db.flush()

    staff = StaffProfile(
        user_id=user.id,
        employee_code=data.employee_code.strip(),
        availability_status=AvailabilityStatus.AVAILABLE,
    )

    db.add(staff)

    db.commit()
    db.refresh(staff)

    return staff


@router.get(
    "",
    response_model=list[StaffResponse],
)
def list_staff(
    availability_status: AvailabilityStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
        )
    ),
):

    query = select(StaffProfile)

    if availability_status:

        query = query.where(
            StaffProfile.availability_status
            == availability_status
        )

    return db.scalars(
        query.order_by(StaffProfile.id)
    ).all()


@router.get(
    "/{staff_id}",
    response_model=StaffResponse,
)
def get_staff(
    staff_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
        )
    ),
):

    staff = db.get(
        StaffProfile,
        staff_id,
    )

    if not staff:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found",
        )

    return staff


@router.patch(
    "/{staff_id}/availability",
    response_model=StaffResponse,
)
def update_availability(
    staff_id: int,
    data: AvailabilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
            UserRole.STAFF,
        )
    ),
):

    staff = db.get(
        StaffProfile,
        staff_id,
    )

    if not staff:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found",
        )

    if current_user.role == UserRole.STAFF and staff.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff members can update only their own availability",
        )

    staff.availability_status = (
        data.availability_status
    )

    db.commit()
    db.refresh(staff)

    return staff


@router.post(
    "/{staff_id}/skills",
    response_model=SkillResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_skill(
    staff_id: int,
    data: SkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    ),
):

    staff = db.get(
        StaffProfile,
        staff_id,
    )

    if not staff:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found",
        )

    existing = db.scalar(
        select(StaffSkill).where(
            StaffSkill.staff_id == staff_id,
            StaffSkill.skill == data.skill,
        )
    )

    if existing:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Staff already has this skill",
        )

    skill = StaffSkill(
        staff_id=staff_id,
        skill=data.skill,
    )

    db.add(skill)
    db.commit()
    db.refresh(skill)

    return skill


@router.get(
    "/{staff_id}/skills",
    response_model=list[SkillResponse],
)
def get_skills(
    staff_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
        )
    ),
):

    staff = db.get(
        StaffProfile,
        staff_id,
    )

    if not staff:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found",
        )

    return db.scalars(
        select(StaffSkill)
        .where(
            StaffSkill.staff_id == staff_id
        )
        .order_by(StaffSkill.id)
    ).all()


@router.delete(
    "/{staff_id}/skills/{skill}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_skill(
    staff_id: int,
    skill: StaffSkillType,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    ),
):

    existing = db.scalar(
        select(StaffSkill).where(
            StaffSkill.staff_id == staff_id,
            StaffSkill.skill == skill,
        )
    )

    if not existing:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff skill not found",
        )

    db.delete(existing)
    db.commit()

    return None
