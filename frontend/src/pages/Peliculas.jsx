// src/pages/Peliculas.jsx

import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Button,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { getPeliculas } from '../services/peliculaService';
import BackToMenuButton from '../components/BackToMenuButton';
import api from '../utils/api';

const Peliculas = () => {
  const [peliculas, setPeliculas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    cargarPeliculas();
  }, []);

  const cargarPeliculas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPeliculas();
      setPeliculas(data);
    } catch (error) {
      setError(error.message || 'Error al cargar las películas');
      enqueueSnackbar(error.message || 'Error al cargar las películas', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const verFunciones = (peliculaId) => {
    navigate(`/funciones?pelicula=${peliculaId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (peliculas.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Alert severity="info">No hay películas disponibles en este momento</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <BackToMenuButton />
      <Typography variant="h4" gutterBottom>
        Películas en Cartelera
      </Typography>
      <Grid container spacing={4}>
        {peliculas.map((pelicula) => (
          <Grid item xs={12} sm={6} md={4} key={pelicula.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="400"
                image={pelicula.imagen_url ? `${api.defaults.baseURL}/${pelicula.imagen_url}` : '/placeholder.jpg'}
                alt={pelicula.titulo}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  {pelicula.titulo}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {pelicula.descripcion}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Duración: {pelicula.duracion_min} minutos
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Clasificación: {pelicula.clasificacion}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Género: {pelicula.genero}
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  onClick={() => verFunciones(pelicula.id)}
                >
                  Ver Funciones
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Peliculas;
