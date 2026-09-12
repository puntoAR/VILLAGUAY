import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTema } from '../contexto/ThemeContext';
import { Icono } from './Icono';
import { Colores } from '../constantes/tema';

interface Props {
  videoUrl: string | null;
  tituloEspacio: string;
}

export const ReproductorVideo: React.FC<Props> = ({ videoUrl, tituloEspacio }) => {
  const { colores } = useTema();
  const [reproduciendo, setReproduciendo] = useState(false);
  const [silenciado, setSilenciado] = useState(true);

  if (!videoUrl) {
    return (
      <View style={[styles.contenedorSinVideo, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
        <View style={styles.circuloSinVideo}>
          <Icono nombre="videocam-off-outline" size={32} color={colores.textoMuted} />
        </View>
        <Text style={[styles.tituloSinVideo, { color: colores.texto }]}>Sin video disponible</Text>
        <Text style={[styles.descripcionSinVideo, { color: colores.textoSecundario }]}>
          Este espacio deportivo aún no cuenta con un clip de recorrido grabado por la administración.
        </Text>
      </View>
    );
  }

  const player = useVideoPlayer(videoUrl, p => {
    p.loop = true;
    p.muted = true;
  });

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

  return (
    <View style={[styles.contenedor, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
      <View style={styles.encabezado}>
        <Icono nombre="videocam-outline" size={18} color={Colores.primarioClaro} />
        <Text style={[styles.tituloEncabezado, { color: colores.texto }]}>
          Recorrido de la Cancha (30s)
        </Text>
      </View>

      <View style={styles.videoMarco}>
        <VideoView
          style={styles.video}
          player={player}
          fullscreenOptions={{ enable: true }}
          allowsPictureInPicture
        />

        {/* Controles visibles de reproducción requeridos por la cátedra */}
        <View style={styles.barraControles}>
          <TouchableOpacity style={styles.botonControl} onPress={alternarPlay}>
            <Icono
              nombre={reproduciendo ? 'pause' : 'play'}
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={styles.tiempoTexto}>
            {reproduciendo ? 'En reproducción' : 'Pausado'}
          </Text>

          <TouchableOpacity style={styles.botonControl} onPress={alternarMute}>
            <Icono
              nombre={silenciado ? 'volume-mute-outline' : 'volume-high-outline'}
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.pieVideo, { color: colores.textoMuted }]}>
        Mirá el estado del piso, las líneas y el desgaste del césped antes de reservar.
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
});
