// src/admin/ReportesVentas.jsx
import React, { useEffect, useState } from "react";
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  CircularProgress,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Divider,
  ButtonGroup,
  Tooltip
} from "@mui/material";
import { useSnackbar } from "notistack";
import boletoService from "../services/boletoService";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import BarChartIcon from '@mui/icons-material/BarChart';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ReportesVentas = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroFechaInicio, setFiltroFechaInicio] = useState(null);
  const [filtroFechaFin, setFiltroFechaFin] = useState(null);
  const [filtroPelicula, setFiltroPelicula] = useState("");
  const [filtroSala, setFiltroSala] = useState("");
  const [peliculas, setPeliculas] = useState([]);
  const [salas, setSalas] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await boletoService.obtenerBoletos();
        setVentas(data);
      
      // Extraer películas y salas únicas para los filtros
      const peliculasUnicas = [...new Set(data.map(venta => venta.funcion.pelicula.titulo))];
      const salasUnicas = [...new Set(data.map(venta => venta.funcion.sala.nombre))];
      
      setPeliculas(peliculasUnicas);
      setSalas(salasUnicas);
      } catch (error) {
      setError("Error al cargar los reportes de ventas");
        enqueueSnackbar("Error al cargar los reportes de ventas", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros a los datos
  const ventasFiltradas = ventas.filter(venta => {
    const fechaVenta = new Date(venta.funcion.fecha);
    
    // Filtro por fecha de inicio
    if (filtroFechaInicio && fechaVenta < filtroFechaInicio) {
      return false;
    }
    
    // Filtro por fecha de fin
    if (filtroFechaFin) {
      const fechaFinAjustada = new Date(filtroFechaFin);
      fechaFinAjustada.setHours(23, 59, 59, 999);
      if (fechaVenta > fechaFinAjustada) {
        return false;
      }
    }
    
    // Filtro por película
    if (filtroPelicula && venta.funcion.pelicula.titulo !== filtroPelicula) {
      return false;
    }
    
    // Filtro por sala
    if (filtroSala && venta.funcion.sala.nombre !== filtroSala) {
      return false;
    }
    
    return true;
  });

  // Calcular estadísticas
  const totalBoletos = ventasFiltradas.reduce((total, venta) => total + venta.cantidad, 0);
  const totalIngresos = ventasFiltradas.reduce((total, venta) => total + (venta.precio * venta.cantidad), 0);

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltroFechaInicio(null);
    setFiltroFechaFin(null);
    setFiltroPelicula("");
    setFiltroSala("");
  };

  // Función para descargar reporte en PDF
  const descargarPDF = () => {
    if (ventasFiltradas.length === 0) {
      enqueueSnackbar("No hay datos para exportar", { variant: "warning" });
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(18);
      doc.text("Reporte de Ventas", 14, 15);
      
      // Fecha de generación
      doc.setFontSize(10);
      doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 22);
      
      // Filtros aplicados
      doc.setFontSize(10);
      let filtrosTexto = "Filtros aplicados: ";
      if (filtroFechaInicio) filtrosTexto += `Desde: ${filtroFechaInicio.toLocaleDateString()} `;
      if (filtroFechaFin) filtrosTexto += `Hasta: ${filtroFechaFin.toLocaleDateString()} `;
      if (filtroPelicula) filtrosTexto += `Película: ${filtroPelicula} `;
      if (filtroSala) filtrosTexto += `Sala: ${filtroSala}`;
      
      doc.text(filtrosTexto, 14, 29);
      
      // Resumen
      doc.setFontSize(12);
      doc.text(`Total de Boletos: ${totalBoletos}`, 14, 36);
      doc.text(`Total de Ingresos: $${totalIngresos.toFixed(2)}`, 14, 43);
      doc.text(`Funciones con Ventas: ${ventasFiltradas.length}`, 14, 50);
      
      // Tabla de datos
      const tableColumn = ["Película", "Sala", "Fecha", "Boletos", "Precio", "Total"];
      const tableRows = ventasFiltradas.map(venta => [
        venta.funcion.pelicula.titulo,
        venta.funcion.sala.nombre,
        new Date(venta.funcion.fecha).toLocaleString(),
        venta.cantidad,
        `$${venta.precio?.toFixed(2) || '0.00'}`,
        `$${(venta.precio * venta.cantidad).toFixed(2) || '0.00'}`
      ]);
      
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 60 }
      });
      
      // Guardar el PDF
      doc.save(`reporte-ventas-${new Date().toISOString().split('T')[0]}.pdf`);
      enqueueSnackbar("Reporte PDF generado correctamente", { variant: "success" });
    } catch (error) {
      console.error("Error al generar PDF:", error);
      enqueueSnackbar("Error al generar el PDF", { variant: "error" });
    }
  };

  // Función para descargar reporte en Excel
  const descargarExcel = () => {
    if (ventasFiltradas.length === 0) {
      enqueueSnackbar("No hay datos para exportar", { variant: "warning" });
      return;
    }

    try {
      // Crear hoja de resumen
      const resumenData = [
        ["Reporte de Ventas"],
        [`Generado el: ${new Date().toLocaleString()}`],
        [""],
        ["Resumen"],
        ["Total de Boletos Vendidos", totalBoletos],
        ["Total de Ingresos", `$${totalIngresos.toFixed(2)}`],
        ["Funciones con Ventas", ventasFiltradas.length],
        [""],
        ["Filtros aplicados"],
        ["Fecha Inicio", filtroFechaInicio ? filtroFechaInicio.toLocaleDateString() : "Todos"],
        ["Fecha Fin", filtroFechaFin ? filtroFechaFin.toLocaleDateString() : "Todos"],
        ["Película", filtroPelicula || "Todas"],
        ["Sala", filtroSala || "Todas"],
        [""]
      ];
      
      // Crear hoja de detalles
      const detallesData = [
        ["Película", "Sala", "Fecha", "Cantidad de Boletos", "Precio Unitario", "Total"]
      ];
      
      ventasFiltradas.forEach(venta => {
        detallesData.push([
          venta.funcion.pelicula.titulo,
          venta.funcion.sala.nombre,
          new Date(venta.funcion.fecha).toLocaleString(),
          venta.cantidad,
          venta.precio?.toFixed(2) || '0.00',
          (venta.precio * venta.cantidad).toFixed(2) || '0.00'
        ]);
      });
      
      // Crear libro de Excel
      const wb = XLSX.utils.book_new();
      
      // Agregar hojas al libro
      const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
      const wsDetalles = XLSX.utils.aoa_to_sheet(detallesData);
      
      XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");
      XLSX.utils.book_append_sheet(wb, wsDetalles, "Detalles");
      
      // Guardar el archivo
      XLSX.writeFile(wb, `reporte-ventas-${new Date().toISOString().split('T')[0]}.xlsx`);
      enqueueSnackbar("Reporte Excel generado correctamente", { variant: "success" });
    } catch (error) {
      console.error("Error al generar Excel:", error);
      enqueueSnackbar("Error al generar el Excel", { variant: "error" });
    }
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToDashboard}
            sx={{ mr: 2 }}
          >
            Regresar al Dashboard
          </Button>
          <BarChartIcon sx={{ fontSize: 30, mr: 1, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Reporte de Ventas
          </Typography>
        </Box>
        
        <ButtonGroup variant="outlined" aria-label="exportar reporte">
          <Tooltip title="Descargar PDF">
            <Button 
              onClick={descargarPDF}
              startIcon={<PictureAsPdfIcon />}
              disabled={loading || ventasFiltradas.length === 0}
            >
              PDF
            </Button>
          </Tooltip>
          <Tooltip title="Descargar Excel">
            <Button 
              onClick={descargarExcel}
              startIcon={<TableChartIcon />}
              disabled={loading || ventasFiltradas.length === 0}
            >
              Excel
            </Button>
          </Tooltip>
        </ButtonGroup>
      </Box>

      {/* Tarjetas de resumen */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total de Boletos Vendidos
              </Typography>
              <Typography variant="h4" component="div">
                {totalBoletos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total de Ingresos
              </Typography>
              <Typography variant="h4" component="div">
                ${totalIngresos.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Funciones con Ventas
              </Typography>
              <Typography variant="h4" component="div">
                {ventasFiltradas.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterListIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Filtros</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha Inicio"
                value={filtroFechaInicio}
                onChange={(newValue) => setFiltroFechaInicio(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha Fin"
                value={filtroFechaFin}
                onChange={(newValue) => setFiltroFechaFin(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Película</InputLabel>
              <Select
                value={filtroPelicula}
                label="Película"
                onChange={(e) => setFiltroPelicula(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {peliculas.map((pelicula) => (
                  <MenuItem key={pelicula} value={pelicula}>
                    {pelicula}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Sala</InputLabel>
              <Select
                value={filtroSala}
                label="Sala"
                onChange={(e) => setFiltroSala(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {salas.map((sala) => (
                  <MenuItem key={sala} value={sala}>
                    {sala}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button 
              variant="outlined" 
              onClick={limpiarFiltros}
              startIcon={<FilterListIcon />}
            >
              Limpiar Filtros
            </Button>
            <Button 
              variant="contained" 
              onClick={cargarDatos}
              startIcon={<RefreshIcon />}
            >
              Actualizar Datos
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de ventas */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
            <Button 
              variant="contained" 
              onClick={cargarDatos}
              sx={{ mt: 2 }}
            >
              Reintentar
            </Button>
          </Box>
        ) : ventasFiltradas.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography>No hay datos de ventas disponibles</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Película</TableCell>
              <TableCell>Sala</TableCell>
              <TableCell>Fecha</TableCell>
                  <TableCell align="right">Cantidad de Boletos</TableCell>
                  <TableCell align="right">Precio Unitario</TableCell>
                  <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
                {ventasFiltradas.map((venta) => (
                  <TableRow key={venta.id} hover>
                <TableCell>{venta.funcion.pelicula.titulo}</TableCell>
                <TableCell>{venta.funcion.sala.nombre}</TableCell>
                <TableCell>{new Date(venta.funcion.fecha).toLocaleString()}</TableCell>
                    <TableCell align="right">{venta.cantidad}</TableCell>
                    <TableCell align="right">${venta.precio?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell align="right">${(venta.precio * venta.cantidad).toFixed(2) || '0.00'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default ReportesVentas;
