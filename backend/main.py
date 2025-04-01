from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from routers import usuarios, peliculas, salas, funciones, boletos, asientos
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
import sys
import os

sys.path.append(os.path.abspath(os.path.dirname(__file__)))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Ajusta según la URL de tu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(usuarios.router)
app.include_router(peliculas.router)
app.include_router(salas.router)
app.include_router(funciones.router)
app.include_router(asientos.router)
app.include_router(boletos.router)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def root():
    return {"message": "Bienvenido a la API de Cine"}


