from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.user import User, UserRole
from app.services.dashboard_service import (
    get_admin_dashboard,
    get_staff_dashboard,
    get_student_dashboard,
    get_warden_dashboard,
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/admin")
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    ),
):
    return get_admin_dashboard(db)


@router.get("/warden")
def warden_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.WARDEN)
    ),
):
    return get_warden_dashboard(db)


@router.get("/staff")
def staff_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.STAFF)
    ),
):
    return get_staff_dashboard(db, current_user)


@router.get("/student")
def student_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.STUDENT)
    ),
):
    return get_student_dashboard(db, current_user)
