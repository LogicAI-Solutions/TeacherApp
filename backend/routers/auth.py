from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from backend.schemas import auth as auth_schemas
from backend.crud import users as users_crud
from backend.core import database, security

router = APIRouter()

@router.post("/token", response_model=auth_schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    print(f"LOGIN ATTEMPT: username='{form_data.username}', password='{form_data.password}'")
    user = users_crud.get_user_by_email(db, email=form_data.username)
    print(f"USER FOUND: {user}")
    if user:
         print(f"HASH MATCH: {security.verify_password(form_data.password, user.hashed_password)}")
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        print("LOGIN FAILED: Invalid credentials")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        print("LOGIN FAILED: User inactive")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sua conta está inativa. Por favor, entre em contato com o suporte.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = security.timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
