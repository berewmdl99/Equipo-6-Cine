// src/services/salaService.js
import api from '../utils/api';

const handleError = (error, operation) => {
  console.error(`Error al ${operation}:`, error);
  throw new Error(error.response?.data?.detail || `Error al ${operation}`);
};

export async function obtenerSalas() {
  try {
    const response = await api.get('/salas');
    return response.data;
  } catch (error) {
    handleError(error, 'obtener salas');
  }
}

export async function obtenerSala(id) {
  try {
    if (!id) {
      throw new Error('El ID de la sala es requerido');
    }
    const response = await api.get(`/salas/${id}`);
    return response.data;
  } catch (error) {
    handleError(error, 'obtener sala');
  }
}

export async function crearSala(salaData) {
  try {
    const response = await api.post('/salas', salaData);
    return response.data;
  } catch (error) {
    handleError(error, 'crear sala');
  }
}

export async function actualizarSala(id, salaData) {
  try {
    if (!id) {
      throw new Error('El ID de la sala es requerido');
    }
    const response = await api.put(`/salas/${id}`, salaData);
    return response.data;
  } catch (error) {
    handleError(error, 'actualizar sala');
  }
}

export async function eliminarSala(id) {
  try {
    if (!id) {
      throw new Error('El ID de la sala es requerido');
    }
    const response = await api.delete(`/salas/${id}`);
    return response.data;
  } catch (error) {
    handleError(error, 'eliminar sala');
  }
}
