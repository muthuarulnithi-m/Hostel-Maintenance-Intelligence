from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RatingCreate(BaseModel):
    rating: int = Field(
        ge=1,
        le=5,
        description="Rating from 1 to 5",
    )

    feedback: str | None = Field(
        default=None,
        max_length=2000,
    )


class RatingResponse(BaseModel):
    id: int
    complaint_id: int
    student_id: int
    staff_id: int
    rating: int
    feedback: str | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )