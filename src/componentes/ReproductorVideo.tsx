// src/componentes/ReproductorVideo.tsx
// Reproductor de video

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTema } from '../contexto/ThemeContext';
import { Icono } from './Icono';

const VIDEO_LOCAL = require('../../assets/videos/recorrido_espacio.mp4');

interface Props {
  videoUrl?: string | null;
}

export const ReproductorVideo: React.FC<Props> = ({ videoUrl }) => {
  const { colores } = useTema();

  const fuente = (!videoUrl || videoUrl === 'local:recorrido_espacio') ? VIDEO_LOCAL : videoUrl;

  const player = useVideoPlayer(fuente, p => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View style={[styles.contenedor, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
      <View style={styles.encabezado}>
        <Icono nombre="videocam-outline" size={18} color={colores.texto} />
        <Text style={[styles.titulo, { color: colores.texto }]}>
          Video del Espacio Deportivo
        </Text>
      </View>

      <View style={styles.videoMarco}>
        <VideoView
          style={styles.video}
          player={player}
          fullscreenOptions={{ enable: true }}
          allowsPictureInPicture
          nativeControls={true}
          contentFit="cover"
        />
      </View>

      <Text style={[styles.pie, { color: colores.textoMuted }]}>
        Vista previa en video grabada por el personal de la Dirección de Deportes.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  titulo: {
    fontSize: 14,
    fontWeight: '700',
  },
  videoMarco: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  pie: {
    fontSize: 11,
    marginTop: 6,
    fontStyle: 'italic',
  },
});
