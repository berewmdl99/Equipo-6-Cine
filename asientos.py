from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Asiento, Sala, Funcion, Boleto
from app.schemas import AsientoCreate, AsientoResponse, AsientoEstado, AsientoVerificar
from app.auth import get_current_user
from typing import List
from datetime import datetime
from pydantic import BaseModel
from enum import Enum

class EstadoAsiento(str, Enum):
    DISPONIBLE = 'disponible'
    OCUPADO = 'ocupado'
    SELECCIONADO = 'seleccionado'
    DESHABILITADO = 'deshabilitado'

class AsientosVerificarRequest(BaseModel):
    asientos_ids: List[int]

class ReservaRequest(BaseModel):
    funcion_id: int
    asientos_ids: List[int]

router = APIRouter(prefix="/asientos", tags=["Asientos"])

# Obtener todos los asientos de una sala
@router.get("/sala/{sala_id}", response_model=List[AsientoResponse])
async def listar_asientos_por_sala(sala_id: int, db: Session = Depends(get_db)):
    try:
        # Cargar los asientos con sus relaciones usando joinedload
        asientos = db.query(Asiento).options(
            joinedload(Asiento.sala)
        ).filter(Asiento.sala_id == sala_id).all()
        
        if not asientos:
            raise HTTPException(status_code=404, detail="No se encontraron asientos para esta sala")
            
        # Convertir los objetos SQLAlchemy a diccionarios
        asientos_dict = []
        for asiento in asientos:
            if not asiento.sala:
                print(f"Asiento {asiento.id} ignorado: falta sala")
                continue
                
            asiento_dict = {
                "id": asiento.id,
                "sala_id": asiento.sala_id,
                "fila": asiento.fila,
                "numero": asiento.numero,
                "estado": asiento.estado,
                "sala": {
                    "id": asiento.sala.id,
                    "nombre": asiento.sala.nombre
                }
            }
            asientos_dict.append(asiento_dict)
            
        return asientos_dict
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error al listar asientos: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al listar los asientos: {str(e)}"
        )

# Obtener asientos por función
@router.get("/funcion/{funcion_id}", response_model=List[AsientoResponse])
async def obtener_asientos_por_funcion(funcion_id: int, db: Session = Depends(get_db)):
    # Verificar que la función existe
    funcion = db.query(Funcion).filter(Funcion.id == funcion_id).first()
    if not funcion:
        raise HTTPException(status_code=404, detail="Función no encontrada")
    
    # Obtener los asientos de la sala para esta función
    asientos = db.query(Asiento).filter(Asiento.sala_id == funcion.sala_id).all()
    return asientos

# Obtener un asiento por su ID
@router.get("/{asiento_id}", response_model=AsientoResponse)
async def obtener_asiento(asiento_id: int, db: Session = Depends(get_db)):
    asiento = db.query(Asiento).filter(Asiento.id == asiento_id).first()
    if not asiento:
        raise HTTPException(status_code=404, detail="Asiento no encontrado")
    return asiento

