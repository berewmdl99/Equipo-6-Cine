import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isAdmin } = useAuth();

  // Si no está autenticado, redirige a login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Si se requiere un rol específico para esta ruta
  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to="/" />;
  }

  return children;
};

export default PrivateRoute;
