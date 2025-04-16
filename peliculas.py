from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Pelicula, Funcion
from app.schemas import PeliculaCreate, PeliculaUpdate, PeliculaResponse
from app.auth import get_current_user
from app.utils.image_handler import guardar_imagen  # Importar la función
import shutil
import os
from typing import Optional

router = APIRouter(prefix="/peliculas", tags=["Películas"])

# Ruta para guardar las imágenes
UPLOAD_DIR = "uploads/"
os.makedirs(UPLOAD_DIR, exist_ok=True)  # Crear la carpeta si no existe


@router.get("/", response_model=list[PeliculaResponse])
def listar_peliculas(db: Session = Depends(get_db)):
    """Lista todas las películas disponibles en cartelera."""
    try:
        peliculas = db.query(Pelicula).options(
            joinedload(Pelicula.funciones)
        ).filter(Pelicula.en_cartelera == True).all()
        
        # Convertir los objetos SQLAlchemy a diccionarios
        peliculas_dict = []
        for pelicula in peliculas:
            pelicula_dict = {
                "id": pelicula.id,
                "titulo": pelicula.titulo,
                "duracion_min": pelicula.duracion_min,
                "clasificacion": pelicula.clasificacion,
                "genero": pelicula.genero,
                "descripcion": pelicula.descripcion,
                "en_cartelera": pelicula.en_cartelera,
                "imagen_url": pelicula.imagen_url,
                "funciones": [{"id": f.id} for f in pelicula.funciones]
            }
            peliculas_dict.append(pelicula_dict)
            
        return peliculas_dict
    except Exception as e:
        print(f"Error al listar películas: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al listar las películas: {str(e)}"
        )


@router.get("/todas", response_model=list[PeliculaResponse])
def listar_todas_peliculas(db: Session = Depends(get_db)):
    """Lista todas las películas sin filtrar por en_cartelera."""
    try:
        peliculas = db.query(Pelicula).options(
            joinedload(Pelicula.funciones)
        ).all()
        
        # Convertir los objetos SQLAlchemy a diccionarios
        peliculas_dict = []
        for pelicula in peliculas:
            pelicula_dict = {
                "id": pelicula.id,
                "titulo": pelicula.titulo,
                "duracion_min": pelicula.duracion_min,
                "clasificacion": pelicula.clasificacion,
                "genero": pelicula.genero,
                "descripcion": pelicula.descripcion,
                "en_cartelera": pelicula.en_cartelera,
                "imagen_url": pelicula.imagen_url,
                "funciones": [{"id": f.id} for f in pelicula.funciones]
            }
            peliculas_dict.append(pelicula_dict)
            
        return peliculas_dict
    except Exception as e:
        print(f"Error al listar todas las películas: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al listar todas las películas: {str(e)}"
        )


@router.post("/", response_model=PeliculaResponse, status_code=status.HTTP_201_CREATED)
async def crear_pelicula(
    titulo: str = Form(...),
    duracion_min: int = Form(...),
    clasificacion: str = Form(...),
    genero: str = Form(...),
    descripcion: Optional[str] = Form(None),
    imagen: Optional[UploadFile] = File(None),
    en_cartelera: bool = Form(True),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Crea una nueva película (solo administradores pueden hacerlo)."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403, 
            detail="Solo administradores pueden crear películas."
        )

    try:
        imagen_url = await guardar_imagen(imagen) if imagen else None
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    nueva_pelicula = Pelicula(
        titulo=titulo,
        duracion_min=duracion_min,
        clasificacion=clasificacion,
        genero=genero,
        descripcion=descripcion,
        imagen_url=imagen_url,
        en_cartelera=en_cartelera,
    )

    try:
        db.add(nueva_pelicula)
        db.commit()
        db.refresh(nueva_pelicula)
        
        # Convertir explícitamente a diccionario
        return {
            "id": nueva_pelicula.id,
            "titulo": nueva_pelicula.titulo,
            "duracion_min": nueva_pelicula.duracion_min,
            "clasificacion": nueva_pelicula.clasificacion,
            "genero": nueva_pelicula.genero,
            "descripcion": nueva_pelicula.descripcion,
            "imagen_url": nueva_pelicula.imagen_url,
            "en_cartelera": nueva_pelicula.en_cartelera
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error al crear la película: {str(e)}"
        )


@router.put("/{pelicula_id}", response_model=PeliculaResponse)
async def actualizar_pelicula(
    pelicula_id: int,
    titulo: str = Form(None),
    duracion_min: int = Form(None),
    clasificacion: str = Form(None),
    genero: str = Form(None),
    descripcion: str = Form(None),
    imagen: UploadFile = File(None),  # Imagen opcional para actualizar
    en_cartelera: bool = Form(None),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Actualiza una película existente (solo administradores pueden modificar)."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403, detail="Solo administradores pueden modificar películas."
        )

    pelicula = db.query(Pelicula).filter(Pelicula.id == pelicula_id).first()
    if not pelicula:
        raise HTTPException(status_code=404, detail="Película no encontrada")

    # Actualizar solo los campos enviados
    if titulo:
        pelicula.titulo = titulo
    if duracion_min is not None:
        pelicula.duracion_min = duracion_min
    if clasificacion:
        pelicula.clasificacion = clasificacion
    if genero:
        pelicula.genero = genero
    if descripcion is not None:
        pelicula.descripcion = descripcion
    if en_cartelera is not None:
        pelicula.en_cartelera = en_cartelera

    # Manejar la nueva imagen si es proporcionada
    if imagen:
        # Verificar si la imagen es de tipo JPG o PNG
        image_extension = imagen.filename.split(".")[-1].lower()
        if image_extension not in ["jpg", "jpeg", "png"]:
            raise HTTPException(
                status_code=400, detail="El archivo debe ser una imagen PNG o JPG."
            )

        # Eliminar la imagen anterior si existe
        if pelicula.imagen_url and os.path.exists(pelicula.imagen_url):
            os.remove(pelicula.imagen_url)

        # Guardar la nueva imagen
        file_location = f"{UPLOAD_DIR}{pelicula.titulo.replace(' ', '_')}_imagen.{image_extension}"
        with open(file_location, "wb") as f:
            shutil.copyfileobj(imagen.file, f)

        pelicula.imagen_url = file_location

    db.commit()
    db.refresh(pelicula)
    return pelicula


@router.delete("/{pelicula_id}")
def eliminar_pelicula(
    pelicula_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)
):
    """Elimina una película si no tiene funciones activas y borra su imagen."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403, detail="Solo administradores pueden eliminar películas."
        )

    pelicula = db.query(Pelicula).filter(Pelicula.id == pelicula_id).first()
    if not pelicula:
        raise HTTPException(status_code=404, detail="Película no encontrada")

    # Validar si hay funciones activas antes de eliminar
    funciones_activas = db.query(Funcion).filter(Funcion.pelicula_id == pelicula_id).count()
    if funciones_activas > 0:
        raise HTTPException(
            status_code=400, detail="No se puede eliminar la película porque tiene funciones activas."
        )

    # Eliminar la imagen si existe
    if pelicula.imagen_url and os.path.exists(pelicula.imagen_url):
        os.remove(pelicula.imagen_url)

    db.delete(pelicula)
    db.commit()
    return {"mensaje": "Película eliminada exitosamente"}
