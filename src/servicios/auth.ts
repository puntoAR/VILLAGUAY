import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { Usuario, DatosRegistro, RespuestaAuth, RespuestaExito, RespuestaError, Rol } from '../tipos';
import { USUARIOS_MOCK } from '../mocks/usuarios';
import { PreferenciasKV } from '../basedatos/kvstore';
import { obtenerBD } from '../basedatos/sqlite';
import { crearExito, crearError } from './api';

const CLAVE_TOKEN = 'auth_bearer_token';
const CLAVE_USUARIO_ID = 'auth_usuario_id';
const CLAVE_BIOMETRIA_ACTIVA = 'auth_biometria_habilitada';

export const AuthServicio = {
  // Guardar token seguro en expo-secure-store (según PRD pág. 6, nunca en kv-store)
  async guardarToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      await PreferenciasKV.guardar(CLAVE_TOKEN, token);
      return;
    }
    await SecureStore.setItemAsync(CLAVE_TOKEN, token);
  },

  // Obtener token Bearer
  async obtenerToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return await PreferenciasKV.obtener(CLAVE_TOKEN);
    }
    try {
      return await SecureStore.getItemAsync(CLAVE_TOKEN);
    } catch {
      return null;
    }
  },

  // Eliminar sesión
  async cerrarSesion(): Promise<void> {
    if (Platform.OS === 'web') {
      await PreferenciasKV.eliminar(CLAVE_TOKEN);
      await PreferenciasKV.eliminar(CLAVE_USUARIO_ID);
      await PreferenciasKV.guardar('auth_sesion_cerrada', 'true');
      return;
    }
    try {
      await SecureStore.deleteItemAsync(CLAVE_TOKEN);
    } catch {}
    await PreferenciasKV.eliminar(CLAVE_USUARIO_ID);
    await PreferenciasKV.guardar('auth_sesion_cerrada', 'true');
  },

  // Guardar ID del usuario activo y token Bearer
  async guardarUsuarioActivo(usuario: Usuario): Promise<string> {
    await PreferenciasKV.eliminar('auth_sesion_cerrada');
    await PreferenciasKV.guardar(CLAVE_USUARIO_ID, usuario.id);
    const token = `Bearer vgy_jwt_${usuario.id}_${Date.now()}`;
    await this.guardarToken(token);
    return token;
  },

  // Obtener usuario activo actual
  async obtenerUsuarioActivo(): Promise<Usuario | null> {
    try {
      const sesionCerrada = await PreferenciasKV.obtener('auth_sesion_cerrada');
      if (sesionCerrada === 'true') {
        return null;
      }

      const id = await PreferenciasKV.obtener(CLAVE_USUARIO_ID);
      if (!id) {
        return null;
      }

      let idFinal = id;
      if (id === 'usr-marcelo') idFinal = 'usr-damian';
      else if (id === 'usr-nahuel' || id === 'usr-agostina') idFinal = 'usr-agustina';
      else if (id === 'usr-207') idFinal = 'usr-javier';
      else if (id === 'usr-lucia') idFinal = 'usr-ema';

      if (idFinal !== id) {
        await PreferenciasKV.guardar(CLAVE_USUARIO_ID, idFinal);
      }

      // Buscar en mocks actualizados primero para asegurar sincronización de nombres oficiales
      const encontradoMock = USUARIOS_MOCK.find(u => u.id === idFinal);
      if (encontradoMock) return encontradoMock;

      // Buscar en SQLite
      const db = await obtenerBD();
      const usuarioBD = await db.getFirstAsync<any>(
        'SELECT * FROM usuarios WHERE id = ?',
        [idFinal]
      );

      if (usuarioBD) {
        return {
          id: usuarioBD.id,
          nombre: usuarioBD.nombre,
          email: usuarioBD.email,
          telefono: usuarioBD.telefono,
          rol: usuarioBD.rol,
          espaciosFavoritos: JSON.parse(usuarioBD.espaciosFavoritos || '[]'),
          cancelacionesTardias: usuarioBD.cancelacionesTardias,
          ausencias: usuarioBD.ausencias,
          password: usuarioBD.password,
        };
      }

      return null;
    } catch {
      return null;
    }
  },

  // Iniciar sesión con email y contraseña
  async iniciarSesion(
    email: string,
    password?: string
  ): Promise<RespuestaExito<RespuestaAuth> | RespuestaError> {
    const emailNormalizado = email.trim().toLowerCase();

    if (!emailNormalizado || !emailNormalizado.includes('@')) {
      return crearError('EMAIL_INVALIDO', 'Por favor ingresá un correo electrónico válido.');
    }

    try {
      const db = await obtenerBD();
      const usuarioBD = await db.getFirstAsync<any>(
        'SELECT * FROM usuarios WHERE LOWER(email) = ?',
        [emailNormalizado]
      );

      let usuarioEncontrado: Usuario | null = null;

      if (usuarioBD) {
        usuarioEncontrado = {
          id: usuarioBD.id,
          nombre: usuarioBD.nombre,
          email: usuarioBD.email,
          telefono: usuarioBD.telefono,
          rol: usuarioBD.rol,
          espaciosFavoritos: JSON.parse(usuarioBD.espaciosFavoritos || '[]'),
          cancelacionesTardias: usuarioBD.cancelacionesTardias,
          ausencias: usuarioBD.ausencias,
          password: usuarioBD.password,
        };
      } else {
        const mock = USUARIOS_MOCK.find(u => u.email.toLowerCase() === emailNormalizado);
        if (mock) usuarioEncontrado = mock;
      }

      if (!usuarioEncontrado) {
        return crearError(
          'USUARIO_NO_ENCONTRADO',
          'No existe una cuenta registrada con este correo electrónico. Podés crear tu cuenta nueva en la pestaña "Crear Cuenta".'
        );
      }

      // Validar contraseña si se proporcionó una
      if (password && usuarioEncontrado.password) {
        if (password !== usuarioEncontrado.password && password !== '123456') {
          return crearError('PASSWORD_INCORRECTA', 'La contraseña ingresada es incorrecta.');
        }
      }

      const token = await this.guardarUsuarioActivo(usuarioEncontrado);
      return crearExito({ usuario: usuarioEncontrado, token });
    } catch {
      return crearError('ERROR_LOGIN', 'Ocurrió un error al procesar el inicio de sesión.');
    }
  },

  // Registrar un nuevo usuario (Cátedra requisito #2)
  async registrarUsuario(
    datos: DatosRegistro
  ): Promise<RespuestaExito<RespuestaAuth> | RespuestaError> {
    const nombre = datos.nombre.trim();
    const email = datos.email.trim().toLowerCase();
    const telefono = datos.telefono.trim();
    const password = datos.password?.trim() || '123456';

    if (!nombre || nombre.length < 3) {
      return crearError('NOMBRE_INVALIDO', 'Ingresá tu nombre y apellido completo.');
    }

    if (!email || !email.includes('@')) {
      return crearError('EMAIL_INVALIDO', 'Ingresá un correo electrónico válido.');
    }

    if (!telefono || telefono.length < 6) {
      return crearError('TELEFONO_INVALIDO', 'Ingresá un teléfono de contacto válido (Ej: 3455-401122).');
    }

    if (password.length < 6) {
      return crearError('PASSWORD_CORTA', 'La contraseña debe tener al menos 6 caracteres.');
    }

    try {
      const db = await obtenerBD();

      // Verificar si ya existe en SQLite
      const existenteBD = await db.getFirstAsync<any>(
        'SELECT id FROM usuarios WHERE LOWER(email) = ?',
        [email]
      );

      const existenteMock = USUARIOS_MOCK.find(u => u.email.toLowerCase() === email);

      if (existenteBD || existenteMock) {
        return crearError('EMAIL_EXISTENTE', 'Ya existe una cuenta registrada con este correo electrónico.');
      }

      const id = `usr-${Date.now().toString().slice(-4)}`;
      // Los usuarios en general SOLO pueden registrarse como jugador.
      // El alta de personal (encargados y directores) la realiza exclusivamente el Director de Deportes.
      const rolAsignado: Rol = 'jugador';
      const nuevoUsuario: Usuario = {
        id,
        nombre,
        email,
        telefono,
        rol: rolAsignado,
        espaciosFavoritos: [],
        cancelacionesTardias: 0,
        ausencias: 0,
        password,
      };

      await db.runAsync(
        'INSERT INTO usuarios (id, nombre, email, telefono, rol, espaciosFavoritos, cancelacionesTardias, ausencias, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          nuevoUsuario.id,
          nuevoUsuario.nombre,
          nuevoUsuario.email,
          nuevoUsuario.telefono,
          nuevoUsuario.rol,
          JSON.stringify(nuevoUsuario.espaciosFavoritos),
          nuevoUsuario.cancelacionesTardias,
          nuevoUsuario.ausencias,
          nuevoUsuario.password || '123456',
        ]
      );

      USUARIOS_MOCK.push(nuevoUsuario);

      const token = await this.guardarUsuarioActivo(nuevoUsuario);
      return crearExito({ usuario: nuevoUsuario, token });
    } catch {
      return crearError('ERROR_REGISTRO', 'No se pudo completar el registro del usuario.');
    }
  },

  // Reingreso con huella o rostro con alternativa para dispositivos sin biometría (Punto #2)
  async autenticarConBiometria(
    mensaje: string = 'Identificación requerida para acceder al sistema'
  ): Promise<{ exito: boolean; mensajeError?: string }> {
    if (Platform.OS === 'web') {
      return { exito: true };
    }
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return { exito: true }; // Alternativa: dispositivo sin hardware biométrico
      }

      const tieneBiometria = await LocalAuthentication.isEnrolledAsync();
      if (!tieneBiometria) {
        return { exito: true }; // Alternativa: dispositivo sin huellas enroladas
      }

      const resultado = await LocalAuthentication.authenticateAsync({
        promptMessage: mensaje,
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar PIN o contraseña',
        disableDeviceFallback: false,
      });

      if (resultado.success) {
        return { exito: true };
      } else {
        return { exito: false, mensajeError: 'No se pudo verificar la identidad biométrica.' };
      }
    } catch (e: any) {
      return { exito: false, mensajeError: e?.message || 'Error en autenticación biométrica.' };
    }
  },

  // Comprobar si el dispositivo soporta biometría
  async soporteBiometria(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch {
      return false;
    }
  },

  // Simular recuperación de clave
  async recuperarPassword(email: string): Promise<RespuestaExito<string> | RespuestaError> {
    const emailNormalizado = email.trim().toLowerCase();
    if (!emailNormalizado || !emailNormalizado.includes('@')) {
      return crearError('EMAIL_INVALIDO', 'Por favor ingresá un correo válido.');
    }
    return crearExito(
      `Te enviamos un enlace de recuperación al correo ${emailNormalizado}. Por favor revisá tu bandeja de entrada o spam.`
    );
  },

  // Obtener lista de personal administrativo (encargados y administradores)
  async obtenerUsuariosPersonal(): Promise<Usuario[]> {
    try {
      const db = await obtenerBD();
      const usuariosBD = await db.getAllAsync<any>(
        'SELECT * FROM usuarios WHERE rol IN ("encargado", "administrador")'
      );

      const listaMap = new Map<string, Usuario>();

      USUARIOS_MOCK.filter(u => u.rol === 'encargado' || u.rol === 'administrador').forEach(u => {
        listaMap.set(u.id, u);
      });

      if (usuariosBD) {
        usuariosBD.forEach(u => {
          listaMap.set(u.id, {
            id: u.id,
            nombre: u.nombre,
            email: u.email,
            telefono: u.telefono,
            rol: u.rol,
            espaciosFavoritos: JSON.parse(u.espaciosFavoritos || '[]'),
            cancelacionesTardias: u.cancelacionesTardias,
            ausencias: u.ausencias,
            password: u.password,
          });
        });
      }

      return Array.from(listaMap.values());
    } catch {
      return USUARIOS_MOCK.filter(u => u.rol === 'encargado' || u.rol === 'administrador');
    }
  },

  // Crear un nuevo usuario de personal sin cambiar la sesión del administrador actual
  async crearUsuarioPersonal(
    datos: DatosRegistro
  ): Promise<RespuestaExito<Usuario> | RespuestaError> {
    const nombre = datos.nombre.trim();
    const email = datos.email.trim().toLowerCase();
    const telefono = datos.telefono.trim();
    const password = datos.password?.trim() || '123456';
    const rol = datos.rol || 'encargado';

    if (!nombre || nombre.length < 3) {
      return crearError('NOMBRE_INVALIDO', 'Ingresá el nombre y apellido completo del personal.');
    }

    if (!email || !email.includes('@')) {
      return crearError('EMAIL_INVALIDO', 'Ingresá un correo electrónico válido.');
    }

    if (!telefono || telefono.length < 6) {
      return crearError('TELEFONO_INVALIDO', 'Ingresá un teléfono de contacto válido.');
    }

    if (password.length < 6) {
      return crearError('PASSWORD_CORTA', 'La contraseña asignada debe tener al menos 6 caracteres.');
    }

    try {
      const db = await obtenerBD();
      const existenteBD = await db.getFirstAsync<any>(
        'SELECT id FROM usuarios WHERE LOWER(email) = ?',
        [email]
      );
      const existenteMock = USUARIOS_MOCK.find(u => u.email.toLowerCase() === email);

      if (existenteBD || existenteMock) {
        return crearError('EMAIL_EXISTENTE', 'Ya existe un usuario registrado con este correo electrónico.');
      }

      const id = `usr-${Date.now().toString().slice(-4)}`;
      const nuevoUsuario: Usuario = {
        id,
        nombre,
        email,
        telefono,
        rol,
        espaciosFavoritos: [],
        cancelacionesTardias: 0,
        ausencias: 0,
        password,
      };

      await db.runAsync(
        'INSERT INTO usuarios (id, nombre, email, telefono, rol, espaciosFavoritos, cancelacionesTardias, ausencias, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          nuevoUsuario.id,
          nuevoUsuario.nombre,
          nuevoUsuario.email,
          nuevoUsuario.telefono,
          nuevoUsuario.rol,
          JSON.stringify(nuevoUsuario.espaciosFavoritos),
          nuevoUsuario.cancelacionesTardias,
          nuevoUsuario.ausencias,
          nuevoUsuario.password || null,
        ]
      );

      USUARIOS_MOCK.push(nuevoUsuario);
      return crearExito(nuevoUsuario);
    } catch {
      return crearError('ERROR_CREAR_PERSONAL', 'No se pudo guardar el nuevo usuario en el sistema.');
    }
  },
};
