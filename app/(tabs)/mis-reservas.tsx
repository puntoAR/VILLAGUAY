import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { Reserva, Espacio } from '../../src/tipos';
import { ReservasServicio } from '../../src/servicios/reservas';
import { EspaciosServicio } from '../../src/servicios/espacios';
import { esError } from '../../src/servicios/api';
import { TarjetaReserva } from '../../src/componentes/TarjetaReserva';
import { EstadoCarga } from '../../src/componentes/EstadoCarga';
import { EstadoVacio } from '../../src/componentes/EstadoVacio';
import { EstadoError } from '../../src/componentes/EstadoError';
import { useAuth } from '../../src/contexto/AuthContext';
import { useTema } from '../../src/contexto/ThemeContext';
import { Colores } from '../../src/constantes/tema';
import { useRouter } from 'expo-router';

export default function PantallaMisReservas() {
  const { colores } = useTema();
  const { usuario } = useAuth();
  const router = useRouter();

  const [tabActiva, setTabActiva] = useState<'proximas' | 'pasadas'>('proximas');
  const [proximas, setProximas] = useState<Reserva[]>([]);
  const [pasadas, setPasadas] = useState<Reserva[]>([]);
  const [espacios, setEspacios] = useState<Record<string, Espacio>>({});
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarReservas = async () => {
    if (!usuario) {
      setCargando(false);
      return;
    }
    setCargando(true);
    setError(null);

    // Cargar mapa de espacios para enriquecer tarjetas
    const respEspacios = await EspaciosServicio.obtenerEspacios();
    if (!esError(respEspacios)) {
      const mapaEsp: Record<string, Espacio> = {};
      respEspacios.datos.forEach(e => {
        mapaEsp[e.id] = e;
      });
      setEspacios(mapaEsp);
    }

    const resp = await ReservasServicio.obtenerMisReservas(usuario.id);
    if (esError(resp)) {
      setError(resp.error.mensaje);
    } else {
      setProximas(resp.datos.proximas);
      setPasadas(resp.datos.pasadas);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarReservas();
  }, [usuario]);

  const onRefrescar = async () => {
    setRefrescando(true);
    await cargarReservas();
    setRefrescando(false);
  };

  const handleCancelar = (reservaId: string) => {
    if (!usuario) return;

    Alert.alert(
      'Cancelar Reserva',
      '¿Estás seguro de cancelar este turno? Si faltan menos de 4 horas para el inicio, se computará como cancelación tardía.',
      [
        { text: 'No cancelar', style: 'cancel' },
        {
          text: 'Sí, cancelar turno',
          style: 'destructive',
          onPress: async () => {
            const resp = await ReservasServicio.cancelarReserva(reservaId, usuario.id);
            if (!esError(resp)) {
              if (resp.datos.cancelacionTardia) {
                Alert.alert(
                  'Cancelación tardía registrada',
                  'Se canceló el turno pero quedó registrada una cancelación tardía (a menos de 4 horas del turno).'
                );
              } else {
                Alert.alert('Reserva cancelada', 'Tu turno fue cancelado correctamente sin penalización.');
              }
              cargarReservas();
            } else {
              Alert.alert('Error', resp.error.mensaje);
            }
          },
        },
      ]
    );
  };

  if (cargando && !refrescando) {
    return <EstadoCarga mensaje="Cargando tus reservas..." />;
  }

  if (!usuario) {
    return (
      <View style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
        <EstadoVacio
          icono="person-circle-outline"
          titulo="Iniciá sesión para ver tus reservas"
          subtitulo="Para consultar tus turnos agendados y presentar tu código QR de acceso en la puerta, por favor ingresá con tu cuenta."
          accionTexto="Iniciar Sesión o Crear Cuenta"
          onAccion={() => router.push('/login')}
        />
      </View>
    );
  }

  if (error) {
    return <EstadoError mensaje={error} onReintentar={cargarReservas} />;
  }

  const listaActual = tabActiva === 'proximas' ? proximas : pasadas;

  return (
    <View style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      {/* Selector de pestañas */}
      <View style={[styles.tabBar, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
        <TouchableOpacity
          style={[
            styles.tabBoton,
            tabActiva === 'proximas' && { borderBottomColor: Colores.primarioClaro, borderBottomWidth: 3 },
          ]}
          onPress={() => setTabActiva('proximas')}
        >
          <Text
            style={[
              styles.tabTexto,
              { color: tabActiva === 'proximas' ? Colores.primarioClaro : colores.textoSecundario },
              tabActiva === 'proximas' && { fontWeight: '700' },
            ]}
          >
            Próximos Turnos ({proximas.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBoton,
            tabActiva === 'pasadas' && { borderBottomColor: Colores.primarioClaro, borderBottomWidth: 3 },
          ]}
          onPress={() => setTabActiva('pasadas')}
        >
          <Text
            style={[
              styles.tabTexto,
              { color: tabActiva === 'pasadas' ? Colores.primarioClaro : colores.textoSecundario },
              tabActiva === 'pasadas' && { fontWeight: '700' },
            ]}
          >
            Historial ({pasadas.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista o estado vacío */}
      {listaActual.length === 0 ? (
        <EstadoVacio
          icono="calendar-outline"
          titulo={tabActiva === 'proximas' ? 'No tenés turnos reservados' : 'Historial vacío'}
          subtitulo={
            tabActiva === 'proximas'
              ? 'Explorá las 11 canchas de la ciudad y reservá un turno en 2 toques.'
              : 'Acá figurarán tus reservas cumplidas o canceladas anteriormente.'
          }
          accionTexto={tabActiva === 'proximas' ? 'Buscar cancha libre' : undefined}
          onAccion={() => router.push('/(tabs)')}
        />
      ) : (
        <FlatList
          data={listaActual}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TarjetaReserva
              reserva={item}
              espacio={espacios[item.espacioId]}
              onCancelar={tabActiva === 'proximas' ? handleCancelar : undefined}
            />
          )}
          contentContainerStyle={styles.lista}
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBoton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabTexto: {
    fontSize: 14,
    fontWeight: '600',
  },
  lista: {
    padding: 16,
    paddingBottom: 30,
  },
});
