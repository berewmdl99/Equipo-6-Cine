// src/services/funcionService.js
import api from "../utils/api";

const obtenerFuncion = async (id) => {
  try {
    const response = await api.get(`/funciones/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const obtenerFunciones = async () => {
  try {
    const response = await api.get('/funciones/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

const funcionService = {
  obtenerFuncion,
  obtenerFunciones,

  crearFuncion: async (datos) => {
    try {
      console.log('Datos recibidos en crearFuncion:', datos);
      // Validar campos requeridos
      if (!datos.pelicula_id || !datos.sala_id || !datos.fecha || !datos.hora || !datos.precio_base) {
        console.log('Campos faltantes:', {
          pelicula_id: !datos.pelicula_id,
          sala_id: !datos.sala_id,
          fecha: !datos.fecha,
          hora: !datos.hora,
          precio_base: !datos.precio_base
        });
        throw new Error('Todos los campos son requeridos');
      }

      // Convertir y validar fecha
      let fechaFormateada;
      if (datos.fecha instanceof Date) {
        fechaFormateada = datos.fecha.toISOString().split('T')[0];
      } else {
        fechaFormateada = datos.fecha;
      }

      // Convertir y validar hora
      let horaFormateada;
      if (datos.hora instanceof Date) {
        horaFormateada = datos.hora.toTimeString().split(' ')[0];
      } else {
        horaFormateada = datos.hora;
      }

      // Validar fecha futura
      const fechaActual = new Date().toISOString().split('T')[0];
      if (fechaFormateada < fechaActual) {
        throw new Error("La fecha de la función debe ser en el futuro");
      }

      // Validar precio base
      const precioBase = parseFloat(datos.precio_base);
      if (isNaN(precioBase) || precioBase <= 0) {
        throw new Error('El precio base debe ser un número mayor que 0');
      }

      const datosFormateados = {
        pelicula_id: parseInt(datos.pelicula_id),
        sala_id: parseInt(datos.sala_id),
        fecha: fechaFormateada,
        hora: horaFormateada,
        precio_base: precioBase
      };

      console.log('Datos formateados a enviar al backend:', datosFormateados);

      const response = await api.post("/funciones/", datosFormateados);
      
      console.log('Respuesta del backend:', response.data);
      
      if (response.data && response.data.id) {
        return response.data;
      } else {
        throw new Error('La respuesta del servidor no contiene los datos esperados');
      }
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Detalles del error:', {
        mensaje: error.message,
        respuesta: error.response?.data,
        status: error.response?.status
      });
      
      // Extraer el mensaje de error más específico
      let errorMessage = 'Error al crear la función';
      
      if (error.response) {
        // Error del servidor con respuesta
        if (error.response.data && error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.status === 403) {
          errorMessage = 'No tienes permisos para crear funciones';
        } else if (error.response.status === 404) {
          errorMessage = 'Película o sala no encontrada';
        } else if (error.response.status === 400) {
          errorMessage = 'Datos inválidos: ' + (error.response.data.detail || 'Verifica los datos ingresados');
        }
      } else if (error.request) {
        // Error de red
        errorMessage = 'Error de conexión. Verifica tu conexión a internet';
      } else if (error.message) {
        // Error local
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  actualizarFuncion: async (funcion_id, datos) => {
    try {
      if (!funcion_id) {
        throw new Error('El ID de la función es requerido');
      }

      // Validar precio base si se está actualizando
      if (datos.precio_base !== undefined) {
        if (isNaN(datos.precio_base) || datos.precio_base <= 0) {
          throw new Error('El precio base debe ser un número mayor que 0');
        }
      }

      // Solo enviar campos que se actualizaron
      const datosActualizados = {};
      if (datos.pelicula_id) datosActualizados.pelicula_id = parseInt(datos.pelicula_id);
      if (datos.sala_id) datosActualizados.sala_id = parseInt(datos.sala_id);
      if (datos.fecha) datosActualizados.fecha = datos.fecha;
      if (datos.hora) datosActualizados.hora = datos.hora;
      if (datos.precio_base) datosActualizados.precio_base = parseFloat(datos.precio_base);

      const response = await api.put(`/funciones/${funcion_id}`, datosActualizados);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || error.message || 'Error al actualizar la función');
    }
  },

  eliminarFuncion: async (funcion_id) => {
    try {
      if (!funcion_id) {
        throw new Error('El ID de la función es requerido');
      }
      const response = await api.delete(`/funciones/${funcion_id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Error al eliminar la función');
    }
  },

  validarDisponibilidadSala: async (sala_id, fecha, hora) => {
    try {
      if (!sala_id || !fecha || !hora) {
        throw new Error('Sala, fecha y hora son requeridos');
      }
      
      // Convertir y validar fecha
      let fechaFormateada;
      if (fecha instanceof Date) {
        fechaFormateada = fecha.toISOString().split('T')[0];
      } else {
        fechaFormateada = fecha;
      }

      // Convertir y validar hora
      let horaFormateada;
      if (hora instanceof Date) {
        horaFormateada = hora.toTimeString().split(' ')[0];
      } else {
        horaFormateada = hora;
      }
      
      console.log('Validando disponibilidad:', { 
        sala_id, 
        fecha: fechaFormateada, 
        hora: horaFormateada,
        tipoFecha: typeof fecha,
        tipoHora: typeof hora,
        esFechaDate: fecha instanceof Date,
        esHoraDate: hora instanceof Date
      });
      
      const response = await api.post('/funciones/validar-disponibilidad', {
        sala_id: parseInt(sala_id),
        fecha: fechaFormateada,
        hora: horaFormateada
      });
      
      console.log('Respuesta de validación:', response.data);
      
      if (response.data && response.data.disponible === true) {
        return response.data;
      } else {
        throw new Error('La sala no está disponible en el horario seleccionado');
      }
    } catch (error) {
      console.error('Error al validar disponibilidad:', error);
      console.error('Detalles del error:', {
        mensaje: error.message,
        respuesta: error.response?.data,
        status: error.response?.status,
        datos: { sala_id, fecha, hora }
      });
      
      // Extraer el mensaje de error más específico
      let errorMessage = 'Error al validar disponibilidad de la sala';
      
      if (error.response) {
        if (error.response.data && error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.status === 404) {
          errorMessage = 'Sala no encontrada';
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.detail || 'Error en los datos proporcionados';
        } else if (error.response.status === 500) {
          errorMessage = 'Error interno del servidor al validar disponibilidad';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }
};

export default funcionService;
