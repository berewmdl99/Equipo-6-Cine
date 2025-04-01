import React from "react";
import { Route, Routes } from "react-router-dom";
import GestionUsuarios from "../admin/GestionUsuarios";
import GestionPeliculas from "../admin/GestionPeliculas";
import GestionFunciones from "../admin/GestionFunciones";
import GestionSalas from "../admin/GestionSalas";
import ReportesVentas from "../admin/ReportesVentas";

const AdminRoutes = () => (
  <Routes>
    <Route path="/gestion-usuarios" element={<GestionUsuarios />} />
    <Route path="/gestion-peliculas" element={<GestionPeliculas />} />
    <Route path="/gestion-funciones" element={<GestionFunciones />} />
    <Route path="/gestion-salas" element={<GestionSalas />} />
    <Route path="/reportes-ventas" element={<ReportesVentas />} />
  </Routes>
);

export default AdminRoutes;
