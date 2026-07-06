import uuid
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from backend.core.database import Base

class Class(Base):
    __tablename__ = "classes"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    name = Column(String, index=True)
    schedule = Column(String) # e.g., "Monday 18:30"
    owner_id = Column(Integer, ForeignKey("users.id"))
    display_order = Column(Integer, default=0)

    owner = relationship("User", back_populates="owned_classes")
    enrollments = relationship("Enrollment", back_populates="course_class")
    attendance_sessions = relationship("AttendanceSession", back_populates="course_class")
