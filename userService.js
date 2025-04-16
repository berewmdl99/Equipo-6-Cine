import api from '../utils/api';

// Obtener todos los usuarios
export const getUsers = async () => {
  try {
    const response = await api.get('/usuarios/');
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw new Error(error.response?.data?.detail || 'Error al obtener usuarios');
  }
};

// Crear un nuevo usuario
export const createUser = async (userData) => {
  try {
    // Asegurarse de que todos los campos requeridos estén presentes
    if (!userData.nombre || !userData.username || !userData.email || !userData.password) {
      throw new Error('Todos los campos son requeridos');
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error('El formato del email no es válido');
    }

    // Validar longitud de contraseña
    if (userData.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    const response = await api.post('/usuarios/crear', userData);
    return response.data;
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw new Error(error.response?.data?.detail || error.message || 'Error al crear usuario');
  }
};

// Actualizar un usuario existente
export const updateUser = async (userId, userData) => {
  try {
    if (!userId) {
      throw new Error('ID de usuario requerido');
    }

    // Validar formato de email si se está actualizando
    if (userData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new Error('El formato del email no es válido');
      }
    }

    // Validar longitud de contraseña si se está actualizando
    if (userData.password && userData.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    const response = await api.put(`/usuarios/editar/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw new Error(error.response?.data?.detail || error.message || 'Error al actualizar usuario');
  }
};

// Eliminar un usuario
export const deleteUser = async (userId) => {
  try {
    if (!userId) {
      throw new Error('ID de usuario requerido');
    }

    const response = await api.delete(`/usuarios/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw new Error(error.response?.data?.detail || 'Error al eliminar usuario');
  }
}; 