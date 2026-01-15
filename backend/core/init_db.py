from sqlalchemy.orm import Session
from backend.models.users import User
from backend.core import database
from passlib.context import CryptContext
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_db(db: Session = next(database.get_db())):
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")

    if not admin_email or not admin_password:
        print("ADMIN_EMAIL or ADMIN_PASSWORD not set in .env")
        return

    user = db.query(User).filter(User.email == admin_email).first()
    if not user:
        print(f"Creating admin user: {admin_email}")
        hashed_password = pwd_context.hash(admin_password)
        db_user = User(
            email=admin_email,
            hashed_password=hashed_password,
            is_admin=True,
            is_active=True
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        print("Admin user created successfully")
    else:
        print("Admin user already exists")
