// src/componentes/TarjetaEspacio.tsx
// Tarjeta de espacio deportivo

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Espacio } from '../tipos';
import { useTema } from '../contexto/ThemeContext';
import { Icono } from './Icono';
import { Colores } from '../constantes/tema';

interface Props {
  espacio: Espacio;
}

export const TarjetaEspacio: React.FC<Props> = ({ espacio }) => {
  const { colores } = useTema();

  return (
    <Link href={`/espacio/${espacio.id}`} asChild prefetch>
      <Pressable
        style={({ pressed }) => [
          styles.tarjeta,
          {
            backgroundColor: colores.tarjeta,
            borderColor: colores.borde,
            opacity: pressed ? 0.92 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
      >
        <Image
          source={{ uri: espacio.imagenes[0] }}
          style={styles.imagen}
          contentFit="cover"
          transition={250}
        />

        <View style={styles.contenido}>
          <View style={styles.filaComplejo}>
            <Icono nombre="location-outline" size={14} color={Colores.primarioClaro} />
            <Text style={[styles.complejoTexto, { color: colores.textoSecundario }]}>
              {espacio.complejo}
            </Text>
          </View>

          <Text style={[styles.nombre, { color: colores.texto }]} numberOfLines={1}>
            {espacio.nombre}
          </Text>

          <View style={styles.filaChips}>
            <View style={[styles.chip, { backgroundColor: colores.libre }]}>
              <Text style={[styles.chipTexto, { color: colores.libreTexto }]}>{espacio.superficie}</Text>
            </View>

            {espacio.iluminacion && (
              <View style={[styles.chip, { backgroundColor: '#FEF3C7' }]}>
                <Icono nombre="bulb-outline" size={12} color="#B45309" style={{ marginRight: 3 }} />
                <Text style={[styles.chipTexto, { color: '#B45309' }]}>Luz nocturna</Text>
              </View>
            )}

            {espacio.techado && (
              <View style={[styles.chip, { backgroundColor: '#E0F2FE' }]}>
                <Text style={[styles.chipTexto, { color: '#0369A1' }]}>Techado</Text>
              </View>
            )}
          </View>

          <View style={styles.pieTarjeta}>
            <Text style={[styles.capacidadTexto, { color: colores.textoMuted }]}>
              👥 Hasta {espacio.capacidad} jugadores
            </Text>
            <Text style={[styles.precioTexto, { color: Colores.primarioClaro }]}>
              ${espacio.precioPorHora.toLocaleString('es-AR')} / h
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
};

const styles = StyleSheet.create({
  tarjeta: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  imagen: {
    width: '100%',
    height: 155,
  },
  contenido: {
    padding: 14,
    gap: 6,
  },
  filaComplejo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  complejoTexto: {
    fontSize: 12,
    fontWeight: '600',
  },
  nombre: {
    fontSize: 16,
    fontWeight: '800',
  },
  filaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
  pieTarjeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    paddingTop: 8,
  },
  capacidadTexto: {
    fontSize: 12,
  },
  precioTexto: {
    fontSize: 15,
    fontWeight: '800',
  },
});
