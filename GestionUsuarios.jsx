import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  Snackbar,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon, ArrowBack as ArrowBackIcon, People as PeopleIcon } from '@mui/icons-material';
import UserForm from '../components/UserForm';
import { useAuth } from '../context/AuthContext';
import { getUsers, createUser, updateUser, deleteUser } from '../services/userService';
import { useNavigate } from 'react-router-dom';

const GestionUsuarios = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al cargar usuarios: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenDialog = (user = null) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedUser(null);
    setOpenDialog(false);
  };

  const handleSaveUser = async (userData) => {
    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, userData);
        setSnackbar({
          open: true,
          message: 'Usuario actualizado exitosamente',
          severity: 'success'
        });
      } else {
        await createUser(userData);
        setSnackbar({
          open: true,
          message: 'Usuario creado exitosamente',
          severity: 'success'
        });
      }
      handleCloseDialog();
      loadUsers();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al guardar usuario: ' + error.message,
        severity: 'error'
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === user.id) {
      setSnackbar({
        open: true,
        message: 'No puedes eliminar tu propio usuario',
        severity: 'error'
      });
      return;
    }

    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        await deleteUser(userId);
        setSnackbar({
          open: true,
          message: 'Usuario eliminado exitosamente',
          severity: 'success'
        });
        loadUsers();
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Error al eliminar usuario: ' + error.message,
          severity: 'error'
        });
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

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
          <PeopleIcon sx={{ fontSize: 30, mr: 1, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Gestión de Usuarios
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Usuario
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length > 0 ? (
                users.map((userItem) => (
                  <TableRow key={userItem.id}>
                    <TableCell>{userItem.id}</TableCell>
                    <TableCell>{userItem.nombre}</TableCell>
                    <TableCell>{userItem.username}</TableCell>
                    <TableCell>{userItem.email}</TableCell>
                    <TableCell>{userItem.is_admin ? 'Administrador' : 'Empleado'}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(userItem)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteUser(userItem.id)}
                        disabled={userItem.id === user.id}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No hay usuarios registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <UserForm
            onGuardar={handleSaveUser}
            usuario={selectedUser}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GestionUsuarios;
