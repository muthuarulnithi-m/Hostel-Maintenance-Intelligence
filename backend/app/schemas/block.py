from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BlockCreate(BaseModel):

    hostel_id: int

    name: str = Field(
        min_length=1,
        max_length=100,
    )

    code: str = Field(
        min_length=1,
        max_length=30,
    )


class BlockUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    is_active: bool | None = None


class BlockResponse(BaseModel):

    id: int
    hostel_id: int
    name: str
    code: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
    