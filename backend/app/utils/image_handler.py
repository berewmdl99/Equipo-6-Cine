import os
import shutil
from fastapi import UploadFile
from pathlib import Path
import time

# Configuración de la carpeta de uploads
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

async def guardar_imagen(imagen: UploadFile) -> str:
    """
    Guarda una imagen y retorna la URL relativa.
    """
    if not imagen:
        return None

    # Verificar el tipo de archivo
    extension = imagen.filename.split(".")[-1].lower()
    if extension not in ["jpg", "jpeg", "png"]:
        raise ValueError("El archivo debe ser una imagen PNG o JPG")

    # Generar un nombre único para el archivo
    timestamp = str(int(time.time()))
    filename = f"{timestamp}_{imagen.filename}"
    file_path = UPLOAD_DIR / filename

    # Guardar el archivo
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(imagen.file, buffer)
        return str(file_path)
    except Exception as e:
        raise ValueError(f"Error al guardar la imagen: {str(e)}")
