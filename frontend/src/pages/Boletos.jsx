// /pages/Boletos.jsx
import React, { useState, useEffect } from "react";
import { TextField, Button, MenuItem, Select, InputLabel, FormControl, Box, Typography } from "@mui/material";
import boletoService from "../services/boletoService";
import funcionService from "../services/funcionService";
import * as asientoService from '../services/asientoService';
import { getUsers } from '/src/services/auth';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BackToMenuButton from '../components/BackToMenuButton';

const Boletos = () => {
  const { funcionId } = useParams();
  const { user } = useAuth();
  const [boletos, setBoletos] = useState([]);
  const [funciones, setFunciones] = useState([]);
  const [asientos, setAsientos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [formData, setFormData] = useState({
    funcion_id: funcionId,
    asientos: [],
    precio_total: 0,
    usuario_id: user.id
  });

  useEffect(() => {
    const fetchData = async () => {
      const funcionesData = await funcionService.obtenerFunciones();
      const asientosData = await asientoService.obtenerAsientos();
      const usuariosData = await getUsers();
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Primero reservamos los asientos
      await asientoService.reservarAsientos(
        formData.asientos.map(a => a.id)
      );

      // Creamos los boletos
      const boletos = await Promise.all(
        formData.asientos.map(asiento => 
          boletoService.crearBoleto({
            funcion_id: parseInt(funcionId),
            asiento_id: asiento.id,
            usuario_id: user.id,
            precio: formData.precio_por_asiento,
            estado: 'vendido'
          })
        )
      );

      return boletos;
    } catch (error) {
      // Si algo falla, liberamos los asientos
      await asientoService.liberarAsientos(
        formData.asientos.map(a => a.id)
      );
      throw error;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <BackToMenuButton />
      <Typography variant="h4" gutterBottom>
        Venta de Boletos
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth>
          <InputLabel>Función</InputLabel>
          <Select
            name="funcion_id"
            value={formData.funcion_id}
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
            name="asientos"
            value={formData.asientos.map(a => a.id)}
            onChange={handleInputChange}
            required
            multiple
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
            value={formData.usuario_id}
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
          name="precio_total"
          label="Precio Total"
          type="number"
          value={formData.precio_total}
          onChange={handleInputChange}
          fullWidth
          required
        />

        <Button type="submit" variant="contained" color="primary">
          Crear Boletos
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
    </Box>
  );
};

export default Boletos;
