from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Boleto, Funcion, Asiento, Usuario
from app.schemas import BoletoCreate, BoletoResponse, EstadoAsiento, EstadoBoleto
from app.auth import get_current_user
import logging
from datetime import datetime
from fastapi.responses import JSONResponse

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/boletos", tags=["Boletos"])

# Obtener todos los boletos
@router.get("/", response_model=list[BoletoResponse])
def listar_boletos(db: Session = Depends(get_db)):
    try:
        # Cargar los boletos con todas sus relaciones usando joinedload
        boletos = db.query(Boleto).options(
            joinedload(Boleto.funcion).joinedload(Funcion.pelicula),
            joinedload(Boleto.funcion).joinedload(Funcion.sala),
            joinedload(Boleto.asiento),
            joinedload(Boleto.usuario),
            joinedload(Boleto.vendedor)
        ).all()
        
        # Convertir los objetos SQLAlchemy a diccionarios
        boletos_dict = []
        for boleto in boletos:
            if not boleto.funcion or not boleto.asiento or not boleto.usuario:
                print(f"Boleto {boleto.id} ignorado: falta función, asiento o usuario")
                continue
                
            boleto_dict = {
                "id": boleto.id,
                "funcion_id": boleto.funcion_id,
                "asiento_id": boleto.asiento_id,
                "usuario_id": boleto.usuario_id,
                "vendedor_id": boleto.vendedor_id,
                "precio": boleto.precio,
                "estado": boleto.estado,
                "creado_en": boleto.creado_en or datetime.now(),  # Asegurar que creado_en no sea None
                "funcion": {
                    "id": boleto.funcion.id,
                    "pelicula_id": boleto.funcion.pelicula_id,
                    "sala_id": boleto.funcion.sala_id,
                    "fecha": boleto.funcion.fecha,
                    "hora": boleto.funcion.hora,
                    "precio_base": boleto.funcion.precio_base,
                    "pelicula": {
                        "id": boleto.funcion.pelicula.id,
                        "titulo": boleto.funcion.pelicula.titulo,
                        "duracion_min": boleto.funcion.pelicula.duracion_min,
                        "clasificacion": boleto.funcion.pelicula.clasificacion,
                        "genero": boleto.funcion.pelicula.genero,
                        "descripcion": boleto.funcion.pelicula.descripcion,
                        "en_cartelera": boleto.funcion.pelicula.en_cartelera,
                        "imagen_url": boleto.funcion.pelicula.imagen_url
                    },
                    "sala": {
                        "id": boleto.funcion.sala.id,
                        "nombre": boleto.funcion.sala.nombre,
                        "capacidad": boleto.funcion.sala.capacidad
                    }
                },
                "asiento": {
                    "id": boleto.asiento.id,
                    "sala_id": boleto.asiento.sala_id,
                    "fila": boleto.asiento.fila,
                    "numero": boleto.asiento.numero,
                    "estado": boleto.asiento.estado
                },
                "usuario": {
                    "id": boleto.usuario.id,
                    "nombre": boleto.usuario.nombre,
                    "email": boleto.usuario.email,
                    "username": boleto.usuario.username,  # Agregar username
                    "is_admin": boleto.usuario.is_admin
                },
                "vendedor": {
                    "id": boleto.vendedor.id,
                    "nombre": boleto.vendedor.nombre,
                    "email": boleto.vendedor.email,
                    "username": boleto.vendedor.username,  # Agregar username
                    "is_admin": boleto.vendedor.is_admin
                } if boleto.vendedor else None
            }
            boletos_dict.append(boleto_dict)
            
        return boletos_dict
        
    except Exception as e:
        print(f"Error al listar boletos: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al listar los boletos: {str(e)}"
        )

