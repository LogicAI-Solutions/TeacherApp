from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.models.users import User
from backend.core import database
from passlib.context import CryptContext
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def ensure_columns(db: Session):
    """Add missing columns used by lightweight deployments."""
    try:
        # Check if profile_photo column exists
        result = db.execute(text(
            "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='profile_photo'"
        ))
        if not result.fetchone():
            db.execute(text("ALTER TABLE users ADD COLUMN profile_photo VARCHAR"))
            db.commit()
            print("Added profile_photo column to users table")
    except Exception as e:
        print(f"Column migration check failed: {e}")
        db.rollback()

    # Colunas adicionadas ao model Student que podem faltar em bancos antigos.
    # create_all() não altera tabelas existentes, então garantimos aqui.
    student_columns = {
        "school_year": "VARCHAR",
        "school": "VARCHAR",
        "intended_profession": "VARCHAR",
        "class_type": "VARCHAR",
        "observation": "TEXT",
    }
    for column_name, column_type in student_columns.items():
        try:
            result = db.execute(text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name='students' AND column_name=:col"
            ), {"col": column_name})
            if not result.fetchone():
                db.execute(text(f"ALTER TABLE students ADD COLUMN {column_name} {column_type}"))
                db.commit()
                print(f"Added {column_name} column to students table")
        except Exception as e:
            print(f"Student column migration check failed for '{column_name}': {e}")
            db.rollback()

def init_db(db: Session = next(database.get_db())):
    # Ensure new columns exist
    ensure_columns(db)

    admin_email = os.getenv("PGADMIN_DEFAULT_EMAIL")
    admin_password = os.getenv("PGADMIN_DEFAULT_PASSWORD")

    if not admin_email or not admin_password:
        print("PGADMIN_DEFAULT_EMAIL or PGADMIN_DEFAULT_PASSWORD not set in .env")
        return

    user = db.query(User).filter(User.email == admin_email).first()
    if not user:
        print(f"Creating admin user: {admin_email}")
        hashed_password = pwd_context.hash(admin_password)
        db_user = User(
            email=admin_email,
            hashed_password=hashed_password,
            is_admin=True,
            is_active=True,
            full_name="Administrator",
            nickname="Admin"
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        print("Admin user created successfully")
    else:
        print("Admin user already exists")

