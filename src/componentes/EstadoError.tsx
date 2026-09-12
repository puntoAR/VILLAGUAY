import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTema } from '../contexto/ThemeContext';
import { Icono } from './Icono';
import { Colores } from '../constantes/tema';

interface Props {
  codigo?: string;
  mensaje: string;
  onReintentar?: () => void;
}

export const EstadoError: React.FC<Props> = ({ codigo, mensaje, onReintentar }) => {
  const { colores } = useTema();

  return (
    <View style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      <View style={[styles.circuloError, { borderColor: Colores.peligro }]}>
        <Icono nombre="alert-circle-outline" size={44} color={Colores.peligro} />
      </View>
      <Text style={[styles.titulo, { color: colores.texto }]}>No se pudo cargar</Text>
      <Text style={[styles.mensaje, { color: colores.textoSecundario }]}>{mensaje}</Text>
      {codigo && <Text style={[styles.codigo, { color: colores.textoMuted }]}>Código de error: {codigo}</Text>}
      {onReintentar && (
        <TouchableOpacity style={styles.boton} onPress={onReintentar}>
          <Icono nombre="refresh-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.botonTexto}>Reintentar</Text>
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
  circuloError: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFEBEE',
  },
  titulo: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  mensaje: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  codigo: {
    fontSize: 12,
    marginBottom: 20,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colores.primarioClaro,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  botonTexto: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
