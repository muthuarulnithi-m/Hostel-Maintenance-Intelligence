import enum

from sqlalchemy import (
    Enum,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class StaffSkillType(str, enum.Enum):

    ELECTRICAL = "ELECTRICAL"
    PLUMBING = "PLUMBING"
    CIVIL = "CIVIL"
    FURNITURE = "FURNITURE"
    SANITATION = "SANITATION"
    NETWORK = "NETWORK"
    CLEANING = "CLEANING"
    SECURITY = "SECURITY"
    GENERAL = "GENERAL"


class StaffSkill(Base):

    __tablename__ = "staff_skills"

    __table_args__ = (
        UniqueConstraint(
            "staff_id",
            "skill",
            name="uq_staff_skill",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    staff_id: Mapped[int] = mapped_column(
        ForeignKey(
            "staff_profiles.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    skill: Mapped[StaffSkillType] = mapped_column(
        Enum(
            StaffSkillType,
            name="staff_skill_type",
        ),
        nullable=False,
    )

    staff = relationship(
        "StaffProfile",
        back_populates="skills",
    )
    