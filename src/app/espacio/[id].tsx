// src/app/espacio/[id].tsx
// Unidad 3: Ruta dinámica con useLocalSearchParams y componentes primitivos
// Unidad 4: expo-video y programación de recordatorio local con expo-notifications
// Unidad 5: Turnos y creación de reserva mediante useQuery y useMutation de TanStack Query
// Unidad 6: Modelado IoT para iluminación nocturna

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTema } from '../../contexto/ThemeContext';
import { useAuth } from '../../contexto/AuthContext';
import { Icono } from '../../componentes/Icono';
import { Colores } from '../../constantes/tema';
import { ReproductorVideo } from '../../componentes/ReproductorVideo';
import { EstadoCarga } from '../../componentes/EstadoCarga';
import { Haptica } from '../../servicios/haptica';
import { ApiCatedraServicio } from '../../servicios/api';
import { NotificacionesServicio } from '../../servicios/notificaciones';
import { BDService } from '../../basedatos/sqlite';
import { Turno } from '../../tipos';

export default function PantallaDetalleCancha() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colores } = useTema();
  const { usuario } = useAuth();
  const queryClient = useQueryClient();

  const fechaHoy = new Date().toISOString().split('T')[0];

  // 1. Obtener cancha sincrónicamente de SQLite
  const espacio = BDService.obtenerEspacioPorIdSync(id || '');

  // 2. Consulta de turnos con TanStack Query
  const { data: turnos = [], isLoading } = useQuery({
    queryKey: ['turnos', id, fechaHoy],
    queryFn: () => ApiCatedraServicio.obtenerTurnos(id || '', fechaHoy),
    enabled: Boolean(id),
  });

  // Estado del Modal de Reserva
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null);
  const [conLuz, setConLuz] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const CANON_LUZ = 2500;
  const precioBase = espacio?.precioPorHora || 0;
  const precioTotal = precioBase + (conLuz ? CANON_LUZ : 0);

  // 3. Mutación para crear la reserva
  const mutacionReservar = useMutation({
    mutationFn: () =>
      ApiCatedraServicio.crearReserva({
        espacioId: espacio!.id,
        nombreEspacio: espacio!.nombre,
        turnoId: turnoSeleccionado!.id,
        usuarioId: usuario?.id || 'usr-jugador-1',
        cantidadPersonas: 10,
        conLuz,
        montoTotal: precioTotal,
      }),
    onSuccess: async () => {
      setModalVisible(false);
      Haptica.exito();

      // Programar recordatorio local con expo-notifications
      await NotificacionesServicio.programarRecordatorio(espacio!.nombre, turnoSeleccionado!.inicio);

      // Invalidar caché
      queryClient.invalidateQueries({ queryKey: ['turnos'] });
      queryClient.invalidateQueries({ queryKey: ['mis-reservas'] });

      Alert.alert(
        '¡Turno Reservado! 🏆',
        `Tu turno en ${espacio!.nombre} para las ${turnoSeleccionado!.inicio} hs fue confirmado. Podés consultar tu código QR en la pestaña "Mis Turnos".`,
        [{ text: 'Ver Mis Turnos', onPress: () => router.push('/(tabs)/turnos') }]
      );
    },
    onError: () => {
      Haptica.error();
      Alert.alert('Error', 'No se pudo completar la reserva.');
    },
  });

  if (!espacio) {
    return <EstadoCarga mensaje="Cancha no encontrada..." />;
  }

  const abrirModalReserva = (t: Turno) => {
    if (t.estado !== 'libre') return;
    Haptica.seleccion();
    setTurnoSeleccionado(t);
    setModalVisible(true);
  };

  return (
    <ScrollView style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      {/* Imagen Principal */}
      <Image
        source={{ uri: espacio.imagenes[0] }}
        style={styles.imagenPrincipal}
        contentFit="cover"
        transition={250}
      />

      <View style={styles.cuerpo}>
        {/* Cabecera */}
        <View style={styles.bloqueTitulo}>
          <Text style={[styles.complejo, { color: Colores.primarioClaro }]}>{espacio.complejo}</Text>
          <Text style={[styles.nombre, { color: colores.texto }]}>{espacio.nombre}</Text>
          <Text style={[styles.superficie, { color: colores.textoSecundario }]}>
            Superficie: {espacio.superficie} • Capacidad: {espacio.capacidad} jugadores
          </Text>
        </View>

        {/* Video con expo-video */}
        <ReproductorVideo videoUrl={espacio.videoUrl} />

        {/* Reglas de Uso */}
        <View style={[styles.tarjetaReglas, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
          <Text style={[styles.tituloReglas, { color: colores.texto }]}>Reglamento del Complejo</Text>
          <Text style={[styles.textoReglas, { color: colores.textoSecundario }]}>{espacio.reglas}</Text>
        </View>

        {/* Grilla de Turnos para Hoy */}
        <View style={styles.seccionTurnos}>
          <Text style={[styles.tituloSeccion, { color: colores.texto }]}>
            Turnos Disponibles para Hoy ({fechaHoy})
          </Text>

          {isLoading ? (
            <EstadoCarga mensaje="Consultando horarios..." />
          ) : (
            <View style={styles.grillaHorarios}>
              {turnos.map(t => {
                const esLibre = t.estado === 'libre';
                return (
                  <Pressable
                    key={t.id}
                    style={({ pressed }) => [
                      styles.botonTurno,
                      {
                        backgroundColor: esLibre ? colores.tarjeta : colores.inputFondo,
                        borderColor: esLibre ? Colores.primarioClaro : colores.borde,
                        opacity: !esLibre ? 0.6 : pressed ? 0.8 : 1,
                      },
                    ]}
                    disabled={!esLibre}
                    onPress={() => abrirModalReserva(t)}
                  >
                    <Text
                      style={[
                        styles.horarioTexto,
                        { color: esLibre ? colores.texto : colores.textoMuted },
                      ]}
                    >
                      {t.inicio} hs
                    </Text>
                    <Text
                      style={[
                        styles.estadoTurnoTexto,
                        { color: esLibre ? Colores.primarioClaro : colores.textoMuted },
                      ]}
                    >
                      {esLibre ? 'LIBRE' : 'OCUPADO'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* Modal de Confirmación de Reserva */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlayModal}>
          <View style={[styles.contenidoModal, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
            <Text style={[styles.tituloModal, { color: colores.texto }]}>Confirmar Reserva</Text>
            <Text style={[styles.detalleModal, { color: colores.textoSecundario }]}>
              {espacio.nombre} a las {turnoSeleccionado?.inicio} hs
            </Text>

            {/* Checkbox de Iluminación Nocturna / IoT */}
            <Pressable
              style={[styles.opcionLuz, { backgroundColor: colores.inputFondo, borderColor: colores.borde }]}
              onPress={() => setConLuz(!conLuz)}
            >
              <Icono
                nombre={conLuz ? 'checkbox' : 'square-outline'}
                size={22}
                color={conLuz ? Colores.primarioClaro : colores.textoMuted}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.textoOpcionLuz, { color: colores.texto }]}>
                  💡 Solicitar Iluminación Nocturna
                </Text>
                <Text style={[styles.subtextoOpcionLuz, { color: colores.textoMuted }]}>
                  Actuador IoT: Los reflectores del predio se activarán automáticamente durante tu turno (+${CANON_LUZ}).
                </Text>
              </View>
            </Pressable>

            {/* Total */}
            <View style={styles.filaTotal}>
              <Text style={[styles.etiquetaTotal, { color: colores.textoSecundario }]}>Monto Total:</Text>
              <Text style={[styles.montoTotal, { color: Colores.primarioClaro }]}>
                ${precioTotal.toLocaleString('es-AR')}
              </Text>
            </View>

            {/* Botones del Modal */}
            <View style={styles.filaBotonesModal}>
              <Pressable
                style={[styles.botonModal, styles.botonCancelarModal]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.textoBotonCancelarModal}>Volver</Text>
              </Pressable>

              <Pressable
                style={[styles.botonModal, styles.botonConfirmarModal, { backgroundColor: Colores.primarioClaro }]}
                onPress={() => mutacionReservar.mutate()}
              >
                <Text style={styles.textoBotonConfirmarModal}>Confirmar Turno</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  imagenPrincipal: {
    width: '100%',
    height: 200,
  },
  cuerpo: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  bloqueTitulo: {
    gap: 4,
  },
  complejo: {
    fontSize: 13,
    fontWeight: '700',
  },
  nombre: {
    fontSize: 20,
    fontWeight: '800',
  },
  superficie: {
    fontSize: 13,
  },
  tarjetaReglas: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  tituloReglas: {
    fontSize: 13,
    fontWeight: '700',
  },
  textoReglas: {
    fontSize: 12,
    lineHeight: 17,
  },
  seccionTurnos: {
    gap: 12,
  },
  tituloSeccion: {
    fontSize: 15,
    fontWeight: '700',
  },
  grillaHorarios: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  botonTurno: {
    width: '31%',
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 3,
  },
  horarioTexto: {
    fontSize: 14,
    fontWeight: '800',
  },
  estadoTurnoTexto: {
    fontSize: 10,
    fontWeight: '700',
  },
  overlayModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  contenidoModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  tituloModal: {
    fontSize: 18,
    fontWeight: '800',
  },
  detalleModal: {
    fontSize: 14,
  },
  opcionLuz: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  textoOpcionLuz: {
    fontSize: 13,
    fontWeight: '700',
  },
  subtextoOpcionLuz: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  filaTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  etiquetaTotal: {
    fontSize: 15,
    fontWeight: '600',
  },
  montoTotal: {
    fontSize: 20,
    fontWeight: '900',
  },
  filaBotonesModal: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  botonModal: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  botonCancelarModal: {
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
  textoBotonCancelarModal: {
    fontSize: 14,
    fontWeight: '700',
  },
  botonConfirmarModal: {},
  textoBotonConfirmarModal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
