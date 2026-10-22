// src/app/+not-found.tsx
// Unidad 3: Manejo de rutas inexistentes o errores 404 en Expo Router

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useTema } from '../contexto/ThemeContext';
import { Colores } from '../constantes/tema';
import { Icono } from '../componentes/Icono';

export default function NotFoundScreen() {
  const { colores } = useTema();

  return (
    <>
      <Stack.Screen options={{ title: 'Página no encontrada' }} />
      <View style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
        <Icono nombre="alert-circle-outline" size={56} color={Colores.advertencia} />
        <Text style={[styles.titulo, { color: colores.texto }]}>Página no encontrada</Text>
        <Text style={[styles.subtitulo, { color: colores.textoSecundario }]}>
          La ruta que intentás abrir no existe o fue reubicada.
        </Text>

        <Link href="/(tabs)" style={styles.enlaceVolver}>
          <Text style={[styles.textoEnlace, { color: Colores.primarioClaro }]}>
            ← Volver a la pantalla principal
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '800',
  },
  subtitulo: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
  },
  enlaceVolver: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  textoEnlace: {
    fontSize: 14,
    fontWeight: '700',
  },
});
