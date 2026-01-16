from pydantic import BaseModel
from datetime import date
from typing import Optional

class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    birth_date: Optional[date] = None
    nickname: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    class Config:
        from_attributes = True
