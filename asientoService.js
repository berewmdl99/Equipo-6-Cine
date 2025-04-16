import api from '../utils/api';

const ESTADOS_ASIENTO = {
  DISPONIBLE: 'disponible',
  OCUPADO: 'ocupado',
  DESHABILITADO: 'deshabilitado',
  SELECCIONADO: 'seleccionado'
};

const obtenerAsientos = async () => {
  try {
    const response = await api.get('/asientos/');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al obtener los asientos');
  }
};

const obtenerAsientosPorSala = async (salaId) => {
  try {
    const response = await api.get(`/salas/${salaId}/asientos`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al obtener los asientos de la sala');
  }
};

const obtenerAsientosPorFuncion = async (funcionId) => {
  try {
    const response = await api.get(`/funciones/${funcionId}/asientos`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al obtener los asientos de la función');
  }
};

const verificarDisponibilidad = async (asientosIds) => {
  try {
    if (!Array.isArray(asientosIds) || asientosIds.length === 0) {
      throw new Error('No se proporcionaron asientos para verificar');
    }
    
    const response = await api.post('/asientos/verificar-disponibilidad', {
      asientos_ids: asientosIds
    });
    
    if (!response.data.disponible) {
      const mensaje = response.data.asientos_no_disponibles
        .map(a => `Asiento ${a.fila}${a.numero} (${a.estado})`)
        .join(', ');
      throw new Error(`Los siguientes asientos no están disponibles: ${mensaje}`);
    }
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || error.message || 'Error al verificar disponibilidad de asientos');
  }
};

const actualizarEstadoAsiento = async (salaId, asientoId, nuevoEstado) => {
  try {
    if (!Object.values(ESTADOS_ASIENTO).includes(nuevoEstado)) {
      throw new Error(`Estado inválido. Debe ser uno de: ${Object.values(ESTADOS_ASIENTO).join(', ')}`);
    }

    const response = await api.patch(`/salas/${salaId}/asiento/${asientoId}`, {
      estado: nuevoEstado
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al actualizar el estado del asiento');
  }
};

const reservarAsientos = async (funcionId, asientosIds) => {
  try {
    if (!Array.isArray(asientosIds) || asientosIds.length === 0) {
      throw new Error('No se proporcionaron asientos para reservar');
    }
    
    const requestData = {
      funcion_id: Number(funcionId),
      asientos_ids: asientosIds.map(id => Number(id))
    };
    
    console.log('Datos a enviar en reservarAsientos:', requestData);
    
    const response = await api.post('/asientos/reservar', requestData);
    
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error completo en reservarAsientos:', error.response?.data);
    throw new Error(error.response?.data?.detail || 'Error al reservar los asientos');
  }
};

const liberarAsientos = async (funcionId, asientosIds) => {
  try {
    if (!Array.isArray(asientosIds) || asientosIds.length === 0) {
      throw new Error('No se proporcionaron asientos para liberar');
    }
    
    // Primero verificamos el estado de los asientos
    const verificacion = await api.post('/asientos/verificar-disponibilidad', {
      asientos_ids: asientosIds
    });
    
    // Solo intentamos liberar si los asientos no están disponibles
    if (!verificacion.data.disponible) {
      const response = await api.post('/asientos/liberar', {
        asientos_ids: asientosIds
      });
      return response.data;
    }
    
    // Si los asientos ya están disponibles, retornamos éxito
    return { mensaje: "Los asientos ya están disponibles" };
  } catch (error) {
    console.error('Error al liberar asientos:', error);
    // No lanzamos el error si los asientos ya están disponibles
    if (error.response?.status === 400 && error.response?.data?.detail?.includes('no está seleccionado u ocupado')) {
      return { mensaje: "Los asientos ya están disponibles" };
    }
    throw new Error(error.response?.data?.detail || 'Error al liberar los asientos');
  }
};

const seleccionarAsientos = async (funcionId, asientosIds) => {
  try {
    if (!Array.isArray(asientosIds) || asientosIds.length === 0) {
      throw new Error('No se proporcionaron asientos para seleccionar');
    }
    
    const response = await api.post(`/funciones/${funcionId}/seleccionar-asientos`, {
      asientos_ids: asientosIds
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al seleccionar los asientos');
  }
};

const asientoService = {
  obtenerAsientos,
  obtenerAsientosPorSala,
  obtenerAsientosPorFuncion,
  verificarDisponibilidad,
  actualizarEstadoAsiento,
  reservarAsientos,
  liberarAsientos,
  seleccionarAsientos,
  ESTADOS_ASIENTO
};

export default asientoService;
