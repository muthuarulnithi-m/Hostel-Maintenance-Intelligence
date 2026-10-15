from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password
from app.dependencies.auth import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.user import (
    AdminCreateUserRequest,
    UpdateMyProfileRequest,
    UpdateUserStatusRequest,
    UserResponse,
)


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    data: AdminCreateUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    existing_user = db.scalar(
        select(User).where(User.email == data.email.lower())
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    user = User(
        name=data.name.strip(),
        email=data.email.lower(),
        phone=data.phone,
        password_hash=hash_password(data.password),
        role=data.role,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.get(
    "",
    response_model=list[UserResponse],
)
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    return db.scalars(select(User).order_by(User.id)).all()


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.patch(
    "/me",
    response_model=UserResponse,
)
def update_my_profile(
    data: UpdateMyProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.name is not None:
        current_user.name = data.name.strip()

    if data.phone is not None:
        current_user.phone = data.phone.strip() or None

    if data.new_password is not None:
        if not data.current_password or not verify_password(
            data.current_password,
            current_user.password_hash,
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )

        current_user.password_hash = hash_password(data.new_password)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.patch(
    "/{user_id}/status",
    response_model=UserResponse,
)
def update_user_status(
    user_id: int,
    data: UpdateUserStatusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    user = db.get(User, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.id == current_user.id and not data.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account",
        )

    user.is_active = data.is_active
    db.commit()
    db.refresh(user)

    return user
