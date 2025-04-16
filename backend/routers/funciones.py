from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import date, datetime, timedelta
from app.database import get_db
from app.models import Funcion, Pelicula, Sala, Asiento, Boleto
from app.schemas import FuncionCreate, FuncionUpdate, FuncionResponse, FuncionDisponibilidad
from app.auth import get_current_user
from typing import List, Dict

router = APIRouter(prefix="/funciones", tags=["Funciones"])


@router.get("/", response_model=List[FuncionResponse])
async def listar_funciones(db: Session = Depends(get_db)):
    """Lista todas las funciones disponibles."""
    try:
        # Cargar las funciones con sus relaciones usando joinedload
        funciones = db.query(Funcion).options(
            joinedload(Funcion.pelicula),
            joinedload(Funcion.sala)
        ).all()
        
        # Convertir los objetos SQLAlchemy a diccionarios
        funciones_dict = []
        for funcion in funciones:
            if not funcion.pelicula or not funcion.sala:
                continue
                
            # Asegurar que el precio_base sea válido
            if funcion.precio_base <= 0:
                funcion.precio_base = 100.0
                
            funcion_dict = {
                "id": funcion.id,
                "pelicula_id": funcion.pelicula_id,
                "sala_id": funcion.sala_id,
                "fecha": funcion.fecha,
                "hora": funcion.hora,
                "precio_base": funcion.precio_base,
                "pelicula": {
                    "id": funcion.pelicula.id,
                    "titulo": funcion.pelicula.titulo,
                    "duracion_min": funcion.pelicula.duracion_min,
                    "clasificacion": funcion.pelicula.clasificacion,
                    "genero": funcion.pelicula.genero,
                    "descripcion": funcion.pelicula.descripcion,
                    "en_cartelera": funcion.pelicula.en_cartelera,
                    "imagen_url": funcion.pelicula.imagen_url
                },
                "sala": {
                    "id": funcion.sala.id,
                    "nombre": funcion.sala.nombre
                }
            }
            funciones_dict.append(funcion_dict)
            
        return funciones_dict
        
    except Exception as e:
        print(f"Error al listar funciones: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al listar las funciones: {str(e)}"
        )


@router.post("/", response_model=FuncionResponse, status_code=status.HTTP_201_CREATED)
async def crear_funcion(
    funcion: FuncionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="No autorizado")
            
        # Validar que la fecha sea futura
        if funcion.fecha < date.today():
            raise HTTPException(status_code=400, detail="La fecha debe ser futura")
        
        # Validar que el precio_base sea mayor que 0
        if funcion.precio_base <= 0:
            raise HTTPException(status_code=400, detail="El precio base debe ser mayor que 0")
            
        # Validar que existan la película y la sala
        pelicula = db.query(Pelicula).filter(Pelicula.id == funcion.pelicula_id).first()
        sala = db.query(Sala).filter(Sala.id == funcion.sala_id).first()
        
        if not pelicula or not sala:
            raise HTTPException(status_code=404, detail="Película o sala no encontrada")
            
        nueva_funcion = Funcion(**funcion.dict())
        db.add(nueva_funcion)
        db.commit()
        db.refresh(nueva_funcion)
        
        # Cargar las relaciones para la respuesta
        nueva_funcion = db.query(Funcion).options(
            joinedload(Funcion.pelicula),
            joinedload(Funcion.sala)
        ).filter(Funcion.id == nueva_funcion.id).first()
        
        # Convertir a diccionario
        funcion_dict = {
            "id": nueva_funcion.id,
            "pelicula_id": nueva_funcion.pelicula_id,
            "sala_id": nueva_funcion.sala_id,
            "fecha": nueva_funcion.fecha,
            "hora": nueva_funcion.hora,
            "precio_base": nueva_funcion.precio_base,
            "pelicula": {
                "id": nueva_funcion.pelicula.id,
                "titulo": nueva_funcion.pelicula.titulo,
                "duracion_min": nueva_funcion.pelicula.duracion_min,
                "clasificacion": nueva_funcion.pelicula.clasificacion,
                "genero": nueva_funcion.pelicula.genero,
                "descripcion": nueva_funcion.pelicula.descripcion,
                "en_cartelera": nueva_funcion.pelicula.en_cartelera,
                "imagen_url": nueva_funcion.pelicula.imagen_url
            },
            "sala": {
                "id": nueva_funcion.sala.id,
                "nombre": nueva_funcion.sala.nombre
            }
        }
        
        return funcion_dict
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error al crear función: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al crear la función: {str(e)}"
        )


