// src/componentes/EstadoCarga.tsx
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colores } from '../constantes/tema';
import { useTema } from '../contexto/ThemeContext';

export const EstadoCarga: React.FC<{ mensaje?: string }> = ({ mensaje = 'Cargando datos...' }) => {
  const { colores } = useTema();
  return (
    <View style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      <ActivityIndicator size="large" color={Colores.primarioClaro} />
      <Text style={[styles.texto, { color: colores.textoSecundario }]}>{mensaje}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  texto: {
    fontSize: 14,
    fontWeight: '500',
  },
});
