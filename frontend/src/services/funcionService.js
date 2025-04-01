// src/services/funcionService.js
import api from "../utils/api";

const obtenerFunciones = async () => {
  const response = await api.get("/funciones/");
  return response.data;
};

const crearFuncion = async (datos) => {
  const response = await api.post("/funciones/", datos);
  return response.data;
};

const actualizarFuncion = async (id, datos) => {
  const response = await api.put(`/funciones/${id}`, datos);
  return response.data;
};

const eliminarFuncion = async (id) => {
  await api.delete(`/funciones/${id}`);
};

const funcionService = {
  obtenerFunciones,
  crearFuncion,
  actualizarFuncion,
  eliminarFuncion,
};

export default funcionService;
