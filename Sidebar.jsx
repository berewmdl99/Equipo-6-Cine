// src/components/Sidebar.jsx

import React from "react";
import { Drawer, List, ListItem, ListItemText, ListItemIcon } from "@mui/material";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { isAdmin } = useAuth();

  // Rutas generales (para todos los usuarios)
  const generalRoutes = [
    { text: "Dashboard", path: "/" },
    { text: "Películas", path: "/peliculas" },
    { text: "Boletos", path: "/boletos" },
    { text: "Funciones", path: "/funciones" },
    { text: "Reimprimir Boletos", path: "/impresion-boletos" }
  ];

  // Rutas adicionales solo para administradores
  const adminRoutes = [
    { text: "Dashboard Admin", path: "/admin" },
    { text: "Gestión de Usuarios", path: "/admin/usuarios" },
    { text: "Gestión de Películas", path: "/admin/peliculas" },
    { text: "Gestión de Salas", path: "/admin/salas" },
    { text: "Gestión de Funciones", path: "/admin/funciones" },
    { text: "Reportes de Ventas", path: "/admin/reportes" }
  ];

  const routes = isAdmin ? [...generalRoutes, ...adminRoutes] : generalRoutes;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
        },
      }}
    >
      <List>
        {routes.map((route) => (
          <ListItem
            button
            component={Link}
            to={route.path}
            key={route.path}
          >
            <ListItemText primary={route.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
