// /pages/Funciones.jsx
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
import funcionService from '../services/funcionService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import BackToMenuButton from '../components/BackToMenuButton';
import api from '../utils/api';

const Funciones = () => {
  const [funciones, setFunciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    loadFunciones();
  }, []);

  const loadFunciones = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await funcionService.obtenerFunciones();
      setFunciones(data);
    } catch (error) {
      setError(error.message || 'Error al cargar las funciones');
      enqueueSnackbar(error.message || 'Error al cargar las funciones', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleComprar = (funcionId) => {
    navigate(`/seleccion-asientos/${funcionId}`);
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

  if (funciones.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Alert severity="info">No hay funciones disponibles en este momento</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <BackToMenuButton />
      <Typography variant="h4" gutterBottom>
        Funciones Disponibles
      </Typography>
      <Grid container spacing={4}>
        {funciones.map((funcion) => (
          <Grid item xs={12} sm={6} md={4} key={funcion.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="300"
                image={funcion.pelicula?.imagen_url ? `${api.defaults.baseURL}${funcion.pelicula.imagen_url}` : '/placeholder.jpg'}
                alt={funcion.pelicula?.titulo}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  {funcion.pelicula?.titulo || 'Película no disponible'}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Sala: {funcion.sala?.nombre || 'Sala no disponible'}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Fecha: {format(new Date(funcion.fecha), 'EEEE d MMMM yyyy', { locale: es })}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Hora: {funcion.hora}
                </Typography>
                <Typography variant="h6" color="primary" gutterBottom>
                  Precio: ${funcion.precio_base}
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  onClick={() => handleComprar(funcion.id)}
                >
                  Comprar Entradas
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Funciones;
