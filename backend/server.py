from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core import database
# Models are now imported individually where needed, but for create_all we need Base
# And to ensure all models are registered, we must import them
from backend.models import users, classes, students, enrollments, attendance, payments
from backend.core import database
from backend.core.router_loader import include_routers

database.Base.metadata.create_all(bind=database.engine)

from backend.core.init_db import init_db
init_db()

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In prod, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load routers dynamically
include_routers(app)