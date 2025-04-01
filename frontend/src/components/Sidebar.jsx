// src/components/Sidebar.jsx

import React from "react";
import { Drawer, List, ListItem, ListItemText } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const Sidebar = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore(state => state);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const adminRoutes = [
    { text: "Gestión de Usuarios", path: "/admin/gestion-usuarios" },
    { text: "Gestión de Películas", path: "/admin/gestion-peliculas" },
    { text: "Gestión de Funciones", path: "/admin/gestion-funciones" },
    { text: "Gestión de Salas", path: "/admin/gestion-salas" },
    { text: "Reportes de Ventas", path: "/admin/reportes" },
  ];

  const generalRoutes = [
    { text: "Dashboard", path: "/" },
    { text: "Películas", path: "/peliculas" },
    { text: "Funciones", path: "/funciones" },
    { text: "Boletos", path: "/boletos" },
  ];

  const routes = user?.isAdmin ? adminRoutes : generalRoutes;

  return (
    <Drawer
      sx={{
        width: 240,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 240,
          boxSizing: "border-box",
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <List>
        {routes.map((route, index) => (
          <ListItem button key={index} onClick={() => handleNavigation(route.path)}>
            <ListItemText primary={route.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
