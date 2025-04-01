from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Pelicula, Funcion
from app.schemas import PeliculaCreate, PeliculaUpdate, PeliculaResponse
from app.auth import get_current_user
import shutil
import os

router = APIRouter(prefix="/peliculas", tags=["Películas"])

# Ruta para guardar las imágenes
UPLOAD_DIR = "uploads/"
os.makedirs(UPLOAD_DIR, exist_ok=True)  # Crear la carpeta si no existe


@router.get("/", response_model=list[PeliculaResponse])
def listar_peliculas(db: Session = Depends(get_db)):
    """Lista todas las películas disponibles."""
    return db.query(Pelicula).all()


@router.post("/", response_model=PeliculaResponse, status_code=status.HTTP_201_CREATED)
async def crear_pelicula(
    titulo: str = Form(...),
    duracion_min: int = Form(...),
    clasificacion: str = Form(...),
    genero: str = Form(...),
    descripcion: str = Form(None),
    imagen: UploadFile = File(None),  # Imagen opcional
    en_cartelera: bool = Form(True),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Crea una nueva película (solo administradores pueden hacerlo)."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403, detail="Solo administradores pueden crear películas."
        )

    # Manejar la imagen si se proporciona
    file_location = None
    if imagen:
        # Verificar si la imagen es de tipo JPG o PNG
        image_extension = imagen.filename.split(".")[-1].lower()
        if image_extension not in ["jpg", "jpeg", "png"]:
            raise HTTPException(
                status_code=400, detail="El archivo debe ser una imagen PNG o JPG."
            )

        # Guardar la imagen si está presente
        file_location = f"{UPLOAD_DIR}{titulo.replace(' ', '_')}_imagen.{image_extension}"
        with open(file_location, "wb") as f:
            shutil.copyfileobj(imagen.file, f)

    # Crear nueva película
    nueva_pelicula = Pelicula(
        titulo=titulo,
        duracion_min=duracion_min,
        clasificacion=clasificacion,
        genero=genero,
        descripcion=descripcion,
        imagen_url=file_location,  # Puede ser None si no se subió imagen
        en_cartelera=en_cartelera,
    )

    db.add(nueva_pelicula)
    db.commit()
    db.refresh(nueva_pelicula)

    return nueva_pelicula


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
