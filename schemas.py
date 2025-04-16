from pydantic import BaseModel, EmailStr, Field
from datetime import date, time, datetime
from typing import Optional, List, Dict, Any
from fastapi import File, Form
from enum import Enum
from decimal import Decimal

# ===========================
# Esquemas para Usuario
# ===========================
class UserBase(BaseModel):
    nombre: str
    username: str
    email: str

    class Config:
        from_attributes = True

class UserCreate(UserBase):
    password: str
    is_admin: Optional[bool] = False

class UserOut(UserBase):
    id: int
    is_admin: bool = Field(default=False)

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    is_admin: Optional[bool] = None

    class Config:
        from_attributes = True

# ===========================
# Esquemas para Pelicula
# ===========================
class PeliculaBase(BaseModel):
    titulo: str
    duracion_min: int = Field(gt=0)
    clasificacion: str
    genero: str
    descripcion: Optional[str] = None
    en_cartelera: bool = True
    imagen_url: Optional[str] = None

    class Config:
        from_attributes = True

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

    class Config:
        from_attributes = True

class PeliculaResponse(PeliculaBase):
    id: int

    class Config:
        from_attributes = True

# ===========================
# Esquemas para Sala
# ===========================
class SalaBase(BaseModel):
    nombre: str
    capacidad: int = Field(gt=0)
    tipo: str = Field(default='2D')
    activa: bool = True
    num_filas: int = Field(gt=0)
    asientos_por_fila: int = Field(gt=0)

    class Config:
        from_attributes = True

class SalaCreate(SalaBase):
    pass

class SalaUpdate(BaseModel):
    nombre: Optional[str] = None
    capacidad: Optional[int] = None
    tipo: Optional[str] = None
    activa: Optional[bool] = None
    num_filas: Optional[int] = None
    asientos_por_fila: Optional[int] = None

    class Config:
        from_attributes = True

class SalaResponse(SalaBase):
    id: int
    creada_en: datetime
    actualizada_en: Optional[datetime] = None

