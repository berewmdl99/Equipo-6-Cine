import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { getUsers, createUser, updateUser, deleteUser } from "../services/authService";
import UserForm from "../components/UserForm";

const GestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    const token = localStorage.getItem("token");
    const data = await getUsers(token);
    setUsuarios(data);
  };

  const handleOpen = (usuario = null) => {
    setEditingUser(usuario);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingUser(null);
  };

  const handleGuardarUsuario = async (usuario) => {
    const token = localStorage.getItem("token");
    if (editingUser) {
      await updateUser(editingUser.id, usuario, token);
    } else {
      await createUser(usuario, token);
    }
    cargarUsuarios();
    handleClose();
  };

  const handleEliminarUsuario = async (usuarioId) => {
    const token = localStorage.getItem("token");
    if (window.confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
      await deleteUser(usuarioId, token);
      cargarUsuarios();
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Gestión de Usuarios
      </Typography>

      <Button variant="contained" color="primary" onClick={() => handleOpen()}>
        Crear Usuario
      </Button>

      <TableContainer component={Paper} style={{ marginTop: 20 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell>{usuario.id}</TableCell>
                <TableCell>{usuario.nombre}</TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>{usuario.is_admin ? "Admin" : "Empleado"}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleOpen(usuario)}>
                    <Edit />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleEliminarUsuario(usuario.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? "Editar Usuario" : "Crear Usuario"}</DialogTitle>
        <DialogContent>
          <UserForm onGuardar={handleGuardarUsuario} usuario={editingUser} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GestionUsuarios;
