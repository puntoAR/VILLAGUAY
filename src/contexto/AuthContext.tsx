import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario, Rol, DatosRegistro } from '../tipos';
import { AuthServicio } from '../servicios/auth';
import { USUARIOS_MOCK } from '../mocks/usuarios';
import { esError } from '../servicios/api';

interface AuthContextType {
  usuario: Usuario | null;
  autenticado: boolean;
  cargando: boolean;
  soportaBiometria: boolean;
  iniciarSesion: (email: string, password?: string) => Promise<{ exito: boolean; mensajeError?: string }>;
  registrar: (datos: DatosRegistro) => Promise<{ exito: boolean; mensajeError?: string }>;
  crearUsuarioPorAdmin: (datos: DatosRegistro) => Promise<{ exito: boolean; usuario?: Usuario; mensajeError?: string }>;
  cerrarSesion: () => Promise<void>;
  reingresoBiometrico: () => Promise<boolean>;
  cambiarRolDemo: (rol: Rol) => Promise<void>;
  seleccionarUsuarioDemo: (usuario: Usuario) => Promise<void>;
  alternarFavorito: (espacioId: string) => Promise<void>;
  esEncargadoOAdmin: boolean;
  esJugador: boolean;
  esEncargado: boolean;
  esAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  autenticado: false,
  cargando: true,
  soportaBiometria: false,
  iniciarSesion: async () => ({ exito: false }),
  registrar: async () => ({ exito: false }),
  crearUsuarioPorAdmin: async () => ({ exito: false }),
  cerrarSesion: async () => {},
  reingresoBiometrico: async () => false,
  cambiarRolDemo: async () => {},
  seleccionarUsuarioDemo: async () => {},
  alternarFavorito: async () => {},
  esEncargadoOAdmin: false,
  esJugador: false,
  esEncargado: false,
  esAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [soportaBiometria, setSoportaBiometria] = useState(false);

  useEffect(() => {
    const inicializar = async () => {
      const activo = await AuthServicio.obtenerUsuarioActivo();
      setUsuario(activo);
      const bio = await AuthServicio.soporteBiometria();
      setSoportaBiometria(bio);
      setCargando(false);
    };

    inicializar();
  }, []);

  const iniciarSesion = async (
    email: string,
    password?: string
  ): Promise<{ exito: boolean; mensajeError?: string }> => {
    const respuesta = await AuthServicio.iniciarSesion(email, password);
    if (esError(respuesta)) {
      return { exito: false, mensajeError: respuesta.error.mensaje };
    }
    setUsuario(respuesta.datos.usuario);
    return { exito: true };
  };

  const registrar = async (
    datos: DatosRegistro
  ): Promise<{ exito: boolean; mensajeError?: string }> => {
    const respuesta = await AuthServicio.registrarUsuario(datos);
    if (esError(respuesta)) {
      return { exito: false, mensajeError: respuesta.error.mensaje };
    }
    setUsuario(respuesta.datos.usuario);
    return { exito: true };
  };

  const crearUsuarioPorAdmin = async (
    datos: DatosRegistro
  ): Promise<{ exito: boolean; usuario?: Usuario; mensajeError?: string }> => {
    const respuesta = await AuthServicio.crearUsuarioPorAdmin(datos, usuario?.rol);
    if (esError(respuesta)) {
      return { exito: false, mensajeError: respuesta.error.mensaje };
    }
    return { exito: true, usuario: respuesta.datos };
  };

  const cerrarSesion = async () => {
    await AuthServicio.cerrarSesion();
    setUsuario(null);
  };

  const reingresoBiometrico = async (): Promise<boolean> => {
    const res = await AuthServicio.autenticarConBiometria(
      'Verificá tu identidad para reingresar al sistema'
    );
    return res.exito;
  };

  const cambiarRolDemo = async (rol: Rol) => {
    let u = USUARIOS_MOCK.find(x => x.rol === rol);
    if (!u && rol === 'administrador') {
      u = {
        id: 'usr-direccion',
        nombre: 'Dirección de Deportes',
        email: 'direccion@villaguay.gob.ar',
        telefono: '3455-998877',
        rol: 'administrador',
        espaciosFavoritos: ['esp-01', 'esp-03'],
        cancelacionesTardias: 0,
        ausencias: 0,
        password: '123456',
      };
    } else if (!u) {
      u = USUARIOS_MOCK[0];
    }
    await AuthServicio.guardarUsuarioActivo(u);
    setUsuario(u);
  };

  const seleccionarUsuarioDemo = async (u: Usuario) => {
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
  const esJugador = usuario?.rol === 'jugador';
  const esEncargado = usuario?.rol === 'encargado';
  const esAdmin = usuario?.rol === 'administrador';

  return (
    <AuthContext.Provider
      value={{
        usuario,
        autenticado: Boolean(usuario),
        cargando,
        soportaBiometria,
        iniciarSesion,
        registrar,
        crearUsuarioPorAdmin,
        cerrarSesion,
        reingresoBiometrico,
        cambiarRolDemo,
        seleccionarUsuarioDemo,
        alternarFavorito,
        esEncargadoOAdmin,
        esJugador,
        esEncargado,
        esAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);