# Verificar disponibilidad de asientos
@router.post("/verificar-disponibilidad")
async def verificar_disponibilidad(request: AsientosVerificarRequest, db: Session = Depends(get_db)):
    try:
        asientos = db.query(Asiento).filter(Asiento.id.in_(request.asientos_ids)).all()
        
        if not asientos:
            raise HTTPException(status_code=404, detail="No se encontraron los asientos especificados")
        
        asientos_no_disponibles = []
        for asiento in asientos:
            # Solo consideramos no disponibles los asientos ocupados o deshabilitados
            if asiento.estado in [EstadoAsiento.OCUPADO.value, EstadoAsiento.DESHABILITADO.value]:
                asientos_no_disponibles.append({
                    "id": asiento.id,
                    "fila": asiento.fila,
                    "numero": asiento.numero,
                    "estado": asiento.estado
                })
        
        return {
            "disponible": len(asientos_no_disponibles) == 0,
            "asientos_no_disponibles": asientos_no_disponibles
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Reservar asientos
@router.post("/reservar", response_model=List[AsientoResponse])
async def reservar_asientos(
    request: ReservaRequest,
    db: Session = Depends(get_db)
):
    try:
        print(f"Intentando reservar asientos: {request.asientos_ids} para función {request.funcion_id}")
        
        # Verificar que la función existe
        funcion = db.query(Funcion).filter(Funcion.id == request.funcion_id).first()
        if not funcion:
            raise HTTPException(
                status_code=404,
                detail="Función no encontrada"
            )

        # Verificar que todos los asientos existan y estén disponibles
        asientos = db.query(Asiento).filter(Asiento.id.in_(request.asientos_ids)).all()
        
        if len(asientos) != len(request.asientos_ids):
            raise HTTPException(
                status_code=404,
                detail="Uno o más asientos no existen"
            )
            
        # Verificar disponibilidad
        asientos_no_disponibles = []
        for asiento in asientos:
            print(f"Estado del asiento {asiento.id}: {asiento.estado}")
            if asiento.estado not in [EstadoAsiento.DISPONIBLE.value, EstadoAsiento.SELECCIONADO.value]:
                asientos_no_disponibles.append(asiento.id)
        
        if asientos_no_disponibles:
            raise HTTPException(
                status_code=400,
                detail=f"Los asientos {asientos_no_disponibles} no están disponibles"
            )
            
        # Reservar los asientos
        for asiento in asientos:
            asiento.estado = EstadoAsiento.SELECCIONADO.value
            
        db.commit()
        
        # Cargar las relaciones para la respuesta
        asientos = db.query(Asiento).options(
            joinedload(Asiento.sala)
        ).filter(Asiento.id.in_(request.asientos_ids)).all()
        
        # Convertir a diccionarios
        asientos_dict = []
        for asiento in asientos:
            if not asiento.sala:
                print(f"Asiento {asiento.id} ignorado: falta sala")
                continue
                
            asiento_dict = {
                "id": asiento.id,
                "sala_id": asiento.sala_id,
                "fila": asiento.fila,
                "numero": asiento.numero,
                "estado": asiento.estado,
                "sala": {
                    "id": asiento.sala.id,
                    "nombre": asiento.sala.nombre
                }
            }
            asientos_dict.append(asiento_dict)
            
        return asientos_dict
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error al reservar asientos: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al reservar los asientos: {str(e)}"
        )

# Liberar asientos
@router.post("/liberar")
async def liberar_asientos(
    asientos: AsientoVerificar,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    asientos_liberar = db.query(Asiento).filter(
        Asiento.id.in_(asientos.asientos_ids)
    ).all()
    
    if len(asientos_liberar) != len(asientos.asientos_ids):
        raise HTTPException(status_code=404, detail="Uno o más asientos no encontrados")
    
    for asiento in asientos_liberar:
        # Permitir liberar asientos que estén seleccionados o ocupados
        if asiento.estado not in [EstadoAsiento.SELECCIONADO.value, EstadoAsiento.OCUPADO.value]:
            raise HTTPException(
                status_code=400,
                detail=f"El asiento {asiento.fila}-{asiento.numero} no está seleccionado u ocupado"
            )
        asiento.estado = EstadoAsiento.DISPONIBLE.value
    
    db.commit()
    return {"mensaje": "Asientos liberados exitosamente"}

# Crear un nuevo asiento
@router.post("/", response_model=AsientoResponse)
async def crear_asiento(
    asiento: AsientoCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    nuevo_asiento = Asiento(**asiento.dict())
    db.add(nuevo_asiento)
    db.commit()
    db.refresh(nuevo_asiento)
    return nuevo_asiento

# Actualizar un asiento
@router.patch("/{asiento_id}")
async def actualizar_asiento(
    asiento_id: int,
    asiento_update: AsientoEstado,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="No autorizado")
        
    asiento = db.query(Asiento).filter(Asiento.id == asiento_id).first()
    if not asiento:
        raise HTTPException(status_code=404, detail="Asiento no encontrado")
        
    if asiento_update.estado_configuracion:
        asiento.estado_configuracion = asiento_update.estado_configuracion
    if asiento_update.estado_venta:
        asiento.estado_venta = asiento_update.estado_venta
        
    db.commit()
    return asiento

# Eliminar un asiento
@router.delete("/{asiento_id}")
async def eliminar_asiento(
    asiento_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    asiento = db.query(Asiento).filter(Asiento.id == asiento_id).first()
    if not asiento:
        raise HTTPException(status_code=404, detail="Asiento no encontrado")
    
    db.delete(asiento)
    db.commit()
    return {"mensaje": "Asiento eliminado exitosamente"}
