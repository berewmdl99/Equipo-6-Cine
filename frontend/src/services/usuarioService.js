// src/services/usuarioService.js
import axios from "../utils/api";

const API_URL = "/usuarios";

// Obtener todos los usuarios
export const getUsuarios = async (token) => {
  const response = await axios.get(`${API_URL}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Crear un nuevo usuario
export const crearUsuario = async (data, token) => {
  const response = await axios.post(`${API_URL}/crear`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Editar usuario existente
export const editarUsuario = async (usuarioId, data, token) => {
  const response = await axios.put(`${API_URL}/editar/${usuarioId}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Eliminar usuario
export const eliminarUsuario = async (usuarioId, token) => {
  const response = await axios.delete(`${API_URL}/${usuarioId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
