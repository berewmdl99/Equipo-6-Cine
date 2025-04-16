// src/pages/Dashboard.jsx

import React from "react";
import { Box, Typography, Grid, Button, Paper } from "@mui/material";
import PeopleIcon from '@mui/icons-material/People';
import MovieIcon from '@mui/icons-material/Movie';
import WeekendIcon from '@mui/icons-material/Weekend';
import EventIcon from '@mui/icons-material/Event';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import LocalMoviesIcon from '@mui/icons-material/LocalMovies';
import PrintIcon from '@mui/icons-material/Print';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { isAdmin, isEmployee, user } = useAuth();
  const navigate = useNavigate();

  const adminOptions = [
    {
      title: 'Gestión de Usuarios',
      description: 'Administrar usuarios y permisos del sistema',
      icon: <PeopleIcon fontSize="large" />,
      path: '/admin/gestion-usuarios',
      color: '#4CAF50'
    },
    {
      title: 'Gestión de Películas',
      description: 'Administrar la cartelera de películas',
      icon: <MovieIcon fontSize="large" />,
      path: '/admin/gestion-peliculas',
      color: '#2196F3'
    },
    {
      title: 'Gestión de Salas',
      description: 'Administrar las salas del cine',
      icon: <WeekendIcon fontSize="large" />,
      path: '/admin/gestion-salas',
      color: '#FF5722'
    },
    {
      title: 'Gestión de Funciones',
      description: 'Administrar horarios y funciones',
      icon: <EventIcon fontSize="large" />,
      path: '/admin/gestion-funciones',
      color: '#673AB7'
    },
    {
      title: 'Reportes de Ventas',
      description: 'Ver estadísticas y reportes de ventas',
      icon: <AssessmentIcon fontSize="large" />,
      path: '/admin/reportes-ventas',
      color: '#9C27B0'
    }
  ];

  const employeeOptions = [
    {
      title: 'Selección de Asientos',
      description: 'Seleccionar asientos para funciones',
      icon: <EventSeatIcon fontSize="large" />,
      path: '/funciones',
      color: '#F44336'
    },
    {
      title: 'Funciones',
      description: 'Ver horarios y funciones disponibles',
      icon: <LocalMoviesIcon fontSize="large" />,
      path: '/funciones',
      color: '#3F51B5'
    },
    {
      title: 'Reimpresión de Boletos',
      description: 'Reimprimir boletos por ID',
      icon: <PrintIcon fontSize="large" />,
      path: '/reimprimir-boletos',
      color: '#009688'
    }
  ];

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Bienvenido, {user?.nombre || 'Usuario'}
      </Typography>
      <Typography variant="subtitle1" gutterBottom sx={{ mb: 4 }}>
        {isAdmin ? 'Panel de Administrador' : 'Panel de Empleado'}
      </Typography>
      
      {/* Opciones de Empleado (disponibles para todos) */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Funciones Generales
      </Typography>
      <Grid container spacing={3}>
        {employeeOptions.map((option, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                  backgroundColor: option.color + '10'
                }
              }}
              onClick={() => handleNavigate(option.path)}
            >
              <Box sx={{ color: option.color, mb: 1 }}>
                {option.icon}
            </Box>
              <Typography variant="h6" align="center" gutterBottom>
                {option.title}
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary">
                {option.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Opciones de Administrador (solo para admins) */}
      {isAdmin && (
        <>
          <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
            Funciones de Administrador
          </Typography>
          <Grid container spacing={3}>
            {adminOptions.map((option, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      backgroundColor: option.color + '10'
                    }
                  }}
                  onClick={() => handleNavigate(option.path)}
                >
                  <Box sx={{ color: option.color, mb: 1 }}>
                    {option.icon}
                  </Box>
                  <Typography variant="h6" align="center" gutterBottom>
                    {option.title}
                  </Typography>
                  <Typography variant="body2" align="center" color="text.secondary">
                    {option.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Dashboard;
