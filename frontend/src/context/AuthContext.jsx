import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, loginUser, logout as authLogout } from '../services/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
      getCurrentUser()
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await loginUser(username, password);
      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token);
        setIsAuthenticated(true);
        const userData = await getCurrentUser();
        setUser(userData);
        return userData;
      }
      throw new Error('No se recibió el token de acceso');
    } catch (error) {
      logout();
      throw error;
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

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      logout, 
      user,
      isAdmin,
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