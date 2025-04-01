import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GeneralRoutes from "./routes/GeneralRoutes";
import AdminRoutes from "./routes/AdminRoutes";
import PrivateRoute from "./routes/PrivateRoute";
import AuthRoutes from "./routes/AuthRoutes";

const App = () => {
  return (
    <Router>
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
    </Router>
  );
};

export default App;
