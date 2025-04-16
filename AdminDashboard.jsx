// src/admin/AdminDashboard.jsx

import React from "react";
import { Box, Typography, Grid, Card, CardContent, CardActionArea, CardMedia } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PeopleIcon from '@mui/icons-material/People';
import MovieIcon from '@mui/icons-material/Movie';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BarChartIcon from '@mui/icons-material/BarChart';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const adminSections = [
    {
      title: "Gestión de Usuarios",
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      path: "/admin/gestion-usuarios",
      description: "Administrar usuarios del sistema"
    },
    {
      title: "Gestión de Películas",
      icon: <MovieIcon sx={{ fontSize: 40 }} />,
      path: "/admin/gestion-peliculas",
      description: "Agregar, editar o eliminar películas"
    },
    {
      title: "Gestión de Salas",
      icon: <EventSeatIcon sx={{ fontSize: 40 }} />,
      path: "/admin/gestion-salas",
      description: "Configurar salas y asientos"
    },
    {
      title: "Gestión de Funciones",
      icon: <CalendarMonthIcon sx={{ fontSize: 40 }} />,
      path: "/admin/gestion-funciones",
      description: "Programar funciones de películas"
    },
    {
      title: "Reportes de Ventas",
      icon: <BarChartIcon sx={{ fontSize: 40 }} />,
      path: "/admin/reportes-ventas",
      description: "Ver estadísticas y reportes de ventas"
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Panel de Administración
      </Typography>
      
      <Grid container spacing={3}>
        {adminSections.map((section) => (
          <Grid item xs={12} sm={6} md={4} key={section.title}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea onClick={() => navigate(section.path)} sx={{ height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {section.icon}
                  </Box>
                  <Typography variant="h6" component="div" gutterBottom>
                    {section.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    {section.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
