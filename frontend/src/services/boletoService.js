// /services/boletoService.js
import api from "../utils/api";

const obtenerBoletos = async () => {
  const response = await api.get("/boletos/");
  return response.data;
};

const crearBoleto = async (datos) => {
  const response = await api.post("/boletos/", datos);
  return response.data;
};

const cancelarBoleto = async (id) => {
  await api.delete(`/boletos/${id}`);
};

const boletoService = {
  obtenerBoletos,
  crearBoleto,
  cancelarBoleto,
};

export default boletoService;