@router.put("/{funcion_id}", response_model=FuncionResponse)
def modificar_funcion(
    funcion_id: int, 
    funcion_actualizada: FuncionUpdate, 
    current_user=Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Solo administradores pueden modificar funciones.")

        funcion = db.query(Funcion).options(
            joinedload(Funcion.pelicula),
            joinedload(Funcion.sala)
        ).filter(Funcion.id == funcion_id).first()
        
        if not funcion:
            raise HTTPException(status_code=404, detail="Función no encontrada")

        # Validar precio base si se está actualizando
        if funcion_actualizada.precio_base is not None and funcion_actualizada.precio_base <= 0:
            raise HTTPException(status_code=400, detail="El precio base debe ser mayor que 0.")

        for field, value in funcion_actualizada.dict(exclude_unset=True).items():
            setattr(funcion, field, value)

        db.commit()
        db.refresh(funcion)
        
        # Convertir a diccionario
        funcion_dict = {
            "id": funcion.id,
            "pelicula_id": funcion.pelicula_id,
            "sala_id": funcion.sala_id,
            "fecha": funcion.fecha,
            "hora": funcion.hora,
            "precio_base": funcion.precio_base,
            "pelicula": {
                "id": funcion.pelicula.id,
                "titulo": funcion.pelicula.titulo,
                "duracion_min": funcion.pelicula.duracion_min,
                "clasificacion": funcion.pelicula.clasificacion,
                "genero": funcion.pelicula.genero,
                "descripcion": funcion.pelicula.descripcion,
                "en_cartelera": funcion.pelicula.en_cartelera,
                "imagen_url": funcion.pelicula.imagen_url
            },
            "sala": {
                "id": funcion.sala.id,
                "nombre": funcion.sala.nombre
            }
        }
        
        return funcion_dict
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error al modificar función: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al modificar la función: {str(e)}"
        )


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


@router.post("/validar-disponibilidad")
def validar_disponibilidad(
    datos: FuncionDisponibilidad,
    db: Session = Depends(get_db)
):
    try:
        # Verificar si la sala existe
        sala = db.query(Sala).filter(Sala.id == datos.sala_id).first()
        if not sala:
            raise HTTPException(status_code=404, detail="Sala no encontrada")

        # Convertir la fecha y hora a datetime para comparación
        try:
            # Asegurarse de que la fecha y hora sean del tipo correcto
            if isinstance(datos.fecha, str):
                fecha = datetime.strptime(datos.fecha, "%Y-%m-%d").date()
            else:
                fecha = datos.fecha

            if isinstance(datos.hora, str):
                hora = datetime.strptime(datos.hora, "%H:%M").time()
            else:
                hora = datos.hora

            print(f"Validando disponibilidad para: Sala {datos.sala_id}, Fecha {fecha}, Hora {hora}")
        except Exception as e:
            print(f"Error al procesar fecha y hora: {e}")
            raise HTTPException(
                status_code=400,
                detail=f"Error al procesar la fecha y hora proporcionadas: {str(e)}"
            )

        # Verificar si hay otras funciones en el mismo horario
        try:
            # Calcular el rango de tiempo (2 horas antes y después)
            hora_inicio = (datetime.combine(fecha, hora) - timedelta(hours=2)).time()
            hora_fin = (datetime.combine(fecha, hora) + timedelta(hours=2)).time()
            
            print(f"Buscando funciones entre {hora_inicio} y {hora_fin}")
            
            funciones_existentes = db.query(Funcion).filter(
                Funcion.sala_id == datos.sala_id,
                Funcion.fecha == fecha,
                Funcion.hora.between(hora_inicio, hora_fin)
            ).all()

            if funciones_existentes:
                print(f"Se encontraron {len(funciones_existentes)} funciones en ese horario")
                raise HTTPException(
                    status_code=400,
                    detail="Ya existe una función en ese horario para esta sala"
                )

            return {"disponible": True}

        except HTTPException as he:
            raise he
        except Exception as e:
            print(f"Error al verificar funciones existentes: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Error al verificar la disponibilidad de la sala: {str(e)}"
            )

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error inesperado en validar_disponibilidad: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error interno al validar disponibilidad: {str(e)}"
        )


