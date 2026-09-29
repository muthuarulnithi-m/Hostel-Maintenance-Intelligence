from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Room(Base):

    __tablename__ = "rooms"

    __table_args__ = (
        UniqueConstraint(
            "block_id",
            "room_number",
            name="uq_room_block_number",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    block_id: Mapped[int] = mapped_column(
        ForeignKey("blocks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    room_number: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    floor: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    capacity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    block = relationship(
        "Block",
        back_populates="rooms",
    )

    student_assignments = relationship(
        "StudentRoomAssignment",
        back_populates="room",
        cascade="all, delete-orphan",
    )