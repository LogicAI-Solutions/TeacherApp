from sqlalchemy.orm import Session
from passlib.context import CryptContext
from backend.models.users import User
from backend.schemas.users import UserCreate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()

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
