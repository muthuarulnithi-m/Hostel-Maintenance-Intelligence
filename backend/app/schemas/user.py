from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.models.user import UserRole


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminCreateUserRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)
    password: str = Field(min_length=8, max_length=72)
    role: UserRole

    @model_validator(mode="after")
    def validate_admin_role(self):
        if self.role == UserRole.ADMIN:
            raise ValueError("New ADMIN accounts must be created through the server bootstrap process")
        return self


class UpdateUserStatusRequest(BaseModel):
    is_active: bool


class UpdateMyProfileRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    current_password: str | None = Field(default=None, min_length=1, max_length=72)
    new_password: str | None = Field(default=None, min_length=8, max_length=72)

    @model_validator(mode="after")
    def validate_password_change(self):
        if self.new_password is not None and self.current_password is None:
            raise ValueError("current_password is required when changing the password")
        return self
