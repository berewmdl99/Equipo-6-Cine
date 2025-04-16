import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Peliculas from '../pages/Peliculas';
import Funciones from '../pages/Funciones';
import SeleccionAsientos from '../pages/SeleccionAsientos';
import Pago from '../pages/Pago';
import ReimprimirBoletos from '../pages/ReimprimirBoletos';

const GeneralRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/peliculas" element={<Peliculas />} />
      <Route path="/funciones" element={<Funciones />} />
      <Route path="/reimprimir-boletos" element={<ReimprimirBoletos />} />
      <Route path="/seleccion-asientos/:funcionId" element={<SeleccionAsientos />} />
      <Route path="/pago" element={<Pago />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default GeneralRoutes;