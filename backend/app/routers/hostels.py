from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.hostel import Hostel
from app.models.user import User, UserRole
from app.schemas.hostel import (
    HostelCreate,
    HostelResponse,
    HostelUpdate,
)


router = APIRouter(
    prefix="/hostels",
    tags=["Hostels"],
)


@router.post(
    "",
    response_model=HostelResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_hostel(
    data: HostelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    ),
):

    existing = db.scalar(
        select(Hostel).where(
            Hostel.code == data.code.upper()
        )
    )

    if existing:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Hostel code already exists",
        )

    hostel = Hostel(
        name=data.name.strip(),
        code=data.code.upper().strip(),
        address=data.address,
    )

    db.add(hostel)
    db.commit()
    db.refresh(hostel)

    return hostel


@router.get(
    "",
    response_model=list[HostelResponse],
)
def list_hostels(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
        )
    ),
):

    return db.scalars(
        select(Hostel)
        .order_by(Hostel.id)
    ).all()


@router.get(
    "/{hostel_id}",
    response_model=HostelResponse,
)
def get_hostel(
    hostel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
        )
    ),
):

    hostel = db.get(Hostel, hostel_id)

    if not hostel:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hostel not found",
        )

    return hostel


@router.patch(
    "/{hostel_id}",
    response_model=HostelResponse,
)
def update_hostel(
    hostel_id: int,
    data: HostelUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    ),
):

    hostel = db.get(Hostel, hostel_id)

    if not hostel:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hostel not found",
        )

    if data.name is not None:
        hostel.name = data.name.strip()

    if data.address is not None:
        hostel.address = data.address

    if data.is_active is not None:
        hostel.is_active = data.is_active

    db.commit()
    db.refresh(hostel)

    return hostel