@router.get("/{funcion_id}", response_model=FuncionResponse)
def obtener_funcion(funcion_id: int, db: Session = Depends(get_db)):
    """Obtiene una función específica por su ID."""
    try:
        funcion = db.query(Funcion).options(
            joinedload(Funcion.pelicula),
            joinedload(Funcion.sala)
        ).filter(Funcion.id == funcion_id).first()
        
        if not funcion:
            raise HTTPException(status_code=404, detail="Función no encontrada")
            
        if not funcion.pelicula or not funcion.sala:
            raise HTTPException(
                status_code=404,
                detail="Función inválida: falta película o sala asociada"
            )
            
        if funcion.precio_base <= 0:
            funcion.precio_base = 10.00
            db.commit()
            db.refresh(funcion)
            
        funcion_dict = {
            "id": funcion.id,
            "pelicula_id": funcion.pelicula_id,
            "sala_id": funcion.sala_id,
            "fecha": funcion.fecha,
            "hora": funcion.hora,
            "precio_base": funcion.precio_base,
            "pelicula": {
                "id": funcion.pelicula.id,
                "titulo": funcion.pelicula.titulo,
                "duracion_min": funcion.pelicula.duracion_min,
                "clasificacion": funcion.pelicula.clasificacion,
                "genero": funcion.pelicula.genero,
                "descripcion": funcion.pelicula.descripcion,
                "en_cartelera": funcion.pelicula.en_cartelera,
                "imagen_url": funcion.pelicula.imagen_url
            },
            "sala": {
                "id": funcion.sala.id,
                "nombre": funcion.sala.nombre,
                "capacidad": funcion.sala.capacidad,
                "num_filas": funcion.sala.num_filas,
                "asientos_por_fila": funcion.sala.asientos_por_fila,
                "tipo": funcion.sala.tipo,
                "activa": funcion.sala.activa,
                "creada_en": funcion.sala.creada_en,
                "actualizada_en": funcion.sala.actualizada_en
            }
        }
        
        return funcion_dict
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error al obtener función: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener la función: {str(e)}"
        )


@router.get("/{funcion_id}/asientos")
async def obtener_asientos_funcion(funcion_id: int, db: Session = Depends(get_db)):
    """Obtiene los asientos disponibles para una función específica."""
    try:
        # Verificar que la función existe
        funcion = db.query(Funcion).options(
            joinedload(Funcion.sala)
        ).filter(Funcion.id == funcion_id).first()
        
        if not funcion:
            raise HTTPException(status_code=404, detail="Función no encontrada")

        # Obtener los asientos de la sala
        asientos = db.query(Asiento).filter(
            Asiento.sala_id == funcion.sala_id
        ).all()
        
        # Obtener los boletos vendidos para esta función
        boletos = db.query(Boleto).filter(
            Boleto.funcion_id == funcion_id,
            Boleto.estado == 'comprado'
        ).all()
        
        # Crear un set de IDs de asientos ocupados
        asientos_ocupados = {boleto.asiento_id for boleto in boletos}
        
        # Convertir a diccionario y organizar por filas
        asientos_dict = {}
        for asiento in asientos:
            if asiento.fila not in asientos_dict:
                asientos_dict[asiento.fila] = []
            
            # Determinar el estado del asiento
            estado_actual = 'ocupado' if asiento.id in asientos_ocupados else asiento.estado
            
            asientos_dict[asiento.fila].append({
                "id": asiento.id,
                "numero": asiento.numero,
                "estado": estado_actual
            })
            
        # Ordenar los asientos por número dentro de cada fila
        for fila in asientos_dict:
            asientos_dict[fila] = sorted(asientos_dict[fila], key=lambda x: x["numero"])
            
        return {
            "funcion_id": funcion_id,
            "sala_id": funcion.sala_id,
            "nombre_sala": funcion.sala.nombre,
            "filas": asientos_dict
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error al obtener asientos de la función: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener los asientos: {str(e)}"
        )
