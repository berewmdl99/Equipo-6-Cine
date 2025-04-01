// src/pages/Dashboard.jsx

import React from "react";
import { Box, Typography, Grid } from "@mui/material";

const Dashboard = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Bienvenido al Dashboard
      </Typography>
      <Grid container spacing={3}>
        {/* Aquí podrías agregar estadísticas o enlaces a las funcionalidades principales */}
        <Grid item xs={12} md={6}>
          <Box p={2} border={1} borderRadius={1}>
            <Typography variant="h6">Estadísticas de Películas</Typography>
            {/* Contenido o visualización de estadísticas */}
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box p={2} border={1} borderRadius={1}>
            <Typography variant="h6">Estadísticas de Funciones</Typography>
            {/* Contenido o visualización de estadísticas */}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
