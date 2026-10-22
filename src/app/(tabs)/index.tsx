// src/app/(tabs)/index.tsx
// Catálogo principal de espacios deportivos

import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTema } from '../../contexto/ThemeContext';
import { TarjetaEspacio } from '../../componentes/TarjetaEspacio';
import { EstadoCarga } from '../../componentes/EstadoCarga';
import { EstadoVacio } from '../../componentes/EstadoVacio';
import { Icono } from '../../componentes/Icono';
import { Colores } from '../../constantes/tema';
import { ApiCatedraServicio } from '../../servicios/api';
import { useAcelerometroShake } from '../../servicios/sensores';
import { BDService } from '../../basedatos/sqlite';

export default function PantallaCanchas() {
  const { colores } = useTema();

  const [deporteFiltro, setDeporteFiltro] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  // Consulta de espacios con caché
  const {
    data: espacios = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['espacios', deporteFiltro],
    queryFn: () => ApiCatedraServicio.obtenerEspacios(deporteFiltro === 'todos' ? undefined : deporteFiltro),
  });

  // Lista de deportes desde SQLite
  const deportes = [{ id: 'todos', nombre: 'Todos' }, ...BDService.obtenerDeportesSync()];

  // Resetear filtros al agitar el dispositivo
  useAcelerometroShake(() => {
    setBusqueda('');
    setDeporteFiltro('todos');
  });

  const espaciosFiltrados = espacios.filter(e =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.complejo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <View style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      {/* Barra de búsqueda */}
      <View style={styles.cabecera}>
        <View style={[styles.buscador, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
          <Icono nombre="search-outline" size={18} color={colores.textoMuted} />
          <TextInput
            style={[styles.inputBusqueda, { color: colores.texto }]}
            placeholder="Buscar por cancha o complejo..."
            placeholderTextColor={colores.textoMuted}
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <Pressable onPress={() => setBusqueda('')}>
              <Icono nombre="close-circle" size={18} color={colores.textoMuted} />
            </Pressable>
          )}
        </View>

        {/* Píldoras de deportes */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={deportes}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listaDeportes}
          renderItem={({ item }) => {
            const activo = deporteFiltro === item.id;
            return (
              <Pressable
                style={[
                  styles.pildoraDeporte,
                  {
                    backgroundColor: activo ? Colores.primarioClaro : colores.tarjeta,
                    borderColor: activo ? Colores.primarioClaro : colores.borde,
                  },
                ]}
                onPress={() => setDeporteFiltro(item.id)}
              >
                <Text
                  style={[
                    styles.textoPildora,
                    { color: activo ? '#FFFFFF' : colores.textoSecundario },
                  ]}
                >
                  {item.nombre}
                </Text>
              </Pressable>
            );
          }}
        />

        {/* Indicador pedagógico de sensores */}
        <View style={styles.avisoSensor}>
          <Icono nombre="phone-portrait-outline" size={12} color={colores.textoMuted} />
          <Text style={[styles.textoAvisoSensor, { color: colores.textoMuted }]}>
            Tip sensor: ¡Sacudí el teléfono para reiniciar los filtros!
          </Text>
        </View>
      </View>

      {/* Lista de Canchas */}
      {isLoading ? (
        <EstadoCarga mensaje="Consultando espacios deportivos de Villaguay..." />
      ) : (
        <FlatList
          data={espaciosFiltrados}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listaCanchas}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colores.primarioClaro} />
          }
          ListEmptyComponent={
            <EstadoVacio
              icono="search-outline"
              titulo="No se encontraron canchas"
              subtitulo="Probá cambiando el deporte o la búsqueda de texto."
            />
          }
          renderItem={({ item }) => <TarjetaEspacio espacio={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  cabecera: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  inputBusqueda: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  listaDeportes: {
    gap: 8,
    paddingVertical: 2,
  },
  pildoraDeporte: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  textoPildora: {
    fontSize: 12,
    fontWeight: '700',
  },
  avisoSensor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingBottom: 4,
  },
  textoAvisoSensor: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  listaCanchas: {
    padding: 16,
    paddingBottom: 32,
  },
});
