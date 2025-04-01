import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { login } from "../services/authService"; // Corregido
import { useNavigate } from "react-router-dom";
import { TextField, Button, Box, Typography } from "@mui/material";
import { jwtDecode } from "jwt-decode";

const LoginForm = () => {
  const [username, setUsername] = useState(""); // Cambiado a 'username'
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const loginStore = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await login(username, password); // Ahora usa 'username'
      loginStore(data.access_token);

      const decoded = jwtDecode(data.access_token);
      console.log("Decoded Token", decoded);
      if (decoded.is_admin) {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
      console.error("Error during login", err);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 5 }}>
      <Typography variant="h5" mb={2}>
        Iniciar Sesión
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Nombre de Usuario" // Cambiado
          margin="normal"
          value={username} // Cambiado
          onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
          fullWidth
          label="Contraseña"
          type="password"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button fullWidth variant="contained" color="primary" type="submit">
          Iniciar Sesión
        </Button>
      </form>
    </Box>
  );
};

export default LoginForm;
