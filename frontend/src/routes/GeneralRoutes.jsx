import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Peliculas from '../pages/Peliculas';
import Boletos from '../pages/Boletos';
import Funciones from '../pages/Funciones';
import ImpresionBoletos from '../pages/ImpresionBoletos';
import SeleccionAsientos from '../pages/SeleccionAsientos';
import Pago from '../pages/Pago';

const GeneralRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/peliculas" element={<Peliculas />} />
      <Route path="/boletos" element={<Boletos />} />
      <Route path="/funciones" element={<Funciones />} />
      <Route path="/impresion-boletos" element={<ImpresionBoletos />} />
      <Route path="/seleccion-asientos/:funcionId" element={<SeleccionAsientos />} />
      <Route path="/pago" element={<Pago />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default GeneralRoutes;