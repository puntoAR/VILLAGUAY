import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { useTema } from '../../src/contexto/ThemeContext';
import { Icono } from '../../src/componentes/Icono';
import { Colores } from '../../src/constantes/tema';
import { useRouter } from 'expo-router';

interface ComplejoInfo {
  id: string;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  canchas: string[];
}

const COMPLEJOS: ComplejoInfo[] = [
  {
    id: 'polideportivo',
    nombre: 'Polideportivo Municipal',
    direccion: 'Av. Savio y Paysandú, Villaguay, Entre Ríos',
    latitud: -31.8642,
    longitud: -59.0281,
    canchas: [
      'Cancha 1 — Fútbol 5 sintético',
      'Cancha 2 — Fútbol 5 sintético',
      'Cancha 3 — Fútbol 11 césped natural',
      'Cancha Básquet 1 (parquet techado)',
      'Cancha Básquet 2 (cemento)',
      'Cancha Vóley 1 (piso sintético techado)',
      'Gimnasio Cerrado Multiuso',
    ],
  },
  {
    id: 'berduc',
    nombre: 'Parque Berduc',
    direccion: 'San Martín y Parque Berduc, Villaguay, Entre Ríos',
    latitud: -31.8595,
    longitud: -59.0340,
    canchas: [
      'Cancha Tenis 1 (polvo de ladrillo)',
      'Cancha Tenis 2 (polvo de ladrillo)',
      'Cancha Básquet 3 (cemento)',
      'Cancha Vóley 2 (arena al aire libre)',
    ],
  },
];

export default function PantallaMapa() {
  const { colores } = useTema();
  const router = useRouter();

  const [ubicacionUsuario, setUbicacionUsuario] = useState<{ lat: number; lng: number } | null>(null);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const [complejoSeleccionado, setComplejoSeleccionado] = useState<ComplejoInfo>(COMPLEJOS[0]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setPermisoDenegado(true);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUbicacionUsuario({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        });
      } catch {
        setPermisoDenegado(true);
      }
    })();
  }, []);

  const abrirEnGoogleMaps = (lat: number, lng: number, nombre: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(nombre)}`;
    Linking.openURL(url);
  };

  // Cálculo aproximado de distancia en km
  const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  return (
    <View style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      {permisoDenegado && (
        <View style={styles.bannerPermiso}>
          <Icono nombre="location-outline" size={16} color="#B45309" style={{ marginRight: 6 }} />
          <Text style={styles.bannerPermisoTexto}>
            Ubicación denegada. Podés explorar los complejos manualmente en el mapa.
          </Text>
        </View>
      )}

      {/* Mapa interactivo */}
      <View style={styles.mapaContenedor}>
        {Platform.OS !== 'web' ? (
          <MapView
            style={styles.mapa}
            initialRegion={{
              latitude: -31.8618,
              longitude: -59.0310,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            {COMPLEJOS.map(comp => (
              <Marker
                key={comp.id}
                coordinate={{ latitude: comp.latitud, longitude: comp.longitud }}
                title={comp.nombre}
                description={comp.direccion}
                onPress={() => setComplejoSeleccionado(comp)}
                pinColor={comp.id === complejoSeleccionado.id ? Colores.acento : Colores.primarioClaro}
              />
            ))}
          </MapView>
        ) : (
          <View style={[styles.mapaFallback, { backgroundColor: '#1E293B' }]}>
            <Icono nombre="map" size={48} color="#E8AA42" />
            <Text style={{ color: '#FFFFFF', marginTop: 8, fontWeight: '700' }}>
              Mapa de Complejos de Villaguay
            </Text>
            <Text style={{ color: '#94A3B8', fontSize: 12 }}>
              Polideportivo Municipal (-31.8642, -59.0281) y Parque Berduc (-31.8595, -59.0340)
            </Text>
          </View>
        )}
      </View>

      {/* Selector de Complejo y Ficha de Canchas */}
      <ScrollView style={styles.panelInfo} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.filaPills}>
          {COMPLEJOS.map(comp => {
            const activo = complejoSeleccionado.id === comp.id;
            return (
              <TouchableOpacity
                key={comp.id}
                style={[
                  styles.pill,
                  {
                    backgroundColor: activo ? Colores.primario : colores.tarjeta,
                    borderColor: activo ? Colores.primario : colores.borde,
                  },
                ]}
                onPress={() => setComplejoSeleccionado(comp)}
              >
                <Text style={[styles.pillTexto, { color: activo ? '#FFFFFF' : colores.texto }]}>
                  {comp.nombre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.fichaComplejo, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
          <View style={styles.encabezadoFicha}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.nombreComplejo, { color: colores.texto }]}>
                {complejoSeleccionado.nombre}
              </Text>
              <Text style={[styles.direccionComplejo, { color: colores.textoSecundario }]}>
                {complejoSeleccionado.direccion}
              </Text>
            </View>

            {ubicacionUsuario && (
              <View style={styles.distanciaBadge}>
                <Icono nombre="navigate-outline" size={13} color="#15803D" />
                <Text style={styles.distanciaTexto}>
                  a {calcularDistancia(ubicacionUsuario.lat, ubicacionUsuario.lng, complejoSeleccionado.latitud, complejoSeleccionado.longitud)} km
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.botonComoLlegar}
            onPress={() => abrirEnGoogleMaps(complejoSeleccionado.latitud, complejoSeleccionado.longitud, complejoSeleccionado.nombre)}
          >
            <Icono nombre="navigate" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.botonComoLlegarTexto}>¿Cómo llegar?</Text>
          </TouchableOpacity>

          <Text style={[styles.subtituloCanchas, { color: colores.texto }]}>
            Espacios disponibles en este predio:
          </Text>

          {complejoSeleccionado.canchas.map((cancha, index) => (
            <View key={index} style={styles.itemCancha}>
              <Icono nombre="checkmark-circle-outline" size={16} color={Colores.primarioClaro} style={{ marginRight: 6 }} />
              <Text style={[styles.textoCancha, { color: colores.textoSecundario }]}>{cancha}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  bannerPermiso: {
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  bannerPermisoTexto: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  mapaContenedor: {
    width: '100%',
    height: 240,
  },
  mapa: {
    width: '100%',
    height: '100%',
  },
  mapaFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  panelInfo: {
    flex: 1,
    padding: 16,
  },
  filaPills: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  pillTexto: {
    fontSize: 13,
    fontWeight: '700',
  },
  fichaComplejo: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  encabezadoFicha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  nombreComplejo: {
    fontSize: 18,
    fontWeight: '800',
  },
  direccionComplejo: {
    fontSize: 12,
    marginTop: 2,
  },
  distanciaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  distanciaTexto: {
    color: '#15803D',
    fontWeight: '700',
    fontSize: 12,
  },
  botonComoLlegar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colores.primarioClaro,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  botonComoLlegarTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  subtituloCanchas: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  itemCancha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  textoCancha: {
    fontSize: 13,
  },
});
