from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.complaint import (
    ComplaintCategory,
    ComplaintPriority,
    ComplaintStatus,
)


class ComplaintCreate(BaseModel):

    title: str = Field(
        min_length=3,
        max_length=200,
    )

    description: str = Field(
        min_length=5,
        max_length=5000,
    )

    category: ComplaintCategory = (
        ComplaintCategory.GENERAL
    )

    priority: ComplaintPriority = (
        ComplaintPriority.MEDIUM
    )


class StudentInfo(BaseModel):

    id: int
    name: str | None = None
    email: str | None = None
    phone: str | None = None


class RoomInfo(BaseModel):

    id: int
    room_number: str
    floor: int
    capacity: int
    block_name: str | None = None
    block_code: str | None = None
    hostel_name: str | None = None
    hostel_code: str | None = None


class StaffInfo(BaseModel):

    id: int
    user_id: int
    name: str | None = None
    email: str | None = None
    employee_code: str | None = None
    availability_status: str | None = None


class AttachmentInfo(BaseModel):

    id: int
    file_name: str
    content_type: str
    uploaded_at: datetime


class ComplaintResponse(BaseModel):

    id: int

    student_id: int
    room_id: int

    category: ComplaintCategory
    priority: ComplaintPriority
    status: ComplaintStatus

    title: str
    description: str

    assigned_staff_id: int | None

    hold_reason: str | None
    resolved_description: str | None
    cancelled_reason: str | None

    created_at: datetime
    updated_at: datetime

    assigned_at: datetime | None
    started_at: datetime | None
    held_at: datetime | None
    resolved_at: datetime | None
    closed_at: datetime | None
    cancelled_at: datetime | None

    model_config = ConfigDict(
        from_attributes=True
    )


class ComplaintDetailResponse(ComplaintResponse):
    student: StudentInfo
    room: RoomInfo
    assigned_staff: StaffInfo | None = None
    attachments: list[AttachmentInfo] = Field(default_factory=list)


class AssignComplaintRequest(BaseModel):

    staff_id: int


class HoldComplaintRequest(BaseModel):

    reason: str = Field(
        min_length=3,
        max_length=2000,
    )


class ResolveComplaintRequest(BaseModel):

    description: str = Field(
        min_length=3,
        max_length=3000,
    )


class CancelComplaintRequest(BaseModel):

    reason: str = Field(
        min_length=3,
        max_length=1000,
    )
