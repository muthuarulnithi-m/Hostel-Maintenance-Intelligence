from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):

    id: int

    user_id: int

    title: str

    message: str

    notification_type: str

    complaint_id: int | None

    alert_id: int | None

    is_read: bool

    created_at: datetime

    read_at: datetime | None

    model_config = ConfigDict(
        from_attributes=True,
    )