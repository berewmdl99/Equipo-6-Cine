// src/theme.js

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2", // Color principal
    },
    secondary: {
      main: "#dc004e", // Color secundario
    },
    background: {
      default: "#f4f4f4", // Fondo principal
    },
  },
  typography: {
    fontFamily: "'Roboto', sans-serif", // Tipo de fuente
  },
});

export default theme;
