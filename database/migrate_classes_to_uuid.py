"""
Migração única: converte classes.id (e as FKs que apontam para ele) de
INTEGER para UUID, gerando um UUID novo para cada turma existente.

Roda em uma única transação: se qualquer passo falhar, nada é alterado.
Idempotente: se classes.id já for UUID, o script não faz nada.
"""
from sqlalchemy import create_engine, text
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_SERVER = os.getenv("POSTGRES_SERVER", "db")
    POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB = os.getenv("POSTGRES_DB", "student_management")
    DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"

engine = create_engine(DATABASE_URL)

# tabelas que têm uma FK apontando para classes.id
DEPENDENT_TABLES = ["enrollments", "attendance_sessions"]


def get_column_type(conn, table_name, column_name):
    result = conn.execute(text("""
        SELECT data_type FROM information_schema.columns
        WHERE table_name = :t AND column_name = :c
    """), {"t": table_name, "c": column_name}).fetchone()
    return result[0] if result else None


def get_fk_constraint_name(conn, table_name, column_name):
    result = conn.execute(text("""
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name = :t
          AND kcu.column_name = :c
          AND tc.constraint_type = 'FOREIGN KEY';
    """), {"t": table_name, "c": column_name}).fetchone()
    return result[0] if result else None


def get_pk_constraint_name(conn, table_name):
    result = conn.execute(text("""
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_name = :t AND constraint_type = 'PRIMARY KEY';
    """), {"t": table_name}).fetchone()
    return result[0] if result else None


def run_migration():
    with engine.begin() as conn:
        current_type = get_column_type(conn, "classes", "id")
        if current_type == "uuid":
            print("✅ classes.id já é UUID. Nada a fazer.")
            return

        print(f"Tipo atual de classes.id: {current_type}")
        print("🚀 Iniciando migração classes.id -> UUID (transação única)...")

        conn.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto;"))

        # 1. Nova coluna UUID em classes, um valor novo por linha
        conn.execute(text("ALTER TABLE classes ADD COLUMN new_id UUID DEFAULT gen_random_uuid() NOT NULL;"))

        # 2. Nova coluna UUID nas tabelas dependentes + backfill via join com classes
        for table in DEPENDENT_TABLES:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN new_class_id UUID;"))
            conn.execute(text(f"""
                UPDATE {table} t SET new_class_id = c.new_id
                FROM classes c WHERE t.class_id = c.id;
            """))

        # 3. Remove constraints antigas (FK nas dependentes, PK em classes)
        for table in DEPENDENT_TABLES:
            fk_name = get_fk_constraint_name(conn, table, "class_id")
            if fk_name:
                conn.execute(text(f"ALTER TABLE {table} DROP CONSTRAINT {fk_name};"))

        pk_name = get_pk_constraint_name(conn, "classes")
        if pk_name:
            conn.execute(text(f"ALTER TABLE classes DROP CONSTRAINT {pk_name};"))

        # 4. Troca as colunas antigas pelas novas
        conn.execute(text("ALTER TABLE classes DROP COLUMN id;"))
        conn.execute(text("ALTER TABLE classes RENAME COLUMN new_id TO id;"))
        conn.execute(text("ALTER TABLE classes ADD PRIMARY KEY (id);"))

        for table in DEPENDENT_TABLES:
            conn.execute(text(f"ALTER TABLE {table} DROP COLUMN class_id;"))
            conn.execute(text(f"ALTER TABLE {table} RENAME COLUMN new_class_id TO class_id;"))
            conn.execute(text(f"""
                ALTER TABLE {table} ADD CONSTRAINT {table}_class_id_fkey
                FOREIGN KEY (class_id) REFERENCES classes(id);
            """))

        print("✅ Migração concluída: classes.id e FKs relacionadas agora são UUID.")


if __name__ == "__main__":
    try:
        run_migration()
    except Exception as e:
        print(f"❌ Erro durante a migração: {e}")
        sys.exit(1)
