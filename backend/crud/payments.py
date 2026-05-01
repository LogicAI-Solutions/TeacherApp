from sqlalchemy.orm import Session
from backend.models.payments import Payment
from backend.schemas.payments import PaymentCreate
from typing import List, Optional

from backend.models.students import Student

def get_payments(db: Session, user_id: int, student_id: Optional[int] = None, year: Optional[int] = None, month: Optional[int] = None, skip: int = 0, limit: int = 100, search: Optional[str] = None):
    query = db.query(Payment).join(Student, Payment.student_id == Student.id).filter(Student.owner_id == user_id)
    
    if student_id:
        query = query.filter(Payment.student_id == student_id)
    if year:
        query = query.filter(Payment.year == year)
    if month:
        query = query.filter(Payment.month == month)
    if search:
        query = query.filter(Student.name.ilike(f"%{search}%"))
        
    return query.offset(skip).limit(limit).all()

def create_payment(db: Session, payment: PaymentCreate):
    db_payment = Payment(
        student_id=payment.student_id,
        month=payment.month,
        year=payment.year,
        status=payment.status,
        amount=payment.amount,
        paid_at=payment.paid_at
    )
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

def update_payment(db: Session, payment_id: int, payment_data: PaymentCreate):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if payment:
        payment.status = payment_data.status
        payment.amount = payment_data.amount
        payment.paid_at = payment_data.paid_at
        db.commit()
        db.refresh(payment)
    return payment
    
def get_payment_stats(db: Session, user_id: int, month: int, year: int):
    total_students = db.query(Student).filter(
        Student.owner_id == user_id,
        Student.active == True
    ).count()
    
    # Paid Payments for this month/year for students owned by user
    # Note: Join Student to ensure ownership
    paid_query = db.query(Payment).join(Student).filter(
        Student.owner_id == user_id,
        Student.active == True,
        Payment.month == month,
        Payment.year == year,
        Payment.status == 'PAID'
    )
    paid_count = paid_query.count()

    exempt_count = db.query(Payment).join(Student).filter(
        Student.owner_id == user_id,
        Student.active == True,
        Payment.month == month,
        Payment.year == year,
        Payment.status == 'ISENTO'
    ).count()
    
    # Total Received (Sum amount)
    from sqlalchemy import func
    total_received = db.query(func.sum(Payment.amount)).join(Student).filter(
        Student.owner_id == user_id,
        Student.active == True,
        Payment.month == month,
        Payment.year == year,
        Payment.status == 'PAID'
    ).scalar() or 0.0
    
    return {
        "total_students": total_students,
        "paid_count": paid_count,
        "exempt_count": exempt_count,
        "pending_count": max(total_students - paid_count - exempt_count, 0),
        "total_received": total_received
    }
