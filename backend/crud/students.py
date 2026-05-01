from sqlalchemy.orm import Session
from backend.models.students import Student
from backend.models.attendance import AttendanceLog
from backend.models.enrollments import Enrollment
from backend.schemas.students import StudentCreate

from sqlalchemy import or_

def get_students(db: Session, user_id: int, skip: int = 0, limit: int = 100, search: str = None, sort_by: str = "name", sort_desc: bool = False, active_status: bool = None, school_year: str = None, payment_status: str = None, payment_month: int = None, payment_year: int = None):
    query = db.query(Student).filter(Student.owner_id == user_id)
    
    if active_status is not None:
        query = query.filter(Student.active == active_status)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(or_(
            Student.name.ilike(search_filter),
            Student.parent_name.ilike(search_filter)
        ))

    if school_year:
        query = query.filter(Student.school_year.ilike(f"%{school_year}%"))

    if payment_status and payment_month and payment_year:
        from backend.models.payments import Payment
        from sqlalchemy import and_
        
        if payment_status == 'PAID':
            # Students who have a PAID payment for that month/year
            query = query.join(Payment, and_(
                Payment.student_id == Student.id,
                Payment.month == payment_month,
                Payment.year == payment_year,
                Payment.status == 'PAID'
            ))
        elif payment_status == 'ISENTO':
            query = query.join(Payment, and_(
                Payment.student_id == Student.id,
                Payment.month == payment_month,
                Payment.year == payment_year,
                Payment.status == 'ISENTO'
            ))
        elif payment_status == 'PENDING':
            # Students who do not have a PAID or ISENTO payment for that month/year.
            query = query.outerjoin(Payment, and_(
                Payment.student_id == Student.id,
                Payment.month == payment_month,
                Payment.year == payment_year,
                Payment.status.in_(['PAID', 'ISENTO'])
            )).filter(Payment.id == None)

    if sort_by == 'name':
        if sort_desc:
            query = query.order_by(Student.name.desc())
        else:
            query = query.order_by(Student.name.asc())
    elif sort_by == 'active':
        if sort_desc:
            query = query.order_by(Student.active.desc())
        else:
            query = query.order_by(Student.active.asc())
    elif sort_by == 'parent_name':
        if sort_desc:
            query = query.order_by(Student.parent_name.desc())
        else:
            query = query.order_by(Student.parent_name.asc())

    return query.offset(skip).limit(limit).all()

def count_students(db: Session, user_id: int, search: str = None, active_status: bool = None, school_year: str = None, payment_status: str = None, payment_month: int = None, payment_year: int = None):
    query = db.query(Student).filter(Student.owner_id == user_id)
    
    if active_status is not None:
        query = query.filter(Student.active == active_status)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(or_(
            Student.name.ilike(search_filter),
            Student.parent_name.ilike(search_filter)
        ))

    if school_year:
        query = query.filter(Student.school_year.ilike(f"%{school_year}%"))
        
    if payment_status and payment_month and payment_year:
        from backend.models.payments import Payment
        from sqlalchemy import and_
        
        if payment_status == 'PAID':
            query = query.join(Payment, and_(
                Payment.student_id == Student.id,
                Payment.month == payment_month,
                Payment.year == payment_year,
                Payment.status == 'PAID'
            ))
        elif payment_status == 'ISENTO':
            query = query.join(Payment, and_(
                Payment.student_id == Student.id,
                Payment.month == payment_month,
                Payment.year == payment_year,
                Payment.status == 'ISENTO'
            ))
        elif payment_status == 'PENDING':
            query = query.outerjoin(Payment, and_(
                Payment.student_id == Student.id,
                Payment.month == payment_month,
                Payment.year == payment_year,
                Payment.status.in_(['PAID', 'ISENTO'])
            )).filter(Payment.id == None)

    return query.count()

def create_student(db: Session, student: StudentCreate, user_id: int):
    db_student = Student(**student.model_dump(), owner_id=user_id)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def update_student(db: Session, student_id: int, student_data: StudentCreate):
    student = db.query(Student).filter(Student.id == student_id).first()
    if student:
        student.name = student_data.name
        student.phone = student_data.phone
        student.parent_name = student_data.parent_name
        student.parent_phone = student_data.parent_phone
        student.parent_email = student_data.parent_email
        student.school_year = student_data.school_year
        student.school = student_data.school
        student.class_type = student_data.class_type
        student.intended_profession = student_data.intended_profession
        student.observation = student_data.observation
        student.active = student_data.active
        db.commit()
        db.refresh(student)
    return student

def delete_student(db: Session, student_id: int):
    student = db.query(Student).filter(Student.id == student_id).first()
    if student:
        db.query(AttendanceLog).filter(AttendanceLog.student_id == student_id).delete()
        db.query(Enrollment).filter(Enrollment.student_id == student_id).delete()
        db.delete(student)
        db.commit()
    return student

def get_student_report_stats(db: Session, student_id: int, month: int = None, year: int = None):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return None
    
    from backend.models.attendance import AttendanceSession
    query = db.query(AttendanceLog).join(AttendanceSession).filter(AttendanceLog.student_id == student_id)

    if month and year:
        from sqlalchemy import extract
        query = query.filter(extract('month', AttendanceSession.date) == month)
        query = query.filter(extract('year', AttendanceSession.date) == year)

    logs = query.order_by(AttendanceSession.date).all()
    
    total_sessions = len(logs)
    present_sessions = len([l for l in logs if l.status == 'present'])
    attendance_rate = (present_sessions / total_sessions * 100) if total_sessions > 0 else 0
    
    avg_grade = 0
    graded_logs = [l.grade for l in logs if l.grade is not None]
    if graded_logs:
        avg_grade = sum(graded_logs) / len(graded_logs)
        
    return {
        "student": student,
        "total_classes": total_sessions,
        "present": present_sessions,
        "attendance_rate": round(attendance_rate, 2),
        "avg_grade": round(avg_grade, 2),
        "logs": logs
    }

def get_student_evolution(db: Session, student_id: int):
    # Retrieve logs ordered by session date
    # Need to import AttendanceSession first (check top of file)
    from backend.models.attendance import AttendanceSession
    results = db.query(AttendanceLog).join(AttendanceSession).filter(AttendanceLog.student_id == student_id).order_by(AttendanceSession.date).all()
    return results
