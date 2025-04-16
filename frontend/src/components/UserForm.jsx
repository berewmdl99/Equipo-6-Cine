// src/components/UserForm.jsx
import React, { useState, useEffect } from "react";
import { 
  TextField, 
  Button, 
  Grid, 
  FormControlLabel, 
  Switch,
  Box,
  Typography,
  InputAdornment,
  IconButton
} from "@mui/material";
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from "../context/AuthContext";

const UserForm = ({ onGuardar, usuario = null }) => {
  const { isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    nombre: "",
    username: "",
    email: "",
    password: "",
    is_admin: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (usuario) {
      setFormData({
        nombre: usuario.nombre || "",
        username: usuario.username || "",
        email: usuario.email || "",
        password: "", // No mostramos la contraseña existente
        is_admin: usuario.is_admin || false
      });
    } else {
      // Resetear el formulario cuando se crea un nuevo usuario
      setFormData({
        nombre: "",
        username: "",
        email: "",
        password: "",
        is_admin: false
      });
    }
  }, [usuario]);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'is_admin' ? checked : value
    }));
    
    // Limpiar error cuando el usuario modifica el campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }
    
    if (!formData.username.trim()) {
      newErrors.username = "El nombre de usuario es requerido";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El correo electrónico no es válido";
    }
    
    if (!usuario && !formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Si estamos editando y no se cambió la contraseña, la eliminamos del objeto
    const dataToSend = {...formData};
    if (usuario && !dataToSend.password) {
      delete dataToSend.password;
    }
    
    onGuardar(dataToSend);
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            fullWidth
            required
            error={!!errors.nombre}
            helperText={errors.nombre}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Nombre de Usuario"
            name="username"
            value={formData.username}
            onChange={handleChange}
            fullWidth
            required
            error={!!errors.username}
            helperText={errors.username}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Correo Electrónico"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            required
            error={!!errors.email}
            helperText={errors.email}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label={usuario ? "Nueva Contraseña (dejar vacío para mantener)" : "Contraseña"}
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            fullWidth
            required={!usuario}
            error={!!errors.password}
            helperText={errors.password}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={toggleShowPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        {isAdmin && (
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_admin}
                  onChange={handleChange}
                  name="is_admin"
                />
              }
              label="Es Administrador"
            />
          </Grid>
        )}
        <Grid item xs={12}>
          <Box sx={{ mt: 2 }}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              fullWidth
            >
              {usuario ? "Actualizar" : "Crear"} Usuario
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  );
};

export default UserForm;
