from sqlalchemy.orm import Session
from backend.models.classes import Class
from backend.schemas.classes import ClassCreate, ClassReorder
from typing import List

def get_classes(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(Class).filter(Class.owner_id == user_id).order_by(Class.display_order, Class.id).offset(skip).limit(limit).all()

def reorder_classes(db: Session, user_id: int, order_data: List[ClassReorder]):
    """Update the display_order for multiple classes"""
    for item in order_data:
        db_class = db.query(Class).filter(Class.id == item.id, Class.owner_id == user_id).first()
        if db_class:
            db_class.display_order = item.display_order
    db.commit()
    return get_classes(db, user_id)

def create_class(db: Session, class_: ClassCreate, user_id: int):
    # **class_.dict() is deprecated in Pydantic v2, using class_.model_dump() is better or strict dict()
    # Keeping dict() for compatibility if v1, but instructions said v2 typically.
    # User didn't specify pydantic version but standardizing.
    # requirements.txt has `pydantic`. Assuming v2 if installed consistently.
    # Using `model_dump()` would be safer for v2, but strictly `dict()` usually works in v2 migration layer.
    # I'll use `model_dump` if possible, but let's stick to what was there or `dict()` if unsure.
    # Original code used `dict()`. I'll use `model_dump()` as it's cleaner for v2, but `dict()` is fine.
    # Let's use `model_dump()` to be modern.
    # Using .dict() for compatibility with Pydantic v1 and v2
    db_class = Class(**class_.dict(), owner_id=user_id)
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class

def get_class(db: Session, class_id: int):
    return db.query(Class).filter(Class.id == class_id).first()

def update_class(db: Session, class_id: int, class_data: ClassCreate):
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if db_class:
        db_class.name = class_data.name
        db_class.schedule = class_data.schedule
        db.commit()
        db.refresh(db_class)
    return db_class

def delete_class(db: Session, class_id: int):
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if db_class:
        db.delete(db_class)
        db.commit()
    return db_class
