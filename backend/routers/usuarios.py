from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from app.database import get_db
from app.models import Usuario
from app.schemas import UserCreate, UserOut, UserBase, UserUpdate
from app.utils import hash_password
from app.auth import authenticate_user, create_access_token, get_current_user
import sys

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.get("/", response_model=list[UserOut])
def listar_usuarios(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Solo administradores pueden ver la lista de usuarios.")
    return db.query(Usuario).all()


@router.post("/crear", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def crear_usuario(usuario: UserCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        usuario.is_admin = False  # Los usuarios normales no pueden crearse como admin

    usuario_existente = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if usuario_existente:
        raise HTTPException(status_code=400, detail="El usuario ya existe")

    nuevo_usuario = Usuario(
        nombre=usuario.nombre,
        email=usuario.email,
        hashed_password=hash_password(usuario.password),
        is_admin=usuario.is_admin
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario


@router.put("/editar/{usuario_id}", response_model=UserOut)
def editar_usuario(usuario_id: int, usuario_actualizado: UserUpdate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Solo admins pueden modificar otros usuarios
    if not current_user.is_admin and current_user.id != usuario.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar este usuario")

    for field, value in usuario_actualizado.dict(exclude_unset=True).items():
        setattr(usuario, field, value)

    db.commit()
    db.refresh(usuario)
    return usuario


@router.delete("/{usuario_id}")
def eliminar_usuario(usuario_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar usuarios.")

    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    db.delete(usuario)
    db.commit()
    return {"mensaje": "Usuario eliminado exitosamente"}


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Usuario o contraseña incorrectos")

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(data={"sub": str(user.id)}, expires_delta=access_token_expires)

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def get_current_user_data(current_user=Depends(get_current_user)):
    return current_user
