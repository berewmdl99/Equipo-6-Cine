// src/admin/GestionSalas.jsx
import React, { useState, useEffect } from "react";
import { TextField, Button, Grid, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { useSnackbar } from "notistack";
import salaService from "../services/salaService";

const GestionSalas = () => {
  const [salas, setSalas] = useState([]);
  const [formData, setFormData] = useState({
    id: "",
    nombre: "",
    capacidad: "",
  });
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const loadSalas = async () => {
      try {
        const salasData = await salaService.obtenerSalas();
        setSalas(salasData);
      } catch (error) {
        enqueueSnackbar("Error al cargar las salas", { variant: "error" });
      }
    };
    loadSalas();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectSala = (id) => {
    const sala = salas.find((s) => s.id === id);
    if (sala) {
      setFormData({
        id: sala.id,
        nombre: sala.nombre,
        capacidad: sala.capacidad,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await salaService.actualizarSala(formData.id, formData);
      enqueueSnackbar("Sala actualizada exitosamente", { variant: "success" });
      setFormData({
        id: "",
        nombre: "",
        capacidad: "",
      });
    } catch (error) {
      enqueueSnackbar("Error al actualizar la sala", { variant: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      await salaService.eliminarSala(formData.id);
      enqueueSnackbar("Sala eliminada exitosamente", { variant: "success" });
      setFormData({
        id: "",
        nombre: "",
        capacidad: "",
      });
    } catch (error) {
      enqueueSnackbar("Error al eliminar la sala", { variant: "error" });
    }
  };

  return (
    <div>
      <h2>Editar Sala</h2>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Seleccionar Sala</InputLabel>
            <Select
              label="Seleccionar Sala"
              name="id"
              value={formData.id}
              onChange={(e) => handleSelectSala(e.target.value)}
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
      </Grid>

      {formData.id && (
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre de la Sala"
                fullWidth
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Capacidad"
                type="number"
                fullWidth
                name="capacidad"
                value={formData.capacidad}
                onChange={handleInputChange}
                required
              />
            </Grid>
          </Grid>
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Actualizar Sala
          </Button>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            onClick={handleDelete}
            style={{ marginTop: "16px" }}
          >
            Eliminar Sala
          </Button>
        </form>
      )}
    </div>
  );
};

export default GestionSalas;
