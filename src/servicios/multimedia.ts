// src/servicios/multimedia.ts
// Unidad 4: Sistema de Archivos orientado a objetos (File, Directory, Paths)
// y selección de fotos con expo-image-picker

import * as ImagePicker from 'expo-image-picker';
import { Paths, File, Directory } from 'expo-file-system';
import { Platform } from 'react-native';

export const MultimediaServicio = {
  // Selector de imagen de galería con expo-image-picker
  async seleccionarFotoPerfil(): Promise<string | null> {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      throw new Error('Se requiere permiso para acceder a la galería de fotos.');
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (resultado.canceled || !resultado.assets || resultado.assets.length === 0) {
      return null;
    }

    const uriOriginalEnCache = resultado.assets[0].uri;

    // APLICACIÓN DE LA REGLA CRÍTICA DE LA CÁTEDRA:
    // Los recursos del selector quedan en Paths.cache y el sistema operativo puede borrarlos.
    // Deben copiarse explícitamente a Paths.document para persistencia permanente.
    return await this.persistirFotoEnDocumentos(uriOriginalEnCache);
  },

  // Copia segura desde Paths.cache hacia Paths.document
  async persistirFotoEnDocumentos(uriCache: string): Promise<string> {
    if (Platform.OS === 'web') return uriCache;

    try {
      // 1. Instanciar archivo origen ubicado en la caché
      const archivoOrigen = new File(uriCache);

      // 2. Definir destino persistente en la carpeta de documentos de la app
      const nombreArchivo = `avatar_${Date.now()}.jpg`;
      const archivoDestino = new File(Paths.document, nombreArchivo);

      // 3. Copiar explícitamente el archivo
      archivoOrigen.copy(archivoDestino);

      // 4. Retornar la URI permanente para guardar en SQLite
      return archivoDestino.uri;
    } catch (e) {
      console.warn('[FileSystem] Error al copiar a Paths.document, usando URI original:', e);
      return uriCache;
    }
  }
};
