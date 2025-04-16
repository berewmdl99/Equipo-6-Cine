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
import boletoService from '../services/boletoService';
import BackToMenuButton from '../components/BackToMenuButton';

const ReimprimirBoletos = () => {
    const [boletoId, setBoletoId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    const handleReimprimir = async () => {
        if (!boletoId.trim()) {
            setError('Por favor ingrese un ID de boleto');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Obtener los datos del boleto
            const datosBoleto = await boletoService.obtenerBoletoPorId(boletoId);
            
            if (!datosBoleto) {
                throw new Error('Boleto no encontrado');
            }

            // Crear el boleto en el formato esperado
            const boleto = {
                id: datosBoleto.boleto_id,
                funcion: {
                    pelicula: {
                        titulo: datosBoleto.funcion.pelicula
                    },
                    sala: {
                        nombre: datosBoleto.funcion.sala
                    },
                    fecha: datosBoleto.funcion.fecha,
                    hora: datosBoleto.funcion.hora
                },
                asiento: {
                    fila: datosBoleto.asiento.fila,
                    numero: datosBoleto.asiento.numero
                },
                precio: datosBoleto.precio
            };

            // Crear objeto de pago
            const pago = {
                monto_pagado: datosBoleto.precio,
                cambio: 0,
                fecha_pago: datosBoleto.fecha_compra
            };

            // Imprimir el boleto
            await boletoService.imprimirBoleto([boleto], pago, boleto.funcion);
            
            enqueueSnackbar('Boleto reimpreso exitosamente', { variant: 'success' });
            setBoletoId(''); // Limpiar el campo después de una reimpresión exitosa

        } catch (error) {
            console.error('Error al reimprimir boleto:', error);
            setError(error.message || 'Error al reimprimir el boleto');
            enqueueSnackbar(error.message || 'Error al reimprimir el boleto', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">
                    Reimprimir Boletos
                </Typography>
                <BackToMenuButton />
            </Box>

            <Grid container spacing={3} justifyContent="center">
                <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Ingrese el ID del Boleto
                        </Typography>

                        <TextField
                            label="ID del Boleto"
                            value={boletoId}
                            onChange={(e) => setBoletoId(e.target.value)}
                            fullWidth
                            margin="normal"
                            variant="outlined"
                            placeholder="Ejemplo: 12345"
                            disabled={loading}
                        />

                        {error && (
                            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            size="large"
                            onClick={handleReimprimir}
                            disabled={loading || !boletoId.trim()}
                            sx={{ mt: 2 }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Reimprimir Boleto'}
                        </Button>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ReimprimirBoletos; 