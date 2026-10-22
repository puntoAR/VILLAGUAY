// src/app/(tabs)/mapa.tsx
// Unidad 4: Geolocalización con expo-location y visualización interactiva con react-native-maps

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import * as Location from 'expo-location';
import { useTema } from '../../contexto/ThemeContext';
import { Icono } from '../../componentes/Icono';
import { Colores } from '../../constantes/tema';

let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default || Maps;
    Marker = Maps.Marker;
  } catch {}
}

const COMPLEJOS = [
  {
    id: 'polideportivo',
    nombre: 'Polideportivo Municipal',
    direccion: 'Av. Savio y Paysandú, Villaguay',
    latitud: -31.8642,
    longitud: -59.0281,
    canchas: 'Fútbol 5 Sintético, Básquet Parquet, Vóley Techado',
  },
  {
    id: 'berduc',
    nombre: 'Parque Berduc',
    direccion: 'San Martín y Parque Berduc, Villaguay',
    latitud: -31.8595,
    longitud: -59.0340,
    canchas: 'Tenis Polvo de Ladrillo, Pádel Cristal, Vóley Arena',
  },
];

export default function PantallaMapa() {
  const { colores } = useTema();

  const [ubicacionUsuario, setUbicacionUsuario] = useState<{ lat: number; lng: number } | null>(null);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const [complejoActivo, setComplejoActivo] = useState(COMPLEJOS[0]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setPermisoDenegado(true);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUbicacionUsuario({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      } catch {
        setPermisoDenegado(true);
      }
    })();
  }, []);

  // Cálculo de distancia euclídea aproximada
  const calcularDistanciaKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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
      {MapView ? (
        <MapView
          style={styles.mapa}
          initialRegion={{
            latitude: -31.8618,
            longitude: -59.0310,
            latitudeDelta: 0.025,
            longitudeDelta: 0.025,
          }}
          showsUserLocation={!permisoDenegado}
        >
          {COMPLEJOS.map(c => (
            <Marker
              key={c.id}
              coordinate={{ latitude: c.latitud, longitude: c.longitud }}
              title={c.nombre}
              description={c.direccion}
              onPress={() => setComplejoActivo(c)}
              pinColor={Colores.primarioClaro}
            />
          ))}
        </MapView>
      ) : (
        <View style={styles.mapaPlaceholder}>
          <Icono nombre="map-outline" size={54} color={colores.textoMuted} />
          <Text style={[styles.textoPlaceholder, { color: colores.texto }]}>
            Mapa activo para Villaguay, Entre Ríos
          </Text>
        </View>
      )}

      {/* Tarjeta inferior con información del complejo seleccionado */}
      <View style={[styles.tarjetaInfo, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
        <View style={styles.filaTitulo}>
          <Icono nombre="business-outline" size={20} color={Colores.primarioClaro} />
          <Text style={[styles.nombreComplejo, { color: colores.texto }]}>{complejoActivo.nombre}</Text>
        </View>
        <Text style={[styles.direccionComplejo, { color: colores.textoSecundario }]}>
          📍 {complejoActivo.direccion}
        </Text>
        <Text style={[styles.canchasComplejo, { color: colores.textoMuted }]}>
          ⚽ {complejoActivo.canchas}
        </Text>

        {ubicacionUsuario && (
          <View style={styles.filaDistancia}>
            <Text style={[styles.distanciaTexto, { color: Colores.primarioClaro }]}>
              Distancia desde tu ubicación: {calcularDistanciaKm(ubicacionUsuario.lat, ubicacionUsuario.lng, complejoActivo.latitud, complejoActivo.longitud)} km
            </Text>
          </View>
        )}

        <View style={styles.selectorComplejos}>
          {COMPLEJOS.map(c => (
            <Pressable
              key={c.id}
              style={[
                styles.botonComplejo,
                {
                  backgroundColor: complejoActivo.id === c.id ? Colores.primarioClaro : colores.inputFondo,
                },
              ]}
              onPress={() => setComplejoActivo(c)}
            >
              <Text
                style={[
                  styles.botonComplejoTexto,
                  { color: complejoActivo.id === c.id ? '#FFFFFF' : colores.textoSecundario },
                ]}
              >
                {c.nombre.split(' ')[0]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  mapa: {
    flex: 1,
  },
  mapaPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  textoPlaceholder: {
    fontSize: 14,
    fontWeight: '600',
  },
  tarjetaInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nombreComplejo: {
    fontSize: 16,
    fontWeight: '800',
  },
  direccionComplejo: {
    fontSize: 12,
  },
  canchasComplejo: {
    fontSize: 12,
  },
  filaDistancia: {
    marginTop: 4,
  },
  distanciaTexto: {
    fontSize: 12,
    fontWeight: '700',
  },
  selectorComplejos: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  botonComplejo: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  botonComplejoTexto: {
    fontSize: 12,
    fontWeight: '700',
  },
});
