from sqlalchemy.orm import Session
from backend.models.students import Student
from backend.models.enrollments import Enrollment
from uuid import UUID

def get_students_for_class(db: Session, class_id: UUID):
    return db.query(Student).join(Enrollment).filter(Enrollment.class_id == class_id).all()

def enroll_student(db: Session, class_id: UUID, student_id: int):
    existing = db.query(Enrollment).filter(Enrollment.class_id == class_id, Enrollment.student_id == student_id).first()
    if existing:
        return existing
    
    db_enrollment = Enrollment(class_id=class_id, student_id=student_id)
    db.add(db_enrollment)
    db.commit()
    return db_enrollment

def unenroll_student(db: Session, class_id: UUID, student_id: int):
    db.query(Enrollment).filter(Enrollment.class_id == class_id, Enrollment.student_id == student_id).delete()
    db.commit()

def get_enrollment_for_student(db: Session, student_id: int):
    """Retorna a matrícula atual do aluno (regra 1:1)"""
    return db.query(Enrollment).filter(Enrollment.student_id == student_id).first()

def change_student_class(db: Session, student_id: int, new_class_id: UUID | None):
    """Troca aluno de turma (remove da antiga, adiciona na nova)"""
    # Remove todas as matrículas existentes (garante regra 1:1)
    db.query(Enrollment).filter(Enrollment.student_id == student_id).delete()
    
    # Se nova turma foi especificada, matricula
    if new_class_id:
        db_enrollment = Enrollment(class_id=new_class_id, student_id=student_id)
        db.add(db_enrollment)
        db.commit()
        return db_enrollment
    
    db.commit()
    return None