# Crear un nuevo boleto
@router.post("/", response_model=BoletoResponse, status_code=status.HTTP_201_CREATED)
async def crear_boleto(
    boleto: BoletoCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        logger.info(f"Intentando crear boleto con datos: {boleto}")
        
        # Verificar que el asiento exista
        asiento = db.query(Asiento).filter(Asiento.id == boleto.asiento_id).first()
        if not asiento:
            raise HTTPException(status_code=404, detail=f"Asiento {boleto.asiento_id} no encontrado")
        
        # Verificar que el asiento esté disponible o reservado
        if asiento.estado not in [EstadoAsiento.DISPONIBLE, EstadoAsiento.SELECCIONADO]:
            raise HTTPException(
                status_code=400, 
                detail=f"Asiento {boleto.asiento_id} no disponible. Estado actual: {asiento.estado}"
            )
            
        # Verificar que la función exista
        funcion = db.query(Funcion).filter(Funcion.id == boleto.funcion_id).first()
        if not funcion:
            raise HTTPException(status_code=404, detail=f"Función {boleto.funcion_id} no encontrada")

        # Verificar que el usuario exista
        usuario = db.query(Usuario).filter(Usuario.id == boleto.usuario_id).first()
        if not usuario:
            raise HTTPException(status_code=404, detail=f"Usuario {boleto.usuario_id} no encontrado")

        # Verificar que el asiento pertenezca a la sala de la función
        if asiento.sala_id != funcion.sala_id:
            raise HTTPException(
                status_code=400, 
                detail=f"El asiento {boleto.asiento_id} no pertenece a la sala de la función {boleto.funcion_id}"
            )

        # Verificar si ya existe un boleto para este asiento y función
        boleto_existente = db.query(Boleto).filter(
            Boleto.asiento_id == boleto.asiento_id,
            Boleto.funcion_id == boleto.funcion_id
        ).first()
        
        if boleto_existente:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un boleto para el asiento {boleto.asiento_id} en la función {boleto.funcion_id}"
            )

        # Validar el estado del boleto
        if boleto.estado not in [e.value for e in EstadoBoleto]:
            raise HTTPException(
                status_code=400,
                detail=f"Estado de boleto inválido. Debe ser uno de: {', '.join([e.value for e in EstadoBoleto])}"
            )

        # Crear el boleto con la fecha actual y el vendedor actual
        nuevo_boleto = Boleto(
            funcion_id=boleto.funcion_id,
            asiento_id=boleto.asiento_id,
            usuario_id=boleto.usuario_id,
            vendedor_id=current_user.id,  # Asignar el vendedor actual
            precio=boleto.precio,
            estado=boleto.estado,
            creado_en=datetime.now()
        )
        
        db.add(nuevo_boleto)
        
        # Actualizar estado del asiento a ocupado
        asiento.estado = EstadoAsiento.OCUPADO
        
        db.commit()
        db.refresh(nuevo_boleto)
        
        # Cargar las relaciones para la respuesta
        db.refresh(nuevo_boleto)
        nuevo_boleto = db.query(Boleto).options(
            joinedload(Boleto.funcion).joinedload(Funcion.pelicula),
            joinedload(Boleto.funcion).joinedload(Funcion.sala),
            joinedload(Boleto.asiento),
            joinedload(Boleto.usuario),
            joinedload(Boleto.vendedor)
        ).filter(Boleto.id == nuevo_boleto.id).first()
        
        # Convertir a diccionario asegurando que todos los campos requeridos estén presentes
        boleto_dict = {
            "id": nuevo_boleto.id,
            "funcion_id": nuevo_boleto.funcion_id,
            "asiento_id": nuevo_boleto.asiento_id,
            "usuario_id": nuevo_boleto.usuario_id,
            "vendedor_id": nuevo_boleto.vendedor_id,
            "precio": nuevo_boleto.precio,
            "estado": nuevo_boleto.estado,
            "creado_en": nuevo_boleto.creado_en,
            "funcion": {
                "id": nuevo_boleto.funcion.id,
                "pelicula_id": nuevo_boleto.funcion.pelicula_id,
                "sala_id": nuevo_boleto.funcion.sala_id,
                "fecha": nuevo_boleto.funcion.fecha,
                "hora": nuevo_boleto.funcion.hora,
                "precio_base": nuevo_boleto.funcion.precio_base,
                "pelicula": {
                    "id": nuevo_boleto.funcion.pelicula.id,
                    "titulo": nuevo_boleto.funcion.pelicula.titulo,
                    "duracion_min": nuevo_boleto.funcion.pelicula.duracion_min,
                    "clasificacion": nuevo_boleto.funcion.pelicula.clasificacion,
                    "genero": nuevo_boleto.funcion.pelicula.genero,
                    "descripcion": nuevo_boleto.funcion.pelicula.descripcion,
                    "en_cartelera": nuevo_boleto.funcion.pelicula.en_cartelera,
                    "imagen_url": nuevo_boleto.funcion.pelicula.imagen_url
                },
                "sala": {
                    "id": nuevo_boleto.funcion.sala.id,
                    "nombre": nuevo_boleto.funcion.sala.nombre,
                    "capacidad": nuevo_boleto.funcion.sala.capacidad
                }
            },
            "asiento": {
                "id": nuevo_boleto.asiento.id,
                "sala_id": nuevo_boleto.asiento.sala_id,
                "fila": nuevo_boleto.asiento.fila,
                "numero": nuevo_boleto.asiento.numero,
                "estado": nuevo_boleto.asiento.estado
            },
            "usuario": {
                "id": nuevo_boleto.usuario.id,
                "nombre": nuevo_boleto.usuario.nombre,
                "email": nuevo_boleto.usuario.email,
                "username": nuevo_boleto.usuario.username,  # Asegurar que username esté presente
                "is_admin": nuevo_boleto.usuario.is_admin
            },
            "vendedor": {
                "id": nuevo_boleto.vendedor.id,
                "nombre": nuevo_boleto.vendedor.nombre,
                "email": nuevo_boleto.vendedor.email,
                "username": nuevo_boleto.vendedor.username,  # Asegurar que username esté presente
                "is_admin": nuevo_boleto.vendedor.is_admin
            } if nuevo_boleto.vendedor else None
        }
        
        logger.info(f"Boleto creado exitosamente con ID: {nuevo_boleto.id}")
        return boleto_dict
        
    except HTTPException as he:
        logger.error(f"Error HTTP al crear boleto: {he.detail}")
        raise he
    except Exception as e:
        logger.error(f"Error inesperado al crear boleto: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error interno del servidor al crear el boleto: {str(e)}"
        )

