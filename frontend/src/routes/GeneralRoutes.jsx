import React from "react";
import { Route, Routes } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Peliculas from "../pages/Peliculas";
import Funciones from "../pages/Funciones";
import Boletos from "../pages/Boletos";

const GeneralRoutes = () => (
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/peliculas" element={<Peliculas />} />
    <Route path="/funciones" element={<Funciones />} />
    <Route path="/boletos" element={<Boletos />} />
  </Routes>
);

export default GeneralRoutes;
