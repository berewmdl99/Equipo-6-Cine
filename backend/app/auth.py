from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.database import get_db
from app.models import Usuario
from sqlalchemy.orm import Session

# Clave secreta para JWT
SECRET_KEY = "tu_clave_secreta_super_segura"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Manejo de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 para autenticación
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="usuarios/login")

# Función para verificar contraseña
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Función para hashear contraseña
def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=15))
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def authenticate_user(db: Session, username: str, password: str):
    user = db.query(Usuario).filter(Usuario.nombre == username).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    print("🔹 Validando token con:", SECRET_KEY, ALGORITHM)  # 👈 Agregado
    print("🔹 Token recibido:", token)  # 👈 Agregado
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print("🔹 Payload decodificado:", payload)  # 👈 Agregado
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")

        # 🔹 Aquí agregamos la validación 🔹
        try:
            user_id = int(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de usuario inválido")

        user = db.query(Usuario).filter(Usuario.id == user_id).first()
        
        if user is None:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="No se pudo validar el token")