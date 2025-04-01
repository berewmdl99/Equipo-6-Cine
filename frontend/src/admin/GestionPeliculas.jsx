import React, { useState, useEffect } from "react";
import { TextField, Button, Grid, MenuItem, FormControl, InputLabel, Select } from "@mui/material";
import { useSnackbar } from "notistack";
import funcionService from "../services/funcionService";
import { getPeliculas, createPelicula, updatePelicula, deletePelicula } from "../services/peliculaService";
import salaService from "../services/salaService";

const Funciones = () => {
  const [funciones, setFunciones] = useState([]);
  const [peliculas, setPeliculas] = useState([]);
  const [salas, setSalas] = useState([]);
  const [formData, setFormData] = useState({
    pelicula_id: "",
    sala_id: "",
    fecha: "",
  });
  const { enqueueSnackbar } = useSnackbar();

  // Cargar funciones, películas y salas al montar el componente
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await funcionService.crearFuncion(formData);
      enqueueSnackbar("Función creada exitosamente", { variant: "success" });
      setFormData({
        pelicula_id: "",
        sala_id: "",
        fecha: "",
      });
    } catch (error) {
      enqueueSnackbar("Error al crear la función", { variant: "error" });
    }
  };

  return (
    <div>
      <h2>Crear Función</h2>
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
          Crear Función
        </Button>
      </form>
    </div>
  );
};

export default Funciones;
