from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import peliculas, salas, funciones, asientos, boletos, usuarios, configuracion_salas
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
import sys
import os
from dotenv import load_dotenv
from fastapi.responses import JSONResponse

load_dotenv()

sys.path.append(os.path.abspath(os.path.dirname(__file__)))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Crear las tablas en la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(title="API de Cine")

# Configurar CORS - Debe estar antes de cualquier ruta
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With"],
    expose_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With"],
    max_age=3600
)

# Rutas
app.include_router(peliculas.router)
app.include_router(salas.router)
app.include_router(funciones.router)
app.include_router(asientos.router)
app.include_router(boletos.router)
app.include_router(usuarios.router)
app.include_router(configuracion_salas.router)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Configurar el manejo de errores global
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, X-Requested-With"
        }
    )

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API de Cine"}


