from pydantic import BaseModel, EmailStr, Field
from datetime import date, time, datetime
from typing import Optional
from fastapi import File, Form

# ===========================
# Esquemas para Usuario
# ===========================
class UserBase(BaseModel):
    nombre: str
    username: str

class UserCreate(UserBase):
    password: str
    is_admin: Optional[bool] = False

class UserOut(UserBase):
    id: int
    is_admin: bool = Field(default=False)

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    username: Optional[str] = None
    is_admin: Optional[bool] = None
# ===========================
# Esquemas para Pelicula
# ===========================
class PeliculaBase(BaseModel):
    titulo: str
    duracion_min: int
    clasificacion: str
    genero: str
    descripcion: Optional[str] = None
    en_cartelera: bool = True
    
    # Aquí es donde cambiamos el campo de imagen a File
    imagen: Optional[bytes] = File(None)  # Esto indica que la imagen es opcional

    class Config:
        orm_mode = True

class PeliculaCreate(PeliculaBase):
    pass

class PeliculaUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    duracion_min: Optional[int] = None
    clasificacion: Optional[str] = None
    genero: Optional[str] = None
    imagen_url: Optional[str] = None
    en_cartelera: Optional[bool] = None

class PeliculaResponse(PeliculaBase):
    id: int

    class Config:
        from_attributes = True

# ===========================
# Esquemas para Sala
# ===========================
class SalaBase(BaseModel):
    nombre: str
    capacidad: int

class SalaCreate(SalaBase):
    pass

class SalaUpdate(BaseModel):
    nombre: Optional[str] = None
    capacidad: Optional[int] = None

class SalaResponse(SalaBase):
    id: int

    class Config:
        from_attributes = True

# ===========================
# Esquemas para Asiento
# ===========================
class AsientoBase(BaseModel):
    fila: str
    numero: int
    sala_id: int

class AsientoCreate(AsientoBase):
    pass

class AsientoResponse(AsientoBase):
    id: int

    class Config:
        orm_mode = True

# ===========================
# Esquemas para Funcion
# ===========================
class FuncionBase(BaseModel):
    pelicula_id: int
    sala_id: int
    fecha: date
    hora: time

class FuncionCreate(FuncionBase):
    pass

class FuncionUpdate(BaseModel):
    pelicula_id: Optional[int] = None
    sala_id: Optional[int] = None
    fecha: Optional[date] = None
    hora: Optional[time] = None

class FuncionResponse(FuncionBase):
    id: int

    class Config:
        from_attributes = True

# ===========================
# Esquemas para Boleto
# ===========================
class BoletoBase(BaseModel):
    funcion_id: int
    asiento_id: int
    usuario_id: int
    precio: float
    estado: Optional[str] = "comprado"

class BoletoCreate(BoletoBase):
    pass

class BoletoUpdate(BaseModel):
    estado: Optional[str] = None

class BoletoResponse(BoletoBase):
    id: int
    creado_en: datetime

    class Config:
        from_attributes = True
