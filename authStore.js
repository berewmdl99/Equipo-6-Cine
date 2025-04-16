// src/store/authStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jwtDecode } from 'jwt-decode';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,   // Por defecto, no hay usuario
      token: null,  // Por defecto, no hay token
      login: (token) => {
        try {
          const decoded = jwtDecode(token); // Decodificar el JWT
          set({ token, user: decoded }); // Guardar el usuario decodificado
        } catch (error) {
          console.error('Error al decodificar el token:', error);
        }
      },
      logout: () => set({ user: null, token: null }),  // Borrar el usuario y el token
    }),
    { name: "auth" } // Persistir en el almacenamiento local
  )
);
