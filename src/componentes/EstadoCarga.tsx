import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTema } from '../contexto/ThemeContext';
import { Colores } from '../constantes/tema';

export const EstadoCarga: React.FC<{ mensaje?: string }> = ({ mensaje = 'Cargando información...' }) => {
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
  },
  texto: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '500',
  },
});
