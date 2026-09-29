from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.block import Block
from app.models.hostel import Hostel
from app.models.user import User, UserRole
from app.schemas.block import (
    BlockCreate,
    BlockResponse,
    BlockUpdate,
)


router = APIRouter(
    prefix="/blocks",
    tags=["Blocks"],
)


@router.post(
    "",
    response_model=BlockResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_block(
    data: BlockCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    ),
):

    hostel = db.get(
        Hostel,
        data.hostel_id,
    )

    if not hostel:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hostel not found",
        )

    existing = db.scalar(
        select(Block).where(
            Block.hostel_id == data.hostel_id,
            Block.code == data.code.upper(),
        )
    )

    if existing:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Block code already exists in this hostel",
        )

    block = Block(
        hostel_id=data.hostel_id,
        name=data.name.strip(),
        code=data.code.upper().strip(),
    )

    db.add(block)
    db.commit()
    db.refresh(block)

    return block


@router.get(
    "",
    response_model=list[BlockResponse],
)
def list_blocks(
    hostel_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
        )
    ),
):

    query = select(Block)

    if hostel_id is not None:

        query = query.where(
            Block.hostel_id == hostel_id
        )

    return db.scalars(
        query.order_by(Block.id)
    ).all()


@router.get(
    "/{block_id}",
    response_model=BlockResponse,
)
def get_block(
    block_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.WARDEN,
        )
    ),
):

    block = db.get(Block, block_id)

    if not block:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Block not found",
        )

    return block


@router.patch(
    "/{block_id}",
    response_model=BlockResponse,
)
def update_block(
    block_id: int,
    data: BlockUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    ),
):

    block = db.get(Block, block_id)

    if not block:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Block not found",
        )

    if data.name is not None:
        block.name = data.name.strip()

    if data.is_active is not None:
        block.is_active = data.is_active

    db.commit()
    db.refresh(block)

    return block