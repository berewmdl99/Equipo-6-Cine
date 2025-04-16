import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography,
  Paper,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Tooltip,
  Snackbar,
  Alert,
  Card,
  CardContent,
  CardActions,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon, 
  Remove as RemoveIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  ArrowBack as ArrowBackIcon,
  Chair as ChairIcon,
  Movie as MovieIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import MapaAsientos from '../components/MapaAsientos';
import * as salaService from '../services/salaService';
import { configuracionSalaService } from '../services/configuracionSalaService';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import EventSeatOutlinedIcon from '@mui/icons-material/EventSeatOutlined';
import EventSeatRoundedIcon from '@mui/icons-material/EventSeatRounded';

const TIPOS_SALA = [
  { value: '2D', label: '2D' },
  { value: '3D', label: '3D' },
  { value: '4DX', label: '4DX' },
];

const ESTADOS_ASIENTO = {
  DISPONIBLE: 'disponible',
  OCUPADO: 'ocupado',
  SELECCIONADO: 'seleccionado',
  DESHABILITADO: 'deshabilitado'
};

const EditorSalaAdmin = ({ onSalaCreada }) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [salas, setSalas] = useState([]);
  const [salaSeleccionada, setSalaSeleccionada] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    capacidad: '',
    tipo: '2D',
    activa: true,
    num_filas: '1',
    asientos_por_fila: '10'
  });
  const [configuracion, setConfiguracion] = useState({
    filas: {},
    ultimaFila: 'A',
    asientosArray: []
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agregarFilaDialogOpen, setAgregarFilaDialogOpen] = useState(false);
  const [eliminarFilaDialogOpen, setEliminarFilaDialogOpen] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState('');
  const [asientosPorFila, setAsientosPorFila] = useState(10);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    cargarSalas();
  }, []);

  const cargarSalas = async () => {
    try {
      setLoading(true);
      const data = await salaService.obtenerSalas();
      setSalas(data);
    } catch (error) {
      console.error('Error al cargar salas:', error);
      enqueueSnackbar('Error al cargar las salas: ' + (error.message || 'Error desconocido'), { 
        variant: 'error',
        autoHideDuration: 5000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarConfiguracionSala = async (salaId) => {
    try {
      setLoading(true);
      const config = await configuracionSalaService.obtenerConfiguracionSala(salaId);
      setSalaSeleccionada(salaId);
      
      // Convertir la estructura de filas a un array plano de asientos
      const asientosArray = [];
      Object.entries(config.filas).forEach(([fila, asientos]) => {
        asientos.forEach(asiento => {
          asientosArray.push({
            ...asiento,
            fila: fila,
            estado: asiento.estado.toUpperCase()
          });
        });
      });
      
      setConfiguracion({
        filas: config.filas || {},
        asientosArray: asientosArray
      });
    } catch (error) {
      enqueueSnackbar('Error al cargar la configuración: ' + error.message, { 
        variant: 'error',
        autoHideDuration: 5000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCrearSala = async () => {
    try {
      // Validar campos requeridos
      if (!formData.nombre?.trim()) {
        enqueueSnackbar('El nombre de la sala es requerido', { variant: 'error' });
        return;
      }

      if (!formData.capacidad || parseInt(formData.capacidad) <= 0) {
        enqueueSnackbar('La capacidad debe ser un número positivo', { variant: 'error' });
        return;
      }

      setSubmitting(true);

      // Asegurarnos de que num_filas y asientos_por_fila sean números válidos
      const numFilas = parseInt(formData.num_filas) || 1;
      const asientosPorFila = parseInt(formData.asientos_por_fila) || Math.ceil(parseInt(formData.capacidad) / numFilas);

      // Validar que asientos_por_fila * num_filas >= capacidad
      if (asientosPorFila * numFilas < parseInt(formData.capacidad)) {
        enqueueSnackbar('El número de asientos (filas × asientos por fila) debe ser mayor o igual a la capacidad', { variant: 'error' });
        setSubmitting(false);
        return;
      }

      // Preparar datos de la sala
      const salaData = {
        nombre: formData.nombre.trim(),
        capacidad: parseInt(formData.capacidad),
        tipo: formData.tipo || '2D',
        activa: formData.activa ?? true,
        num_filas: numFilas,
        asientos_por_fila: asientosPorFila
      };

      console.log('Enviando datos de sala:', salaData); // Para debugging

      const response = await salaService.crearSala(salaData);
      enqueueSnackbar('Sala creada exitosamente', { variant: 'success' });
      
      // Actualizar lista de salas y cerrar diálogo
      await cargarSalas();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error al crear sala:', error);
      enqueueSnackbar(error.response?.data?.message || 'Error al crear la sala', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditarSala = async () => {
    try {
      if (!formData.nombre || !formData.capacidad || !formData.num_filas || !formData.asientos_por_fila) {
        enqueueSnackbar('Todos los campos son requeridos', { 
          variant: 'error',
          autoHideDuration: 5000,
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          }
        });
        return;
      }

      if (isNaN(formData.capacidad) || parseInt(formData.capacidad) <= 0) {
        enqueueSnackbar('La capacidad debe ser un número positivo', { 
          variant: 'error',
          autoHideDuration: 5000,
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          }
        });
        return;
      }

      if (isNaN(formData.num_filas) || parseInt(formData.num_filas) <= 0) {
        enqueueSnackbar('El número de filas debe ser positivo', { 
          variant: 'error',
          autoHideDuration: 5000,
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          }
        });
        return;
      }

      if (isNaN(formData.asientos_por_fila) || parseInt(formData.asientos_por_fila) <= 0) {
        enqueueSnackbar('El número de asientos por fila debe ser positivo', { 
          variant: 'error',
          autoHideDuration: 5000,
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          }
        });
        return;
      }

      setSubmitting(true);
      await salaService.actualizarSala(salaSeleccionada, {
        ...formData,
        capacidad: parseInt(formData.capacidad),
        num_filas: parseInt(formData.num_filas),
        asientos_por_fila: parseInt(formData.asientos_por_fila)
      });
      enqueueSnackbar('Sala actualizada exitosamente', { 
        variant: 'success',
        autoHideDuration: 3000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        }
      });
      setDialogOpen(false);
      resetForm();
      await cargarSalas();
      await cargarConfiguracionSala(salaSeleccionada);
    } catch (error) {
      enqueueSnackbar('Error al actualizar la sala: ' + error.message, { 
        variant: 'error',
        autoHideDuration: 5000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        }
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEliminarSala = async () => {
    try {
      setSubmitting(true);
      await salaService.eliminarSala(salaSeleccionada);
      enqueueSnackbar('Sala eliminada exitosamente', { 
        variant: 'success',
        autoHideDuration: 3000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        }
      });
      setDeleteDialogOpen(false);
      setSalaSeleccionada(null);
      await cargarSalas();
    } catch (error) {
      enqueueSnackbar('Error al eliminar la sala: ' + error.message, { 
        variant: 'error',
        autoHideDuration: 5000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        }
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAgregarFila = async () => {
    try {
      if (!salaSeleccionada) {
        enqueueSnackbar('Debe seleccionar una sala primero', { 
          variant: 'error',
          autoHideDuration: 5000,
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          }
        });
        return;
      }

      const numAsientos = parseInt(asientosPorFila);
      if (isNaN(numAsientos) || numAsientos <= 0 || numAsientos > 20) {
        enqueueSnackbar('El número de asientos por fila debe ser un número entre 1 y 20', { 
          variant: 'error',
          autoHideDuration: 5000,
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          }
        });
        return;
      }

      setSubmitting(true);
      
      // Obtener las filas existentes y calcular la siguiente letra
      const filasExistentes = [...new Set((configuracion.asientosArray || []).map(asiento => asiento.fila))].sort();
      
      let siguienteLetra;
      if (filasExistentes.length === 0) {
        siguienteLetra = 'A';
      } else {
        const ultimaLetra = filasExistentes[filasExistentes.length - 1];
        siguienteLetra = String.fromCharCode(ultimaLetra.charCodeAt(0) + 1);
      }
      
      if (siguienteLetra.charCodeAt(0) > 'Z'.charCodeAt(0)) {
        enqueueSnackbar('No se pueden agregar más filas: se ha alcanzado el límite de filas (A-Z)', { 
          variant: 'error',
          autoHideDuration: 5000,
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          }
        });
        return;
      }
      
      const nuevaFila = {
        letra: siguienteLetra,
        asientos_por_fila: numAsientos
      };

      await configuracionSalaService.agregarFila(salaSeleccionada, nuevaFila);
      
      enqueueSnackbar(`Fila ${siguienteLetra} agregada exitosamente`, { 
        variant: 'success',
        autoHideDuration: 3000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        }
      });
      
      await cargarConfiguracionSala(salaSeleccionada);
      setAgregarFilaDialogOpen(false);
    } catch (error) {
      enqueueSnackbar('Error al agregar la fila: ' + error.message, { 
        variant: 'error',
        autoHideDuration: 5000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        }
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEliminarFila = async () => {
    try {
      if (!salaSeleccionada) {
        enqueueSnackbar('Debe seleccionar una sala primero', { 
          variant: 'error',
          autoHideDuration: 5000,
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          }
        });
        return;
      }

      if (!filaSeleccionada) {
        enqueueSnackbar('Debe seleccionar una fila para eliminar', { 
          variant: 'error',
          autoHideDuration: 5000,
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          }
        });
        return;
      }

      setSubmitting(true);
      await configuracionSalaService.eliminarFila(salaSeleccionada, filaSeleccionada);
      enqueueSnackbar('Fila eliminada exitosamente', { 
        variant: 'success',
        autoHideDuration: 3000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        }
      });
      setEliminarFilaDialogOpen(false);
      setFilaSeleccionada('');
      await cargarConfiguracionSala(salaSeleccionada);
    } catch (error) {
      enqueueSnackbar('Error al eliminar la fila: ' + error.message, { 
        variant: 'error',
        autoHideDuration: 5000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        }
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAsientoClick = async (asiento) => {
    try {
      if (!salaSeleccionada) {
        enqueueSnackbar('Debe seleccionar una sala primero', { 
          variant: 'error',
          autoHideDuration: 5000,
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          }
        });
        return;
      }

      setSubmitting(true);
      const nuevoEstado = asiento.estado.toLowerCase() === ESTADOS_ASIENTO.DISPONIBLE 
        ? ESTADOS_ASIENTO.DESHABILITADO 
        : ESTADOS_ASIENTO.DISPONIBLE;

      await configuracionSalaService.actualizarEstadoAsiento(asiento.id, {
        estado: nuevoEstado
      });

      enqueueSnackbar('Estado del asiento actualizado exitosamente', { 
        variant: 'success',
        autoHideDuration: 3000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        }
      });

      await cargarConfiguracionSala(salaSeleccionada);
    } catch (error) {
      enqueueSnackbar('Error al actualizar el estado del asiento: ' + error.message, { 
        variant: 'error',
        autoHideDuration: 5000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        }
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      capacidad: '',
      tipo: '2D',
      activa: true,
      num_filas: '1',
      asientos_por_fila: '10'
    });
    setIsEditing(false);
  };

  const handleOpenEditDialog = (sala) => {
    setFormData({
      nombre: sala.nombre,
      capacidad: sala.capacidad,
      tipo: sala.tipo,
      activa: sala.activa
    });
    setIsEditing(true);
    setDialogOpen(true);
    cargarConfiguracionSala(sala.id);
  };

  const handleBackToDashboard = () => {
    navigate('/admin');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToDashboard}
            sx={{ mr: 2 }}
          >
            Regresar al Dashboard
          </Button>
          <MovieIcon sx={{ fontSize: 30, mr: 1, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Editor de Salas
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
          startIcon={<AddIcon />}
        >
          Crear Nueva Sala
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Lista de Salas */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Salas Disponibles
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {salas.length === 0 ? (
              <Typography color="text.secondary" align="center">
                No hay salas creadas
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {salas.map(sala => (
                  <Grid item xs={12} key={sala.id}>
                    <Card 
                      variant={salaSeleccionada === sala.id ? "elevation" : "outlined"}
                      sx={{ 
                        borderColor: salaSeleccionada === sala.id ? 'primary.main' : 'grey.300',
                        borderWidth: salaSeleccionada === sala.id ? 2 : 1
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {sala.nombre}
                        </Typography>
                        <Typography color="text.secondary">
                          Capacidad: {sala.capacidad} asientos
                        </Typography>
                        <Typography color="text.secondary">
                          Tipo: {sala.tipo}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          onClick={() => cargarConfiguracionSala(sala.id)}
                          startIcon={<ChairIcon />}
                        >
                          Ver Asientos
                        </Button>
                        <IconButton 
                          onClick={() => handleOpenEditDialog(sala)}
                          color="primary"
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => {
                            setSalaSeleccionada(sala.id);
                            setDeleteDialogOpen(true);
                          }}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Configuración de Sala */}
        <Grid item xs={12} md={8}>
          {salaSeleccionada ? (
            <Box>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Configuración de Sala
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    onClick={() => setAgregarFilaDialogOpen(true)}
                    sx={{ mr: 1 }}
                    disabled={submitting}
                  >
                    Agregar Fila
                  </Button>
                  <Button
                    startIcon={<RemoveIcon />}
                    variant="outlined"
                    onClick={() => setEliminarFilaDialogOpen(true)}
                    disabled={submitting || !configuracion.asientosArray?.length}
                  >
                    Eliminar Fila
                  </Button>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Haga clic en un asiento para habilitarlo o deshabilitarlo
                </Typography>
              </Paper>

              <MapaAsientos
                asientos={configuracion.asientosArray || []}
                onAsientoClick={handleAsientoClick}
                modo="configuracion"
              />
            </Box>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <ChairIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Seleccione una sala para ver y configurar sus asientos
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Diálogo para crear/editar sala */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => {
          setDialogOpen(false);
          resetForm();
        }}
      >
        <DialogTitle>{isEditing ? 'Editar Sala' : 'Crear Nueva Sala'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Nombre"
            value={formData.nombre}
            onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
            fullWidth
            margin="normal"
            required
            disabled={submitting}
          />
          <TextField
            label="Capacidad"
            type="number"
            value={formData.capacidad}
            onChange={(e) => setFormData(prev => ({ ...prev, capacidad: e.target.value }))}
            fullWidth
            margin="normal"
            required
            inputProps={{ min: 1 }}
            disabled={submitting}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Tipo</InputLabel>
            <Select
              value={formData.tipo}
              label="Tipo"
              onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
              disabled={submitting}
            >
              {TIPOS_SALA.map((tipo) => (
                <MenuItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Estado</InputLabel>
            <Select
              value={formData.activa}
              label="Estado"
              onChange={(e) => setFormData(prev => ({ ...prev, activa: e.target.value }))}
              disabled={submitting}
            >
              <MenuItem value={true}>Activa</MenuItem>
              <MenuItem value={false}>Inactiva</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Número de Filas"
            type="number"
            value={formData.num_filas}
            onChange={(e) => setFormData(prev => ({ ...prev, num_filas: e.target.value }))}
            fullWidth
            margin="normal"
            inputProps={{ min: 1 }}
            disabled={submitting}
            helperText="Si no se especifica, se usará 1 por defecto"
          />
          <TextField
            label="Asientos por Fila"
            type="number"
            value={formData.asientos_por_fila}
            onChange={(e) => setFormData(prev => ({ ...prev, asientos_por_fila: e.target.value }))}
            fullWidth
            margin="normal"
            inputProps={{ min: 1 }}
            disabled={submitting}
            helperText="Si no se especifica, se calculará automáticamente según la capacidad"
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDialogOpen(false);
              resetForm();
            }}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={isEditing ? handleEditarSala : handleCrearSala}
            variant="contained" 
            disabled={submitting}
          >
            {submitting ? (
              <CircularProgress size={24} />
            ) : isEditing ? (
              'Guardar Cambios'
            ) : (
              'Crear Sala'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminar sala */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar esta sala? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleEliminarSala} 
            color="error" 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para agregar fila */}
      <Dialog 
        open={agregarFilaDialogOpen} 
        onClose={() => setAgregarFilaDialogOpen(false)}
      >
        <DialogTitle>Agregar Nueva Fila</DialogTitle>
        <DialogContent>
          <TextField
            label="Asientos por Fila"
            type="number"
            value={asientosPorFila}
            onChange={(e) => setAsientosPorFila(Math.max(1, parseInt(e.target.value) || 1))}
            fullWidth
            margin="normal"
            required
            inputProps={{ min: 1 }}
            disabled={submitting}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            La letra de la fila se asignará automáticamente
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setAgregarFilaDialogOpen(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAgregarFila}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para eliminar fila */}
      <Dialog 
        open={eliminarFilaDialogOpen} 
        onClose={() => {
          setEliminarFilaDialogOpen(false);
          setFilaSeleccionada('');
        }}
      >
        <DialogTitle>Eliminar Fila</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Seleccionar Fila</InputLabel>
            <Select
              value={filaSeleccionada}
              label="Seleccionar Fila"
              onChange={(e) => setFilaSeleccionada(e.target.value)}
              disabled={submitting}
            >
              {[...new Set((configuracion.asientosArray || []).map(asiento => asiento.fila))]
                .sort()
                .map((fila) => (
                  <MenuItem key={fila} value={fila}>
                    Fila {fila}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            ¡Atención! Esta acción eliminará todos los asientos de la fila seleccionada.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setEliminarFilaDialogOpen(false);
              setFilaSeleccionada('');
            }}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleEliminarFila}
            variant="contained"
            color="error"
            disabled={submitting || !filaSeleccionada}
          >
            {submitting ? <CircularProgress size={24} /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EditorSalaAdmin;
