// src/theme.js

import { createTheme } from "@mui/material/styles";
import { useThemeStore } from "./store/themeStore";

// Función para crear un tema basado en el modo (claro/oscuro)
export const getTheme = (mode) => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#1976d2",
        light: "#42a5f5",
        dark: "#1565c0",
        contrastText: "#ffffff",
      },
      secondary: {
        main: "#dc004e",
        light: "#ff4081",
        dark: "#c51162",
        contrastText: "#ffffff",
      },
      error: {
        main: "#f44336",
        light: "#e57373",
        dark: "#d32f2f",
        contrastText: "#ffffff",
      },
      warning: {
        main: "#ff9800",
        light: "#ffb74d",
        dark: "#f57c00",
        contrastText: "rgba(0, 0, 0, 0.87)",
      },
      info: {
        main: "#2196f3",
        light: "#64b5f6",
        dark: "#1976d2",
        contrastText: "#ffffff",
      },
      success: {
        main: "#4caf50",
        light: "#81c784",
        dark: "#388e3c",
        contrastText: "rgba(0, 0, 0, 0.87)",
      },
      background: {
        default: mode === 'light' ? "#f4f4f4" : "#121212",
        paper: mode === 'light' ? "#ffffff" : "#1e1e1e",
      },
      text: {
        primary: mode === 'light' ? "rgba(0, 0, 0, 0.87)" : "#ffffff",
        secondary: mode === 'light' ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.7)",
      },
      divider: mode === 'light' ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.12)",
    },
    typography: {
      fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
      h1: {
        fontWeight: 500,
      },
      h2: {
        fontWeight: 500,
      },
      h3: {
        fontWeight: 500,
      },
      h4: {
        fontWeight: 500,
      },
      h5: {
        fontWeight: 500,
      },
      h6: {
        fontWeight: 500,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: mode === 'light' 
              ? '0 4px 6px rgba(0, 0, 0, 0.1)' 
              : '0 4px 6px rgba(0, 0, 0, 0.3)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
    },
  });
};

// Tema por defecto (se actualizará en el componente ThemeProvider)
const theme = getTheme('light');

export default theme;
