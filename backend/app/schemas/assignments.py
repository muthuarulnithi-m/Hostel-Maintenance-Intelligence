from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class AssignmentCreate(BaseModel):

    student_id: int
    room_id: int
    start_date: date


class AssignmentResponse(BaseModel):

    id: int
    student_id: int
    room_id: int
    start_date: date
    end_date: date | None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
    