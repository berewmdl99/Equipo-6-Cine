from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Sala, Funcion
from app.schemas import SalaCreate, SalaUpdate, SalaResponse
from app.auth import get_current_user

router = APIRouter(prefix="/salas", tags=["Salas"])


@router.get("/", response_model=list[SalaResponse])
def listar_salas(db: Session = Depends(get_db)):
    return db.query(Sala).all()


@router.post("/", response_model=SalaResponse, status_code=status.HTTP_201_CREATED)
def crear_sala(sala: SalaCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Solo administradores pueden crear salas.")

    nueva_sala = Sala(**sala.dict())
    db.add(nueva_sala)
    db.commit()
    db.refresh(nueva_sala)
    return nueva_sala


@router.put("/{sala_id}", response_model=SalaResponse)
def modificar_sala(sala_id: int, sala_actualizada: SalaUpdate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Solo administradores pueden modificar salas.")

    sala = db.query(Sala).filter(Sala.id == sala_id).first()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada")

    for field, value in sala_actualizada.dict(exclude_unset=True).items():
        setattr(sala, field, value)

    db.commit()
    db.refresh(sala)
    return sala


@router.delete("/{sala_id}")
def eliminar_sala(sala_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar salas.")

    sala = db.query(Sala).filter(Sala.id == sala_id).first()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada")

    # Validar si hay funciones activas antes de eliminar
    funciones_activas = db.query(Funcion).filter(Funcion.sala_id == sala_id).count()
    if funciones_activas > 0:
        raise HTTPException(status_code=400, detail="No se puede eliminar la sala porque tiene funciones activas.")

    db.delete(sala)
    db.commit()
    return {"mensaje": "Sala eliminada exitosamente"}