class SalaSimple(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True

# ===========================
# Esquemas para Asiento
# ===========================
class EstadoAsiento(str, Enum):
    DISPONIBLE = "disponible"
    SELECCIONADO = "seleccionado"
    OCUPADO = "ocupado"
    DESHABILITADO = "deshabilitado"

class AsientoBase(BaseModel):
    fila: str
    numero: int
    estado: EstadoAsiento = EstadoAsiento.DISPONIBLE

    class Config:
        from_attributes = True

class AsientoCreate(AsientoBase):
    sala_id: int

class AsientoUpdate(BaseModel):
    estado: Optional[EstadoAsiento] = None

    class Config:
        from_attributes = True

class AsientoResponse(AsientoBase):
    id: int
    sala_id: int
    sala: Optional[SalaSimple] = None

    class Config:
        from_attributes = True

class AsientoBatchCreate(BaseModel):
    fila: str
    numeros: List[int]
    estado: EstadoAsiento = EstadoAsiento.DISPONIBLE

    class Config:
        from_attributes = True

class AsientoVerificar(BaseModel):
    asientos_ids: List[int]

    class Config:
        from_attributes = True

# Constantes compartidas
LEYENDA_ASIENTOS = {
    "disponible": "Azul - Asiento disponible",
    "seleccionado": "Verde - Asiento seleccionado",
    "ocupado": "Rojo - Asiento ocupado",
    "deshabilitado": "Gris - Asiento deshabilitado"
}

class MapaAsientosResponse(BaseModel):
    sala_id: int
    nombre_sala: str
    filas: Dict[str, List[Dict[str, Any]]]
    leyenda: Dict[str, str] = LEYENDA_ASIENTOS

    class Config:
        from_attributes = True

class FilaCreate(BaseModel):
    letra: str = Field(..., min_length=1, max_length=1, regex='^[A-Z]$', description="La letra debe ser una única letra mayúscula")
    asientos_por_fila: int = Field(..., gt=0, le=20, description="El número de asientos por fila debe estar entre 1 y 20")

    class Config:
        from_attributes = True

# ===========================
# Esquemas para Funcion
# ===========================
class FuncionBase(BaseModel):
    pelicula_id: int
    sala_id: int
    fecha: date
    hora: time
    precio_base: float = Field(gt=0, description="El precio base debe ser mayor que 0")

    class Config:
        from_attributes = True

class FuncionCreate(FuncionBase):
    pass

class FuncionUpdate(BaseModel):
    pelicula_id: Optional[int] = None
    sala_id: Optional[int] = None
    fecha: Optional[date] = None
    hora: Optional[time] = None
    precio_base: Optional[float] = None

    class Config:
        from_attributes = True

class FuncionResponse(FuncionBase):
    id: int
    pelicula: PeliculaResponse
    sala: SalaSimple

    class Config:
        from_attributes = True

class FuncionDisponibilidad(BaseModel):
    sala_id: int
    fecha: date
    hora: time

    class Config:
        from_attributes = True
        json_encoders = {
            date: lambda v: v.isoformat(),
            time: lambda v: v.strftime("%H:%M")
        }

# ===========================
# Esquemas para Boleto
# ===========================
class EstadoBoleto(str, Enum):
    COMPRADO = "comprado"
    CANCELADO = "cancelado"
    USADO = "usado"

class BoletoBase(BaseModel):
    funcion_id: int
    asiento_id: int
    usuario_id: int
    vendedor_id: int
    precio: Decimal
    estado: EstadoBoleto = EstadoBoleto.COMPRADO
    codigo_qr: Optional[str] = None

    class Config:
        from_attributes = True

class BoletoCreate(BoletoBase):
    pass

class BoletoUpdate(BaseModel):
    estado: Optional[EstadoBoleto] = None
    codigo_qr: Optional[str] = None

    class Config:
        from_attributes = True

class BoletoResponse(BoletoBase):
    id: int
    creado_en: datetime
    actualizado_en: Optional[datetime] = None
    funcion: "FuncionResponse"
    asiento: "AsientoResponse"
    usuario: "UserOut"
    vendedor: "UserOut"

class BoletoImpresion(BaseModel):
    id: int
    codigo_qr: str
    pelicula: str
    sala: str
    fecha: date
    hora: time
    asiento: str
    precio: Decimal
    usuario: str
    vendedor: str
    fecha_impresion: datetime = Field(default_factory=datetime.now)

    class Config:
        from_attributes = True

# ===========================
# Esquemas para Configuración de Salas
# ===========================
class EstadoVenta(str, Enum):
    PENDIENTE = "pendiente"
    COMPLETADA = "completada"
    CANCELADA = "cancelada"
    REEMBOLSADA = "reembolsada"

class EstadoConfiguracion(str, Enum):
    ACTIVA = "activa"
    INACTIVA = "inactiva"
    EN_MANTENIMIENTO = "en_mantenimiento"

class ConfiguracionSalaBase(BaseModel):
    filas: int
    asientos_por_fila: int

    class Config:
        from_attributes = True

class ConfiguracionSalaCreate(ConfiguracionSalaBase):
    pass

class ConfiguracionSalaResponse(BaseModel):
    sala_id: int
    nombre_sala: str
    filas: Dict[str, List[Dict[str, Any]]]
    leyenda: Dict[str, str] = LEYENDA_ASIENTOS

    class Config:
        from_attributes = True

class AsientoEstado(BaseModel):
    estado_configuracion: Optional[str] = None
    estado_venta: Optional[str] = None

    class Config:
        from_attributes = True
        schema_extra = {
            "example": {
                "estado_configuracion": "activa",
                "estado_venta": "pendiente"
            }
        }

class PagoCreate(BaseModel):
    boleto_id: int
    monto_pagado: Decimal
    usuario_id: int

    class Config:
        from_attributes = True

class PagoResponse(BaseModel):
    id: int
    boleto_id: int
    monto_pagado: Decimal
    cambio: Decimal
    fecha_pago: datetime
    usuario_id: int

    class Config:
        from_attributes = True
