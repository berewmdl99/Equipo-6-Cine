from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Boleto, Funcion, Asiento, Usuario
from app.schemas import BoletoCreate, BoletoResponse
from app.auth import get_current_user

router = APIRouter(prefix="/boletos", tags=["Boletos"])

# Obtener todos los boletos
@router.get("/", response_model=list[BoletoResponse])
def listar_boletos(db: Session = Depends(get_db)):
    boletos = db.query(Boleto).all()
    return boletos

# Crear un nuevo boleto
@router.post("/", response_model=BoletoResponse, status_code=status.HTTP_201_CREATED)
def crear_boleto(boleto: BoletoCreate, db: Session = Depends(get_db)):
    funcion = db.query(Funcion).filter(Funcion.id == boleto.funcion_id).first()
    asiento = db.query(Asiento).filter(Asiento.id == boleto.asiento_id).first()
    usuario = db.query(Usuario).filter(Usuario.id == boleto.usuario_id).first()

    if not funcion or not asiento or not usuario:
        raise HTTPException(status_code=404, detail="Función, asiento o usuario no encontrado")

    nuevo_boleto = Boleto(
        funcion_id=boleto.funcion_id,
        asiento_id=boleto.asiento_id,
        usuario_id=boleto.usuario_id,
        precio=boleto.precio,
        estado=boleto.estado
    )
    db.add(nuevo_boleto)
    db.commit()
    db.refresh(nuevo_boleto)
    return nuevo_boleto

# Cancelar un boleto
@router.delete("/{boleto_id}", status_code=status.HTTP_200_OK)
def cancelar_boleto(boleto_id: int, db: Session = Depends(get_db)):
    boleto = db.query(Boleto).filter(Boleto.id == boleto_id).first()
    if not boleto:
        raise HTTPException(status_code=404, detail="Boleto no encontrado")
    
    db.delete(boleto)
    db.commit()
    return {"detail": "Boleto cancelado exitosamente"}
