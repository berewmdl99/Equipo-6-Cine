from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from typing import List, Dict, Any
import qrcode
import io
import base64

from app import schemas, crud, database
from app.auth import authenticate_user, create_access_token, get_current_user
from app.database import get_db
from app.models import Sala, Asiento, Boleto, Funcion, Usuario

router = APIRouter()


@router.get("/users/")
def read_users(db: Session = Depends(get_db)):
    users = crud.get_users(db)
    return {"usuarios": users}


@router.post("/users/")
def create_new_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db, user)


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Usuario o contraseña incorrectos")

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/configuracion-salas/{sala_id}")
def get_configuracion_sala(sala_id: int, db: Session = Depends(get_db)):
    sala = db.query(Sala).filter(Sala.id == sala_id).first()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    
    asientos = db.query(Asiento).filter(Asiento.sala_id == sala_id).all()
    return {
        "sala": {
            "id": sala.id,
            "nombre": sala.nombre,
            "capacidad": sala.capacidad,
            "tipo": sala.tipo,
            "num_filas": sala.num_filas,
            "asientos_por_fila": sala.asientos_por_fila
        },
        "asientos": [
            {
                "id": asiento.id,
                "fila": asiento.fila,
                "numero": asiento.numero,
                "estado": asiento.estado
            } for asiento in asientos
        ]
    }

@router.put("/configuracion-salas/{sala_id}")
def update_configuracion_sala(sala_id: int, configuracion: dict, db: Session = Depends(get_db)):
    sala = db.query(Sala).filter(Sala.id == sala_id).first()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    
    # Actualizar configuración de asientos
    for asiento_data in configuracion.get("asientos", []):
        asiento = db.query(Asiento).filter(
            Asiento.sala_id == sala_id,
            Asiento.fila == asiento_data["fila"],
            Asiento.numero == asiento_data["numero"]
        ).first()
        
        if asiento:
            asiento.estado = asiento_data["estado"]
    
    db.commit()
    return {"message": "Configuración actualizada exitosamente"}

# ===========================
# Rutas para Gestión de Salas
# ===========================

@router.post("/salas/", response_model=schemas.SalaResponse)
def crear_sala(sala: schemas.SalaCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="No tiene permisos para crear salas")
    
    db_sala = crud.create_sala(db, sala)
    return db_sala

@router.get("/salas/", response_model=List[schemas.SalaResponse])
def listar_salas(db: Session = Depends(get_db)):
    return crud.get_salas(db)

@router.get("/salas/{sala_id}", response_model=schemas.SalaResponse)
def obtener_sala(sala_id: int, db: Session = Depends(get_db)):
    sala = crud.get_sala(db, sala_id)
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    return sala

@router.put("/salas/{sala_id}", response_model=schemas.SalaResponse)
def actualizar_sala(sala_id: int, sala: schemas.SalaUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="No tiene permisos para modificar salas")
    
    db_sala = crud.update_sala(db, sala_id, sala)
    if not db_sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    return db_sala

# ===========================
# Rutas para Gestión de Asientos
# ===========================

@router.post("/salas/{sala_id}/asientos/", response_model=List[schemas.AsientoResponse])
def crear_asientos(sala_id: int, config: schemas.ConfiguracionSalaCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="No tiene permisos para configurar asientos")
    
    sala = crud.get_sala(db, sala_id)
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    
    asientos = crud.create_asientos_batch(db, sala_id, config)
    return asientos

@router.get("/salas/{sala_id}/mapa", response_model=schemas.MapaAsientosResponse)
def obtener_mapa_asientos(sala_id: int, db: Session = Depends(get_db)):
    sala = crud.get_sala(db, sala_id)
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    
    mapa = crud.get_mapa_asientos(db, sala_id)
    return mapa

@router.put("/asientos/{asiento_id}/estado", response_model=schemas.AsientoResponse)
def actualizar_estado_asiento(asiento_id: int, estado: schemas.AsientoUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="No tiene permisos para modificar asientos")
    
    asiento = crud.update_asiento_estado(db, asiento_id, estado)
    if not asiento:
        raise HTTPException(status_code=404, detail="Asiento no encontrado")
    return asiento

# ===========================
# Rutas para Venta de Boletos
# ===========================

@router.post("/boletos/", response_model=schemas.BoletoResponse)
def crear_boleto(boleto: schemas.BoletoCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    # Verificar disponibilidad del asiento
    asiento = crud.get_asiento(db, boleto.asiento_id)
    if not asiento or asiento.estado != schemas.EstadoAsiento.DISPONIBLE.value:
        raise HTTPException(status_code=400, detail="Asiento no disponible")
    
    # Crear boleto con código QR
    boleto.vendedor_id = current_user.id
    boleto.codigo_qr = crud.generate_qr_code(boleto)
    db_boleto = crud.create_boleto(db, boleto)
    
    # Actualizar estado del asiento
    crud.update_asiento_estado(db, boleto.asiento_id, schemas.AsientoUpdate(estado=schemas.EstadoAsiento.OCUPADO))
    
    return db_boleto

@router.get("/boletos/{boleto_id}/imprimir", response_model=schemas.BoletoImpresion)
def imprimir_boleto(boleto_id: int, db: Session = Depends(get_db)):
    boleto = crud.get_boleto(db, boleto_id)
    if not boleto:
        raise HTTPException(status_code=404, detail="Boleto no encontrado")
    
    return crud.get_boleto_impresion(db, boleto_id)

@router.put("/boletos/{boleto_id}/asientos", response_model=schemas.BoletoResponse)
def cambiar_asientos_boleto(boleto_id: int, nuevos_asientos: List[int], db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="No tiene permisos para modificar boletos")
    
    boleto = crud.cambiar_asientos_boleto(db, boleto_id, nuevos_asientos)
    if not boleto:
        raise HTTPException(status_code=404, detail="Boleto no encontrado")
    return boleto

# ===========================
# Rutas para Verificación de Asientos
# ===========================

@router.post("/verificar-asientos")
def verificar_asientos(datos: schemas.AsientoVerificar, db: Session = Depends(get_db)):
    asientos = db.query(Asiento).filter(Asiento.id.in_(datos.asientos_ids)).all()
    
    # Verificar que todos los asientos existen
    if len(asientos) != len(datos.asientos_ids):
        raise HTTPException(
            status_code=400,
            detail="Uno o más asientos no existen"
        )
    
    # Verificar que todos los asientos están disponibles
    asientos_no_disponibles = [
        asiento for asiento in asientos 
        if asiento.estado != schemas.EstadoAsiento.DISPONIBLE.value
    ]
    
    if asientos_no_disponibles:
        return {
            "disponibles": False,
            "asientos_no_disponibles": [
                {
                    "id": asiento.id,
                    "fila": asiento.fila,
                    "numero": asiento.numero,
                    "estado": asiento.estado
                }
                for asiento in asientos_no_disponibles
            ]
        }
    
    return {"disponibles": True}
