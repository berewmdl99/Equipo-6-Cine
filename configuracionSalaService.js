import api from '../utils/api';

const ESTADOS_ASIENTO = {
  DISPONIBLE: 'disponible',
  OCUPADO: 'ocupado',
  SELECCIONADO: 'seleccionado',
  DESHABILITADO: 'deshabilitado'
};

export const configuracionSalaService = {
  async obtenerConfiguracionSala(salaId) {
    try {
      const response = await api.get(`/configuracion-salas/${salaId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener configuración de sala:', error);
      throw error;
    }
  },

  async agregarFila(salaId, filaData) {
    try {
      console.log('Datos enviados:', {
        salaId,
        filaData: {
          letra: filaData.letra,
          asientos_por_fila: filaData.asientos_por_fila
        }
      });

      const response = await api.post(`/configuracion-salas/${salaId}/filas`, {
        letra: filaData.letra,
        asientos_por_fila: filaData.asientos_por_fila
      });
      return response.data;
    } catch (error) {
      console.error('Error al agregar fila:', error);
      if (error.response) {
        console.error('Detalles del error:', error.response.data);
      }
      throw error;
    }
  },

  async eliminarFila(salaId, letraFila) {
    try {
      const response = await api.delete(`/configuracion-salas/${salaId}/filas/${letraFila}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar fila:', error);
      throw error;
    }
  },

  async actualizarEstadoAsiento(asientoId, estadoData) {
    try {
      const response = await api.put(`/configuracion-salas/asientos/${asientoId}/estado`, {
        estado: estadoData.estado.toLowerCase()
      });
      return response.data;
    } catch (error) {
      console.error('Error al actualizar estado de asiento:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw error;
    }
  },

  async toggleEstadoAsiento(asientoId, estadoActual) {
    try {
      const nuevoEstado = estadoActual === ESTADOS_ASIENTO.DISPONIBLE 
        ? ESTADOS_ASIENTO.DESHABILITADO 
        : ESTADOS_ASIENTO.DISPONIBLE;

      const response = await api.put(`/configuracion-salas/asientos/${asientoId}/estado`, {
        estado: nuevoEstado
      });
      return response.data;
    } catch (error) {
      console.error('Error al cambiar estado de asiento:', error);
      throw error;
    }
  }
};
