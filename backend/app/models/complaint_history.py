from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

from app.models.complaint import ComplaintStatus


class ComplaintHistory(Base):

    __tablename__ = "complaint_history"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    complaint_id: Mapped[int] = mapped_column(
        ForeignKey(
            "complaints.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    changed_by_user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    old_status: Mapped[ComplaintStatus | None] = mapped_column(
        Enum(
            ComplaintStatus,
            name="complaint_old_status",
        ),
        nullable=True,
    )

    new_status: Mapped[ComplaintStatus] = mapped_column(
        Enum(
            ComplaintStatus,
            name="complaint_new_status",
        ),
        nullable=False,
    )

    note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    complaint = relationship(
        "Complaint",
        back_populates="history",
    )

    changed_by = relationship(
        "User",
        foreign_keys=[changed_by_user_id],
    )