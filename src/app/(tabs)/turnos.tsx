// src/app/(tabs)/turnos.tsx
// Listado de reservas: Próximos Turnos e Historial con código QR offline

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Pressable, RefreshControl, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../contexto/AuthContext';
import { useTema } from '../../contexto/ThemeContext';
import { EstadoCarga } from '../../componentes/EstadoCarga';
import { EstadoVacio } from '../../componentes/EstadoVacio';
import { Icono } from '../../componentes/Icono';
import { Colores } from '../../constantes/tema';
import { Haptica } from '../../servicios/haptica';
import { ReservasServicio } from '../../servicios/reservas';
import { esError } from '../../servicios/api';
import { Reserva } from '../../tipos';

export default function PantallaMisTurnos() {
  const { colores } = useTema();
  const { usuario } = useAuth();

  const usuarioId = usuario?.id || 'usr-jugador-1';

  const [pestana, setPestana] = useState<'proximos' | 'historial'>('proximos');
  const [proximas, setProximas] = useState<Reserva[]>([]);
  const [pasadas, setPasadas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [refrescando, setRefrescando] = useState<boolean>(false);

  const cargarReservas = useCallback(async () => {
    try {
      const resp = await ReservasServicio.obtenerMisReservas(usuarioId);
      if (!esError(resp)) {
        setProximas(resp.datos.proximas);
        setPasadas(resp.datos.pasadas);
      }
    } catch (err) {
      console.warn('Error cargando reservas:', err);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [usuarioId]);

  // Recargar al enfocar la pestaña (evita desincronización por caché de pestañas)
  useFocusEffect(
    useCallback(() => {
      cargarReservas();
    }, [cargarReservas])
  );

  useEffect(() => {
    cargarReservas();
  }, [cargarReservas]);

  const manejarRefresco = () => {
    setRefrescando(true);
    cargarReservas();
  };

  const confirmarCancelacion = (reserva: Reserva) => {
    const ahora = new Date();
    const limite = new Date(reserva.cancelableHasta);
    const esTardia = ahora > limite;

    const mensajeAdvertencia = esTardia
      ? 'Faltan menos de 4 horas para el turno. La cancelación quedará registrada como tardía en tu cuenta municipal.'
      : 'Estás a tiempo (más de 4 horas de anticipación). El turno quedará liberado sin penalizaciones.';

    const ejecutarCancelacion = async () => {
      const resp = await ReservasServicio.cancelarReserva(reserva.id, usuarioId);
      if (!esError(resp)) {
        await Haptica.exito();
        Alert.alert('Turno Cancelado', 'El horario fue liberado correctamente.');
        cargarReservas();
      } else {
        await Haptica.error();
        Alert.alert('Error', resp.error.mensaje);
      }
    };

    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm(`Cancelar Reserva:\n${mensajeAdvertencia}\n\n¿Confirmás la cancelación?`) : true;
      if (ok) {
        ejecutarCancelacion();
      }
      return;
    }

    Alert.alert(
      'Cancelar Reserva',
      `${mensajeAdvertencia}\n\n¿Confirmás la cancelación?`,
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Sí, cancelar turno',
          style: 'destructive',
          onPress: ejecutarCancelacion,
        },
      ]
    );
  };

  if (cargando) {
    return <EstadoCarga mensaje="Cargando tus reservas y pases de acceso..." />;
  }

  const listaActual = pestana === 'proximos' ? proximas : pasadas;

  return (
    <View style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      {/* Selector de Pestañas */}
      <View style={[styles.barraPestanas, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
        <Pressable
          style={[
            styles.botonPestana,
            pestana === 'proximos' && { backgroundColor: Colores.primarioClaro },
          ]}
          onPress={() => setPestana('proximos')}
        >
          <Text
            style={[
              styles.textoPestana,
              { color: pestana === 'proximos' ? '#FFFFFF' : colores.textoSecundario },
            ]}
          >
            Próximos Turnos ({proximas.length})
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.botonPestana,
            pestana === 'historial' && { backgroundColor: Colores.primarioClaro },
          ]}
          onPress={() => setPestana('historial')}
        >
          <Text
            style={[
              styles.textoPestana,
              { color: pestana === 'historial' ? '#FFFFFF' : colores.textoSecundario },
            ]}
          >
            Historial ({pasadas.length})
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={listaActual}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.lista}
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
            icono="calendar-outline"
            titulo={pestana === 'proximos' ? 'No tenés turnos próximos' : 'No tenés turnos pasados'}
            subtitulo={
              pestana === 'proximos'
                ? 'Elegí una cancha y reservá tu horario favorito.'
                : 'Acá vas a ver los turnos anteriores, asistencias y cancelaciones.'
            }
          />
        }
        renderItem={({ item }) => {
          const esCancelada = item.estado === 'cancelada';
          const esCumplida = item.estado === 'cumplida';
          const esAusente = item.estado === 'ausente';

          let colorBadge = colores.libre;
          let colorTextoBadge = colores.libreTexto;
          let etiqueta = 'CONFIRMADA';

          if (esCancelada) {
            colorBadge = '#FEE2E2';
            colorTextoBadge = '#B91C1C';
            etiqueta = 'CANCELADA';
          } else if (esCumplida) {
            colorBadge = '#E0F2FE';
            colorTextoBadge = '#0369A1';
            etiqueta = 'INGRESADO';
          } else if (esAusente) {
            colorBadge = '#FEF3C7';
            colorTextoBadge = '#B45309';
            etiqueta = 'AUSENTE';
          }

          return (
            <View style={[styles.tarjetaReserva, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
              {/* Cabecera */}
              <View style={styles.filaCabecera}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nombreEspacio, { color: colores.texto }]}>
                    {item.nombreEspacio || item.espacioId}
                  </Text>
                  <Text style={[styles.fechaTexto, { color: colores.textoSecundario }]}>
                    Fecha: {item.creadaEn.split('T')[0]} • {item.cantidadPersonas} jugadores
                  </Text>
                </View>

                <View style={[styles.badgeEstado, { backgroundColor: colorBadge }]}>
                  <Text style={[styles.textoBadge, { color: colorTextoBadge }]}>{etiqueta}</Text>
                </View>
              </View>

              {/* Bloque QR si la reserva está confirmada */}
              {item.estado === 'confirmada' ? (
                <View style={styles.bloqueQr}>
                  <View style={styles.qrContenedor}>
                    <QRCode value={item.codigoQr} size={95} color="#0F172A" backgroundColor="#FFFFFF" />
                  </View>
                  <View style={styles.infoTurno}>
                    <Text style={[styles.codigoTexto, { color: colores.texto }]}>{item.codigoQr}</Text>
                    <Text style={[styles.subtextoQr, { color: colores.textoMuted }]}>
                      Presentá este código offline al encargado al ingresar al predio.
                    </Text>
                    {item.conLuz && (
                      <Text style={[styles.badgeLuz, { color: '#B45309' }]}>
                        💡 Con iluminación nocturna
                      </Text>
                    )}
                  </View>
                </View>
              ) : (
                <View style={[styles.bloqueDetalle, { backgroundColor: 'rgba(150, 150, 150, 0.05)' }]}>
                  <Text style={[styles.subtextoQr, { color: colores.textoSecundario }]}>
                    Código de reserva: {item.codigoQr}
                  </Text>
                  {item.montoTotal && (
                    <Text style={[styles.subtextoQr, { color: colores.textoMuted }]}>
                      Monto: ${item.montoTotal.toLocaleString('es-AR')}
                    </Text>
                  )}
                </View>
              )}

              {/* Botón Cancelar sólo para próximos confirmados */}
              {item.estado === 'confirmada' && (
                <Pressable
                  style={({ pressed }) => [
                    styles.botonCancelar,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => confirmarCancelacion(item)}
                >
                  <Icono nombre="trash-outline" size={15} color={Colores.peligro} />
                  <Text style={styles.textoBotonCancelar}>Cancelar turno</Text>
                </Pressable>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  barraPestanas: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
  },
  botonPestana: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  textoPestana: {
    fontSize: 12,
    fontWeight: '700',
  },
  lista: {
    padding: 16,
    paddingBottom: 32,
  },
  tarjetaReserva: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    gap: 12,
  },
  filaCabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nombreEspacio: {
    fontSize: 15,
    fontWeight: '800',
  },
  fechaTexto: {
    fontSize: 12,
    marginTop: 2,
  },
  badgeEstado: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  textoBadge: {
    fontSize: 10,
    fontWeight: '800',
  },
  bloqueQr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(150, 150, 150, 0.05)',
    padding: 10,
    borderRadius: 10,
  },
  qrContenedor: {
    padding: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  infoTurno: {
    flex: 1,
    gap: 4,
  },
  codigoTexto: {
    fontSize: 12,
    fontWeight: '800',
  },
  subtextoQr: {
    fontSize: 11,
    lineHeight: 15,
  },
  badgeLuz: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  bloqueDetalle: {
    padding: 10,
    borderRadius: 8,
    gap: 4,
  },
  botonCancelar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  textoBotonCancelar: {
    color: Colores.peligro,
    fontSize: 13,
    fontWeight: '700',
  },
});
