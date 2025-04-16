import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import { useSnackbar } from 'notistack';
import MapaAsientos from '../components/MapaAsientos';
import asientoService from '../services/asientoService';
import funcionService from '../services/funcionService';
import BackToMenuButton from '../components/BackToMenuButton';

const SeleccionAsientos = () => {
  const { funcionId } = useParams();
  const navigate = useNavigate();
  const [asientos, setAsientos] = useState([]);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState([]);
  const [precioUnitario, setPrecioUnitario] = useState(0);
  const [funcion, setFuncion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    cargarDatosFuncion();
  }, [funcionId]);

  const resetearAsientosSeleccionados = async () => {
    try {
      const asientosSeleccionados = asientos.filter(a => a.estado === 'seleccionado');
      if (asientosSeleccionados.length > 0) {
        // Actualizar el estado de los asientos en el backend a 'disponible'
        await Promise.all(asientosSeleccionados.map(async (asiento) => {
          await asientoService.actualizarEstadoAsiento(funcion.sala.id, asiento.id, 'disponible');
        }));
      }
    } catch (error) {
      console.error('Error al resetear asientos:', error);
    }
  };

  const cargarDatosFuncion = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar datos de la función
      const funcionData = await funcionService.obtenerFuncion(funcionId);
      setFuncion(funcionData);
      setPrecioUnitario(funcionData.precio_base);
      
      // Cargar asientos
      const response = await asientoService.obtenerAsientosPorFuncion(funcionId);
      
      // Convertir el objeto de filas a un array plano de asientos
      const asientosArray = Object.entries(response.filas).flatMap(([fila, asientos]) =>
        asientos.map(asiento => ({
          ...asiento,
          fila,
          estado_configuracion: 'habilitado', // Por defecto todos están habilitados
          estado_venta: asiento.estado // Usar el estado que viene del backend
        }))
      );
      
      setAsientos(asientosArray);
      
      // Resetear asientos que quedaron seleccionados
      await resetearAsientosSeleccionados();
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError(error.message || 'Error al cargar los datos');
      enqueueSnackbar(error.message || 'Error al cargar los datos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAsientoClick = async (asiento) => {
    try {
      // Verificar si el asiento está deshabilitado por el administrador
      if (asiento.estado_configuracion !== 'habilitado') {
        enqueueSnackbar('Este asiento está deshabilitado', { variant: 'warning' });
        return;
      }

      // Verificar si el asiento está ocupado
      if (asiento.estado_venta === 'ocupado') {
        enqueueSnackbar('Este asiento ya está ocupado', { variant: 'warning' });
        return;
      }

      // Verificar disponibilidad actual del asiento
      const disponibilidad = await asientoService.verificarDisponibilidad([asiento.id]);
      if (!disponibilidad.disponible) {
        enqueueSnackbar('Este asiento ya no está disponible', { variant: 'warning' });
        // Actualizar el estado del asiento en la lista
        setAsientos(prev => prev.map(a => 
          a.id === asiento.id ? { ...a, estado_venta: 'ocupado' } : a
        ));
        return;
      }

      // Manejar la selección/deselección del asiento
      const yaSeleccionado = asientosSeleccionados.find(a => a.id === asiento.id);
      if (yaSeleccionado) {
        setAsientosSeleccionados(prev => prev.filter(a => a.id !== asiento.id));
      } else {
        setAsientosSeleccionados(prev => [...prev, asiento]);
      }
    } catch (error) {
      console.error('Error al verificar disponibilidad:', error);
      enqueueSnackbar('Error al verificar disponibilidad del asiento', { variant: 'error' });
    }
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
      const asientosIds = asientosSeleccionados.map(asiento => Number(asiento.id));
      const disponibilidad = await asientoService.verificarDisponibilidad(asientosIds);
      
      if (!disponibilidad.disponible) {
        const mensaje = disponibilidad.asientos_no_disponibles
          .map(a => `Asiento ${a.fila}${a.numero}`)
          .join(', ');
        throw new Error(`Los siguientes asientos ya no están disponibles: ${mensaje}`);
      }

      console.log('Datos antes de reservar:', {
        funcionId,
        asientosIds,
        asientosSeleccionados
      });

      // Reservar asientos
      await asientoService.reservarAsientos(funcionId, asientosIds);
      
      // Navegar a la página de pago con los datos necesarios
      navigate('/pago', {
        state: {
          funcionId: Number(funcionId),
          asientos: asientosSeleccionados.map(asiento => ({
            id: asiento.id,
            fila: asiento.fila,
            numero: asiento.numero
          })),
          total: asientosSeleccionados.length * precioUnitario,
          funcion: {
            id: funcion.id,
            titulo: funcion.pelicula.titulo,
            fecha: funcion.fecha,
            hora: funcion.hora,
            sala: funcion.sala.nombre,
            precio_unitario: precioUnitario
          }
        },
        replace: false
      });
    } catch (err) {
      setError(err.message || 'Error al procesar la selección');
      setLoading(false);
    }
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
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
        <Box mt={2}>
          <BackToMenuButton />
        </Box>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Selección de Asientos
        </Typography>
        <BackToMenuButton />
      </Box>
      
      {funcion && (
        <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6">
            {funcion.pelicula?.titulo || 'Película no disponible'}
          </Typography>
          <Typography>
            Sala: {funcion.sala?.nombre || 'Sala no disponible'} | 
            Fecha: {new Date(funcion.fecha).toLocaleDateString()} | 
            Hora: {funcion.hora}
          </Typography>
          <Typography>
            Precio por asiento: ${precioUnitario.toFixed(2)}
          </Typography>
        </Paper>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <MapaAsientos
              asientos={asientos}
              asientosSeleccionados={asientosSeleccionados}
              onAsientoClick={handleAsientoClick}
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Resumen
            </Typography>
            <Typography gutterBottom>
              Asientos Seleccionados: {asientosSeleccionados.length}
            </Typography>
            {asientosSeleccionados.length > 0 && (
              <Typography gutterBottom>
                Asientos: {asientosSeleccionados.map(a => `${a.fila}${a.numero}`).join(', ')}
              </Typography>
            )}
            <Typography gutterBottom>
              Total: ${(asientosSeleccionados.length * precioUnitario).toFixed(2)}
            </Typography>
            
            <Box mt={3}>
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth
                onClick={handleContinuar}
                disabled={asientosSeleccionados.length === 0}
              >
                Proceder al Pago
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SeleccionAsientos;
