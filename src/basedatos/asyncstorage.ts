// src/basedatos/asyncstorage.ts
// Unidad 5: Persistencia clave-valor para configuraciones y preferencias livianas

import AsyncStorage from '@react-native-async-storage/async-storage';

export const PreferenciasStorage = {
  async guardar(clave: string, valor: string): Promise<void> {
    try {
      await AsyncStorage.setItem(`@reservas_vgy:${clave}`, valor);
    } catch (e) {
      console.warn('[AsyncStorage] Error al guardar:', e);
    }
  },

  async obtener(clave: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(`@reservas_vgy:${clave}`);
    } catch {
      return null;
    }
  },

  async eliminar(clave: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`@reservas_vgy:${clave}`);
    } catch (e) {
      console.warn('[AsyncStorage] Error al eliminar:', e);
    }
  }
};
