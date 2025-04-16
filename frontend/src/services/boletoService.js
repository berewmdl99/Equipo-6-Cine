// /services/boletoService.js
import api from "../utils/api";

const obtenerBoletos = async () => {
  try {
    const response = await api.get("/boletos/");
    return response.data;
  } catch (error) {
    console.error("Error al obtener boletos:", error);
    throw new Error(error.response?.data?.detail || 'Error al obtener los boletos');
  }
};

const obtenerBoletoPorId = async (boletoId) => {
  try {
    if (!boletoId) {
      throw new Error('El ID del boleto es requerido');
    }
    const response = await api.get(`/boletos/${boletoId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al obtener el boleto');
  }
};

const crearBoleto = async (datos) => {
  try {
    if (!datos.funcion_id || !datos.asientos_ids || !datos.usuario_id) {
      throw new Error('Datos incompletos para crear el boleto');
    }
    
    const response = await api.post("/boletos/", {
      funcion_id: datos.funcion_id,
      asientos_ids: datos.asientos_ids,
      usuario_id: datos.usuario_id,
      precio_total: datos.precio_total
    });
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al crear el boleto');
  }
};

const cancelarBoleto = async (boletoId) => {
  try {
    if (!boletoId) {
      throw new Error('El ID del boleto es requerido');
    }
    const response = await api.post(`/boletos/${boletoId}/cancelar`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al cancelar el boleto');
  }
};

const realizarPago = async (boletoId, datosPago) => {
  try {
    if (!boletoId) {
      throw new Error('El ID del boleto es requerido');
    }
    if (!datosPago.metodo_pago || !datosPago.monto) {
      throw new Error('Datos de pago incompletos');
    }
    
    const response = await api.post(`/boletos/${boletoId}/pagar`, datosPago);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al procesar el pago');
  }
};

const imprimirBoleto = async (boletoId) => {
  try {
    if (!boletoId) {
      throw new Error('El ID del boleto es requerido');
    }
    const response = await api.get(`/boletos/${boletoId}/imprimir`, {
      responseType: 'blob'
    });
    
    // Crear URL para el blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `boleto-${boletoId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al imprimir el boleto');
  }
};

const reimprimirBoleto = async (boletoId) => {
  try {
    if (!boletoId) {
      throw new Error('El ID del boleto es requerido');
    }
    const response = await api.get(`/boletos/${boletoId}/reimprimir`, {
      responseType: 'blob'
    });
    
    // Crear URL para el blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `boleto-${boletoId}-reimpreso.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al reimprimir el boleto');
  }
};

const boletoService = {
  obtenerBoletos,
  obtenerBoletoPorId,
  crearBoleto,
  cancelarBoleto,
  realizarPago,
  imprimirBoleto,
  reimprimirBoleto
};

export default boletoService;
