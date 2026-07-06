from sqlalchemy import Column, Integer, String, ForeignKey, Date, Float, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from backend.core.database import Base

class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"))
    date = Column(Date)
    description = Column(String) # e.g. "Aula 01"
    lesson_number = Column(Integer, default=1)

    course_class = relationship("Class", back_populates="attendance_sessions")
    logs = relationship("AttendanceLog", back_populates="session", cascade="all, delete-orphan")

class AttendanceLog(Base):
    __tablename__ = "attendance_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("attendance_sessions.id"))
    student_id = Column(Integer, ForeignKey("students.id"))
    status = Column(String) # "present", "absent"
    essay_delivered = Column(Boolean, default=False)
    grade = Column(Float, nullable=True) # 960
    observation = Column(Text, nullable=True)

    session = relationship("AttendanceSession", back_populates="logs")
    student = relationship("Student")
