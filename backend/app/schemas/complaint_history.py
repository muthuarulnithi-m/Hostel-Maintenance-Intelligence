from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.complaint import ComplaintStatus


class ComplaintHistoryResponse(BaseModel):
    id: int
    complaint_id: int
    changed_by_user_id: int

    old_status: ComplaintStatus | None
    new_status: ComplaintStatus

    note: str | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )