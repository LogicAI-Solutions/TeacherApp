from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from backend.schemas import classes as class_schemas
from backend.schemas import users as user_schemas
from backend.schemas import students as student_schemas
from backend.schemas import attendance as attendance_schemas
from backend.crud import classes as class_crud
from backend.crud import enrollments as enrollment_crud
from backend.crud import attendance as attendance_crud
from backend.core import database, security

router = APIRouter()

@router.get("/classes/", response_model=List[class_schemas.Class])
def read_classes(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: user_schemas.User = Depends(security.get_current_user)):
    return class_crud.get_classes(db, user_id=current_user.id, skip=skip, limit=limit)

@router.put("/classes/reorder", response_model=List[class_schemas.Class])
def reorder_classes(order_data: List[class_schemas.ClassReorder], db: Session = Depends(database.get_db), current_user: user_schemas.User = Depends(security.get_current_user)):
    return class_crud.reorder_classes(db=db, user_id=current_user.id, order_data=order_data)

@router.post("/classes/", response_model=class_schemas.Class)
def create_class(class_: class_schemas.ClassCreate, db: Session = Depends(database.get_db), current_user: user_schemas.User = Depends(security.get_current_user)):
    return class_crud.create_class(db=db, class_=class_, user_id=current_user.id)

@router.get("/classes/{class_id}", response_model=class_schemas.Class)
def read_class(class_id: UUID, db: Session = Depends(database.get_db), current_user: user_schemas.User = Depends(security.get_current_user)):
    db_class = class_crud.get_class(db, class_id=class_id)
    if db_class is None:
        raise HTTPException(status_code=404, detail="Class not found")
    if db_class.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db_class

@router.put("/classes/{class_id}", response_model=class_schemas.Class)
def update_class(class_id: UUID, class_data: class_schemas.ClassCreate, db: Session = Depends(database.get_db), current_user: user_schemas.User = Depends(security.get_current_user)):
    db_class = class_crud.get_class(db, class_id=class_id)
    if db_class is None:
        raise HTTPException(status_code=404, detail="Class not found")
    if db_class.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return class_crud.update_class(db=db, class_id=class_id, class_data=class_data)

@router.delete("/classes/{class_id}")
def delete_class(class_id: UUID, db: Session = Depends(database.get_db), current_user: user_schemas.User = Depends(security.get_current_user)):
    db_class = class_crud.get_class(db, class_id=class_id)
    if db_class is None:
        raise HTTPException(status_code=404, detail="Class not found")
    if db_class.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    class_crud.delete_class(db=db, class_id=class_id)
    return {"message": "Class deleted successfully"}

@router.get("/classes/{class_id}/students", response_model=List[student_schemas.Student])
def read_class_students(class_id: UUID, db: Session = Depends(database.get_db), current_user: user_schemas.User = Depends(security.get_current_user)):
    # Verify ownership
    db_class = class_crud.get_class(db, class_id=class_id)
    if not db_class or db_class.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return enrollment_crud.get_students_for_class(db, class_id=class_id)

@router.get("/classes/{class_id}/attendance", response_model=List[attendance_schemas.AttendanceSession])
def read_attendance_sessions(class_id: UUID, db: Session = Depends(database.get_db), current_user: user_schemas.User = Depends(security.get_current_user)):
    # Verify class belongs to user
    # TODO: Add check
    return attendance_crud.get_class_attendance_sessions(db, class_id=class_id)

@router.post("/classes/{class_id}/attendance", response_model=attendance_schemas.AttendanceSession)
def create_attendance_session(class_id: UUID, session: attendance_schemas.AttendanceSessionCreate, db: Session = Depends(database.get_db), current_user: user_schemas.User = Depends(security.get_current_user)):
    # Verify class belongs to user
    # TODO: Add check
    try:
        return attendance_crud.create_attendance_session(db=db, session=session, class_id=class_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/classes/{class_id}/enroll/{student_id}")
def enroll_student_in_class(class_id: UUID, student_id: int, db: Session = Depends(database.get_db), current_user: user_schemas.User = Depends(security.get_current_user)):
    return enrollment_crud.enroll_student(db, class_id=class_id, student_id=student_id)

@router.delete("/classes/{class_id}/enroll/{student_id}")
def unenroll_student_from_class(class_id: UUID, student_id: int, db: Session = Depends(database.get_db), current_user: user_schemas.User = Depends(security.get_current_user)):
    enrollment_crud.unenroll_student(db, class_id=class_id, student_id=student_id)
    return {"message": "Student unenrolled successfully"}
