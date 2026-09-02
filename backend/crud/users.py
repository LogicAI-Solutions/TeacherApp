from sqlalchemy.orm import Session
from passlib.context import CryptContext
from backend.models.users import User
from backend.schemas.users import UserCreate, UserUpdate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
from sqlalchemy import or_

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_nickname(db: Session, nickname: str):
    return db.query(User).filter(User.nickname.ilike(nickname)).first()

def get_users(db: Session, skip: int = 0, limit: int = 100, search: str = None):
    query = db.query(User).filter(User.email != 'admin@admin.com')
    if search:
        search_filter = f"%{search}%"
        query = query.filter(or_(
            User.full_name.ilike(search_filter),
            User.email.ilike(search_filter),
            User.nickname.ilike(search_filter)
        ))
    return query.offset(skip).limit(limit).all()

def create_user(db: Session, user: UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        birth_date=user.birth_date,
        nickname=user.nickname
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
    return user

def update_user_password(db: Session, user_id: int, password: str):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        hashed_password = pwd_context.hash(password)
        user.hashed_password = hashed_password
        db.commit()
        db.refresh(user)
    return user

def update_user(db: Session, user_id: int, user_update: UserUpdate):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        return None
    
    update_data = user_update.dict(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        hashed_password = pwd_context.hash(update_data["password"])
        update_data["hashed_password"] = hashed_password
        del update_data["password"]
    
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user
