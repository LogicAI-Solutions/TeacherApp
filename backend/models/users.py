from sqlalchemy import Boolean, Column, Integer, String, Date
from sqlalchemy.orm import relationship
from backend.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    
    full_name = Column(String, nullable=True)
    birth_date = Column(Date, nullable=True)
    nickname = Column(String, nullable=True)
    profile_photo = Column(String, nullable=True)

    owned_classes = relationship("Class", back_populates="owner")
    students = relationship("Student", back_populates="owner")
