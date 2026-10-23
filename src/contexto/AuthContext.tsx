// src/contexto/AuthContext.tsx
// Contexto de autenticación

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '../tipos';
import { AuthServicio } from '../servicios/auth';

interface AuthContextType {
  usuario: Usuario | null;
  autenticado: boolean;
  cargando: boolean;
  soportaBiometria: boolean;
  iniciarSesion: (email: string, password?: string) => Promise<{ exito: boolean; mensaje?: string }>;
  cerrarSesion: () => Promise<void>;
  autenticarBiometria: () => Promise<boolean>;
  actualizarAvatar: (avatarUrl: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  autenticado: false,
  cargando: true,
  soportaBiometria: false,
  iniciarSesion: async () => ({ exito: false }),
  cerrarSesion: async () => {},
  autenticarBiometria: async () => false,
  actualizarAvatar: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [soportaBiometria, setSoportaBiometria] = useState(false);

  useEffect(() => {
    let montado = true;
    const inicializar = async () => {
      try {
        const u = await AuthServicio.obtenerUsuarioSesion();
        if (montado) setUsuario(u);
        const bio = await AuthServicio.soportaBiometria();
        if (montado) setSoportaBiometria(bio);
      } catch (err) {
        console.warn('[AuthContext] Error inicializando sesión:', err);
      } finally {
        if (montado) setCargando(false);
      }
    };
    inicializar();
    return () => {
      montado = false;
    };
  }, []);

  const iniciarSesion = async (email: string, password?: string) => {
    try {
      const res = await AuthServicio.iniciarSesion(email, password);
      if (res.exito && res.usuario) {
        setUsuario(res.usuario);
        return { exito: true };
      }
      return { exito: false, mensaje: res.mensaje || 'Error al iniciar sesión' };
    } catch (e: any) {
      return { exito: false, mensaje: e?.message || 'Error de conexión' };
    }
  };

  const cerrarSesion = async () => {
    try {
      await AuthServicio.cerrarSesion();
    } finally {
      setUsuario(null);
    }
  };

  const autenticarBiometria = async () => {
    try {
      return await AuthServicio.autenticarConBiometria();
    } catch {
      return false;
    }
  };

  const actualizarAvatar = (avatarUrl: string) => {
    if (usuario) {
      setUsuario({ ...usuario, avatarUrl });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        autenticado: Boolean(usuario),
        cargando,
        soportaBiometria,
        iniciarSesion,
        cerrarSesion,
        autenticarBiometria,
        actualizarAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
