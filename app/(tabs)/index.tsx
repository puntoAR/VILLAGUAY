import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Espacio, Deporte } from '../../src/tipos';
import { EspaciosServicio } from '../../src/servicios/espacios';
import { esError } from '../../src/servicios/api';
import { EspacioCard } from '../../src/componentes/EspacioCard';
import { EstadoCarga } from '../../src/componentes/EstadoCarga';
import { EstadoVacio } from '../../src/componentes/EstadoVacio';
import { EstadoError } from '../../src/componentes/EstadoError';
import { Icono } from '../../src/componentes/Icono';
import { useTema } from '../../src/contexto/ThemeContext';
import { useAuth } from '../../src/contexto/AuthContext';
import { useRouter } from 'expo-router';
import { Colores } from '../../src/constantes/tema';

export default function PantallaExplorar() {
  const { colores } = useTema();
  const { usuario } = useAuth();
  const router = useRouter();

  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [deportes, setDeportes] = useState<Deporte[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<{ codigo: string; mensaje: string } | null>(null);

  // Filtros
  const [complejoSeleccionado, setComplejoSeleccionado] = useState<string>('todos');
  const [deporteSeleccionado, setDeporteSeleccionado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  const cargarDatos = async () => {
    setCargando(true);
    setError(null);

    const respDeportes = await EspaciosServicio.obtenerDeportes();
    if (!esError(respDeportes)) {
      setDeportes(respDeportes.datos);
    }

    const respEspacios = await EspaciosServicio.obtenerEspacios({
      complejo: complejoSeleccionado !== 'todos' ? complejoSeleccionado : undefined,
      deporteId: deporteSeleccionado !== 'todos' ? deporteSeleccionado : undefined,
    });

    if (esError(respEspacios)) {
      setError(respEspacios.error);
    } else {
      setEspacios(respEspacios.datos);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [complejoSeleccionado, deporteSeleccionado]);

  const onRefrescar = async () => {
    setRefrescando(true);
    await cargarDatos();
    setRefrescando(false);
  };

  const espaciosFiltrados = espacios.filter(e => {
    if (!busqueda) return true;
    const termino = busqueda.toLowerCase();
    return (
      e.nombre.toLowerCase().includes(termino) ||
      e.superficie.toLowerCase().includes(termino) ||
      e.complejo.toLowerCase().includes(termino)
    );
  });

  if (cargando && !refrescando) {
    return <EstadoCarga mensaje="Cargando espacios deportivos de Villaguay..." />;
  }

  if (error) {
    return (
      <EstadoError
        codigo={error.codigo}
        mensaje={error.mensaje}
        onReintentar={cargarDatos}
      />
    );
  }

  return (
    <View style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      {/* Banner de Estado de Autenticación */}
      <TouchableOpacity
        style={[
          styles.bannerAuth,
          {
            backgroundColor: usuario ? colores.tarjeta : Colores.primarioClaro,
            borderColor: usuario ? colores.borde : Colores.primarioClaro,
          },
        ]}
        onPress={() => router.push('/login')}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.bannerAuthIcono,
            { backgroundColor: usuario ? 'rgba(46, 125, 50, 0.12)' : 'rgba(255, 255, 255, 0.2)' },
          ]}
        >
          <Icono
            nombre={usuario ? 'person-circle-outline' : 'key-outline'}
            size={22}
            color={usuario ? Colores.primarioClaro : '#FFFFFF'}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.bannerAuthTitulo,
              { color: usuario ? colores.texto : '#FFFFFF' },
            ]}
          >
            {usuario ? `Sesión: ${usuario.nombre}` : '¿Querés reservar una cancha?'}
          </Text>
          <Text
            style={[
              styles.bannerAuthSub,
              { color: usuario ? colores.textoSecundario : 'rgba(255,255,255,0.85)' },
            ]}
          >
            {usuario
              ? `Rol: ${usuario.rol.toUpperCase()} • Tocá para cambiar cuenta`
              : 'Iniciá sesión o registrate para confirmar turnos'}
          </Text>
        </View>
        <Icono
          nombre="chevron-forward"
          size={18}
          color={usuario ? colores.textoMuted : '#FFFFFF'}
        />
      </TouchableOpacity>

      {/* Barra de búsqueda */}
      <View style={[styles.buscadorContenedor, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
        <Icono nombre="search-outline" size={18} color={colores.textoMuted} />
        <TextInput
          placeholder="Buscar por cancha, césped sintético, parquet..."
          placeholderTextColor={colores.textoMuted}
          style={[styles.inputBuscador, { color: colores.texto }]}
          value={busqueda}
          onChangeText={setBusqueda}
        />
        {busqueda ? (
          <TouchableOpacity onPress={() => setBusqueda('')}>
            <Icono nombre="close-circle" size={18} color={colores.textoMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filtro por Complejos */}
      <View style={styles.seccionFiltro}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filaPills}>
          {['todos', 'Polideportivo Municipal', 'Parque Berduc'].map(comp => {
            const activo = complejoSeleccionado === comp;
            const etiqueta = comp === 'todos' ? 'Todos los Complejos' : comp;
            return (
              <TouchableOpacity
                key={comp}
                style={[
                  styles.pill,
                  {
                    backgroundColor: activo ? Colores.primario : colores.tarjeta,
                    borderColor: activo ? Colores.primario : colores.borde,
                  },
                ]}
                onPress={() => setComplejoSeleccionado(comp)}
              >
                <Text
                  style={[
                    styles.pillTexto,
                    { color: activo ? '#FFFFFF' : colores.textoSecundario },
                  ]}
                >
                  {etiqueta}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Filtro por Deportes */}
      <View style={styles.seccionFiltro}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filaPills}>
          <TouchableOpacity
            style={[
              styles.pillDeporte,
              {
                backgroundColor: deporteSeleccionado === 'todos' ? Colores.acento : colores.tarjeta,
                borderColor: deporteSeleccionado === 'todos' ? Colores.acento : colores.borde,
              },
            ]}
            onPress={() => setDeporteSeleccionado('todos')}
          >
            <Text
              style={[
                styles.pillTexto,
                { color: deporteSeleccionado === 'todos' ? '#1A4D2E' : colores.textoSecundario, fontWeight: '700' },
              ]}
            >
              Todos los deportes
            </Text>
          </TouchableOpacity>

          {deportes.map(dep => {
            const activo = deporteSeleccionado === dep.id;
            return (
              <TouchableOpacity
                key={dep.id}
                style={[
                  styles.pillDeporte,
                  {
                    backgroundColor: activo ? Colores.acento : colores.tarjeta,
                    borderColor: activo ? Colores.acento : colores.borde,
                  },
                ]}
                onPress={() => setDeporteSeleccionado(dep.id)}
              >
                <Icono
                  nombre={dep.icono}
                  size={15}
                  color={activo ? '#1A4D2E' : dep.color}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.pillTexto,
                    { color: activo ? '#1A4D2E' : colores.texto, fontWeight: activo ? '700' : '500' },
                  ]}
                >
                  {dep.nombre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Listado de 11 canchas o estado vacío */}
      {espaciosFiltrados.length === 0 ? (
        <EstadoVacio
          icono="search-outline"
          titulo="No se encontraron canchas"
          subtitulo="Probá cambiando el deporte, complejo o término de búsqueda."
          accionTexto="Restablecer filtros"
          onAccion={() => {
            setComplejoSeleccionado('todos');
            setDeporteSeleccionado('todos');
            setBusqueda('');
          }}
        />
      ) : (
        <FlatList
          data={espaciosFiltrados}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <EspacioCard espacio={item} />}
          contentContainerStyle={styles.listaCanchas}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={onRefrescar}
              tintColor={Colores.primarioClaro}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  bannerAuth: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bannerAuthIcono: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerAuthTitulo: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerAuthSub: {
    fontSize: 11,
  },
  buscadorContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  inputBuscador: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  seccionFiltro: {
    marginBottom: 8,
  },
  filaPills: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillDeporte: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillTexto: {
    fontSize: 12,
  },
  listaCanchas: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
});
