import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Grid, 
  CircularProgress,
  Alert
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { QRCodeCanvas } from 'qrcode.react';
import boletoService from '../services/boletoService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import BackToMenuButton from '../components/BackToMenuButton';

const ImpresionBoletos = () => {
  const [codigoBoleto, setCodigoBoleto] = useState('');
  const [boleto, setBoleto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  const buscarBoleto = async () => {
    if (!codigoBoleto.trim()) {
      enqueueSnackbar('Por favor ingrese un código de boleto', { variant: 'warning' });
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await boletoService.obtenerBoletoPorId(codigoBoleto);
      setBoleto(data);
    } catch (error) {
      setError(error.message || 'Boleto no encontrado');
      setBoleto(null);
      enqueueSnackbar(error.message || 'Boleto no encontrado', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const imprimirBoleto = () => {
    window.print();
  };

  return (
    <Box sx={{ p: 3 }}>
      <BackToMenuButton />
      <Typography variant="h4" gutterBottom>
        Reimpresión de Boletos
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <TextField
              label="Código de Boleto"
              value={codigoBoleto}
              onChange={(e) => setCodigoBoleto(e.target.value)}
              fullWidth
              placeholder="Ingrese el código del boleto"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={buscarBoleto}
              fullWidth
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Buscar'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {boleto && (
        <Paper sx={{ p: 3, mb: 3 }} className="boleto-imprimir">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom align="center">
                Boleto de Cine
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                {boleto.funcion?.pelicula?.titulo}
              </Typography>
              
              <Typography variant="body1" paragraph>
                <strong>Fecha:</strong> {format(new Date(boleto.funcion?.fecha), 'EEEE d MMMM yyyy', { locale: es })}
              </Typography>
              
              <Typography variant="body1" paragraph>
                <strong>Hora:</strong> {boleto.funcion?.hora}
              </Typography>
              
              <Typography variant="body1" paragraph>
                <strong>Sala:</strong> {boleto.funcion?.sala?.nombre}
              </Typography>
              
              <Typography variant="body1" paragraph>
                <strong>Asiento:</strong> {boleto.asiento?.fila}{boleto.asiento?.numero}
              </Typography>
              
              <Typography variant="body1" paragraph>
                <strong>Precio:</strong> ${boleto.precio}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Código de boleto: {boleto.id}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <QRCodeCanvas 
                  value={JSON.stringify({
                    id: boleto.id,
                    funcion: boleto.funcion?.id,
                    asiento: boleto.asiento?.id
                  })} 
                  size={150}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={imprimirBoleto}
                fullWidth
              >
                Imprimir Boleto
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default ImpresionBoletos;