import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { useThemeStore } from "./store/themeStore";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { getTheme } from "./theme";

// Componente para aplicar el tema según el modo seleccionado
const ThemedApp = () => {
  const { theme } = useThemeStore();
  const muiTheme = React.useMemo(() => getTheme(theme), [theme]);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemedApp />
  </React.StrictMode>
);
