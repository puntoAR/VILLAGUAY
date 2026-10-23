// src/app/espacio/[id].tsx
// Detalle de cancha y grilla horaria de disponibilidad

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Alert, FlatList, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useTema } from '../../contexto/ThemeContext';
import { useAuth } from '../../contexto/AuthContext';
import { Icono } from '../../componentes/Icono';
import { Colores } from '../../constantes/tema';
import { ReproductorVideo } from '../../componentes/ReproductorVideo';
import { EstadoCarga } from '../../componentes/EstadoCarga';
import { Haptica } from '../../servicios/haptica';
import { EspaciosServicio } from '../../servicios/espacios';
import { TurnosServicio } from '../../servicios/turnos';
import { ReservasServicio } from '../../servicios/reservas';
import { esError } from '../../servicios/api';
import { Espacio, Turno } from '../../tipos';

export default function PantallaDetalleCancha() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colores } = useTema();
  const { usuario } = useAuth();

  const [espacio, setEspacio] = useState<Espacio | null>(null);
  const [diasDisponibles] = useState(() => TurnosServicio.obtenerProximos7Dias());
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(
    () => TurnosServicio.obtenerProximos7Dias()[0].fecha
  );
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [cargandoEspacio, setCargandoEspacio] = useState<boolean>(true);
  const [cargandoTurnos, setCargandoTurnos] = useState<boolean>(false);

  // Modal de reserva
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null);
  const [conLuz, setConLuz] = useState<boolean>(false);
  const [cantidadPersonas, setCantidadPersonas] = useState<number>(10);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [reservando, setReservando] = useState<boolean>(false);

  const CANON_LUZ = 2500;

  // Cargar información del espacio
  useEffect(() => {
    let montado = true;
    const cargar = async () => {
      if (!id) return;
      setCargandoEspacio(true);
      const resp = await EspaciosServicio.obtenerEspacioPorId(id);
      if (montado) {
        if (!esError(resp)) {
          setEspacio(resp.datos);
          setCantidadPersonas(resp.datos.capacidad || 10);
        }
        setCargandoEspacio(false);
      }
    };
    cargar();
    return () => {
      montado = false;
    };
  }, [id]);

  // Cargar grilla horaria para la fecha seleccionada
  const cargarGrilla = useCallback(async () => {
    if (!id || !fechaSeleccionada) return;
    setCargandoTurnos(true);
    const resp = await TurnosServicio.obtenerGrillaDia(id, fechaSeleccionada);
    if (!esError(resp)) {
      setTurnos(resp.datos);
    }
    setCargandoTurnos(false);
  }, [id, fechaSeleccionada]);

  useEffect(() => {
    cargarGrilla();
  }, [cargarGrilla]);

  if (cargandoEspacio || !espacio) {
    return <EstadoCarga mensaje="Cargando detalles de la cancha..." />;
  }

  const precioTotal = (espacio.precioPorHora || 0) + (conLuz ? CANON_LUZ : 0);

  const abrirModalReserva = (t: Turno) => {
    if (t.estado !== 'libre') {
      if (t.motivoBloqueo) {
        Alert.alert('Turno no disponible', t.motivoBloqueo);
      }
      return;
    }

    if (usuario && usuario.rol !== 'jugador') {
      const nombreRol = usuario.rol === 'encargado' ? 'Encargado de Complejo' : 'Director de Deportes';
      const mensaje = `Como ${nombreRol} no realizás reservas particulares de canchas. Tu función municipal es la gestión y el control de accesos.\n\nPara reservar un turno, ingresá con la cuenta de Jugador (usuario@villaguay.gob.ar).`;
      if (Platform.OS === 'web') {
        window.alert(`Acceso de Personal Municipal:\n\n${mensaje}`);
      } else {
        Alert.alert('Acceso de Personal Municipal', mensaje);
      }
      return;
    }

    Haptica.seleccionSuave();
    setTurnoSeleccionado(t);
    setModalVisible(true);
  };

  const confirmarReserva = async () => {
    if (!turnoSeleccionado) return;

    try {
      setReservando(true);
      const resp = await ReservasServicio.crearReserva({
        espacioId: espacio.id,
        nombreEspacio: espacio.nombre,
        turnoId: turnoSeleccionado.id,
        usuarioId: usuario?.id || 'usr-jugador-1',
        cantidadPersonas,
        fecha: fechaSeleccionada,
        inicio: turnoSeleccionado.inicio,
        conLuz,
        montoTotal: precioTotal,
        nombreUsuario: usuario?.nombre || 'Usuario',
        telefonoUsuario: usuario?.telefono || '',
      });

      if (esError(resp)) {
        await Haptica.error();
        Alert.alert('No se pudo reservar', resp.error.mensaje);
        return;
      }

      await Haptica.confirmacion();
      setModalVisible(false);
      await cargarGrilla();

      if (Platform.OS === 'web') {
        const irATurnos = typeof window !== 'undefined'
          ? window.confirm(
              `¡Reserva Confirmada!\n\nTu turno en ${espacio.nombre} para las ${turnoSeleccionado.inicio} hs quedó confirmado con éxito.\n\n¿Querés ir a "Mis Turnos" a ver el detalle y el pase de acceso QR?`
            )
          : false;
        if (irATurnos) {
          router.push('/(tabs)/turnos');
        }
        return;
      }

      Alert.alert(
        '¡Reserva Confirmada!',
        `Tu turno en ${espacio.nombre} para las ${turnoSeleccionado.inicio} hs quedó confirmado. Mostrá el código QR al ingresar.`,
        [
          {
            text: 'Ver Mis Turnos',
            onPress: () => router.push('/(tabs)/turnos'),
          },
          { text: 'Aceptar', style: 'cancel' },
        ]
      );
    } catch {
      await Haptica.error();
      Alert.alert('Error', 'Ocurrió un problema al procesar la reserva.');
    } finally {
      setReservando(false);
    }
  };

  return (
    <ScrollView style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      {/* Galería de imágenes */}
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

        {/* Video corto del recorrido */}
        <ReproductorVideo videoUrl={espacio.videoUrl} />

        {/* Reglamento */}
        <View style={[styles.tarjetaReglas, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
          <Text style={[styles.tituloReglas, { color: colores.texto }]}>Reglamento del Espacio</Text>
          <Text style={[styles.textoReglas, { color: colores.textoSecundario }]}>{espacio.reglas}</Text>
        </View>

        {/* Selector de los próximos 7 días */}
        <View style={styles.seccionDias}>
          <Text style={[styles.tituloSeccion, { color: colores.texto }]}>Elegir Fecha (Próximos 7 días)</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={diasDisponibles}
            keyExtractor={item => item.fecha}
            contentContainerStyle={styles.listaDias}
            renderItem={({ item }) => {
              const seleccionado = fechaSeleccionada === item.fecha;
              return (
                <Pressable
                  style={[
                    styles.botonDia,
                    {
                      backgroundColor: seleccionado ? Colores.primarioClaro : colores.tarjeta,
                      borderColor: seleccionado ? Colores.primarioClaro : colores.borde,
                    },
                  ]}
                  onPress={() => setFechaSeleccionada(item.fecha)}
                >
                  <Text
                    style={[
                      styles.textoDiaEtiqueta,
                      { color: seleccionado ? '#FFFFFF' : colores.textoSecundario },
                    ]}
                  >
                    {item.etiqueta}
                  </Text>
                  <Text
                    style={[
                      styles.textoDiaMes,
                      { color: seleccionado ? '#FFFFFF' : colores.texto },
                    ]}
                  >
                    {item.diaMes}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        {/* Grilla horaria de 8:00 a 24:00 */}
        <View style={styles.seccionGrilla}>
          <Text style={[styles.tituloSeccion, { color: colores.texto }]}>
            Grilla Horaria (8:00 a 24:00 hs)
          </Text>

          {cargandoTurnos ? (
            <ActivityIndicator size="small" color={Colores.primarioClaro} style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.grillaHorarios}>
              {turnos.map(t => {
                const esLibre = t.estado === 'libre';
                const esPasado = t.motivoBloqueo === 'Horario transcurrido';
                const esMantenimiento = t.estado === 'mantenimiento';
                const esFijo = t.estado === 'fijo';

                let colorFondo = colores.tarjeta;
                let colorBorde = colores.borde;
                let textoEstado = 'LIBRE';
                let colorTextoEstado = colores.libreTexto;

                if (esPasado) {
                  textoEstado = 'PASADO';
                  colorFondo = 'rgba(150, 150, 150, 0.1)';
                  colorTextoEstado = colores.textoMuted;
                } else if (esMantenimiento) {
                  textoEstado = 'BLOQUEADO';
                  colorFondo = '#FEF3C7';
                  colorBorde = '#F59E0B';
                  colorTextoEstado = '#B45309';
                } else if (esFijo) {
                  textoEstado = 'FIJO';
                  colorFondo = '#E0F2FE';
                  colorBorde = '#0284C7';
                  colorTextoEstado = '#0369A1';
                } else if (!esLibre) {
                  textoEstado = 'OCUPADO';
                  colorFondo = '#FEE2E2';
                  colorBorde = '#EF4444';
                  colorTextoEstado = '#B91C1C';
                } else {
                  colorBorde = Colores.primarioClaro;
                  colorTextoEstado = Colores.primarioClaro;
                }

                return (
                  <Pressable
                    key={t.id}
                    style={({ pressed }) => [
                      styles.botonTurno,
                      {
                        backgroundColor: colorFondo,
                        borderColor: colorBorde,
                        opacity: !esLibre || esPasado ? 0.7 : pressed ? 0.8 : 1,
                      },
                    ]}
                    disabled={!esLibre || esPasado}
                    onPress={() => abrirModalReserva(t)}
                  >
                    <Text
                      style={[
                        styles.horarioTexto,
                        { color: esLibre && !esPasado ? colores.texto : colores.textoMuted },
                      ]}
                    >
                      {t.inicio}
                    </Text>
                    <Text
                      style={[
                        styles.estadoTurnoTexto,
                        { color: colorTextoEstado },
                      ]}
                    >
                      {textoEstado}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* Modal de confirmación de reserva */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlayModal}>
          <View style={[styles.contenidoModal, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
            <Text style={[styles.tituloModal, { color: colores.texto }]}>Confirmar Reserva</Text>
            <Text style={[styles.detalleModal, { color: colores.textoSecundario }]}>
              {espacio.nombre} • {fechaSeleccionada} a las {turnoSeleccionado?.inicio} hs
            </Text>

            {/* Cantidad de personas */}
            <View style={styles.filaControl}>
              <Text style={[styles.etiquetaControl, { color: colores.texto }]}>Jugadores:</Text>
              <View style={styles.contadorContenedor}>
                <Pressable
                  style={[styles.botonContador, { borderColor: colores.borde }]}
                  onPress={() => setCantidadPersonas(Math.max(2, cantidadPersonas - 1))}
                >
                  <Text style={[styles.textoContador, { color: colores.texto }]}>-</Text>
                </Pressable>
                <Text style={[styles.numeroPersonas, { color: colores.texto }]}>{cantidadPersonas}</Text>
                <Pressable
                  style={[styles.botonContador, { borderColor: colores.borde }]}
                  onPress={() => setCantidadPersonas(Math.min(espacio.capacidad + 4, cantidadPersonas + 1))}
                >
                  <Text style={[styles.textoContador, { color: colores.texto }]}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* Checkbox de luz nocturna si el espacio tiene iluminación */}
            {espacio.iluminacion && (
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
                    Solicitar Iluminación Nocturna (+${CANON_LUZ})
                  </Text>
                  <Text style={[styles.subtextoOpcionLuz, { color: colores.textoMuted }]}>
                    Incluye el encendido de reflectores durante el horario del turno.
                  </Text>
                </View>
              </Pressable>
            )}

            {/* Total */}
            <View style={styles.filaTotal}>
              <Text style={[styles.etiquetaTotal, { color: colores.textoSecundario }]}>Total a abonar:</Text>
              <Text style={[styles.montoTotal, { color: Colores.primarioClaro }]}>
                ${precioTotal.toLocaleString('es-AR')}
              </Text>
            </View>

            {/* Botones de acción */}
            <View style={styles.filaBotonesModal}>
              <Pressable
                style={[styles.botonModal, styles.botonCancelarModal]}
                onPress={() => setModalVisible(false)}
                disabled={reservando}
              >
                <Text style={styles.textoBotonCancelarModal}>Volver</Text>
              </Pressable>

              <Pressable
                style={[styles.botonModal, { backgroundColor: Colores.primarioClaro, opacity: reservando ? 0.7 : 1 }]}
                onPress={confirmarReserva}
                disabled={reservando}
              >
                {reservando ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.textoBotonConfirmarModal}>Confirmar Reserva</Text>
                )}
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
  seccionDias: {
    gap: 8,
  },
  tituloSeccion: {
    fontSize: 15,
    fontWeight: '700',
  },
  listaDias: {
    gap: 8,
    paddingVertical: 4,
  },
  botonDia: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 70,
  },
  textoDiaEtiqueta: {
    fontSize: 11,
    fontWeight: '700',
  },
  textoDiaMes: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  seccionGrilla: {
    gap: 10,
  },
  grillaHorarios: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  botonTurno: {
    width: '23%',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  horarioTexto: {
    fontSize: 13,
    fontWeight: '800',
  },
  estadoTurnoTexto: {
    fontSize: 9,
    fontWeight: '800',
  },
  overlayModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 20 : 0,
  },
  contenidoModal: {
    width: '100%',
    maxWidth: 480,
    borderRadius: Platform.OS === 'web' ? 20 : 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: Platform.OS === 'web' ? 1 : 0,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'web' ? 8 : -4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  tituloModal: {
    fontSize: 18,
    fontWeight: '800',
  },
  detalleModal: {
    fontSize: 13,
  },
  filaControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etiquetaControl: {
    fontSize: 14,
    fontWeight: '600',
  },
  contadorContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botonContador: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoContador: {
    fontSize: 18,
    fontWeight: '700',
  },
  numeroPersonas: {
    fontSize: 15,
    fontWeight: '800',
    minWidth: 20,
    textAlign: 'center',
  },
  opcionLuz: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  textoBotonConfirmarModal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
