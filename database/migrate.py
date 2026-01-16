from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Fallback to constructing it from individual vars if DATABASE_URL not set
    POSTGRES_USER = os.getenv("POSTGRES_USER", "user")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password")
    POSTGRES_SERVER = os.getenv("POSTGRES_SERVER", "db")
    POSTGRES_DB = os.getenv("POSTGRES_DB", "teacherapp")
    DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}/{POSTGRES_DB}"

print(f"Connecting to database...")

engine = create_engine(DATABASE_URL)

def add_column_if_not_exists(table_name, column_name, column_type):
    with engine.connect() as conn:
        # Check if column exists
        query = text(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='{table_name}' AND column_name='{column_name}';
        """)
        result = conn.execute(query).fetchone()
        
        if not result:
            print(f"Adding column {column_name} to {table_name}...")
            alter_query = text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type};")
            conn.execute(alter_query)
            conn.commit()
            print(f"Column {column_name} added successfully.")
        else:
            print(f"Column {column_name} already exists in {table_name}.")

if __name__ == "__main__":
    try:
        add_column_if_not_exists("users", "full_name", "VARCHAR")
        add_column_if_not_exists("users", "birth_date", "DATE")
        add_column_if_not_exists("users", "nickname", "VARCHAR")
        print("Migration completed successfully.")
    except Exception as e:
        print(f"Error during migration: {e}")
