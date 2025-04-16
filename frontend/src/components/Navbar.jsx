import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Film, Calendar, Ticket, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 p-4">
      <div className="flex justify-between items-center container mx-auto">
        {/* Menú general */}
        <div className="flex space-x-4">
          <NavLink to="/home" className="text-white hover:bg-blue-500 p-2 rounded-md">
            <Home className="mr-2" /> Inicio
          </NavLink>
          <NavLink to="/peliculas" className="text-white hover:bg-blue-500 p-2 rounded-md">
            <Film className="mr-2" /> Películas
          </NavLink>
          <NavLink to="/funciones" className="text-white hover:bg-blue-500 p-2 rounded-md">
            <Calendar className="mr-2" /> Funciones
          </NavLink>
          <NavLink to="/boletos" className="text-white hover:bg-blue-500 p-2 rounded-md">
            <Ticket className="mr-2" /> Boletos
          </NavLink>
        </div>

        {/* Menú para administradores */}
        {isAdmin && (
          <div className="flex space-x-4">
            <NavLink to="/admin" className="text-white hover:bg-red-500 p-2 rounded-md">
              <Settings className="mr-2" /> Panel Admin
            </NavLink>
          </div>
        )}

        {/* Botón de cerrar sesión */}
        <button onClick={handleLogout} className="text-white hover:bg-red-500 p-2 rounded-md">
          <LogOut className="mr-2" /> Cerrar sesión
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
