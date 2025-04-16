from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Dict, Any
import qrcode
import io
import base64
import json
from datetime import datetime
from app import schemas, crud, database
from app.models import Usuario, Sala, Asiento, Boleto, Funcion

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

# ===========================
# Funciones para Salas
# ===========================

def create_sala(db: Session, sala: schemas.SalaCreate) -> Sala:
    db_sala = Sala(**sala.dict())
    db.add(db_sala)
    db.commit()
    db.refresh(db_sala)
    return db_sala

def get_sala(db: Session, sala_id: int) -> Sala:
    return db.query(Sala).filter(Sala.id == sala_id).first()

def get_salas(db: Session) -> List[Sala]:
    return db.query(Sala).all()

def update_sala(db: Session, sala_id: int, sala: schemas.SalaUpdate) -> Sala:
    db_sala = get_sala(db, sala_id)
    if not db_sala:
        return None
    
    update_data = sala.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_sala, key, value)
    
    db.commit()
    db.refresh(db_sala)
    return db_sala

# ===========================
# Funciones para Asientos
# ===========================

def create_asientos_batch(db: Session, sala_id: int, config: schemas.ConfiguracionSalaCreate) -> List[Asiento]:
    asientos = []
    letras = [chr(i) for i in range(65, 65 + config.filas)]  # A, B, C, ...
    
    for fila in letras:
        for numero in range(1, config.asientos_por_fila + 1):
            asiento = Asiento(
                sala_id=sala_id,
                fila=fila,
                numero=numero,
                estado=schemas.EstadoAsiento.DISPONIBLE.value
            )
            db.add(asiento)
            asientos.append(asiento)
    
    db.commit()
    for asiento in asientos:
        db.refresh(asiento)
    return asientos

def get_asiento(db: Session, asiento_id: int) -> Asiento:
    return db.query(Asiento).filter(Asiento.id == asiento_id).first()

def update_asiento_estado(db: Session, asiento_id: int, estado: schemas.AsientoUpdate) -> Asiento:
    db_asiento = get_asiento(db, asiento_id)
    if not db_asiento:
        return None
    
    if estado.estado:
        db_asiento.estado = estado.estado.value
    
    db.commit()
    db.refresh(db_asiento)
    return db_asiento

def get_mapa_asientos(db: Session, sala_id: int) -> Dict[str, Any]:
    sala = get_sala(db, sala_id)
    if not sala:
        return None
    
    asientos = db.query(Asiento).filter(Asiento.sala_id == sala_id).all()
    
    # Organizar asientos por fila
    filas = {}
    for asiento in asientos:
        if asiento.fila not in filas:
            filas[asiento.fila] = []
        filas[asiento.fila].append({
            "id": asiento.id,
            "numero": asiento.numero,
            "estado": asiento.estado
        })
    
    return {
        "sala_id": sala_id,
        "nombre_sala": sala.nombre,
        "filas": filas,
        "leyenda": {
            "disponible": "Azul - Asiento disponible",
            "seleccionado": "Verde - Asiento seleccionado",
            "ocupado": "Rojo - Asiento ocupado",
            "deshabilitado": "Gris - Asiento deshabilitado"
        }
    }

def verificar_disponibilidad_asientos(db: Session, asientos_ids: List[int]) -> Dict[str, Any]:
    asientos = db.query(Asiento).filter(Asiento.id.in_(asientos_ids)).all()
    
    disponibles = []
    no_disponibles = []
    
    for asiento in asientos:
        if asiento.estado == schemas.EstadoAsiento.DISPONIBLE.value:
            disponibles.append({
                "id": asiento.id,
                "fila": asiento.fila,
                "numero": asiento.numero
            })
        else:
            no_disponibles.append({
                "id": asiento.id,
                "fila": asiento.fila,
                "numero": asiento.numero,
                "estado": asiento.estado
            })
    
    return {
        "disponibles": disponibles,
        "no_disponibles": no_disponibles,
        "total_disponibles": len(disponibles),
        "total_no_disponibles": len(no_disponibles)
    }

# ===========================
# Funciones para Boletos
# ===========================

def generate_qr_code(boleto: schemas.BoletoCreate) -> str:
    # Crear datos para el QR
    qr_data = {
        "boleto_id": str(boleto.id),
        "funcion_id": str(boleto.funcion_id),
        "asiento_id": str(boleto.asiento_id),
        "usuario_id": str(boleto.usuario_id),
        "fecha_creacion": datetime.now().isoformat()
    }
    
    # Generar QR
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(json.dumps(qr_data))
    qr.make(fit=True)
    
    # Convertir a imagen
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convertir a base64
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()

def create_boleto(db: Session, boleto: schemas.BoletoCreate) -> Boleto:
    db_boleto = Boleto(**boleto.dict())
    db.add(db_boleto)
    db.commit()
    db.refresh(db_boleto)
    return db_boleto

def get_boleto(db: Session, boleto_id: int) -> Boleto:
    return db.query(Boleto).filter(Boleto.id == boleto_id).first()

def get_boleto_impresion(db: Session, boleto_id: int) -> Dict[str, Any]:
    boleto = get_boleto(db, boleto_id)
    if not boleto:
        return None
    
    funcion = db.query(Funcion).filter(Funcion.id == boleto.funcion_id).first()
    asiento = get_asiento(db, boleto.asiento_id)
    usuario = db.query(Usuario).filter(Usuario.id == boleto.usuario_id).first()
    vendedor = db.query(Usuario).filter(Usuario.id == boleto.vendedor_id).first()
    
    return {
        "id": boleto.id,
        "codigo_qr": boleto.codigo_qr,
        "pelicula": funcion.pelicula.titulo,
        "sala": funcion.sala.nombre,
        "fecha": funcion.fecha,
        "hora": funcion.hora,
        "asiento": f"{asiento.fila}{asiento.numero}",
        "precio": boleto.precio,
        "usuario": usuario.nombre,
        "vendedor": vendedor.nombre,
        "fecha_impresion": datetime.now()
    }

def cambiar_asientos_boleto(db: Session, boleto_id: int, nuevos_asientos: List[int]) -> Boleto:
    boleto = get_boleto(db, boleto_id)
    if not boleto:
        return None
    
    # Verificar que los nuevos asientos estén disponibles
    for asiento_id in nuevos_asientos:
        asiento = get_asiento(db, asiento_id)
        if not asiento or asiento.estado != schemas.EstadoAsiento.DISPONIBLE.value:
            return None
    
    # Liberar el asiento anterior
    asiento_anterior = get_asiento(db, boleto.asiento_id)
    if asiento_anterior:
        asiento_anterior.estado = schemas.EstadoAsiento.DISPONIBLE.value
    
    # Ocupar los nuevos asientos
    for asiento_id in nuevos_asientos:
        asiento = get_asiento(db, asiento_id)
        asiento.estado = schemas.EstadoAsiento.OCUPADO.value
    
    # Actualizar el boleto
    boleto.asiento_id = nuevos_asientos[0]  # Por ahora solo manejamos un asiento por boleto
    db.commit()
    db.refresh(boleto)
    return boleto
