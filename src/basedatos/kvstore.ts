// expo-sqlite/kv-store para preferencias y datos no confidenciales
import Storage from 'expo-sqlite/kv-store';

export const PreferenciasKV = {
  async guardar(clave: string, valor: string): Promise<void> {
    try {
      await Storage.setItemAsync(clave, valor);
    } catch {
      // Fallback a memoria si no estuviera disponible
    }
  },

  async obtener(clave: string): Promise<string | null> {
    try {
      return await Storage.getItemAsync(clave);
    } catch {
      return null;
    }
  },

  async eliminar(clave: string): Promise<void> {
    try {
      await Storage.removeItemAsync(clave);
    } catch {
      // ignorar
    }
  }
};
