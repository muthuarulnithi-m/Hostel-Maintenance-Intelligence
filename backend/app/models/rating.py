from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Rating(Base):
    __tablename__ = "ratings"

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

    student_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    staff_id: Mapped[int] = mapped_column(
        ForeignKey(
            "staff_profiles.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    rating: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    feedback: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "complaint_id",
            name="uq_rating_complaint",
        ),
        CheckConstraint(
            "rating >= 1 AND rating <= 5",
            name="ck_rating_value",
        ),
    )

    complaint = relationship(
        "Complaint",
        foreign_keys=[complaint_id],
    )

    student = relationship(
        "User",
        foreign_keys=[student_id],
    )

    staff = relationship(
        "StaffProfile",
        foreign_keys=[staff_id],
    )