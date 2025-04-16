import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import boletoService from '../services/boletoService';
import asientoService from '../services/asientoService';
import { useSnackbar } from 'notistack';
import BackToMenuButton from '../components/BackToMenuButton';
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

const Pago = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
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

    // Efecto para limpiar asientos al montar/desmontar el componente
    useEffect(() => {
        const limpiarAsientos = async () => {
            if (funcionId && asientos) {
                try {
                    const asientosIds = asientos.map(asiento => asiento.id);
                    await asientoService.liberarAsientos(funcionId, asientosIds);
                } catch (error) {
                    console.error('Error al liberar asientos:', error);
                    // No mostramos el error al usuario ya que no es crítico
                }
            }
        };

        // Solo limpiamos al desmontar
        return () => {
            if (!boletoCreado) { // Solo si no se completó la compra
                limpiarAsientos();
            }
        };
    }, [funcionId, asientos, boletoCreado]);

    useEffect(() => {
        if (!funcionId || !asientos || !total || !funcion) {
            enqueueSnackbar('Información de pago incompleta', { variant: 'error' });
            navigate('/');
            return;
        }
    }, [funcionId, asientos, total, funcion, navigate, enqueueSnackbar]);

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

            // Intentamos reservar los asientos directamente
            // La API verificará la disponibilidad internamente
            try {
                await asientoService.reservarAsientos(funcionId, asientosIds);
            } catch (error) {
                if (error.response?.status === 400) {
                    // Si los asientos no están disponibles, intentamos liberarlos primero
                    await asientoService.liberarAsientos(funcionId, asientosIds);
                    // Intentamos reservar nuevamente
                    await asientoService.reservarAsientos(funcionId, asientosIds);
                } else {
                    throw error;
                }
            }

            // Si llegamos aquí, la reserva fue exitosa
            // Creamos los boletos
            const boletosData = asientos.map(asiento => ({
                funcion_id: funcionId,
                asiento_id: asiento.id,
                usuario_id: user.id,
                precio: funcion.precio_unitario,
                estado: 'comprado'
            }));

            const boletos = await boletoService.crearBoletos(boletosData);
            setBoletoCreado(boletos);

            // Navegar a la página de impresión de boletos
            navigate('/boletos/imprimir', {
                state: {
                    boletos,
                    funcion,
                    montoPagado: parseFloat(montoPagado),
                    cambio,
                    imprimirAutomaticamente: true
                }
            });

            enqueueSnackbar('Pago procesado exitosamente', { variant: 'success' });
        } catch (error) {
            setError(error.message || 'Error al procesar el pago');
            enqueueSnackbar(error.message || 'Error al procesar el pago', { variant: 'error' });
            
            // Si falló el proceso, intentamos liberar los asientos
            try {
                const asientosIds = asientos.map(asiento => asiento.id);
                await asientoService.liberarAsientos(funcionId, asientosIds);
            } catch (liberarError) {
                console.error('Error al liberar asientos:', liberarError);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!funcionId || !asientos || !total || !funcion) {
        return null;
    }

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
                            Película: {funcion.titulo}
                        </Typography>
                        <Typography>
                            Sala: {funcion.sala}
                        </Typography>
                        <Typography>
                            Fecha: {new Date(funcion.fecha).toLocaleDateString()}
                        </Typography>
                        <Typography>
                            Hora: {funcion.hora}
                        </Typography>
                        <Typography gutterBottom>
                            Asientos: {asientos.map(a => `${a.fila}${a.numero}`).join(', ')}
                        </Typography>

                        <Divider sx={{ my: 3 }} />

                        <Box mt={3}>
                            <Typography variant="h6" gutterBottom>
                                Resumen de Pago
                            </Typography>
                            <Typography>
                                Precio por boleto: ${funcion.precio_unitario.toFixed(2)}
                            </Typography>
                            <Typography>
                                Cantidad de boletos: {asientos.length}
                            </Typography>
                            <Typography variant="h6" sx={{ mt: 2, color: 'primary.main' }}>
                                Total a pagar: ${total.toFixed(2)}
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