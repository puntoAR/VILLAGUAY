import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { Usuario } from '../tipos';
import { USUARIOS_MOCK } from '../mocks/usuarios';
import { PreferenciasKV } from '../basedatos/kvstore';

const CLAVE_TOKEN = 'auth_bearer_token';
const CLAVE_USUARIO_ID = 'auth_usuario_id';

export const AuthServicio = {
  // Guardar token seguro en expo-secure-store
  async guardarToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      await PreferenciasKV.guardar(CLAVE_TOKEN, token);
      return;
    }
    await SecureStore.setItemAsync(CLAVE_TOKEN, token);
  },

  // Obtener token
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
      return;
    }
    await SecureStore.deleteItemAsync(CLAVE_TOKEN);
    await PreferenciasKV.eliminar(CLAVE_USUARIO_ID);
  },

  // Guardar ID del usuario activo
  async guardarUsuarioActivo(usuario: Usuario): Promise<void> {
    await PreferenciasKV.guardar(CLAVE_USUARIO_ID, usuario.id);
    const token = `vgy_token_${usuario.id}_${Date.now()}`;
    await this.guardarToken(token);
  },

  // Obtener usuario activo
  async obtenerUsuarioActivo(): Promise<Usuario> {
    const id = await PreferenciasKV.obtener(CLAVE_USUARIO_ID);
    if (id) {
      const encontrado = USUARIOS_MOCK.find(u => u.id === id);
      if (encontrado) return encontrado;
    }
    // Por defecto inicia como Emiliano Ruiz (jugador) para demo fluida sin forzar login inicial
    return USUARIOS_MOCK[0];
  },

  // Reingreso con huella o rostro para el encargado (Marcelo) antes de escanear
  async autenticarConBiometria(mensaje: string = 'Autenticación requerida para acceder al control de ingresos'): Promise<{ exito: boolean; mensajeError?: string }> {
    if (Platform.OS === 'web') {
      return { exito: true };
    }
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return { exito: true }; // Fallback para dispositivos sin lector biométrico
      }

      const tieneBiometria = await LocalAuthentication.isEnrolledAsync();
      if (!tieneBiometria) {
        return { exito: true }; // Fallback para dispositivos sin huellas configuradas
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
      return { exito: false, mensajeError: e?.message || 'Error en autenticación.' };
    }
  }
};
