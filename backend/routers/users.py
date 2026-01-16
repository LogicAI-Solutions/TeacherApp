from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.schemas import users as user_schemas
from backend.crud import users as user_crud
from backend.core import database, security
import pydantic

router = APIRouter()

@router.post("/users/", response_model=user_schemas.User)
def create_user(user: user_schemas.UserCreate, db: Session = Depends(database.get_db), current_user: user_schemas.User = Depends(security.get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Apenas administradores podem criar usuários.")
    
    db_user = user_crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return user_crud.create_user(db=db, user=user)

@router.get("/users/", response_model=List[user_schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: user_schemas.User = Depends(security.get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores.")
    return user_crud.get_users(db, skip=skip, limit=limit)

@router.get("/users/me", response_model=user_schemas.User)
async def read_users_me(current_user: user_schemas.User = Depends(security.get_current_user)):
    return current_user

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(database.get_db), current_user: user_schemas.User = Depends(security.get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores.")
    
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Você não pode excluir a si mesmo.")
    
    deleted_user = user_crud.delete_user(db, user_id=user_id)
    if not deleted_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return {"detail": "Usuário removido com sucesso"}

class PasswordUpdate(pydantic.BaseModel):
    password: str

@router.put("/users/me/password")
def update_own_password(password_data: PasswordUpdate, db: Session = Depends(database.get_db), current_user: user_schemas.User = Depends(security.get_current_user)):
    user = user_crud.update_user_password(db, user_id=current_user.id, password=password_data.password)
    return {"detail": "Sua senha foi atualizada com sucesso"}

@router.put("/users/{user_id}/password")
def update_password(user_id: int, password_data: PasswordUpdate, db: Session = Depends(database.get_db), current_user: user_schemas.User = Depends(security.get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores.")
    
    user = user_crud.update_user_password(db, user_id=user_id, password=password_data.password)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return {"detail": "Senha atualizada com sucesso"}

@router.put("/users/{user_id}", response_model=user_schemas.User)
def update_user(user_id: int, user: user_schemas.UserUpdate, db: Session = Depends(database.get_db), current_user: user_schemas.User = Depends(security.get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores.")
    
    updated_user = user_crud.update_user(db, user_id=user_id, user_update=user)
    if not updated_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return updated_user
