import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    Box, 
    Typography, 
    TextField, 
    Button, 
    Paper,
    Grid,
    CircularProgress,
    Alert,
    Divider
} from '@mui/material';
import { useSnackbar } from 'notistack';
import boletoService from '../services/boletoService';
import asientoService from '../services/asientoService';
import BackToMenuButton from '../components/BackToMenuButton';

const Pago = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [montoPagado, setMontoPagado] = useState('');
    const [cambio, setCambio] = useState(0);
    const [boletoCreado, setBoletoCreado] = useState(null);

    const {
        funcionId,
        asientos,
        total,
        funcion
    } = location.state || {};

    useEffect(() => {
        if (!funcionId || !asientos || !total || !funcion) {
            enqueueSnackbar('Información de pago incompleta', { variant: 'error' });
            navigate('/');
            return;
        }

        if (!currentUser?.id) {
            enqueueSnackbar('Debe iniciar sesión como vendedor', { variant: 'error' });
            navigate('/login');
            return;
        }
    }, [funcionId, asientos, total, funcion, currentUser, navigate, enqueueSnackbar]);

    const handleMontoChange = (e) => {
        const monto = parseFloat(e.target.value) || 0;
        setMontoPagado(e.target.value);
        setCambio(Math.max(0, monto - total));
    };

    const handleProcesarPago = async () => {
        if (!montoPagado || parseFloat(montoPagado) < total) {
            setError('El monto pagado debe ser igual o mayor al total');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const asientosIds = asientos.map(asiento => asiento.id);

            // Intentamos reservar los asientos
            try {
                await asientoService.reservarAsientos(funcionId, asientosIds);
            } catch (error) {
                if (error.response?.status === 400) {
                    await asientoService.liberarAsientos(funcionId, asientosIds);
                    await asientoService.reservarAsientos(funcionId, asientosIds);
                } else {
                    throw error;
                }
            }

            // Creamos un boleto por cada asiento
            const boletosPromesas = asientos.map(asiento => 
                boletoService.crearBoleto({
                    funcion_id: funcionId,
                    asiento_id: asiento.id,
                    usuario_id: currentUser.id,
                    vendedor_id: currentUser.id,
                    precio: funcion.precio_unitario,
                    estado: 'comprado'
                })
            );

            const boletos = await Promise.all(boletosPromesas);
            setBoletoCreado(boletos);

            // Crear objeto de pago
            const pago = {
                monto_pagado: parseFloat(montoPagado),
                cambio: cambio,
                fecha_pago: new Date().toISOString()
            };

            // Imprimir los boletos directamente
            await boletoService.imprimirBoleto(boletos, pago, funcion);

            // Mostrar mensaje de éxito
            enqueueSnackbar('Pago procesado exitosamente', { variant: 'success' });

            // Redirigir al menú principal después de un breve retraso
            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (error) {
            console.error('Error en el proceso de pago:', error);
            setError(error.message || 'Error al procesar el pago');
            enqueueSnackbar(error.message || 'Error al procesar el pago', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">
                    Pago de Boletos
                </Typography>
                <BackToMenuButton />
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper elevation={3} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Detalles de la Función
                        </Typography>
                        <Typography>
                            Película: {funcion?.titulo}
                        </Typography>
                        <Typography>
                            Sala: {funcion?.sala}
                        </Typography>
                        <Typography>
                            Fecha: {funcion?.fecha && new Date(funcion.fecha).toLocaleDateString()}
                        </Typography>
                        <Typography>
                            Hora: {funcion?.hora}
                        </Typography>
                        <Typography gutterBottom>
                            Asientos: {asientos?.map(a => `${a.fila}${a.numero}`).join(', ')}
                        </Typography>

                        <Divider sx={{ my: 3 }} />

                        <Box mt={3}>
                            <Typography variant="h6" gutterBottom>
                                Resumen de Pago
                            </Typography>
                            <Typography>
                                Precio por boleto: ${funcion?.precio_unitario?.toFixed(2)}
                            </Typography>
                            <Typography>
                                Cantidad de boletos: {asientos?.length}
                            </Typography>
                            <Typography variant="h6" sx={{ mt: 2, color: 'primary.main' }}>
                                Total a pagar: ${total?.toFixed(2)}
                            </Typography>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        <Box mt={3}>
                            <Typography variant="h6" gutterBottom>
                                Procesar Pago
                            </Typography>
                            <TextField
                                label="Monto Recibido"
                                type="number"
                                value={montoPagado}
                                onChange={handleMontoChange}
                                fullWidth
                                required
                                error={montoPagado !== '' && parseFloat(montoPagado) < total}
                                helperText={montoPagado !== '' && parseFloat(montoPagado) < total ? 'El monto debe ser igual o mayor al total' : ''}
                                sx={{ mb: 2 }}
                                InputProps={{
                                    startAdornment: <Typography>$</Typography>
                                }}
                            />
                            <Typography variant="h6" color="success.main" gutterBottom>
                                Cambio a devolver: ${cambio.toFixed(2)}
                            </Typography>
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <Box mt={3}>
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                size="large"
                                onClick={handleProcesarPago}
                                disabled={loading || !montoPagado || parseFloat(montoPagado) < total}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Confirmar Pago e Imprimir Boletos'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Pago; 