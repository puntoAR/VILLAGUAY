import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTema } from '../contexto/ThemeContext';
import { Icono } from './Icono';
import { Colores } from '../constantes/tema';

interface Props {
  icono?: string;
  titulo: string;
  subtitulo?: string;
  accionTexto?: string;
  onAccion?: () => void;
}

export const EstadoVacio: React.FC<Props> = ({
  icono = 'calendar-outline',
  titulo,
  subtitulo,
  accionTexto,
  onAccion,
}) => {
  const { colores } = useTema();

  return (
    <View style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      <View style={[styles.circuloIcono, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
        <Icono nombre={icono} size={40} color={colores.textoMuted} />
      </View>
      <Text style={[styles.titulo, { color: colores.texto }]}>{titulo}</Text>
      {subtitulo && <Text style={[styles.subtitulo, { color: colores.textoSecundario }]}>{subtitulo}</Text>}
      {accionTexto && onAccion && (
        <TouchableOpacity style={styles.boton} onPress={onAccion}>
          <Text style={styles.botonTexto}>{accionTexto}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  circuloIcono: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  boton: {
    backgroundColor: Colores.primarioClaro,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  botonTexto: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
