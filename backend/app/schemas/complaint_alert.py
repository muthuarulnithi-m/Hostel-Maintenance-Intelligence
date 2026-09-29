from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ComplaintAlertResponse(BaseModel):

    id: int

    complaint_id: int

    room_id: int

    category: str

    repeat_count: int

    message: str

    is_acknowledged: bool

    acknowledged_by: int | None

    acknowledged_at: datetime | None

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )