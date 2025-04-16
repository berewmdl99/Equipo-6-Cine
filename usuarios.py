from fastapi import APIRouter, Depends, HTTPException, status, Body, Request, Form
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from app.database import get_db
from app.models import Usuario
from app.schemas import UserCreate, UserOut, UserBase, UserUpdate
from app.utils import hash_password
from app.auth import authenticate_user, create_access_token, get_current_user, verify_password
import sys
from pydantic import BaseModel
import json
from typing import Optional

class LoginData(BaseModel):
    username: str
    password: str
    grant_type: str = 'password'
    scope: str = ''
    client_id: str = ''
    client_secret: str = ''

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.get("/", response_model=list[UserOut])
def listar_usuarios(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Solo administradores pueden ver la lista de usuarios.")
            
        # Obtener todos los usuarios
        usuarios = db.query(Usuario).all()
        
        # Convertir los objetos SQLAlchemy a diccionarios
        usuarios_dict = []
        for usuario in usuarios:
            usuario_dict = {
                "id": usuario.id,
                "nombre": usuario.nombre,
                "username": usuario.username,
                "email": usuario.email,
                "is_admin": usuario.is_admin
            }
            usuarios_dict.append(usuario_dict)
            
        return usuarios_dict
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error al listar usuarios: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al listar los usuarios: {str(e)}"
        )

@router.post("/crear", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def crear_usuario(usuario: UserCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        if not current_user.is_admin:
            usuario.is_admin = False  # Los usuarios normales no pueden crearse como admin

        usuario_existente = db.query(Usuario).filter(Usuario.email == usuario.email).first()
        if usuario_existente:
            raise HTTPException(status_code=400, detail="El usuario ya existe")
        
        # Asegurarse de que el username no sea nulo
        if not usuario.username:
            # Generar un username basado en el email si no se proporciona
            usuario.username = usuario.email.split('@')[0]

        nuevo_usuario = Usuario(
            nombre=usuario.nombre,
            username=usuario.username,
            email=usuario.email,
            hashed_password=hash_password(usuario.password),
            is_admin=usuario.is_admin
        )
        db.add(nuevo_usuario)
        db.commit()
        db.refresh(nuevo_usuario)
        
        # Convertir a diccionario
        usuario_dict = {
            "id": nuevo_usuario.id,
            "nombre": nuevo_usuario.nombre,
            "username": nuevo_usuario.username,
            "email": nuevo_usuario.email,
            "is_admin": nuevo_usuario.is_admin
        }
        
        return usuario_dict
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error al crear usuario: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al crear el usuario: {str(e)}"
        )

@router.put("/editar/{usuario_id}", response_model=UserOut)
def editar_usuario(
    usuario_id: int, 
    usuario_actualizado: UserUpdate, 
    current_user=Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    try:
        usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Solo admins pueden modificar otros usuarios
        if not current_user.is_admin and current_user.id != usuario.id:
            raise HTTPException(status_code=403, detail="No tienes permiso para modificar este usuario")

        # Verificar si se está intentando cambiar el rol de admin
        if usuario_actualizado.is_admin is not None and not current_user.is_admin:
            raise HTTPException(status_code=403, detail="No tienes permiso para cambiar el rol de administrador")

        # Actualizar campos
        update_data = usuario_actualizado.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(usuario, field, value)

        db.commit()
        db.refresh(usuario)
        
        # Convertir a diccionario
        usuario_dict = {
            "id": usuario.id,
            "nombre": usuario.nombre,
            "username": usuario.username,
            "email": usuario.email,
            "is_admin": usuario.is_admin
        }
        
        return usuario_dict
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error al editar usuario: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al editar el usuario: {str(e)}"
        )

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
async def login(
    request: Request,
    username: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    grant_type: Optional[str] = Form('password'),
    scope: Optional[str] = Form(''),
    client_id: Optional[str] = Form(''),
    client_secret: Optional[str] = Form(''),
    db: Session = Depends(get_db)
):
    try:
        content_type = request.headers.get('content-type', '')
        print(f"🔹 Content-Type: {content_type}")

        # Determinar el formato de los datos
        if 'application/json' in content_type:
            # Para JSON, leer el cuerpo de la petición
            body = await request.body()
            print(f"🔹 Cuerpo de la petición recibido: {body.decode()}")
            try:
                login_data = json.loads(body)
                print(f"🔹 JSON parseado: {login_data}")
            except json.JSONDecodeError as e:
                print(f"❌ Error al parsear JSON: {e}")
                raise HTTPException(
                    status_code=422,
                    detail="El cuerpo de la petición debe ser un JSON válido"
                )
        else:
            # Para form-data, usar los parámetros Form
            login_data = {
                'username': username,
                'password': password,
                'grant_type': grant_type,
                'scope': scope,
                'client_id': client_id,
                'client_secret': client_secret
            }
            print(f"🔹 Datos del formulario: {login_data}")

        # Validar campos requeridos
        if not login_data.get('username') or not login_data.get('password'):
            print("❌ Usuario o contraseña faltantes en la petición")
            raise HTTPException(
                status_code=400,
                detail="Usuario y contraseña son requeridos"
            )

        # Crear objeto LoginData
        try:
            login_data_obj = LoginData(**login_data)
            print(f"🔹 Objeto LoginData creado: {login_data_obj}")
        except Exception as e:
            print(f"❌ Error al crear LoginData: {e}")
            raise HTTPException(
                status_code=422,
                detail=f"Error en el formato de los datos: {str(e)}"
            )

        # Intentar autenticar
        user = authenticate_user(db, login_data_obj.username, login_data_obj.password)
        if not user:
            print(f"❌ Autenticación fallida para usuario: {login_data_obj.username}")
            raise HTTPException(
                status_code=400,
                detail="Usuario o contraseña incorrectos"
            )

        print(f"✅ Login exitoso para usuario: {login_data_obj.username}")
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer"
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error interno del servidor: {str(e)}"
        )

@router.get("/me", response_model=UserOut)
def get_current_user_data(current_user=Depends(get_current_user)):
    try:
        # Convertir el objeto Usuario a un diccionario
        user_dict = {
            "id": current_user.id,
            "nombre": current_user.nombre,
            "username": current_user.username,
            "email": current_user.email,
            "is_admin": current_user.is_admin
        }
        return user_dict
    except Exception as e:
        print(f"Error en get_current_user_data: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener los datos del usuario: {str(e)}"
        )

@router.post("/cambiar-password")
def cambiar_password(
    password_change: PasswordChange,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verificar la contraseña actual
    if not verify_password(password_change.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="La contraseña actual es incorrecta"
        )
    
    # Actualizar la contraseña
    current_user.hashed_password = hash_password(password_change.new_password)
    db.commit()
    
    return {"detail": "Contraseña actualizada exitosamente"}
