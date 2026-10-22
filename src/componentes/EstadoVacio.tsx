// src/componentes/EstadoVacio.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTema } from '../contexto/ThemeContext';
import { Icono } from './Icono';

interface Props {
  icono?: string;
  titulo: string;
  subtitulo?: string;
}

export const EstadoVacio: React.FC<Props> = ({
  icono = 'calendar-outline',
  titulo,
  subtitulo,
}) => {
  const { colores } = useTema();
  return (
    <View style={styles.contenedor}>
      <Icono nombre={icono} size={48} color={colores.textoMuted} />
      <Text style={[styles.titulo, { color: colores.texto }]}>{titulo}</Text>
      {subtitulo && (
        <Text style={[styles.subtitulo, { color: colores.textoSecundario }]}>{subtitulo}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  titulo: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
