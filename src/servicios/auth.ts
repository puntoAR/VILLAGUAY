// src/servicios/auth.ts
// Servicio de autenticación y credenciales

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { Usuario } from '../tipos';
import { USUARIOS_MOCK } from '../mocks/usuarios';
import { obtenerBD } from '../basedatos/sqlite';

const CLAVE_TOKEN = 'auth_bearer_token';
const CLAVE_USUARIO_ID = 'auth_usuario_id';

export const AuthServicio = {
  async guardarToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(CLAVE_TOKEN, token);
        }
        return;
      }
      await SecureStore.setItemAsync(CLAVE_TOKEN, token);
    } catch {}
  },

  async obtenerToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(CLAVE_TOKEN);
        }
        return null;
      }
      return await SecureStore.getItemAsync(CLAVE_TOKEN);
    } catch {
      return null;
    }
  },

  async cerrarSesion(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(CLAVE_TOKEN);
          window.localStorage.removeItem(CLAVE_USUARIO_ID);
        }
        return;
      }
      await SecureStore.deleteItemAsync(CLAVE_TOKEN);
      await SecureStore.deleteItemAsync(CLAVE_USUARIO_ID);
    } catch {}
  },

  async iniciarSesion(email: string, password?: string): Promise<{ exito: boolean; usuario?: Usuario; mensaje?: string }> {
    try {
      const emailLimpio = email.toLowerCase().trim();
      let usuario: Usuario | null = null;

      try {
        const db = await obtenerBD();
        const row = await db.getFirstAsync('SELECT * FROM usuarios WHERE LOWER(email) = ?', [emailLimpio]);
        if (row) {
          usuario = {
            id: row.id,
            nombre: row.nombre,
            email: row.email,
            telefono: row.telefono,
            rol: row.rol as any,
            espaciosFavoritos: typeof row.espaciosFavoritos === 'string' ? JSON.parse(row.espaciosFavoritos) : (row.espaciosFavoritos || []),
            cancelacionesTardias: Number(row.cancelacionesTardias) || 0,
            ausencias: Number(row.ausencias) || 0,
            password: row.password || 'password123',
            avatarUrl: row.avatarUrl || null,
          };
        }
      } catch {}

      if (!usuario) {
        usuario = USUARIOS_MOCK.find(u => u.email.toLowerCase().trim() === emailLimpio) || null;
      }

      if (!usuario) {
        return { exito: false, mensaje: 'Usuario no registrado con este correo.' };
      }

      if (password && usuario.password && password !== usuario.password) {
        return { exito: false, mensaje: 'Contraseña incorrecta.' };
      }

      const token = `vgy_jwt_${usuario.id}_${Date.now()}`;
      await this.guardarToken(token);

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(CLAVE_USUARIO_ID, usuario.id);
        }
      } else {
        await SecureStore.setItemAsync(CLAVE_USUARIO_ID, usuario.id);
      }

      return { exito: true, usuario };
    } catch (e: any) {
      return { exito: false, mensaje: e?.message || 'Error al iniciar sesión.' };
    }
  },

  async obtenerUsuarioSesion(): Promise<Usuario | null> {
    try {
      let id: string | null = null;
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          id = window.localStorage.getItem(CLAVE_USUARIO_ID);
        }
      } else {
        id = await SecureStore.getItemAsync(CLAVE_USUARIO_ID);
      }

      if (!id) return null;

      try {
        const db = await obtenerBD();
        const row = await db.getFirstAsync('SELECT * FROM usuarios WHERE id = ?', [id]);
        if (row) {
          return {
            id: row.id,
            nombre: row.nombre,
            email: row.email,
            telefono: row.telefono,
            rol: row.rol as any,
            espaciosFavoritos: typeof row.espaciosFavoritos === 'string' ? JSON.parse(row.espaciosFavoritos) : (row.espaciosFavoritos || []),
            cancelacionesTardias: Number(row.cancelacionesTardias) || 0,
            ausencias: Number(row.ausencias) || 0,
            password: row.password || 'password123',
            avatarUrl: row.avatarUrl || null,
          };
        }
      } catch {}

      const mock = USUARIOS_MOCK.find(u => u.id === id);
      return mock || null;
    } catch {
      return null;
    }
  },

  async autenticarConBiometria(mensaje: string = 'Confirmá tu identidad para continuar'): Promise<boolean> {
    if (Platform.OS === 'web') return true;
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) return true;

      const enrolado = await LocalAuthentication.isEnrolledAsync();
      if (!enrolado) return true;

      const resultado = await LocalAuthentication.authenticateAsync({
        promptMessage: mensaje,
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar PIN o Contraseña',
        disableDeviceFallback: false,
      });

      return resultado.success;
    } catch {
      return false;
    }
  },

  async soportaBiometria(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const hardware = await LocalAuthentication.hasHardwareAsync();
      const enrolado = await LocalAuthentication.isEnrolledAsync();
      return hardware && enrolado;
    } catch {
      return false;
    }
  },
};
