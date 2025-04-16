from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Sala, Funcion, Asiento
from app.schemas import SalaCreate, SalaUpdate, SalaResponse
from app.auth import get_current_user, verificar_admin

router = APIRouter(prefix="/salas", tags=["Salas"])


@router.get("/", response_model=list[SalaResponse])
def listar_salas(db: Session = Depends(get_db)):
    try:
        salas = db.query(Sala).all()
        # Convertir cada sala a un diccionario
        salas_dict = []
        for sala in salas:
            sala_dict = {
                "id": sala.id,
                "nombre": sala.nombre,
                "capacidad": sala.capacidad,
                "tipo": sala.tipo,
                "num_filas": sala.num_filas,
                "asientos_por_fila": sala.asientos_por_fila,
                "activa": sala.activa,
                "creada_en": sala.creada_en,
                "actualizada_en": sala.actualizada_en
            }
            salas_dict.append(sala_dict)
        return salas_dict
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener las salas: {str(e)}"
        )


@router.get("/{sala_id}", response_model=SalaResponse)
def obtener_sala(sala_id: int, db: Session = Depends(get_db)):
    sala = db.query(Sala).filter(Sala.id == sala_id).first()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    return {
        "id": sala.id,
        "nombre": sala.nombre,
        "capacidad": sala.capacidad,
        "tipo": sala.tipo,
        "num_filas": sala.num_filas,
        "asientos_por_fila": sala.asientos_por_fila,
        "activa": sala.activa,
        "creada_en": sala.creada_en,
        "actualizada_en": sala.actualizada_en
    }


@router.post("/", response_model=SalaResponse, status_code=status.HTTP_201_CREATED)
async def crear_sala(
    sala: SalaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    verificar_admin(current_user)
        
    if sala.capacidad <= 0:
        raise HTTPException(status_code=400, detail="La capacidad debe ser mayor que 0")
        
    nueva_sala = Sala(**sala.dict())
    db.add(nueva_sala)
    db.commit()
    db.refresh(nueva_sala)
    return {
        "id": nueva_sala.id,
        "nombre": nueva_sala.nombre,
        "capacidad": nueva_sala.capacidad,
        "tipo": nueva_sala.tipo,
        "num_filas": nueva_sala.num_filas,
        "asientos_por_fila": nueva_sala.asientos_por_fila,
        "activa": nueva_sala.activa,
        "creada_en": nueva_sala.creada_en,
        "actualizada_en": nueva_sala.actualizada_en
    }


@router.put("/{sala_id}", response_model=SalaResponse)
def modificar_sala(
    sala_id: int, 
    sala_actualizada: SalaUpdate, 
    current_user=Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    verificar_admin(current_user)

    sala = db.query(Sala).filter(Sala.id == sala_id).first()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada")

    for field, value in sala_actualizada.dict(exclude_unset=True).items():
        setattr(sala, field, value)

    db.commit()
    db.refresh(sala)
    return {
        "id": sala.id,
        "nombre": sala.nombre,
        "capacidad": sala.capacidad,
        "tipo": sala.tipo,
        "num_filas": sala.num_filas,
        "asientos_por_fila": sala.asientos_por_fila,
        "activa": sala.activa,
        "creada_en": sala.creada_en,
        "actualizada_en": sala.actualizada_en
    }


@router.delete("/{sala_id}")
def eliminar_sala(
    sala_id: int, 
    current_user=Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    verificar_admin(current_user)

    sala = db.query(Sala).filter(Sala.id == sala_id).first()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada")

    # Validar si hay funciones activas antes de eliminar
    funciones_activas = db.query(Funcion).filter(Funcion.sala_id == sala_id).count()
    if funciones_activas > 0:
        raise HTTPException(
            status_code=400, 
            detail="No se puede eliminar la sala porque tiene funciones activas"
        )

    try:
        # Primero eliminar los asientos asociados
        db.query(Asiento).filter(Asiento.sala_id == sala_id).delete()
        
        # Luego eliminar la sala
        db.delete(sala)
        db.commit()
        return {"mensaje": "Sala eliminada exitosamente"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error al eliminar la sala: {str(e)}"
        )
