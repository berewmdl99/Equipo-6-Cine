from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Time, DECIMAL, TIMESTAMP, func, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class Usuario(Base):
    __tablename__ = 'usuarios'

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    creado_en = Column(TIMESTAMP, server_default=func.now())

    boletos = relationship("Boleto", back_populates="usuario", foreign_keys="[Boleto.usuario_id]")
    pagos = relationship("Pago", back_populates="usuario")


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
    tipo = Column(String, nullable=False, default='2D')
    num_filas = Column(Integer, nullable=False)
    asientos_por_fila = Column(Integer, nullable=False)
    activa = Column(Boolean, default=True)
    creada_en = Column(TIMESTAMP, server_default=func.now())
    actualizada_en = Column(TIMESTAMP, onupdate=func.now())

    asientos = relationship("Asiento", back_populates="sala")
    funciones = relationship("Funcion", back_populates="sala")

class Asiento(Base):
    __tablename__ = 'asientos'

    id = Column(Integer, primary_key=True, index=True)
    sala_id = Column(Integer, ForeignKey('salas.id'), nullable=False)
    fila = Column(String, nullable=False)
    numero = Column(Integer, nullable=False)
    estado = Column(String, nullable=False, server_default='disponible')  # disponible, seleccionado, ocupado, deshabilitado
    creado_en = Column(TIMESTAMP, server_default=func.now())
    actualizado_en = Column(TIMESTAMP, onupdate=func.now())

    sala = relationship("Sala", back_populates="asientos")
    boletos = relationship("Boleto", back_populates="asiento")

    __table_args__ = (
        # Asegura que no haya asientos duplicados en la misma sala
        UniqueConstraint('sala_id', 'fila', 'numero', name='uq_asiento_sala_fila_numero'),
    )

class Funcion(Base):
    __tablename__ = 'funciones'

    id = Column(Integer, primary_key=True, index=True)
    pelicula_id = Column(Integer, ForeignKey('peliculas.id', ondelete='CASCADE'), nullable=False)
    sala_id = Column(Integer, ForeignKey('salas.id', ondelete='CASCADE'), nullable=False)
    fecha = Column(Date, nullable=False)
    hora = Column(Time, nullable=False)
    precio_base = Column(DECIMAL(10,2), nullable=False)

    pelicula = relationship("Pelicula", back_populates="funciones")
    sala = relationship("Sala", back_populates="funciones")
    boletos = relationship("Boleto", back_populates="funcion", cascade="all, delete-orphan")

    __table_args__ = (
        # Asegura que no haya funciones duplicadas en la misma sala y horario
        UniqueConstraint('sala_id', 'fecha', 'hora', name='uq_funcion_sala_fecha_hora'),
        # Asegura que el precio base sea mayor que 0
        CheckConstraint('precio_base > 0', name='ck_funcion_precio_base_positivo'),
    )

class Boleto(Base):
    __tablename__ = 'boletos'

    id = Column(Integer, primary_key=True, index=True)
    funcion_id = Column(Integer, ForeignKey('funciones.id'), nullable=False)
    asiento_id = Column(Integer, ForeignKey('asientos.id'), nullable=False)
    usuario_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    precio = Column(DECIMAL(10,2), nullable=False)
    estado = Column(String, nullable=False, default='comprado')  # comprado, cancelado, usado
    codigo_qr = Column(String, nullable=True)  # Código único para el boleto
    creado_en = Column(TIMESTAMP, server_default=func.now())
    actualizado_en = Column(TIMESTAMP, onupdate=func.now())
    vendedor_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)  # Usuario que vendió el boleto

    funcion = relationship("Funcion", back_populates="boletos")
    asiento = relationship("Asiento", back_populates="boletos")
    usuario = relationship("Usuario", back_populates="boletos", foreign_keys=[usuario_id])
    vendedor = relationship("Usuario", foreign_keys=[vendedor_id])
    pago = relationship("Pago", back_populates="boleto", uselist=False)

class Pago(Base):
    __tablename__ = 'pagos'

    id = Column(Integer, primary_key=True, index=True)
    boleto_id = Column(Integer, ForeignKey('boletos.id'), nullable=False)
    monto_pagado = Column(DECIMAL(10,2), nullable=False)
    cambio = Column(DECIMAL(10,2), nullable=False)
    fecha_pago = Column(TIMESTAMP, server_default=func.now())
    usuario_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)

    boleto = relationship("Boleto", back_populates="pago")
    usuario = relationship("Usuario", back_populates="pagos")
