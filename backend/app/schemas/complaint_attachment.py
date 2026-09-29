from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ComplaintAttachmentResponse(BaseModel):
    id: int
    complaint_id: int
    file_name: str
    file_path: str
    content_type: str
    uploaded_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )