from sqlalchemy.orm import Session, joinedload
from backend.models.attendance import AttendanceSession, AttendanceLog
from backend.schemas.attendance import AttendanceSessionCreate

def create_attendance_session(db: Session, session: AttendanceSessionCreate, class_id: int):
    # Calculate next lesson number
    last_session = db.query(AttendanceSession)\
        .filter(AttendanceSession.class_id == class_id)\
        .order_by(AttendanceSession.lesson_number.desc())\
        .first()
    
    next_number = (last_session.lesson_number + 1) if last_session else 1
    
    # Auto-generate description if not provided
    description = session.description
    if not description:
        description = f"Aula {next_number:02d}"

    # Check for duplicate session on same date
    existing_session = db.query(AttendanceSession).filter(
        AttendanceSession.class_id == class_id,
        AttendanceSession.date == session.date
    ).first()
    if existing_session:
        raise ValueError("Já existe uma chamada para esse dia")

    # Create session
    db_session = AttendanceSession(
        class_id=class_id,
        date=session.date,
        description=description,
        lesson_number=next_number
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    # Create logs
    for log in session.logs:
        db_log = AttendanceLog(
            session_id=db_session.id,
            student_id=log.student_id,
            status=log.status,
            essay_delivered=log.essay_delivered,
            grade=log.grade,
            observation=log.observation
        )
        db.add(db_log)
    
    db.commit()
    db.refresh(db_session)
    return db_session

def update_attendance_session(db: Session, session_id: int, session_data: AttendanceSessionCreate):
    db_session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not db_session:
        return None
    
    # Update Session Details (Date/Description)
    db_session.date = session_data.date
    if session_data.description:
        db_session.description = session_data.description
        
    # Update Logs
    # Strategy: clear old logs and re-create? Or update in place?
    # Re-creating is safer for consistency if students changed, but let's try update/create.
    # Simpler: Delete all logs for this session and recreate them.
    db.query(AttendanceLog).filter(AttendanceLog.session_id == session_id).delete()
    
    for log in session_data.logs:
        db_log = AttendanceLog(
            session_id=session_id,
            student_id=log.student_id,
            status=log.status,
            essay_delivered=log.essay_delivered,
            grade=log.grade,
            observation=log.observation
        )
        db.add(db_log)
        
    db.commit()
    db.refresh(db_session)
    return db_session

def get_class_attendance_sessions(db: Session, class_id: int):
    return db.query(AttendanceSession).filter(AttendanceSession.class_id == class_id).order_by(AttendanceSession.date.asc()).all()

def get_attendance_session(db: Session, session_id: int):
    return db.query(AttendanceSession).options(joinedload(AttendanceSession.logs).joinedload(AttendanceLog.student)).filter(AttendanceSession.id == session_id).first()

def delete_attendance_session(db: Session, session_id: int):
    db_session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if db_session:
        db.delete(db_session)
        db.commit()
    return db_session
