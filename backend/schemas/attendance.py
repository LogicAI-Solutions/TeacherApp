from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from uuid import UUID

class AttendanceLogBase(BaseModel):
    student_id: int
    status: str
    essay_delivered: bool = False
    grade: Optional[float] = None
    observation: Optional[str] = None

class AttendanceLogCreate(AttendanceLogBase):
    pass

class AttendanceLog(AttendanceLogBase):
    id: int
    session_id: int
    class Config:
        from_attributes = True

class AttendanceSessionBase(BaseModel):
    date: date
    description: Optional[str] = None # Auto-generated if empty
    lesson_number: Optional[int] = None

class AttendanceSessionCreate(AttendanceSessionBase):
    logs: List[AttendanceLogCreate] = []

class AttendanceSession(AttendanceSessionBase):
    id: int
    class_id: UUID
    logs: List[AttendanceLog] = []
    class Config:
        from_attributes = True
