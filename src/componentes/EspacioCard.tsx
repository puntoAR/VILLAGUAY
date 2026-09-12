import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Espacio } from '../tipos';
import { useTema } from '../contexto/ThemeContext';
import { useAuth } from '../contexto/AuthContext';
import { Icono } from './Icono';
import { Colores } from '../constantes/tema';
import { useRouter } from 'expo-router';

interface Props {
  espacio: Espacio;
}

export const EspacioCard: React.FC<Props> = ({ espacio }) => {
  const { colores } = useTema();
  const { usuario, alternarFavorito } = useAuth();
  const router = useRouter();

  const esFavorito = usuario?.espaciosFavoritos?.includes(espacio.id) || false;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colores.tarjeta, borderColor: colores.borde },
      ]}
      activeOpacity={0.88}
      onPress={() => router.push(`/espacio/${espacio.id}` as any)}
    >
      <View style={styles.imagenContenedor}>
        <Image
          source={{ uri: espacio.imagenes[0] }}
          style={styles.imagen}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={styles.botonFavorito}
          onPress={() => alternarFavorito(espacio.id)}
          activeOpacity={0.8}
        >
          <Icono
            nombre={esFavorito ? 'heart' : 'heart-outline'}
            size={22}
            color={esFavorito ? '#E53935' : '#FFFFFF'}
          />
        </TouchableOpacity>

        <View style={styles.precioBadge}>
          <Text style={styles.precioTexto}>${espacio.precioPorHora.toLocaleString('es-AR')} / h</Text>
        </View>
      </View>

      <View style={styles.cuerpo}>
        <View style={styles.filaComplejo}>
          <Icono nombre="location-outline" size={14} color={Colores.primarioClaro} />
          <Text style={[styles.complejoTexto, { color: colores.textoSecundario }]}>
            {espacio.complejo}
          </Text>
        </View>

        <Text style={[styles.nombre, { color: colores.texto }]} numberOfLines={1}>
          {espacio.nombre}
        </Text>

        <View style={styles.chipsContenedor}>
          <View style={[styles.chip, { backgroundColor: colores.libre }]}>
            <Text style={[styles.chipTexto, { color: colores.libreTexto }]}>{espacio.superficie}</Text>
          </View>

          {espacio.iluminacion ? (
            <View style={[styles.chip, { backgroundColor: '#FEF3C7' }]}>
              <Icono nombre="bulb-outline" size={12} color="#B45309" style={{ marginRight: 4 }} />
              <Text style={[styles.chipTexto, { color: '#B45309' }]}>Luz nocturna</Text>
            </View>
          ) : (
            <View style={[styles.chip, { backgroundColor: '#F1F5F9' }]}>
              <Icono nombre="sunny-outline" size={12} color="#64748B" style={{ marginRight: 4 }} />
              <Text style={[styles.chipTexto, { color: '#64748B' }]}>Solo diurno</Text>
            </View>
          )}

          {espacio.techado && (
            <View style={[styles.chip, { backgroundColor: '#E0F2FE' }]}>
              <Text style={[styles.chipTexto, { color: '#0369A1' }]}>Techado</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.capacidad}>
            <Icono nombre="people-outline" size={15} color={colores.textoMuted} />
            <Text style={[styles.capacidadTexto, { color: colores.textoMuted }]}>
              Hasta {espacio.capacidad} jug.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.botonDisponibilidad}
            onPress={() => router.push(`/grilla/${espacio.id}` as any)}
          >
            <Text style={styles.botonDisponibilidadTexto}>Ver turnos</Text>
            <Icono nombre="chevron-forward" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  imagenContenedor: {
    width: '100%',
    height: 160,
    position: 'relative',
    backgroundColor: '#1E293B',
  },
  imagen: {
    width: '100%',
    height: '100%',
  },
  botonFavorito: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    padding: 7,
  },
  precioBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(15, 45, 27, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  precioTexto: {
    color: '#E8AA42',
    fontWeight: '700',
    fontSize: 13,
  },
  cuerpo: {
    padding: 14,
  },
  filaComplejo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  complejoTexto: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  nombre: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  chipsContenedor: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
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
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  capacidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  capacidadTexto: {
    fontSize: 12,
  },
  botonDisponibilidad: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colores.primarioClaro,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
    gap: 4,
  },
  botonDisponibilidadTexto: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
});
