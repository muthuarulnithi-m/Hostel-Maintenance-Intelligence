from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.staff import AvailabilityStatus
from app.models.staff_skill import StaffSkillType


class StaffCreate(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=100,
    )

    email: EmailStr

    phone: str | None = Field(
        default=None,
        max_length=20,
    )

    password: str = Field(
        min_length=8,
        max_length=72,
    )

    employee_code: str = Field(
        min_length=1,
        max_length=50,
    )


class StaffResponse(BaseModel):

    id: int
    user_id: int
    employee_code: str
    availability_status: AvailabilityStatus
    joined_at: datetime
    name: str | None = None
    email: str | None = None
    phone: str | None = None

    model_config = ConfigDict(
        from_attributes=True,
    )


class AvailabilityUpdate(BaseModel):

    availability_status: AvailabilityStatus


class SkillCreate(BaseModel):

    skill: StaffSkillType


class SkillResponse(BaseModel):

    id: int
    staff_id: int
    skill: StaffSkillType

    model_config = ConfigDict(
        from_attributes=True,
    )
