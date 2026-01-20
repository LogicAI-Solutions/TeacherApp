from sqlalchemy.orm import Session
from backend.models.students import Student
from backend.models.attendance import AttendanceLog
from backend.models.enrollments import Enrollment
from backend.schemas.students import StudentCreate

from sqlalchemy import or_

def get_students(db: Session, user_id: int, skip: int = 0, limit: int = 100, search: str = None):
    query = db.query(Student).filter(Student.owner_id == user_id)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(or_(
            Student.name.ilike(search_filter),
            Student.parent_name.ilike(search_filter)
        ))
    return query.offset(skip).limit(limit).all()

def count_students(db: Session, user_id: int, search: str = None):
    query = db.query(Student).filter(Student.owner_id == user_id)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(or_(
            Student.name.ilike(search_filter),
            Student.parent_name.ilike(search_filter)
        ))
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
        student.class_type = student_data.class_type
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
