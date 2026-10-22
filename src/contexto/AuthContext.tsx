// src/contexto/AuthContext.tsx
// Unidad 3 y 6: Proveedor de Autenticación y resguardo seguro

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
    const inicializar = async () => {
      const u = await AuthServicio.obtenerUsuarioSesion();
      setUsuario(u);
      const bio = await AuthServicio.soportaBiometria();
      setSoportaBiometria(bio);
      setCargando(false);
    };
    inicializar();
  }, []);

  const iniciarSesion = async (email: string, password?: string) => {
    const res = await AuthServicio.iniciarSesion(email, password);
    if (res.exito && res.usuario) {
      setUsuario(res.usuario);
      return { exito: true };
    }
    return { exito: false, mensaje: res.mensaje };
  };

  const cerrarSesion = async () => {
    await AuthServicio.cerrarSesion();
    setUsuario(null);
  };

  const autenticarBiometria = async () => {
    return await AuthServicio.autenticarConBiometria();
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
