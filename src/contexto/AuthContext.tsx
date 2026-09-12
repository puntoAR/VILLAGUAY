import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario, Rol } from '../tipos';
import { AuthServicio } from '../servicios/auth';
import { USUARIOS_MOCK } from '../mocks/usuarios';

interface AuthContextType {
  usuario: Usuario | null;
  autenticado: boolean;
  cargando: boolean;
  iniciarSesion: (email: string) => Promise<boolean>;
  cerrarSesion: () => Promise<void>;
  cambiarRolDemo: (rol: Rol) => Promise<void>;
  alternarFavorito: (espacioId: string) => Promise<void>;
  esEncargadoOAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  autenticado: false,
  cargando: true,
  iniciarSesion: async () => false,
  cerrarSesion: async () => {},
  cambiarRolDemo: async () => {},
  alternarFavorito: async () => {},
  esEncargadoOAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    AuthServicio.obtenerUsuarioActivo().then(u => {
      setUsuario(u);
      setCargando(false);
    });
  }, []);

  const iniciarSesion = async (email: string): Promise<boolean> => {
    const u = USUARIOS_MOCK.find(x => x.email.toLowerCase() === email.toLowerCase()) || {
      id: `usr-${Date.now()}`,
      nombre: email.split('@')[0],
      email,
      telefono: '3455-000000',
      rol: 'jugador' as Rol,
      espaciosFavoritos: [],
      cancelacionesTardias: 0,
      ausencias: 0,
    };
    await AuthServicio.guardarUsuarioActivo(u);
    setUsuario(u);
    return true;
  };

  const cerrarSesion = async () => {
    await AuthServicio.cerrarSesion();
    setUsuario(null);
  };

  const cambiarRolDemo = async (rol: Rol) => {
    const u = USUARIOS_MOCK.find(x => x.rol === rol) || USUARIOS_MOCK[0];
    await AuthServicio.guardarUsuarioActivo(u);
    setUsuario(u);
  };

  const alternarFavorito = async (espacioId: string) => {
    if (!usuario) return;
    const favs = usuario.espaciosFavoritos || [];
    const existe = favs.includes(espacioId);
    const nuevosFavs = existe ? favs.filter(id => id !== espacioId) : [...favs, espacioId];
    const act = { ...usuario, espaciosFavoritos: nuevosFavs };
    setUsuario(act);
    await AuthServicio.guardarUsuarioActivo(act);
  };

  const esEncargadoOAdmin = usuario?.rol === 'encargado' || usuario?.rol === 'administrador';

  return (
    <AuthContext.Provider
      value={{
        usuario,
        autenticado: Boolean(usuario),
        cargando,
        iniciarSesion,
        cerrarSesion,
        cambiarRolDemo,
        alternarFavorito,
        esEncargadoOAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);