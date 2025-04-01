import axios from "axios";

const API_URL = "http://localhost:8000/usuarios";

// Iniciar sesión
export const login = async (username, password) => {
  try {
    const response = await axios.post(
      `${API_URL}/login`,
      new URLSearchParams({
        username: username, // Cambiado para que use 'username'
        password: password,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || "Error al iniciar sesión";
  }
};

// Obtener datos del usuario actual
export const getCurrentUser = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || "Error al obtener el usuario";
  }
};

// Obtener lista de usuarios (solo administradores)
export const getUsers = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || "Error al obtener los usuarios";
  }
};

// Crear usuario
export const createUser = async (userData, token) => {
  try {
    const response = await axios.post(`${API_URL}/crear`, userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || "Error al crear el usuario";
  }
};

// Editar usuario
export const updateUser = async (userId, userData, token) => {
  try {
    const response = await axios.put(`${API_URL}/editar/${userId}`, userData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    throw error.response?.data || "Error al actualizar el usuario";
  }
};

// Eliminar usuario
export const deleteUser = async (userId, token) => {
  try {
    await axios.delete(`${API_URL}/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { message: "Usuario eliminado exitosamente" };
  } catch (error) {
    throw error.response?.data || "Error al eliminar el usuario";
  }
};
