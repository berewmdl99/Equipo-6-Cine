import axios from 'axios';
import api from '../utils/api';

const API_URL = 'http://localhost:8000';

// Configuración global de Axios
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Configurar interceptor para incluir el token en todas las peticiones
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Autenticación
export const loginUser = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/usuarios/login`, {
      username,
      password,
      grant_type: 'password'
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || 'Error al iniciar sesión');
    }
    console.error('Error de red:', error);
    throw new Error('Error de conexión. Por favor, verifica tu conexión a internet.');
  }
};

export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/usuarios/`, userData);
    return response.data;
  } catch (error) {
    if (error.response) {
      const errorMessage = error.response.data?.detail || 'Error al registrar usuario';
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor');
    } else {
      throw new Error('Error al realizar la petición');
    }
  }
};

export const logout = () => {
  localStorage.removeItem('access_token');
};

export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No hay token de acceso');
    }

    const response = await axios.get(`${API_URL}/usuarios/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      withCredentials: true
    });

    if (response.status === 200 && response.data) {
      return response.data;
    }
    throw new Error('Error al obtener el usuario actual');
  } catch (error) {
    console.error('Error en getCurrentUser:', error);
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('access_token');
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else if (error.response.status === 500) {
        console.error('Error del servidor:', error.response.data);
        throw new Error(error.response.data?.detail || 'Error del servidor. Por favor, intente más tarde.');
      }
      throw new Error(error.response.data?.detail || 'Error al obtener el usuario actual');
    } else if (error.code === 'ERR_NETWORK') {
      console.error('Error de red:', error);
      throw new Error('Error de conexión. Por favor, verifica tu conexión a internet.');
    }
    throw error;
  }
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

// Gestión de usuarios (funciones administrativas)
export const getUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/usuarios/`);
    return response.data;
  } catch (error) {
    if (error.response) {
      const errorMessage = error.response.data?.detail || 'Error al obtener usuarios';
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor');
    } else {
      throw new Error('Error al realizar la petición');
    }
  }
};

export const createUser = async (userData) => {
  try {
    const response = await api.post('/usuarios/crear', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || "Error al crear el usuario";
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`/usuarios/editar/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || "Error al actualizar el usuario";
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/usuarios/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || "Error al eliminar el usuario";
  }
}; 