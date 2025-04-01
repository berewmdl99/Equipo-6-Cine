// src/admin/GestionFunciones.jsx
import React, { useState, useEffect } from "react";
import { TextField, Button, Grid, MenuItem, FormControl, InputLabel, Select } from "@mui/material";
import { useSnackbar } from "notistack";
import funcionService from "../services/funcionService";
import { getPeliculas, createPelicula, updatePelicula, deletePelicula } from "../services/peliculaService";
import salaService from "../services/salaService";

const GestionFunciones = () => {
  const [funciones, setFunciones] = useState([]);
  const [peliculas, setPeliculas] = useState([]);
  const [salas, setSalas] = useState([]);
  const [formData, setFormData] = useState({
    id: "",
    pelicula_id: "",
    sala_id: "",
    fecha: "",
  });
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const loadData = async () => {
      try {
        const funcionesData = await funcionService.obtenerFunciones();
        const peliculasData = await peliculaService.obtenerPeliculas();
        const salasData = await salaService.obtenerSalas();
        setFunciones(funcionesData);
        setPeliculas(peliculasData);
        setSalas(salasData);
      } catch (error) {
        enqueueSnackbar("Error al cargar los datos", { variant: "error" });
      }
    };
    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectFuncion = (id) => {
    const funcion = funciones.find((f) => f.id === id);
    if (funcion) {
      setFormData({
        id: funcion.id,
        pelicula_id: funcion.pelicula_id,
        sala_id: funcion.sala_id,
        fecha: funcion.fecha,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await funcionService.actualizarFuncion(formData.id, formData);
      enqueueSnackbar("Función actualizada exitosamente", { variant: "success" });
      setFormData({
        id: "",
        pelicula_id: "",
        sala_id: "",
        fecha: "",
      });
    } catch (error) {
      enqueueSnackbar("Error al actualizar la función", { variant: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      await funcionService.eliminarFuncion(formData.id);
      enqueueSnackbar("Función eliminada exitosamente", { variant: "success" });
      setFormData({
        id: "",
        pelicula_id: "",
        sala_id: "",
        fecha: "",
      });
    } catch (error) {
      enqueueSnackbar("Error al eliminar la función", { variant: "error" });
    }
  };

  return (
    <div>
      <h2>Editar Función</h2>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Seleccionar Función</InputLabel>
            <Select
              label="Seleccionar Función"
              name="id"
              value={formData.id}
              onChange={(e) => handleSelectFuncion(e.target.value)}
              required
            >
              {funciones.map((funcion) => (
                <MenuItem key={funcion.id} value={funcion.id}>
                  {funcion.pelicula.titulo} - {funcion.sala.nombre} - {new Date(funcion.fecha).toLocaleString()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {formData.id && (
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Película</InputLabel>
                <Select
                  label="Película"
                  name="pelicula_id"
                  value={formData.pelicula_id}
                  onChange={handleInputChange}
                  required
                >
                  {peliculas.map((pelicula) => (
                    <MenuItem key={pelicula.id} value={pelicula.id}>
                      {pelicula.titulo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Sala</InputLabel>
                <Select
                  label="Sala"
                  name="sala_id"
                  value={formData.sala_id}
                  onChange={handleInputChange}
                  required
                >
                  {salas.map((sala) => (
                    <MenuItem key={sala.id} value={sala.id}>
                      {sala.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fecha"
                type="datetime-local"
                fullWidth
                name="fecha"
                value={formData.fecha}
                onChange={handleInputChange}
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Actualizar Función
          </Button>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            onClick={handleDelete}
            style={{ marginTop: "16px" }}
          >
            Eliminar Función
          </Button>
        </form>
      )}
    </div>
  );
};

export default GestionFunciones;
