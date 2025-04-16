// src/admin/GestionFunciones.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  TextField, 
  Button, 
  Grid, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Chip,
  Container,
  CircularProgress,
  Skeleton
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useSnackbar } from "notistack";
import { useNavigate } from 'react-router-dom';
import funcionService from "../services/funcionService";
import { getTodasPeliculas } from "../services/peliculaService";
import { obtenerSalas } from '../services/salaService';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';

const GestionFunciones = () => {
  const navigate = useNavigate();
  const [funciones, setFunciones] = useState([]);
  const [peliculas, setPeliculas] = useState([]);
  const [salas, setSalas] = useState([]);
  const [formData, setFormData] = useState({
    pelicula_id: "",
    sala_id: "",
    fecha: null,
    hora: null,
    precio_base: ""
  });
  const [editMode, setEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [funcionToDelete, setFuncionToDelete] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, []);

  // Función para cargar datos
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Cargar datos en paralelo para mejorar el rendimiento
      const [peliculasData, salasData, funcionesData] = await Promise.all([
        getTodasPeliculas(),
        obtenerSalas(),
        funcionService.obtenerFunciones()
      ]);
      
      // Procesar películas
      if (Array.isArray(peliculasData)) {
        setPeliculas(peliculasData);
      } else {
        console.error("Error: peliculasData no es un array:", peliculasData);
        enqueueSnackbar("Error al cargar las películas", { variant: "error" });
      }
      
      // Procesar salas
      if (Array.isArray(salasData)) {
        setSalas(salasData);
      } else {
        console.error("Error: salasData no es un array:", salasData);
        enqueueSnackbar("Error al cargar las salas", { variant: "error" });
      }
      
      // Procesar funciones
      if (Array.isArray(funcionesData)) {
        setFunciones(funcionesData);
      } else {
        console.error("Error: funcionesData no es un array:", funcionesData);
        enqueueSnackbar("Error al cargar las funciones", { variant: "error" });
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      enqueueSnackbar("Error al cargar los datos", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  // Manejador de cambios en los inputs
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Validar formulario
  const validateForm = useCallback(() => {
    if (!formData.pelicula_id) {
      enqueueSnackbar('Debe seleccionar una película', { variant: 'error' });
      return false;
    }
    if (!formData.sala_id) {
      enqueueSnackbar('Debe seleccionar una sala', { variant: 'error' });
      return false;
    }
    if (!formData.fecha) {
      enqueueSnackbar('Debe seleccionar una fecha', { variant: 'error' });
      return false;
    }
    if (!formData.hora) {
      enqueueSnackbar('Debe seleccionar una hora', { variant: 'error' });
      return false;
    }
    if (!formData.precio_base || isNaN(formData.precio_base) || parseFloat(formData.precio_base) <= 0) {
      enqueueSnackbar('El precio base debe ser un número mayor que 0', { variant: 'error' });
      return false;
    }
    return true;
  }, [formData, enqueueSnackbar]);

  // Resetear formulario
  const resetForm = useCallback(() => {
    setFormData({
      pelicula_id: "",
      sala_id: "",
      fecha: null,
      hora: null,
      precio_base: ""
    });
    setEditMode(false);
  }, []);

  // Función para formatear fechas
  const formatDate = useCallback((dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }, []);

  // Función para formatear horas
  const formatTime = useCallback((timeString) => {
    try {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    } catch (error) {
      return timeString;
    }
  }, []);

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      console.log('Datos antes de enviar:', formData);
      
      // Crear objeto con los datos formateados
      const datosParaEnviar = {
        pelicula_id: parseInt(formData.pelicula_id),
        sala_id: parseInt(formData.sala_id),
        fecha: formData.fecha instanceof Date ? formData.fecha.toISOString().split('T')[0] : formData.fecha,
        hora: formData.hora instanceof Date ? formData.hora.toTimeString().split(' ')[0] : formData.hora,
        precio_base: parseFloat(formData.precio_base)
      };
      
      console.log('Datos a enviar:', datosParaEnviar);

      if (editMode) {
        await funcionService.actualizarFuncion(formData.id, datosParaEnviar);
        enqueueSnackbar("Función actualizada exitosamente", { 
          variant: "success",
          autoHideDuration: 3000,
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          }
        });
      } else {
        await funcionService.crearFuncion(datosParaEnviar);
        enqueueSnackbar("Función creada exitosamente", { 
          variant: "success",
          autoHideDuration: 3000,
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          }
        });
      }
      resetForm();
      loadData();
    } catch (error) {
      enqueueSnackbar(error.message || `Error al ${editMode ? 'actualizar' : 'crear'} la función`, { 
        variant: "error",
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

  // Manejar edición
  const handleEdit = useCallback((funcion) => {
    setFormData({
      id: funcion.id,
      pelicula_id: funcion.pelicula_id,
      sala_id: funcion.sala_id,
      fecha: new Date(funcion.fecha),
      hora: new Date(funcion.hora),
      precio_base: funcion.precio_base
    });
    setEditMode(true);
  }, []);

  // Manejar clic en eliminar
  const handleDeleteClick = useCallback((funcion) => {
    setFuncionToDelete(funcion);
    setDeleteDialogOpen(true);
  }, []);

  // Manejar eliminación
  const handleDelete = async () => {
    try {
      setSubmitting(true);
      await funcionService.eliminarFuncion(funcionToDelete.id);
      enqueueSnackbar("Función eliminada exitosamente", { 
        variant: "success",
        autoHideDuration: 3000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        }
      });
      setDeleteDialogOpen(false);
      setFuncionToDelete(null);
      loadData();
    } catch (error) {
      enqueueSnackbar(error.message || "Error al eliminar la función", { 
        variant: "error",
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

  // Manejar regreso al dashboard
  const handleBackToDashboard = () => {
    navigate('/');
  };

  // Memoizar películas en cartelera
  const peliculasEnCartelera = useMemo(() => {
    return peliculas.filter(p => p.en_cartelera);
  }, [peliculas]);

  // Renderizar skeleton mientras carga
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            <Skeleton width="60%" />
          </Typography>
          
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              <Skeleton width="40%" />
            </Typography>
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5].map((item) => (
                <Grid item xs={12} sm={6} key={item}>
                  <Skeleton height={56} />
                </Grid>
              ))}
            </Grid>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Skeleton width="50%" />
            </Typography>
            <Skeleton variant="rectangular" height={300} />
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={handleBackToDashboard}
                sx={{ mr: 2 }}
              >
                Regresar al Dashboard
              </Button>
              <Typography variant="h4" component="h1">
                Gestión de Funciones
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => {
                resetForm();
                setEditMode(false);
              }}
            >
              Nueva Función
            </Button>
          </Box>

          {/* Formulario */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              {editMode ? "Editar Función" : "Nueva Función"}
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Película</InputLabel>
                    <Select
                      label="Película"
                      name="pelicula_id"
                      value={formData.pelicula_id}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                    >
                      {peliculas.length > 0 ? (
                        peliculas.map((pelicula) => (
                          <MenuItem key={pelicula.id} value={pelicula.id}>
                            {pelicula.titulo} {!pelicula.en_cartelera && "(No en cartelera)"}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No hay películas disponibles. Por favor, cree algunas películas primero.</MenuItem>
                      )}
                    </Select>
                    <Typography variant="caption" color="text.secondary">
                      {peliculas.length > 0 ? `${peliculas.length} películas disponibles (${peliculasEnCartelera.length} en cartelera)` : "No hay películas disponibles"}
                    </Typography>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Sala</InputLabel>
                    <Select
                      label="Sala"
                      name="sala_id"
                      value={formData.sala_id}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                    >
                      {salas.length > 0 ? (
                        salas.map((sala) => (
                          <MenuItem key={sala.id} value={sala.id}>
                            {sala.nombre}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No hay salas disponibles. Por favor, cree algunas salas primero.</MenuItem>
                      )}
                    </Select>
                    <Typography variant="caption" color="text.secondary">
                      {salas.length > 0 ? `${salas.length} salas disponibles` : "No hay salas disponibles"}
                    </Typography>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Fecha"
                    value={formData.fecha}
                    onChange={(newValue) => setFormData(prev => ({ ...prev, fecha: newValue }))}
                    minDate={new Date()}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true, 
                        required: true,
                        disabled: submitting
                      } 
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TimePicker
                    label="Hora"
                    value={formData.hora}
                    onChange={(newValue) => setFormData(prev => ({ ...prev, hora: newValue }))}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true, 
                        required: true,
                        disabled: submitting
                      } 
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Precio Base"
                    type="number"
                    fullWidth
                    name="precio_base"
                    value={formData.precio_base}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                    inputProps={{ min: 0.01, step: 0.01 }}
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {submitting ? 'Procesando...' : (editMode ? 'Actualizar' : 'Crear') + ' Función'}
                </Button>
                {editMode && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    fullWidth
                    onClick={resetForm}
                    disabled={submitting}
                  >
                    Cancelar Edición
                  </Button>
                )}
              </Box>
            </form>
          </Paper>

          {/* Tabla de Funciones */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Funciones Programadas
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Película</TableCell>
                    <TableCell>Sala</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Hora</TableCell>
                    <TableCell>Precio Base</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {funciones.length > 0 ? (
                    funciones.map((funcion) => {
                      const pelicula = peliculas.find(p => p.id === funcion.pelicula_id);
                      const sala = salas.find(s => s.id === funcion.sala_id);
                      return (
                        <TableRow key={funcion.id}>
                          <TableCell>{funcion.id}</TableCell>
                          <TableCell>{pelicula ? pelicula.titulo : 'N/A'}</TableCell>
                          <TableCell>{sala ? sala.nombre : 'N/A'}</TableCell>
                          <TableCell>{formatDate(funcion.fecha)}</TableCell>
                          <TableCell>{formatTime(funcion.hora)}</TableCell>
                          <TableCell>${funcion.precio_base}</TableCell>
                          <TableCell>
                            <IconButton 
                              onClick={() => handleEdit(funcion)} 
                              color="primary"
                              disabled={submitting}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              onClick={() => handleDeleteClick(funcion)} 
                              color="error"
                              disabled={submitting}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No hay funciones programadas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>

        {/* Diálogo de confirmación de eliminación */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => !submitting && setDeleteDialogOpen(false)}
        >
          <DialogTitle>Confirmar eliminación</DialogTitle>
          <DialogContent>
            <DialogContentText>
              ¿Estás seguro de que deseas eliminar esta función?
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
              onClick={handleDelete} 
              color="error" 
              autoFocus
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {submitting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default GestionFunciones;
