import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useTema } from '../src/contexto/ThemeContext';
import { Icono } from '../src/componentes/Icono';
import { Colores } from '../src/constantes/tema';

export default function NotFoundScreen() {
  const { colores } = useTema();

  return (
    <>
      <Stack.Screen options={{ title: 'Página no encontrada' }} />
      <View style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
        <Icono nombre="alert-circle-outline" size={64} color={Colores.secundario} />
        <Text style={[styles.titulo, { color: colores.texto }]}>Pantalla no encontrada</Text>
        <Text style={[styles.descripcion, { color: colores.textoSecundario }]}>
          La sección solicitada no existe o fue movida en el sistema de reservas deportivas.
        </Text>

        <Link href="/" asChild>
          <TouchableOpacity
            style={[styles.boton, { backgroundColor: Colores.primarioClaro }]}
          >
            <Icono nombre="home-outline" size={20} color="#FFFFFF" />
            <Text style={styles.botonTexto}>Volver al Inicio</Text>
          </TouchableOpacity>
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
    marginTop: 8,
  },
  descripcion: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
    marginBottom: 12,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  botonTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
