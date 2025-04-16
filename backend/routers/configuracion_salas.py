from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List
from app.database import get_db
from app.models import Sala, Asiento, Funcion
from app.schemas import (
    ConfiguracionSalaCreate, 
    FilaCreate, 
    AsientoBatchCreate, 
    AsientoEstado,
    EstadoConfiguracion,
    EstadoVenta,
    ConfiguracionSalaResponse,
    SalaCreate,
    SalaResponse
)
from app.auth import get_current_user, verificar_admin
from datetime import datetime, date, time

router = APIRouter(prefix="/configuracion-salas", tags=["Configuración de Salas"])

@router.post("/{sala_id}/configurar", response_model=SalaResponse)
async def configurar_sala(
    sala_id: int,
    sala_config: SalaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Verificar que el usuario es admin
    verificar_admin(current_user)
    
    # Obtener la sala
    sala = db.query(Sala).filter(Sala.id == sala_id).first()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    
    # Verificar que no haya funciones activas
    funciones_activas = db.query(Funcion).filter(
        Funcion.sala_id == sala_id,
        Funcion.fecha_hora > datetime.now()
    ).first()
    
    if funciones_activas:
        raise HTTPException(
            status_code=400,
            detail="No se puede configurar una sala con funciones activas"
        )
    
    # Actualizar la configuración de la sala
    sala.num_filas = sala_config.num_filas
    sala.asientos_por_fila = sala_config.asientos_por_fila
    sala.activa = True
    sala.actualizada_en = datetime.now()
    
    # Eliminar asientos existentes
    db.query(Asiento).filter(Asiento.sala_id == sala_id).delete()
    
    # Crear nuevos asientos
    for fila in range(1, sala_config.num_filas + 1):
        for numero in range(1, sala_config.asientos_por_fila + 1):
            nuevo_asiento = Asiento(
                sala_id=sala_id,
                fila=fila,
                numero=numero,
                estado="disponible"
            )
            db.add(nuevo_asiento)
    
    db.commit()
    db.refresh(sala)
    return sala

@router.post("/{sala_id}/filas")
async def agregar_fila(
    sala_id: int,
    fila_data: FilaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        print(f"Recibiendo datos: sala_id={sala_id}, fila_data={fila_data}")
        
        # Verificar que el usuario es admin
        verificar_admin(current_user)
        
        # Obtener la sala
        sala = db.query(Sala).filter(Sala.id == sala_id).first()
        if not sala:
            raise HTTPException(status_code=404, detail="Sala no encontrada")
        
        # Verificar que no exista una fila con la misma letra
        fila_existente = db.query(Asiento).filter(
            Asiento.sala_id == sala_id,
            Asiento.fila == fila_data.letra
        ).first()
        
        if fila_existente:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe una fila con la letra {fila_data.letra}"
            )
        
        # Crear los asientos de la nueva fila
        for numero in range(1, fila_data.asientos_por_fila + 1):
            nuevo_asiento = Asiento(
                sala_id=sala_id,
                fila=fila_data.letra,
                numero=numero,
                estado="disponible"
            )
            db.add(nuevo_asiento)
        
        db.commit()
        return {"mensaje": "Fila agregada exitosamente"}
    except Exception as e:
        db.rollback()
        print(f"Error al agregar fila: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Error al agregar fila: {str(e)}"
        )

@router.delete("/{sala_id}/filas/{letra_fila}")
def eliminar_fila(
    sala_id: int,
    letra_fila: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar filas")
    
    result = db.query(Asiento).filter(
        Asiento.sala_id == sala_id,
        Asiento.fila == letra_fila
    ).delete()
    
    if result == 0:
        raise HTTPException(status_code=404, detail="Fila no encontrada")
    
    db.commit()
    return {"message": f"Fila {letra_fila} eliminada exitosamente"}

@router.patch("/{sala_id}/asiento/{asiento_id}")
async def actualizar_estado_asiento(
    sala_id: int,
    asiento_id: int,
    nuevo_estado: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Verificar que el usuario es admin
    verificar_admin(current_user)
    
    # Verificar que el estado sea válido
    estados_validos = ["disponible", "deshabilitado"]
    if nuevo_estado not in estados_validos:
        raise HTTPException(
            status_code=400,
            detail=f"Estado inválido. Estados válidos: {', '.join(estados_validos)}"
        )
    
    # Obtener el asiento
    asiento = db.query(Asiento).filter(
        Asiento.id == asiento_id,
        Asiento.sala_id == sala_id
    ).first()
    
    if not asiento:
        raise HTTPException(status_code=404, detail="Asiento no encontrado")
    
    # Actualizar el estado
    asiento.estado = nuevo_estado
    db.commit()
    
    return {"mensaje": "Estado del asiento actualizado exitosamente"}

@router.get("/{sala_id}", response_model=ConfiguracionSalaResponse)
async def obtener_configuracion_sala(sala_id: int, db: Session = Depends(get_db)):
    sala = db.query(Sala).filter(Sala.id == sala_id).first()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    
    asientos = db.query(Asiento).filter(Asiento.sala_id == sala_id).all()
    asientos_por_fila = {}
    
    for asiento in asientos:
        if asiento.fila not in asientos_por_fila:
            asientos_por_fila[asiento.fila] = []
        asientos_por_fila[asiento.fila].append({
            "id": asiento.id,
            "numero": asiento.numero,
            "estado": asiento.estado
        })
    
    return {
        "sala_id": sala_id,
        "nombre_sala": sala.nombre,
        "filas": asientos_por_fila,
        "leyenda": {
            "disponible": "Asiento disponible para venta",
            "ocupado": "Asiento ocupado/vendido",
            "reservado": "Asiento temporalmente reservado",
            "deshabilitado": "Asiento no disponible para venta"
        }
    }

@router.put("/asientos/{asiento_id}/estado")
async def actualizar_estado_asiento(
    asiento_id: int,
    estado_data: AsientoEstado,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Verificar que el usuario es admin
    verificar_admin(current_user)
    
    # Obtener el asiento
    asiento = db.query(Asiento).filter(Asiento.id == asiento_id).first()
    if not asiento:
        raise HTTPException(status_code=404, detail="Asiento no encontrado")
    
    # Verificar que no haya funciones activas
    funciones_activas = db.query(Funcion).filter(
        Funcion.sala_id == asiento.sala_id,
        Funcion.fecha > datetime.now().date()
    ).first()
    
    if funciones_activas:
        raise HTTPException(
            status_code=400,
            detail="No se puede modificar un asiento de una sala con funciones activas"
        )
    
    # Actualizar el estado
    asiento.estado = estado_data.estado
    db.commit()
    
    return {"mensaje": "Estado del asiento actualizado exitosamente"}
