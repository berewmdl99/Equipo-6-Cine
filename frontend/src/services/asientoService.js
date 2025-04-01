import axios from 'axios';

const API_URL = '/api/asientos';  // Asegúrate de que la URL sea la correcta en tu configuración de backend

// Obtener todos los asientos de una sala
export const obtenerAsientosPorSala = async (salaId) => {
    try {
        const response = await axios.get(`${API_URL}/sala/${salaId}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener los asientos de la sala', error);
        throw error;
    }
};

// Obtener un asiento por su ID
export const obtenerAsiento = async (asientoId) => {
    try {
        const response = await axios.get(`${API_URL}/${asientoId}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener el asiento', error);
        throw error;
    }
};

// Crear un nuevo asiento
export const crearAsiento = async (asientoData) => {
    try {
        const response = await axios.post(API_URL, asientoData);
        return response.data;
    } catch (error) {
        console.error('Error al crear el asiento', error);
        throw error;
    }
};

// Actualizar un asiento
export const actualizarAsiento = async (asientoId, asientoData) => {
    try {
        const response = await axios.put(`${API_URL}/${asientoId}`, asientoData);
        return response.data;
    } catch (error) {
        console.error('Error al actualizar el asiento', error);
        throw error;
    }
};

// Eliminar un asiento
export const eliminarAsiento = async (asientoId) => {
    try {
        await axios.delete(`${API_URL}/${asientoId}`);
        return { message: 'Asiento eliminado exitosamente' };
    } catch (error) {
        console.error('Error al eliminar el asiento', error);
        throw error;
    }
};
