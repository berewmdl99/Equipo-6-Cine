from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from . import schemas, crud, database

router = APIRouter()

@router.get("/users/")
def read_users(db: Session = Depends(database.SessionLocal)):
    return crud.get_users(db)

@router.post("/users/")
def create_new_user(user: schemas.UserCreate, db: Session = Depends(database.SessionLocal)):
    return crud.create_user(db, user)
