import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, logout as authLogout } from './services/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
      // Obtener datos del usuario al cargar
      getCurrentUser().then(userData => {
        setUser(userData);
      }).catch(error => {
        console.error('Error loading user:', error);
        logout(); // Si hay error, hacer logout
      });
    }
    setLoading(false);
  }, []);

  const login = async (token) => {
    localStorage.setItem('access_token', token);
    setIsAuthenticated(true);
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error getting user data:', error);
      logout();
    }
  };

  const logout = () => {
    authLogout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const isAdmin = () => {
    return user?.is_admin === true;
  };

  const isEmployee = () => {
    return user?.role === 'employee';
  };

  if (loading) {
    return null; // o un componente de carga
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      logout, 
      user,
      isAdmin,
      isEmployee,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};