import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTema } from '../contexto/ThemeContext';
import { Icono } from './Icono';
import { Colores } from '../constantes/tema';

const VIDEO_GENERICO_LOCAL = require('../../assets/videos/recorrido_espacio.mp4');

interface Props {
  videoUrl: string | null;
  tituloEspacio: string;
  esGimnasio?: boolean;
}

export const ReproductorVideo: React.FC<Props> = ({ videoUrl, tituloEspacio, esGimnasio }) => {
  const { colores } = useTema();
  const [reproduciendo, setReproduciendo] = useState(false);
  const [silenciado, setSilenciado] = useState(true);

  if (!videoUrl) {
    return (
      <View style={[styles.contenedorSinVideo, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
        <View style={styles.circuloSinVideo}>
          <Icono nombre="videocam-off-outline" size={32} color={colores.textoMuted} />
        </View>
        <Text style={[styles.tituloSinVideo, { color: colores.texto }]}>
          {esGimnasio ? 'Sin video del gimnasio' : 'Sin video de la cancha'}
        </Text>
        <Text style={[styles.descripcionSinVideo, { color: colores.textoSecundario }]}>
          {esGimnasio
            ? 'Este gimnasio aún no cuenta con un clip de recorrido grabado por la administración.'
            : 'Este espacio deportivo aún no cuenta con un clip de recorrido grabado por la administración.'}
        </Text>
      </View>
    );
  }

  // Si es local o la URL rota de google, usamos el video de 6 segundos generado en assets
  const fuenteFinal =
    videoUrl === 'local:recorrido_espacio' ||
    videoUrl.includes('commondatastorage.googleapis.com')
      ? VIDEO_GENERICO_LOCAL
      : videoUrl;

  const player = useVideoPlayer(fuenteFinal, p => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    if (!player) return;
    try {
      const sub = player.addListener?.('playingChange', (event: any) => {
        setReproduciendo(Boolean(event?.isPlaying));
      });
      const muteSub = player.addListener?.('mutedChange', (event: any) => {
        setSilenciado(Boolean(event?.isMuted));
      });
      return () => {
        sub?.remove?.();
        muteSub?.remove?.();
      };
    } catch {
      // Ignorar si no está soportado en la plataforma actual
    }
  }, [player]);

  const alternarPlay = () => {
    if (!player) return;
    if (player.playing) {
      player.pause();
      setReproduciendo(false);
    } else {
      player.play();
      setReproduciendo(true);
    }
  };

  const alternarMute = () => {
    if (!player) return;
    player.muted = !player.muted;
    setSilenciado(player.muted);
  };

  const tituloHeader = esGimnasio
    ? 'Recorrido del Gimnasio (6s)'
    : 'Recorrido de la Cancha (6s)';

  const pieTexto = esGimnasio
    ? 'Mirá el estado del parquet flotante, aros y demarcaciones antes de reservar.'
    : 'Mirá el estado del piso, las líneas y redes antes de reservar.';

  return (
    <View style={[styles.contenedor, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
      <View style={styles.encabezado}>
        <Icono nombre="videocam-outline" size={18} color={Colores.primarioClaro} />
        <Text style={[styles.tituloEncabezado, { color: colores.texto }]}>
          {tituloHeader}
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

        {/* Botón flotante central de Play cuando está pausado */}
        {!reproduciendo && (
          <TouchableOpacity
            style={styles.overlayPlayCentro}
            onPress={alternarPlay}
            activeOpacity={0.8}
          >
            <View style={styles.circuloPlayCentro}>
              <Icono nombre="play" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.textoPlayCentro}>Tocar para reproducir</Text>
          </TouchableOpacity>
        )}

        {/* Barra inferior de controles rápidos */}
        <View style={styles.barraControles}>
          <TouchableOpacity style={styles.botonControl} onPress={alternarPlay}>
            <Icono
              nombre={reproduciendo ? 'pause' : 'play'}
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={styles.tiempoTexto}>
            {reproduciendo ? '▶ 00:06 (Loop)' : '⏸ Pausado'}
          </Text>

          <TouchableOpacity style={styles.botonControl} onPress={alternarMute}>
            <Icono
              nombre={silenciado ? 'volume-mute-outline' : 'volume-high-outline'}
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.pieVideo, { color: colores.textoMuted }]}>
        {pieTexto}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  tituloEncabezado: {
    fontSize: 15,
    fontWeight: '700',
  },
  videoMarco: {
    width: '100%',
    height: 210,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  barraControles: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  botonControl: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tiempoTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  pieVideo: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  contenedorSinVideo: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  circuloSinVideo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  tituloSinVideo: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  descripcionSinVideo: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  overlayPlayCentro: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  circuloPlayCentro: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colores.primarioClaro,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  textoPlayCentro: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
});
