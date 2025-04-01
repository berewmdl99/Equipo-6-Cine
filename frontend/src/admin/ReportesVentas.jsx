// src/admin/ReportesVentas.jsx
import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { useSnackbar } from "notistack";
import boletoService from "../services/boletoService"; // Asegúrate de tener el servicio para obtener los boletos

const ReportesVentas = () => {
  const [ventas, setVentas] = useState([]);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const loadVentas = async () => {
      try {
        const data = await boletoService.obtenerBoletos(); // Suponiendo que tenemos el servicio adecuado
        setVentas(data);
      } catch (error) {
        enqueueSnackbar("Error al cargar los reportes de ventas", { variant: "error" });
      }
    };
    loadVentas();
  }, []);

  return (
    <div>
      <h2>Reporte de Ventas</h2>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Película</TableCell>
              <TableCell>Sala</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Cantidad de Boletos Vendidos</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ventas.map((venta) => (
              <TableRow key={venta.id}>
                <TableCell>{venta.funcion.pelicula.titulo}</TableCell>
                <TableCell>{venta.funcion.sala.nombre}</TableCell>
                <TableCell>{new Date(venta.funcion.fecha).toLocaleString()}</TableCell>
                <TableCell>{venta.cantidad}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default ReportesVentas;
