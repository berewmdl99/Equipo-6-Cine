// /pages/Boletos.jsx
import React, { useState, useEffect } from "react";
import { TextField, Button, MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import boletoService from "../services/boletoService";
import funcionService from "../services/funcionService";
import * as asientoService from '../services/asientoService';
import * as usuarioService from "../services/usuarioService";

const Boletos = () => {
  const [boletos, setBoletos] = useState([]);
  const [funciones, setFunciones] = useState([]);
  const [asientos, setAsientos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoBoleto, setNuevoBoleto] = useState({
    funcion_id: "",
    asiento_id: "",
    usuario_id: "",
    precio: "",
    estado: "Activo",
  });

  useEffect(() => {
    const fetchData = async () => {
      const funcionesData = await funcionService.obtenerFunciones();
      const asientosData = await asientoService.obtenerAsientos();
      const usuariosData = await usuarioService.obtenerUsuarios();
      setFunciones(funcionesData);
      setAsientos(asientosData);
      setUsuarios(usuariosData);
    };

    fetchData();
    obtenerBoletos();
  }, []);

  const obtenerBoletos = async () => {
    const data = await boletoService.obtenerBoletos();
    setBoletos(data);
  };

  const handleInputChange = (e) => {
    setNuevoBoleto({ ...nuevoBoleto, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await boletoService.crearBoleto(nuevoBoleto);
      setNuevoBoleto({ funcion_id: "", asiento_id: "", usuario_id: "", precio: "", estado: "Activo" });
      obtenerBoletos(); // Recargar los boletos después de crear uno nuevo
    } catch (error) {
      console.error("Error al crear boleto:", error);
    }
  };

  return (
    <div>
      <h2>Gestionar Boletos</h2>
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth>
          <InputLabel>Función</InputLabel>
          <Select
            name="funcion_id"
            value={nuevoBoleto.funcion_id}
            onChange={handleInputChange}
            required
          >
            {funciones.map((funcion) => (
              <MenuItem key={funcion.id} value={funcion.id}>
                {funcion.pelicula.nombre} - {funcion.sala.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth>
          <InputLabel>Asiento</InputLabel>
          <Select
            name="asiento_id"
            value={nuevoBoleto.asiento_id}
            onChange={handleInputChange}
            required
          >
            {asientos.map((asiento) => (
              <MenuItem key={asiento.id} value={asiento.id}>
                {asiento.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth>
          <InputLabel>Usuario</InputLabel>
          <Select
            name="usuario_id"
            value={nuevoBoleto.usuario_id}
            onChange={handleInputChange}
            required
          >
            {usuarios.map((usuario) => (
              <MenuItem key={usuario.id} value={usuario.id}>
                {usuario.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          name="precio"
          label="Precio"
          type="number"
          value={nuevoBoleto.precio}
          onChange={handleInputChange}
          fullWidth
          required
        />

        <Button type="submit" variant="contained" color="primary">
          Crear Boleto
        </Button>
      </form>

      <h3>Boletos Vendidos</h3>
      <ul>
        {boletos.map((boleto) => (
          <li key={boleto.id}>
            {boleto.funcion.pelicula.nombre} - {boleto.funcion.sala.nombre} - Asiento: {boleto.asiento.nombre} - Usuario: {boleto.usuario.nombre} - Precio: {boleto.precio}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Boletos;
