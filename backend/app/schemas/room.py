from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RoomCreate(BaseModel):

    block_id: int

    room_number: str = Field(
        min_length=1,
        max_length=20,
    )

    floor: int = Field(
        ge=0,
        le=100,
    )

    capacity: int = Field(
        ge=1,
        le=20,
    )


class RoomUpdate(BaseModel):

    floor: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    capacity: int | None = Field(
        default=None,
        ge=1,
        le=20,
    )

    is_active: bool | None = None


class RoomResponse(BaseModel):

    id: int
    block_id: int
    room_number: str
    floor: int
    capacity: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )