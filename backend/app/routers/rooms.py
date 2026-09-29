from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.block import Block
from app.models.room import Room
from app.models.user import User, UserRole
from app.schemas.room import (
    RoomCreate,
    RoomResponse,
    RoomUpdate,
)


router = APIRouter(
    prefix="/rooms",
    tags=["Rooms"],
)


@router.post(
    "",
    response_model=RoomResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_room(
    data: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    ),
):

    block = db.get(
        Block,
        data.block_id,
    )

    if not block:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Block not found",
        )

    existing = db.scalar(
        select(Room).where(
            Room.block_id == data.block_id,
            Room.room_number == data.room_number.strip(),
        )
    )

    if existing:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Room number already exists in this block",
        )

    room = Room(
        block_id=data.block_id,
        room_number=data.room_number.strip(),
        floor=data.floor,
        capacity=data.capacity,
    )

    db.add(room)
    db.commit()
    db.refresh(room)

    return room


@router.get(
    "",
    response_model=list[RoomResponse],
)
def list_rooms(
    block_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
        )
    ),
):

    query = select(Room)

    if block_id is not None:

        query = query.where(
            Room.block_id == block_id
        )

    return db.scalars(
        query.order_by(Room.room_number)
    ).all()


@router.get(
    "/{room_id}",
    response_model=RoomResponse,
)
def get_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
        )
    ),
):

    room = db.get(Room, room_id)

    if not room:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    return room


@router.patch(
    "/{room_id}",
    response_model=RoomResponse,
)
def update_room(
    room_id: int,
    data: RoomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    ),
):

    room = db.get(Room, room_id)

    if not room:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    if data.floor is not None:
        room.floor = data.floor

    if data.capacity is not None:
        room.capacity = data.capacity

    if data.is_active is not None:
        room.is_active = data.is_active

    db.commit()
    db.refresh(room)

    return room