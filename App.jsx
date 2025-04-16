import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import GeneralRoutes from "./routes/GeneralRoutes";
import AdminRoutes from "./routes/AdminRoutes";
import PrivateRoute from "./routes/PrivateRoute";
import AuthRoutes from "./routes/AuthRoutes";
import { AuthProvider } from "./context/AuthContext";
import { Box, AppBar, Toolbar, Typography, Container, IconButton, Tooltip } from "@mui/material";
import DarkModeToggle from "./components/DarkModeToggle";
import { useAuth } from "./context/AuthContext";
import LogoutIcon from '@mui/icons-material/Logout';
import { SnackbarProvider } from 'notistack';

// Componente para el layout común
const Layout = ({ children }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname.startsWith('/login');

  // No mostrar el layout en la página de login
  if (isLoginPage) {
    return children;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" color="primary" enableColorOnDark>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Sistema de Cine
          </Typography>
          <DarkModeToggle />
          <Tooltip title="Cerrar sesión">
            <IconButton 
              color="inherit" 
              onClick={logout}
              aria-label="cerrar sesión"
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Container>
      <Box component="footer" sx={{ py: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Sistema de Cine. Todos los derechos reservados.
        </Typography>
      </Box>
    </Box>
  );
};

const App = () => {
  return (
    <SnackbarProvider 
      maxSnack={3}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <AuthProvider>
        <Router future={{ 
          v7_relativeSplatPath: true,
          v7_startTransition: true 
        }}>
          <Layout>
            <Routes>
              {/* Rutas públicas (solo login) */}
              <Route path="/login/*" element={<AuthRoutes />} />

              {/* Rutas generales protegidas para cualquier usuario autenticado */}
              <Route
                path="/*"
                element={
                  <PrivateRoute>
                    <GeneralRoutes />
                  </PrivateRoute>
                }
              />

              {/* Rutas de administrador protegidas */}
              <Route
                path="/admin/*"
                element={
                  <PrivateRoute requiredRole="admin">
                    <AdminRoutes />
                  </PrivateRoute>
                }
              />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </SnackbarProvider>
  );
};

export default App;
