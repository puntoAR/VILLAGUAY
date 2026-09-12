import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRed } from '../contexto/RedContext';
import { Icono } from './Icono';

export const BannerDesconexion: React.FC = () => {
  const { conectado } = useRed();

  if (conectado) return null;

  return (
    <View style={styles.banner}>
      <Icono nombre="cloud-offline-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
      <Text style={styles.texto}>Sin conexión a internet. Mostrando datos guardados localmente.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#C62828',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  texto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
