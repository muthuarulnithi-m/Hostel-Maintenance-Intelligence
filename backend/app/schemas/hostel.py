from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class HostelCreate(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=100,
    )

    code: str = Field(
        min_length=1,
        max_length=30,
    )

    address: str | None = Field(
        default=None,
        max_length=255,
    )


class HostelUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    address: str | None = Field(
        default=None,
        max_length=255,
    )

    is_active: bool | None = None


class HostelResponse(BaseModel):

    id: int
    name: str
    code: str
    address: str | None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
    