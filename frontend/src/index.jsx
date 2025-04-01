import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";  // Cambiado aquí
import { useThemeStore } from "./store/themeStore";

const Root = () => {
  const { theme } = useThemeStore();

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return <App />;  {/* Cambiado aquí */}
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
