import enum
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ComplaintStatus(str, enum.Enum):

    SUBMITTED = "SUBMITTED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    ON_HOLD = "ON_HOLD"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class ComplaintPriority(str, enum.Enum):

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class ComplaintCategory(str, enum.Enum):

    ELECTRICAL = "ELECTRICAL"
    PLUMBING = "PLUMBING"
    CIVIL = "CIVIL"
    FURNITURE = "FURNITURE"
    SANITATION = "SANITATION"
    NETWORK = "NETWORK"
    CLEANING = "CLEANING"
    SECURITY = "SECURITY"
    GENERAL = "GENERAL"


class Complaint(Base):

    __tablename__ = "complaints"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    student_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    room_id: Mapped[int] = mapped_column(
        ForeignKey(
            "rooms.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    category: Mapped[ComplaintCategory] = mapped_column(
        Enum(
            ComplaintCategory,
            name="complaint_category",
        ),
        nullable=False,
    )

    priority: Mapped[ComplaintPriority] = mapped_column(
        Enum(
            ComplaintPriority,
            name="complaint_priority",
        ),
        nullable=False,
        default=ComplaintPriority.MEDIUM,
    )

    status: Mapped[ComplaintStatus] = mapped_column(
        Enum(
            ComplaintStatus,
            name="complaint_status",
        ),
        nullable=False,
        default=ComplaintStatus.SUBMITTED,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    assigned_staff_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "staff_profiles.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    hold_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    resolved_description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    cancelled_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    assigned_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    held_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    student = relationship(
        "User",
        foreign_keys=[student_id],
    )

    room = relationship(
        "Room",
        foreign_keys=[room_id],
    )

    assigned_staff = relationship(
        "StaffProfile",
        foreign_keys=[assigned_staff_id],
    )

    attachments = relationship(
        "ComplaintAttachment",
        back_populates="complaint",
        cascade="all, delete-orphan",
    )

    history = relationship(
        "ComplaintHistory",
        back_populates="complaint",
        cascade="all, delete-orphan",
        order_by="ComplaintHistory.created_at",
    )
    