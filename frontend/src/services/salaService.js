// src/services/salaService.js
import api from "../utils/api";

const obtenerSalas = async () => {
  const response = await api.get("/salas/");
  return response.data;
};

const crearSala = async (datos) => {
  const response = await api.post("/salas/", datos);
  return response.data;
};

const actualizarSala = async (id, datos) => {
  const response = await api.put(`/salas/${id}`, datos);
  return response.data;
};

const eliminarSala = async (id) => {
  await api.delete(`/salas/${id}`);
};

const salaService = {
  obtenerSalas,
  crearSala,
  actualizarSala,
  eliminarSala,
};

export default salaService;
