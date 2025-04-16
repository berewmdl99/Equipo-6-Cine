import React from 'react';
import { Box, IconButton, Typography, Paper } from '@mui/material';
import WeekendIcon from '@mui/icons-material/Weekend';
import { styled } from '@mui/material/styles';

const Screen = styled(Paper)(({ theme }) => ({
  width: '80%',
  height: '50px',
  backgroundColor: theme.palette.grey[300],
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: theme.spacing(4),
  transform: 'perspective(100px) rotateX(-5deg)',
  boxShadow: theme.shadows[3]
}));

const MapaAsientos = ({ asientos, onAsientoClick, modo = 'seleccion', asientosSeleccionados = [] }) => {
  const filas = [...new Set(asientos.map(asiento => asiento.fila))].sort();
  const maxAsientosPorFila = Math.max(...filas.map(fila => 
    asientos.filter(asiento => asiento.fila === fila).length
  ));

  const getColorAsiento = (estado, asiento) => {
    if (asientosSeleccionados.find(a => a.id === asiento.id)) return '#4caf50'; // Verde para seleccionados
    switch (estado.toLowerCase()) {
      case 'disponible': return '#2196f3'; // Azul
      case 'ocupado': return '#f44336'; // Rojo
      case 'deshabilitado': return '#9e9e9e'; // Gris
      default: return '#2196f3'; // Azul por defecto
    }
  };

  const handleClick = (asiento) => {
    if (onAsientoClick && (modo === 'configuracion' || asiento.estado.toLowerCase() !== 'ocupado')) {
      onAsientoClick(asiento);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: 1,
      p: 2,
      bgcolor: 'background.paper',
      borderRadius: 1,
      boxShadow: 1
    }}>
      <Screen>
        <Typography variant="subtitle1" color="text.secondary">
          PANTALLA
        </Typography>
      </Screen>

      {filas.map((fila) => {
        const asientosFila = asientos.filter(a => a.fila === fila).sort((a, b) => a.numero - b.numero);
        const espaciosVacios = (maxAsientosPorFila - asientosFila.length) / 2;

        return (
          <Box
            key={fila}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Typography sx={{ minWidth: '30px' }}>{fila}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[...Array(Math.floor(espaciosVacios))].map((_, i) => (
                <Box key={`space-left-${i}`} sx={{ width: 40 }} />
              ))}
              {asientosFila.map((asiento) => (
                <IconButton
                  key={asiento.numero}
                  onClick={() => handleClick(asiento)}
                  disabled={modo === 'seleccion' && asiento.estado.toLowerCase() === 'ocupado'}
                  sx={{
                    color: getColorAsiento(asiento.estado, asiento),
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    },
                    '&.Mui-disabled': {
                      color: '#f44336'
                    }
                  }}
                >
                  <WeekendIcon />
                </IconButton>
              ))}
            </Box>
          </Box>
        );
      })}
      
      <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <WeekendIcon sx={{ color: '#2196f3' }} />
          <Typography variant="caption">Disponible</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <WeekendIcon sx={{ color: '#f44336' }} />
          <Typography variant="caption">Ocupado</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <WeekendIcon sx={{ color: '#9e9e9e' }} />
          <Typography variant="caption">Deshabilitado</Typography>
        </Box>
        {modo === 'seleccion' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <WeekendIcon sx={{ color: '#4caf50' }} />
            <Typography variant="caption">Seleccionado</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MapaAsientos;
