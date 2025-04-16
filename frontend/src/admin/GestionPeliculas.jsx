import React, { useState, useEffect } from "react";
import { 
  TextField, 
  Button, 
  Grid, 
  FormControl,
  Switch,
  FormControlLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Container
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useSnackbar } from "notistack";
import { getPeliculas, createPelicula, updatePelicula, deletePelicula } from "../services/peliculaService";
import { useNavigate } from 'react-router-dom';

const GestionPeliculas = () => {
  const navigate = useNavigate();
  const [peliculas, setPeliculas] = useState([]);
  const [formData, setFormData] = useState({
    titulo: "",
    duracion_min: "",
    clasificacion: "",
    genero: "",
    descripcion: "",
    imagen: null,
    en_cartelera: true
  });
  const [editMode, setEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [peliculaToDelete, setPeliculaToDelete] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    cargarPeliculas();
  }, []);

  const cargarPeliculas = async () => {
    try {
      const data = await getPeliculas();
      setPeliculas(data);
    } catch (error) {
      enqueueSnackbar(error.message || "Error al cargar películas", { 
        variant: "error",
        autoHideDuration: 5000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        }
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileType = file.type.toLowerCase();
      if (!fileType.includes('jpeg') && !fileType.includes('jpg') && !fileType.includes('png')) {
        enqueueSnackbar("Solo se permiten imágenes JPG o PNG", { 
          variant: "error",
          autoHideDuration: 5000,
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          }
        });
        return;
      }
      setFormData(prev => ({
        ...prev,
        imagen: file
      }));
    }
  };

  const validateForm = () => {
    if (!formData.titulo.trim()) {
      enqueueSnackbar("El título es requerido", { 
        variant: "error",
        autoHideDuration: 5000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        }
      });
      return false;
    }
    if (!formData.duracion_min || formData.duracion_min <= 0) {
      enqueueSnackbar("La duración debe ser mayor a 0", { 
        variant: "error",
        autoHideDuration: 5000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        }
      });
      return false;
    }
    if (!formData.clasificacion.trim()) {
      enqueueSnackbar("La clasificación es requerida", { 
        variant: "error",
        autoHideDuration: 5000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        }
      });
      return false;
    }
    if (!formData.genero.trim()) {
      enqueueSnackbar("El género es requerido", { 
        variant: "error",
        autoHideDuration: 5000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        }
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await updatePelicula(peliculaToDelete.id, formData);
        enqueueSnackbar("Película actualizada exitosamente", { 
          variant: "success",
          autoHideDuration: 3000,
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          }
        });
      } else {
        await createPelicula(formData);
        enqueueSnackbar("Película creada exitosamente", { 
          variant: "success",
          autoHideDuration: 3000,
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          }
        });
      }
      resetForm();
      cargarPeliculas();
    } catch (error) {
      enqueueSnackbar(error.message || `Error al ${editMode ? 'actualizar' : 'crear'} la película`, { 
        variant: "error",
        autoHideDuration: 5000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        }
      });
    }
  };

  const handleDeleteClick = (pelicula) => {
    setPeliculaToDelete(pelicula);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deletePelicula(peliculaToDelete.id);
      enqueueSnackbar("Película eliminada exitosamente", { 
        variant: "success",
        autoHideDuration: 3000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        }
      });
      setDeleteDialogOpen(false);
      setPeliculaToDelete(null);
      cargarPeliculas();
    } catch (error) {
      enqueueSnackbar(error.message || "Error al eliminar la película", { 
        variant: "error",
        autoHideDuration: 5000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        }
      });
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: "",
      duracion_min: "",
      clasificacion: "",
      genero: "",
      descripcion: "",
      imagen: null,
      en_cartelera: true
    });
    setEditMode(false);
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
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
              Gestión de Películas
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
            Nueva Película
          </Button>
        </Box>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {editMode ? 'Editar' : 'Crear'} Película
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Título"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Duración (minutos)"
                  name="duracion_min"
                  type="number"
                  value={formData.duracion_min}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Clasificación"
                  name="clasificacion"
                  value={formData.clasificacion}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Género"
                  name="genero"
                  value={formData.genero}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Descripción"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleImageChange}
                  style={{ marginBottom: '1rem' }}
                />
                {formData.imagen && (
                  <p>Imagen seleccionada: {formData.imagen.name}</p>
                )}
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.en_cartelera}
                      onChange={handleInputChange}
                      name="en_cartelera"
                    />
                  }
                  label="En cartelera"
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                fullWidth
              >
                {editMode ? 'Actualizar' : 'Crear'} Película
              </Button>
              {editMode && (
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  onClick={resetForm}
                >
                  Cancelar Edición
                </Button>
              )}
            </Box>
          </form>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Películas Registradas
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell>Duración</TableCell>
                  <TableCell>Clasificación</TableCell>
                  <TableCell>Género</TableCell>
                  <TableCell>En Cartelera</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {peliculas.map((pelicula) => (
                  <TableRow key={pelicula.id}>
                    <TableCell>{pelicula.titulo}</TableCell>
                    <TableCell>{pelicula.duracion_min} min</TableCell>
                    <TableCell>{pelicula.clasificacion}</TableCell>
                    <TableCell>{pelicula.genero}</TableCell>
                    <TableCell>{pelicula.en_cartelera ? "Sí" : "No"}</TableCell>
                    <TableCell>
                      <IconButton 
                        onClick={() => {
                          setFormData({
                            ...pelicula,
                            imagen: null
                          });
                          setEditMode(true);
                        }}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDeleteClick(pelicula)} 
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Confirmar eliminación</DialogTitle>
          <DialogContent>
            <DialogContentText>
              ¿Está seguro que desea eliminar esta película? Esta acción no se puede deshacer.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default GestionPeliculas;
