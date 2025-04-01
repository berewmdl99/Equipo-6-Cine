// /pages/Funciones.jsx
import React, { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, Grid } from "@mui/material";
import funcionService from "../services/funcionService";

const Funciones = () => {
  const [funciones, setFunciones] = useState([]);

  useEffect(() => {
    const fetchFunciones = async () => {
      try {
        const data = await funcionService.obtenerFunciones();
        setFunciones(data);
      } catch (error) {
        console.error("Error al obtener funciones:", error);
      }
    };
    fetchFunciones();
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Funciones Disponibles 🎥
      </Typography>
      <Grid container spacing={3}>
        {funciones.map((funcion) => (
          <Grid item xs={12} sm={6} md={4} key={funcion.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{funcion.pelicula.titulo}</Typography>
                <Typography>Fecha: {funcion.fecha}</Typography>
                <Typography>Hora: {funcion.hora}</Typography>
                <Typography>Sala: {funcion.sala.nombre}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Funciones;
