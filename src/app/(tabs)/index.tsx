// src/app/(tabs)/index.tsx
// Catálogo principal de espacios deportivos

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useTema } from '../../contexto/ThemeContext';
import { TarjetaEspacio } from '../../componentes/TarjetaEspacio';
import { EstadoCarga } from '../../componentes/EstadoCarga';
import { EstadoVacio } from '../../componentes/EstadoVacio';
import { Icono } from '../../componentes/Icono';
import { Colores } from '../../constantes/tema';
import { EspaciosServicio } from '../../servicios/espacios';
import { esError } from '../../servicios/api';
import { useAcelerometroShake } from '../../servicios/sensores';
import { Espacio, Deporte } from '../../tipos';

const COMPLEJOS = ['Todos', 'Polideportivo Municipal', 'Parque Berduc'];

export default function PantallaCanchas() {
  const { colores } = useTema();

  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [deportes, setDeportes] = useState<Deporte[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [refrescando, setRefrescando] = useState<boolean>(false);

  const [deporteFiltro, setDeporteFiltro] = useState<string>('todos');
  const [complejoFiltro, setComplejoFiltro] = useState<string>('Todos');
  const [busqueda, setBusqueda] = useState<string>('');

  const cargarDatos = useCallback(async () => {
    try {
      const respDeportes = await EspaciosServicio.obtenerDeportes();
      if (!esError(respDeportes)) {
        setDeportes(respDeportes.datos);
      }

      const paramsFiltro: { deporteId?: string; complejo?: string } = {};
      if (deporteFiltro !== 'todos') paramsFiltro.deporteId = deporteFiltro;
      if (complejoFiltro !== 'Todos') paramsFiltro.complejo = complejoFiltro;

      const respEspacios = await EspaciosServicio.obtenerEspacios(paramsFiltro);
      if (!esError(respEspacios)) {
        setEspacios(respEspacios.datos);
      }
    } catch (err) {
      console.warn('Error cargando canchas:', err);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [deporteFiltro, complejoFiltro]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const manejarRefresco = () => {
    setRefrescando(true);
    cargarDatos();
  };

  // Resetear filtros al agitar el teléfono
  useAcelerometroShake(() => {
    setBusqueda('');
    setDeporteFiltro('todos');
    setComplejoFiltro('Todos');
  });

  const listaDeportesPildoras = [{ id: 'todos', nombre: 'Todos' }, ...deportes];

  const espaciosFiltrados = espacios.filter(e => {
    const coincideTexto =
      e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.complejo.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.superficie.toLowerCase().includes(busqueda.toLowerCase());
    return coincideTexto;
  });

  return (
    <View style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      {/* Barra de búsqueda y filtros */}
      <View style={styles.cabecera}>
        <View style={[styles.buscador, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
          <Icono nombre="search-outline" size={18} color={colores.textoMuted} />
          <TextInput
            style={[styles.inputBusqueda, { color: colores.texto }]}
            placeholder="Buscar por cancha, complejo o superficie..."
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

        {/* Selector de Complejo */}
        <View style={styles.filaComplejos}>
          {COMPLEJOS.map(comp => {
            const activo = complejoFiltro === comp;
            return (
              <Pressable
                key={comp}
                style={[
                  styles.botonComplejo,
                  {
                    backgroundColor: activo ? Colores.primarioClaro : colores.tarjeta,
                    borderColor: activo ? Colores.primarioClaro : colores.borde,
                  },
                ]}
                onPress={() => setComplejoFiltro(comp)}
              >
                <Text
                  style={[
                    styles.textoBotonComplejo,
                    { color: activo ? '#FFFFFF' : colores.textoSecundario },
                  ]}
                  numberOfLines={1}
                >
                  {comp}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Píldoras de deportes */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={listaDeportesPildoras}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listaDeportes}
          renderItem={({ item }) => {
            const activo = deporteFiltro === item.id;
            return (
              <Pressable
                style={[
                  styles.pildoraDeporte,
                  {
                    backgroundColor: activo ? Colores.acento : colores.tarjeta,
                    borderColor: activo ? Colores.acento : colores.borde,
                  },
                ]}
                onPress={() => setDeporteFiltro(item.id)}
              >
                <Text
                  style={[
                    styles.textoPildora,
                    { color: activo ? '#000000' : colores.textoSecundario },
                  ]}
                >
                  {item.nombre}
                </Text>
              </Pressable>
            );
          }}
        />

        {/* Tip sensor */}
        <View style={styles.avisoSensor}>
          <Icono nombre="phone-portrait-outline" size={12} color={colores.textoMuted} />
          <Text style={[styles.textoAvisoSensor, { color: colores.textoMuted }]}>
            Tip: Sacudí el celular para limpiar los filtros
          </Text>
        </View>
      </View>

      {/* Lista de Canchas */}
      {cargando ? (
        <EstadoCarga mensaje="Cargando canchas municipales..." />
      ) : (
        <FlatList
          data={espaciosFiltrados}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listaCanchas}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={manejarRefresco}
              tintColor={Colores.primarioClaro}
            />
          }
          ListEmptyComponent={
            <EstadoVacio
              icono="search-outline"
              titulo="No se encontraron canchas"
              subtitulo="Probá ajustando el deporte, complejo o término de búsqueda."
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
    gap: 8,
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
  filaComplejos: {
    flexDirection: 'row',
    gap: 6,
  },
  botonComplejo: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotonComplejo: {
    fontSize: 11,
    fontWeight: '700',
  },
  listaDeportes: {
    gap: 8,
    paddingVertical: 2,
  },
  pildoraDeporte: {
    paddingHorizontal: 14,
    paddingVertical: 6,
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
    paddingBottom: 2,
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
