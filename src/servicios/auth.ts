// src/servicios/auth.ts
// Unidad 6: Autenticación, resguardo seguro de credenciales con expo-secure-store y biometría

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { Usuario } from '../tipos';
import { BDService } from '../basedatos/sqlite';

const CLAVE_TOKEN = 'auth_bearer_token';
const CLAVE_USUARIO_ID = 'auth_usuario_id';

export const AuthServicio = {
  // Guardar token cifrado en el almacén de claves del sistema
  async guardarToken(token: string): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await SecureStore.setItemAsync(CLAVE_TOKEN, token);
    } catch (e) {
      console.warn('[SecureStore] Error al guardar token:', e);
    }
  },

  async obtenerToken(): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    try {
      return await SecureStore.getItemAsync(CLAVE_TOKEN);
    } catch {
      return null;
    }
  },

  async cerrarSesion(): Promise<void> {
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.deleteItemAsync(CLAVE_TOKEN);
        await SecureStore.deleteItemAsync(CLAVE_USUARIO_ID);
      } catch {}
    }
  },

  // Iniciar sesión con email y contraseña
  async iniciarSesion(email: string, password?: string): Promise<{ exito: boolean; usuario?: Usuario; mensaje?: string }> {
    const usuario = BDService.buscarUsuarioPorEmailSync(email);
    if (!usuario) {
      return { exito: false, mensaje: 'Usuario no registrado con este correo.' };
    }

    if (password && usuario.password && password !== usuario.password) {
      return { exito: false, mensaje: 'Contraseña incorrecta.' };
    }

    // Generar token JWT simulado y guardar en SecureStore
    const token = `vgy_jwt_${usuario.id}_${Date.now()}`;
    await this.guardarToken(token);
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(CLAVE_USUARIO_ID, usuario.id);
    }

    return { exito: true, usuario };
  },

  // Obtener usuario guardado en sesión activa
  async obtenerUsuarioSesion(): Promise<Usuario | null> {
    if (Platform.OS === 'web') {
      return null;
    }
    try {
      const id = await SecureStore.getItemAsync(CLAVE_USUARIO_ID);
      if (!id) return null;
      const dbUser = BDService.obtenerUsuarioPorIdSync(id);
      return dbUser;
    } catch {
      return null;
    }
  },

  // Autenticación Biométrica (Huella / Rostro)
  async autenticarConBiometria(mensaje: string = 'Confirmá tu identidad para continuar'): Promise<boolean> {
    if (Platform.OS === 'web') return true;
    try {
      // 1. Verificar si el hardware está disponible
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) return true; // Fallback automático si el teléfono no tiene hardware

      // 2. Verificar si tiene biometría registrada
      const enrolado = await LocalAuthentication.isEnrolledAsync();
      if (!enrolado) return true;

      // 3. Ejecutar autenticación
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
  }
};
