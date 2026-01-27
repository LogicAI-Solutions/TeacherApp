from sqlalchemy import Column, Integer, String, ForeignKey, Float, Boolean, Date
from sqlalchemy.orm import relationship
from backend.core.database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), index=True)
    month = Column(Integer, index=True) # 1-12
    year = Column(Integer, index=True)
    status = Column(String) # "PENDING", "PAID", "LATE"
    amount = Column(Float, default=0.0)
    paid_at = Column(Date, nullable=True)
    
    student = relationship("Student", back_populates="payments")
