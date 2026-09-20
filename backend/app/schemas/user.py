from enum import Enum
from pydantic import BaseModel, EmailStr
from datetime import datetime


class Role(str, Enum):
    VIEWER = "VIEWER"
    ANALYST = "ANALYST"
    ADMIN = "ADMIN"


class UserBase(BaseModel):
    email: EmailStr
    role: Role = Role.VIEWER


class UserCreate(UserBase):
    password: str


class UserRoleUpdate(BaseModel):
    role: Role


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
