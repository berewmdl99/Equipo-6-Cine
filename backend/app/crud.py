from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas, crud, database
from app.models import Usuario

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/users/")
def create_new_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    print("📌 Creando usuario:", user.dict())  # Para debug
    try:
        new_user = crud.create_user(db, user)
        print("✅ Usuario creado:", new_user)
        return new_user
    except Exception as e:
        print("❌ Error al crear usuario:", str(e))
        raise HTTPException(status_code=500, detail="Error interno del servidor")
