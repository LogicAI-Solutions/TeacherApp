import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.core import database
from backend.models import users, classes, students, enrollments, attendance, payments
from backend.core.router_loader import include_routers

database.Base.metadata.create_all(bind=database.engine)

from backend.core.init_db import init_db
init_db()

app = FastAPI(
    title="TeacherApp API",
    description="API para gerenciamento de alunos e turmas",
    version="1.0.1"
)

cors_origins_env = os.getenv("CORS_ORIGINS", "")
if cors_origins_env:
    # Produção: usa origens específicas do .env
    origins = [origin.strip() for origin in cors_origins_env.split(",")]
else:
    # Desenvolvimento: permite todas as origens
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Health"])
def health_check():
    """Endpoint para verificação de saúde da API"""
    return {"status": "healthy", "service": "TeacherApp API"}

include_routers(app)

# Serve uploaded files (profile photos, etc.)
uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")