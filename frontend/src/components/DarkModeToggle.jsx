import React from 'react';
import { useThemeStore } from "../store/themeStore";
import { IconButton, Tooltip, useTheme } from "@mui/material";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const DarkModeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();
  const muiTheme = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <Tooltip title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
      <IconButton 
        onClick={toggleTheme} 
        color="inherit"
        aria-label={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      >
        {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Tooltip>
  );
};

export default DarkModeToggle;
