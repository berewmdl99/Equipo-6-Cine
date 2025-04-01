from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app.models import Funcion, Pelicula, Sala
from app.schemas import FuncionCreate, FuncionUpdate, FuncionResponse
from app.auth import get_current_user

router = APIRouter(prefix="/funciones", tags=["Funciones"])


@router.get("/", response_model=list[FuncionResponse])
def listar_funciones(db: Session = Depends(get_db)):
    return db.query(Funcion).all()


@router.post("/", response_model=FuncionResponse, status_code=status.HTTP_201_CREATED)
def crear_funcion(funcion: FuncionCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Solo administradores pueden crear funciones.")

    # Validar que la fecha sea en el futuro
    if funcion.fecha < date.today():
        raise HTTPException(status_code=400, detail="La fecha de la función debe ser en el futuro.")

    pelicula = db.query(Pelicula).filter(Pelicula.id == funcion.pelicula_id).first()
    sala = db.query(Sala).filter(Sala.id == funcion.sala_id).first()

    if not pelicula or not sala:
        raise HTTPException(status_code=404, detail="Película o sala no encontrada")

    nueva_funcion = Funcion(**funcion.dict())
    db.add(nueva_funcion)
    db.commit()
    db.refresh(nueva_funcion)
    return nueva_funcion


@router.put("/{funcion_id}", response_model=FuncionResponse)
def modificar_funcion(funcion_id: int, funcion_actualizada: FuncionUpdate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Solo administradores pueden modificar funciones.")

    funcion = db.query(Funcion).filter(Funcion.id == funcion_id).first()
    if not funcion:
        raise HTTPException(status_code=404, detail="Función no encontrada")

    for field, value in funcion_actualizada.dict(exclude_unset=True).items():
        setattr(funcion, field, value)

    db.commit()
    db.refresh(funcion)
    return funcion


@router.delete("/{funcion_id}")
def eliminar_funcion(funcion_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar funciones.")

    funcion = db.query(Funcion).filter(Funcion.id == funcion_id).first()
    if not funcion:
        raise HTTPException(status_code=404, detail="Función no encontrada")

    db.delete(funcion)
    db.commit()
    return {"mensaje": "Función eliminada exitosamente"}
