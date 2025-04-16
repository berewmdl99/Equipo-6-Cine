import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Container, Typography, Button, Alert, CircularProgress, Paper } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import MapaAsientos from './MapaAsientos';
import * as funcionService from '../services/funcionService';
import * as asientoService from '../services/asientoService';

const SeleccionAsientos = () => {
  const { funcionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [funcion, setFuncion] = useState(null);
  const [asientos, setAsientos] = useState([]);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState([]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);

        // Verificar que funcionId sea válido
        if (!funcionId || isNaN(funcionId)) {
          throw new Error('ID de función inválido');
        }

        // Cargar datos de la función
        const funcionData = await funcionService.obtenerFuncionPorId(funcionId);
        if (!funcionData) {
          throw new Error('No se encontró la función especificada');
        }
        setFuncion(funcionData);
        
        // Cargar asientos de la función
        const asientosData = await asientoService.obtenerAsientosPorFuncion(funcionId);
        setAsientos(asientosData);
      } catch (err) {
        setError(err.message || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [funcionId]);

  const handleSeleccionAsiento = (asiento) => {
    setAsientosSeleccionados(prevSeleccionados => {
      const yaSeleccionado = prevSeleccionados.some(a => a.id === asiento.id);
      if (yaSeleccionado) {
        return prevSeleccionados.filter(a => a.id !== asiento.id);
      }
      return [...prevSeleccionados, asiento];
    });
  };

  const handleContinuar = async () => {
    if (asientosSeleccionados.length === 0) {
      setError('Debe seleccionar al menos un asiento');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      // Verificar disponibilidad de asientos
      const asientosIds = asientosSeleccionados.map(asiento => asiento.id);
      const disponibilidad = await asientoService.verificarDisponibilidad(asientosIds);
      
      if (!disponibilidad.disponibles) {
        throw new Error('Algunos asientos seleccionados ya no están disponibles');
      }

      // Reservar asientos
      await asientoService.reservarAsientos(asientosIds);
      
      // Navegar a la página de pago con los datos necesarios
      navigate('/pago', {
        state: {
          funcionId,
          asientosIds,
          total: asientosSeleccionados.length * funcion.precio,
          funcion: {
            titulo: funcion.pelicula.titulo,
            fecha: funcion.fecha,
            hora: funcion.hora,
            sala: funcion.sala.nombre
          }
        }
      });
    } catch (err) {
      setError(err.message || 'Error al procesar la selección');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!funcion) {
    return (
      <Container maxWidth="sm">
        <Alert severity="warning" sx={{ mt: 2 }}>
          No se encontró la función especificada
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Selección de Asientos
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {funcion.pelicula.titulo}
          </Typography>
          <Typography variant="body1">
            Fecha: {new Date(funcion.fecha).toLocaleDateString()}
          </Typography>
          <Typography variant="body1">
            Hora: {funcion.hora}
          </Typography>
          <Typography variant="body1">
            Sala: {funcion.sala.nombre}
          </Typography>
          <Typography variant="body1">
            Precio por asiento: ${funcion.precio}
          </Typography>
        </Paper>
              
              <MapaAsientos
                asientos={asientos}
                asientosSeleccionados={asientosSeleccionados}
                onSeleccionAsiento={handleSeleccionAsiento}
        />

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Total: ${(asientosSeleccionados.length * funcion.precio).toFixed(2)}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            disabled={asientosSeleccionados.length === 0 || loading}
            onClick={handleContinuar}
          >
            {loading ? <CircularProgress size={24} /> : 'Continuar a Pago'}
                </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default SeleccionAsientos; 