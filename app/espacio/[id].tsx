import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Espacio } from '../../src/tipos';
import { EspaciosServicio } from '../../src/servicios/espacios';
import { esError } from '../../src/servicios/api';
import { ReproductorVideo } from '../../src/componentes/ReproductorVideo';
import { EstadoCarga } from '../../src/componentes/EstadoCarga';
import { EstadoError } from '../../src/componentes/EstadoError';
import { Icono } from '../../src/componentes/Icono';
import { useTema } from '../../src/contexto/ThemeContext';
import { useAuth } from '../../src/contexto/AuthContext';
import { Colores } from '../../src/constantes/tema';

export default function DetalleEspacio() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colores } = useTema();
  const { usuario, alternarFavorito } = useAuth();
  const router = useRouter();

  const [espacio, setEspacio] = useState<Espacio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fotoActiva, setFotoActiva] = useState(0);

  const cargarEspacio = async () => {
    if (!id) return;
    setCargando(true);
    setError(null);
    const resp = await EspaciosServicio.obtenerEspacioPorId(id);
    if (esError(resp)) {
      setError(resp.error.mensaje);
    } else {
      setEspacio(resp.datos);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarEspacio();
  }, [id]);

  if (cargando) {
    return <EstadoCarga mensaje="Cargando detalles de la cancha..." />;
  }

  if (error || !espacio) {
    return <EstadoError mensaje={error || 'Cancha no encontrada.'} onReintentar={cargarEspacio} />;
  }

  const esFavorito = usuario?.espaciosFavoritos?.includes(espacio.id) || false;

  const abrirEnGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${espacio.coordenadas.latitud},${espacio.coordenadas.longitud}`;
    Linking.openURL(url);
  };

  return (
    <View style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Galería de fotos */}
        <View style={styles.carruselContenedor}>
          <Image
            source={{ uri: espacio.imagenes[fotoActiva] || espacio.imagenes[0] }}
            style={styles.fotoPrincipal}
            resizeMode="cover"
          />

          <TouchableOpacity
            style={styles.botonFavorito}
            onPress={() => alternarFavorito(espacio.id)}
          >
            <Icono
              nombre={esFavorito ? 'heart' : 'heart-outline'}
              size={24}
              color={esFavorito ? '#E53935' : '#FFFFFF'}
            />
          </TouchableOpacity>

          {espacio.imagenes.length > 1 && (
            <View style={styles.miniaturasFila}>
              {espacio.imagenes.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.miniaturaMarco,
                    fotoActiva === idx && { borderColor: Colores.acento, borderWidth: 2 },
                  ]}
                  onPress={() => setFotoActiva(idx)}
                >
                  <Image source={{ uri: img }} style={styles.miniatura} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.cuerpo}>
          {/* Título y Complejo */}
          <Text style={[styles.complejoTexto, { color: Colores.primarioClaro }]}>
            {espacio.complejo}
          </Text>
          <Text style={[styles.nombre, { color: colores.texto }]}>{espacio.nombre}</Text>

          {/* Precio y Capacidad */}
          <View style={[styles.tarjetaResumen, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
            <View style={styles.itemResumen}>
              <Text style={[styles.resumenLabel, { color: colores.textoSecundario }]}>Precio por hora</Text>
              <Text style={[styles.resumenValor, { color: Colores.acento }]}>
                ${espacio.precioPorHora.toLocaleString('es-AR')}
              </Text>
              <Text style={[styles.resumenSub, { color: colores.textoMuted }]}>Se abona en el lugar</Text>
            </View>

            <View style={[styles.separadorVertical, { backgroundColor: colores.borde }]} />

            <View style={styles.itemResumen}>
              <Text style={[styles.resumenLabel, { color: colores.textoSecundario }]}>Capacidad</Text>
              <Text style={[styles.resumenValor, { color: colores.texto }]}>
                {espacio.capacidad} jugadores
              </Text>
              <Text style={[styles.resumenSub, { color: colores.textoMuted }]}>{espacio.superficie}</Text>
            </View>
          </View>

          {/* Características */}
          <Text style={[styles.seccionTitulo, { color: colores.texto }]}>Características del Lugar</Text>
          <View style={styles.grillaCaracteristicas}>
            <View style={[styles.tarjetaCarac, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
              <Icono
                nombre={espacio.iluminacion ? 'bulb' : 'sunny'}
                size={22}
                color={espacio.iluminacion ? '#B45309' : '#64748B'}
              />
              <Text style={[styles.caracTitulo, { color: colores.texto }]}>
                {espacio.iluminacion ? 'Iluminación Artificial' : 'Solo Horario Diurno'}
              </Text>
              <Text style={[styles.caracDesc, { color: colores.textoSecundario }]}>
                {espacio.iluminacion ? 'Apto para jugar de noche' : 'Sin reflectores nocturnos'}
              </Text>
            </View>

            <View style={[styles.tarjetaCarac, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
              <Icono
                nombre={espacio.techado ? 'shield-checkmark' : 'cloud-outline'}
                size={22}
                color={Colores.primarioClaro}
              />
              <Text style={[styles.caracTitulo, { color: colores.texto }]}>
                {espacio.techado ? 'Techado / Cubierto' : 'A la Intemperie'}
              </Text>
              <Text style={[styles.caracDesc, { color: colores.textoSecundario }]}>
                {espacio.techado ? 'Protegido de lluvia y sol' : 'Sujeto a clima'}
              </Text>
            </View>
          </View>

          {/* Video de recorrido (expo-video obligatorio) */}
          <Text style={[styles.seccionTitulo, { color: colores.texto }]}>
            {espacio.nombre.toLowerCase().includes('gimnasio')
              ? 'Video del Gimnasio'
              : espacio.nombre.toLowerCase().includes('pileta') || espacio.nombre.toLowerCase().includes('natatorio')
              ? 'Video del Natatorio'
              : 'Video de la Cancha'}
          </Text>
          <ReproductorVideo
            videoUrl={espacio.videoUrl}
            tituloEspacio={espacio.nombre}
            esGimnasio={espacio.nombre.toLowerCase().includes('gimnasio')}
          />

          {/* Reglas del lugar */}
          <Text style={[styles.seccionTitulo, { color: colores.texto }]}>Reglamento de Uso</Text>
          <View style={[styles.cajaReglas, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
            <Icono nombre="information-circle-outline" size={20} color={Colores.primarioClaro} style={{ marginRight: 8 }} />
            <Text style={[styles.textoReglas, { color: colores.texto }]}>{espacio.reglas}</Text>
          </View>

          {/* Ubicación y Cómo Llegar */}
          <TouchableOpacity
            style={[styles.botonUbicacion, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}
            onPress={abrirEnGoogleMaps}
          >
            <Icono nombre="navigate-outline" size={22} color={Colores.primarioClaro} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.ubicacionTitulo, { color: colores.texto }]}>Ubicación del Complejo</Text>
              <Text style={[styles.ubicacionSub, { color: colores.textoSecundario }]}>Abrir ruta en Google Maps</Text>
            </View>
            <Icono nombre="open-outline" size={18} color={colores.textoMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Botón Flotante Inferior para Ver Disponibilidad */}
      <View style={[styles.barraInferior, { backgroundColor: colores.tarjeta, borderTopColor: colores.borde }]}>
        <View>
          <Text style={[styles.barraInferiorPrecio, { color: Colores.acento }]}>
            ${espacio.precioPorHora.toLocaleString('es-AR')}
          </Text>
          <Text style={[styles.barraInferiorHora, { color: colores.textoMuted }]}>por hora de turno</Text>
        </View>

        <TouchableOpacity
          style={styles.botonDisponibilidad}
          activeOpacity={0.85}
          onPress={() => router.push(`/grilla/${espacio.id}` as any)}
        >
          <Icono nombre="calendar" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.botonDisponibilidadTexto}>Ver Grilla de Turnos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  carruselContenedor: {
    width: '100%',
    height: 240,
    position: 'relative',
    backgroundColor: '#000',
  },
  fotoPrincipal: {
    width: '100%',
    height: '100%',
  },
  botonFavorito: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  miniaturasFila: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  miniaturaMarco: {
    width: 44,
    height: 44,
    borderRadius: 6,
    overflow: 'hidden',
  },
  miniatura: {
    width: '100%',
    height: '100%',
  },
  cuerpo: {
    padding: 16,
    paddingBottom: 90,
  },
  complejoTexto: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  nombre: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
  },
  tarjetaResumen: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  itemResumen: {
    flex: 1,
    alignItems: 'center',
  },
  resumenLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  resumenValor: {
    fontSize: 18,
    fontWeight: '800',
    marginVertical: 4,
  },
  resumenSub: {
    fontSize: 11,
  },
  separadorVertical: {
    width: 1,
    height: '100%',
  },
  seccionTitulo: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
  },
  grillaCaracteristicas: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  tarjetaCarac: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  caracTitulo: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  caracDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  cajaReglas: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  textoReglas: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  botonUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  ubicacionTitulo: {
    fontSize: 14,
    fontWeight: '700',
  },
  ubicacionSub: {
    fontSize: 12,
    marginTop: 1,
  },
  barraInferior: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  barraInferiorPrecio: {
    fontSize: 20,
    fontWeight: '800',
  },
  barraInferiorHora: {
    fontSize: 11,
  },
  botonDisponibilidad: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colores.primarioClaro,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  botonDisponibilidadTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
