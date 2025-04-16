import React from 'react';
import { Button, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const BackToMenuButton = ({ toDashboard = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (toDashboard) {
      navigate('/');
    } else {
      navigate(-1); // Navega a la página anterior
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{ 
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 'bold'
        }}
      >
        {toDashboard ? 'Regresar al Dashboard' : 'Regresar'}
      </Button>
    </Box>
  );
};

export default BackToMenuButton; 