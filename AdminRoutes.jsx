import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import GestionUsuarios from "../admin/GestionUsuarios";
import GestionPeliculas from "../admin/GestionPeliculas";
import GestionFunciones from "../admin/GestionFunciones";
import EditorSalaAdmin from "../admin/EditorSalaAdmin";
import ReportesVentas from "../admin/ReportesVentas";
import AdminDashboard from "../admin/AdminDashboard";

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="gestion-usuarios" element={<GestionUsuarios />} />
      <Route path="gestion-peliculas" element={<GestionPeliculas />} />
      <Route path="gestion-salas" element={<EditorSalaAdmin />} />
      <Route path="gestion-funciones" element={<GestionFunciones />} />
      <Route path="reportes-ventas" element={<ReportesVentas />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