# Cancelar un boleto
@router.delete("/{boleto_id}", status_code=status.HTTP_200_OK)
def cancelar_boleto(
    boleto_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Verificar que el usuario sea admin o el vendedor del boleto
    boleto = db.query(Boleto).filter(Boleto.id == boleto_id).first()
    if not boleto:
        raise HTTPException(status_code=404, detail="Boleto no encontrado")
    
    if not current_user.is_admin and boleto.vendedor_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="No tienes permiso para cancelar este boleto"
        )
    
    # Obtener el asiento asociado y actualizarlo a disponible
    asiento = db.query(Asiento).filter(Asiento.id == boleto.asiento_id).first()
    if asiento:
        asiento.estado = EstadoAsiento.DISPONIBLE
    
    # Marcar el boleto como cancelado antes de eliminarlo
    boleto.estado = EstadoBoleto.CANCELADO
    db.commit()
    
    db.delete(boleto)
    db.commit()
    return {"detail": "Boleto cancelado exitosamente"}

@router.get("/{boleto_id}/imprimir")
async def imprimir_boleto(boleto_id: int, db: Session = Depends(get_db)):
    """Endpoint para imprimir un boleto."""
    try:
        # Cargar el boleto con todas sus relaciones usando joinedload
        boleto = db.query(Boleto).options(
            joinedload(Boleto.funcion).joinedload(Funcion.pelicula),
            joinedload(Boleto.funcion).joinedload(Funcion.sala),
            joinedload(Boleto.asiento),
            joinedload(Boleto.usuario)
        ).filter(Boleto.id == boleto_id).first()
        
        if not boleto:
            raise HTTPException(status_code=404, detail="Boleto no encontrado")
            
        # Preparar datos para impresión asegurando que las fechas sean strings
        datos_impresion = {
            "boleto_id": boleto.id,
            "funcion": {
                "pelicula": boleto.funcion.pelicula.titulo,
                "fecha": boleto.funcion.fecha.isoformat(),
                "hora": boleto.funcion.hora.strftime("%H:%M"),
                "sala": boleto.funcion.sala.nombre
            },
            "asiento": {
                "fila": boleto.asiento.fila,
                "numero": boleto.asiento.numero
            },
            "usuario": {
                "nombre": boleto.usuario.nombre,
                "email": boleto.usuario.email
            },
            "precio": float(boleto.precio),
            "fecha_compra": boleto.creado_en.isoformat()
        }
        
        return JSONResponse(content=datos_impresion)
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error al preparar impresión del boleto: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al preparar la impresión del boleto: {str(e)}"
        )
