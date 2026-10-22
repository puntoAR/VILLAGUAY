// src/app/(tabs)/turnos.tsx
// Listado de reservas y código QR

import React from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Pressable } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../contexto/AuthContext';
import { useTema } from '../../contexto/ThemeContext';
import { EstadoCarga } from '../../componentes/EstadoCarga';
import { EstadoVacio } from '../../componentes/EstadoVacio';
import { Icono } from '../../componentes/Icono';
import { Colores } from '../../constantes/tema';
import { Haptica } from '../../servicios/haptica';
import { ApiCatedraServicio } from '../../servicios/api';
import { Reserva } from '../../tipos';

export default function PantallaMisTurnos() {
  const { colores } = useTema();
  const { usuario } = useAuth();
  const queryClient = useQueryClient();

  const usuarioId = usuario?.id || 'usr-jugador-1';

  // Consulta de reservas con TanStack Query
  const {
    data: reservas = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['mis-reservas', usuarioId],
    queryFn: () => ApiCatedraServicio.obtenerMisReservas(usuarioId),
  });

  // Mutación para cancelar turno e invalidar la consulta
  const mutacionCancelar = useMutation({
    mutationFn: (reservaId: string) => ApiCatedraServicio.cancelarReserva(reservaId),
    onSuccess: () => {
      Haptica.exito();
      queryClient.invalidateQueries({ queryKey: ['mis-reservas'] });
      queryClient.invalidateQueries({ queryKey: ['turnos'] });
      Alert.alert('Turno cancelado', 'Tu reserva fue cancelada y el turno quedó liberado.');
    },
    onError: () => {
      Haptica.error();
      Alert.alert('Error', 'No se pudo cancelar el turno.');
    },
  });

  const confirmarCancelacion = (reserva: Reserva) => {
    Alert.alert(
      'Cancelar Reserva',
      `¿Deseás cancelar tu turno en ${reserva.nombreEspacio || 'la cancha'}?`,
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: () => mutacionCancelar.mutate(reserva.id),
        },
      ]
    );
  };

  if (isLoading) {
    return <EstadoCarga mensaje="Cargando tus turnos y pases QR..." />;
  }

  return (
    <View style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      <FlatList
        data={reservas}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isLoading}
        ListEmptyComponent={
          <EstadoVacio
            icono="calendar-outline"
            titulo="No tenés turnos reservados"
            subtitulo="Explorá las canchas disponibles y reservá tu horario favorito."
          />
        }
        renderItem={({ item }) => {
          const esCancelada = item.estado === 'cancelada';
          const esCumplida = item.estado === 'cumplida';

          return (
            <View style={[styles.tarjetaReserva, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
              {/* Cabecera de la Reserva */}
              <View style={styles.filaCabecera}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nombreEspacio, { color: colores.texto }]}>
                    {item.nombreEspacio || 'Cancha Municipal'}
                  </Text>
                  <Text style={[styles.fechaTexto, { color: colores.textoSecundario }]}>
                    Turno: {item.creadaEn.split('T')[0]}
                  </Text>
                </View>

                <View
                  style={[
                    styles.badgeEstado,
                    {
                      backgroundColor: esCancelada
                        ? colores.reservado
                        : esCumplida
                        ? '#E0F2FE'
                        : colores.libre,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.textoBadge,
                      {
                        color: esCancelada
                          ? colores.reservadoTexto
                          : esCumplida
                          ? '#0369A1'
                          : colores.libreTexto,
                      },
                    ]}
                  >
                    {item.estado.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Código QR del Turno */}
              <View style={styles.bloqueQr}>
                <View style={styles.qrContenedor}>
                  <QRCode value={item.codigoQr} size={110} color="#0F172A" backgroundColor="#FFFFFF" />
                </View>
                <View style={styles.infoTurno}>
                  <Text style={[styles.codigoTexto, { color: colores.texto }]}>
                    {item.codigoQr}
                  </Text>
                  <Text style={[styles.subtextoQr, { color: colores.textoMuted }]}>
                    Presentá este código QR en la entrada para que el encargado valide tu ingreso.
                  </Text>

                  {item.conLuz && (
                    <Text style={[styles.badgeLuz, { color: '#B45309' }]}>
                      💡 Con luz nocturna incluida
                    </Text>
                  )}
                </View>
              </View>

              {/* Botón para cancelar reserva */}
              {!esCancelada && !esCumplida && (
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
    fontSize: 16,
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
    fontSize: 13,
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
