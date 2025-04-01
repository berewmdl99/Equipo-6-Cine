from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Asiento, Sala
from app.schemas import AsientoCreate, AsientoResponse
from app.auth import get_current_user

router = APIRouter(prefix="/asientos", tags=["Asientos"])

# Obtener todos los asientos de una sala
@router.get("/sala/{sala_id}", response_model=list[AsientoResponse])
def listar_asientos_por_sala(sala_id: int, db: Session = Depends(get_db)):
    asientos = db.query(Asiento).filter(Asiento.sala_id == sala_id).all()
    if not asientos:
        raise HTTPException(status_code=404, detail="No hay asientos disponibles para esta sala")
    return asientos

# Obtener un asiento por su ID
@router.get("/{asiento_id}", response_model=AsientoResponse)
def obtener_asiento(asiento_id: int, db: Session = Depends(get_db)):
    asiento = db.query(Asiento).filter(Asiento.id == asiento_id).first()
    if not asiento:
        raise HTTPException(status_code=404, detail="Asiento no encontrado")
    return asiento

# Crear un nuevo asiento
@router.post("/", response_model=AsientoResponse, status_code=status.HTTP_201_CREATED)
def crear_asiento(asiento: AsientoCreate, db: Session = Depends(get_db)):
    sala = db.query(Sala).filter(Sala.id == asiento.sala_id).first()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    
    nuevo_asiento = Asiento(
        fila=asiento.fila,
        numero=asiento.numero,
        sala_id=asiento.sala_id
    )
    db.add(nuevo_asiento)
    db.commit()
    db.refresh(nuevo_asiento)
    return nuevo_asiento

# Actualizar un asiento
@router.put("/{asiento_id}", response_model=AsientoResponse)
def actualizar_asiento(asiento_id: int, asiento: AsientoCreate, db: Session = Depends(get_db)):
    db_asiento = db.query(Asiento).filter(Asiento.id == asiento_id).first()
    if not db_asiento:
        raise HTTPException(status_code=404, detail="Asiento no encontrado")
    
    db_asiento.fila = asiento.fila
    db_asiento.numero = asiento.numero
    db_asiento.sala_id = asiento.sala_id
    
    db.commit()
    db.refresh(db_asiento)
    return db_asiento

# Eliminar un asiento
@router.delete("/{asiento_id}", status_code=status.HTTP_200_OK)
def eliminar_asiento(asiento_id: int, db: Session = Depends(get_db)):
    db_asiento = db.query(Asiento).filter(Asiento.id == asiento_id).first()
    if not db_asiento:
        raise HTTPException(status_code=404, detail="Asiento no encontrado")
    
    db.delete(db_asiento)
    db.commit()
    return {"detail": "Asiento eliminado exitosamente"}
