from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Time, DECIMAL, TIMESTAMP, func
from sqlalchemy.orm import relationship
from app.database import Base

class Usuario(Base):
    __tablename__ = 'usuarios'

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    creado_en = Column(TIMESTAMP, server_default=func.now())

    boletos = relationship("Boleto", back_populates="usuario")


class Pelicula(Base):
    __tablename__ = 'peliculas'

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)
    duracion_min = Column(Integer, nullable=False)
    clasificacion = Column(String, nullable=False)
    genero = Column(String, nullable=False)
    descripcion = Column(String, nullable=True)
    imagen_url = Column(String, nullable=True)  # Se guarda la ruta del archivo
    en_cartelera = Column(Boolean, default=True)

    funciones = relationship("Funcion", back_populates="pelicula")

class Sala(Base):
    __tablename__ = 'salas'

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    capacidad = Column(Integer, nullable=False)

    asientos = relationship("Asiento", back_populates="sala")
    funciones = relationship("Funcion", back_populates="sala")

class Asiento(Base):
    __tablename__ = 'asientos'

    id = Column(Integer, primary_key=True, index=True)
    sala_id = Column(Integer, ForeignKey('salas.id'), nullable=False)
    fila = Column(String, nullable=False)
    numero = Column(Integer, nullable=False)

    sala = relationship("Sala", back_populates="asientos")
    boletos = relationship("Boleto", back_populates="asiento")

class Funcion(Base):
    __tablename__ = 'funciones'

    id = Column(Integer, primary_key=True, index=True)
    pelicula_id = Column(Integer, ForeignKey('peliculas.id'), nullable=False)
    sala_id = Column(Integer, ForeignKey('salas.id'), nullable=False)
    fecha = Column(Date, nullable=False)
    hora = Column(Time, nullable=False)

    pelicula = relationship("Pelicula", back_populates="funciones")
    sala = relationship("Sala", back_populates="funciones")
    boletos = relationship("Boleto", back_populates="funcion")

class Boleto(Base):
    __tablename__ = 'boletos'

    id = Column(Integer, primary_key=True, index=True)
    funcion_id = Column(Integer, ForeignKey('funciones.id'), nullable=False)
    asiento_id = Column(Integer, ForeignKey('asientos.id'), nullable=False)
    usuario_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    precio = Column(DECIMAL, nullable=False)
    estado = Column(String, nullable=False, default='comprado')
    creado_en = Column(TIMESTAMP, server_default=func.now())

    funcion = relationship("Funcion", back_populates="boletos")
    asiento = relationship("Asiento", back_populates="boletos")
    usuario = relationship("Usuario", back_populates="boletos")
