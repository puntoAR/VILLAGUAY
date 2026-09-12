// Manejo con la nueva API de expo-file-system (File, Directory, Paths)
import { Paths, Directory, File } from 'expo-file-system';
import { Platform } from 'react-native';

export const MultimediaServicio = {
  // Directorio base de cache para medios deportivos
  obtenerDirectorioCache(): Directory | null {
    if (Platform.OS === 'web') return null;
    try {
      const dir = new Directory(Paths.cache, 'medios_deportivos');
      if (!dir.exists) {
        dir.create();
      }
      return dir;
    } catch {
      return null;
    }
  },

  // Obtiene o cachea una imagen / video para acceso offline
  async obtenerRutaLocal(uriRemota: string): Promise<string> {
    if (Platform.OS === 'web') return uriRemota;
    try {
      const dir = this.obtenerDirectorioCache();
      if (!dir) return uriRemota;

      const nombreArchivo = uriRemota.split('/').pop()?.split('?')[0] || 'medio.bin';
      const archivoLocal = new File(dir, nombreArchivo);

      if (archivoLocal.exists) {
        return archivoLocal.uri;
      }

      // Si no existe, usamos la URL remota mientras se descarga en background
      return uriRemota;
    } catch {
      return uriRemota;
    }
  }
};
