import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const PrivateRoute = ({ children, requiredRole }) => {
  const token = useAuthStore((state) => state.token);

  // Si no hay token, redirige a login
  if (!token) {
    return <Navigate to="/login" />;
  }

  // Si se requiere un rol específico para esta ruta
  if (requiredRole) {
    try {
      const decoded = jwtDecode(token);
      if (requiredRole === "admin" && !decoded.is_admin) {
        return <Navigate to="/dashboard" />;
      }
    } catch (error) {
      console.error("Error al decodificar el token", error);
      return <Navigate to="/login" />;
    }
  }

  return children;
};

export default PrivateRoute;
