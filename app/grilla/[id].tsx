import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTema } from '../../src/contexto/ThemeContext';
import { useAuth } from '../../src/contexto/AuthContext';
import { EspaciosServicio } from '../../src/servicios/espacios';
import { TurnosServicio } from '../../src/servicios/turnos';
import { ReservasServicio } from '../../src/servicios/reservas';
import { esError } from '../../src/servicios/api';
import { Espacio, Turno, Deporte } from '../../src/tipos';
import { GrillaTurnos } from '../../src/componentes/GrillaTurnos';
import { EstadoCarga } from '../../src/componentes/EstadoCarga';
import { EstadoError } from '../../src/componentes/EstadoError';
import { Icono } from '../../src/componentes/Icono';
import { Colores } from '../../src/constantes/tema';
import { Haptica } from '../../src/servicios/haptica';

export default function PantallaGrilla() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colores } = useTema();
  const { usuario } = useAuth();

  const proximosDias = TurnosServicio.obtenerProximos7Dias();

  const [espacio, setEspacio] = useState<Espacio | null>(null);
  const [deportes, setDeportes] = useState<Deporte[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(proximosDias[0].fecha);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [cargandoEspacio, setCargandoEspacio] = useState<boolean>(true);
  const [cargandoTurnos, setCargandoTurnos] = useState<boolean>(true);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  // Modal para confirmar reserva en 2 toques
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null);
  const [mostrarModal, setMostrarModal] = useState<boolean>(false);
  const [cantidadPersonas, setCantidadPersonas] = useState<number>(2);
  const [deporteElegidoId, setDeporteElegidoId] = useState<string>('');
  const [reservando, setReservando] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    const cargarInfo = async () => {
      setCargandoEspacio(true);
      setErrorMensaje(null);
      const respEspacio = await EspaciosServicio.obtenerEspacioPorId(id);
      const respDeportes = await EspaciosServicio.obtenerDeportes();

      if (esError(respEspacio)) {
        setErrorMensaje(respEspacio.error.mensaje);
      } else {
        setEspacio(respEspacio.datos);
        setDeporteElegidoId(respEspacio.datos.deporteId);
      }

      if (!esError(respDeportes)) {
        setDeportes(respDeportes.datos);
      }
      setCargandoEspacio(false);
    };

    cargarInfo();
  }, [id]);

  const cargarTurnos = useCallback(async () => {
    if (!id || !fechaSeleccionada) return;
    setCargandoTurnos(true);
    const resp = await TurnosServicio.obtenerGrillaDia(id, fechaSeleccionada);
    if (esError(resp)) {
      setTurnos([]);
    } else {
      setTurnos(resp.datos);
    }
    setCargandoTurnos(false);
  }, [id, fechaSeleccionada]);

  useEffect(() => {
    cargarTurnos();
  }, [cargarTurnos]);

  const seleccionarDia = async (fecha: string) => {
    await Haptica.seleccionSuave();
    setFechaSeleccionada(fecha);
    setTurnoSeleccionado(null);
  };

  const abrirModalReserva = (turno: Turno) => {
    // Si no está registrado, se le pide cuenta recién al querer reservar
    if (!usuario) {
      if (Platform.OS === 'web') {
        const ok = typeof window !== 'undefined'
          ? window.confirm('Podés consultar la disponibilidad sin cuenta, pero para reservar un turno tenés que iniciar sesión o registrarte.\n\n¿Deseás ir a iniciar sesión / registrarte ahora?')
          : false;
        if (ok) {
          router.push('/login');
        }
        return;
      }

      Alert.alert(
        'Iniciar Sesión',
        'Podés consultar la disponibilidad sin cuenta, pero para reservar un turno tenés que iniciar sesión o registrarte.',
        [
          { text: 'Seguir mirando', style: 'cancel' },
          {
            text: 'Ingresar / Registrarme',
            onPress: () => router.push('/login'),
          },
        ]
      );
      return;
    }

    if (usuario.rol === 'encargado' || usuario.rol === 'administrador') {
      Alert.alert(
        'Modo Consulta',
        'El personal municipal puede consultar la disponibilidad pero la reserva de turnos es para los jugadores.'
      );
      return;
    }

    setTurnoSeleccionado(turno);
    setCantidadPersonas(Math.min(2, espacio?.capacidad || 10));
    setMostrarModal(true);
  };

  const confirmarReserva = async () => {
    if (!espacio || !turnoSeleccionado || !usuario) return;

    if (usuario.rol !== 'jugador') {
      Alert.alert('Acceso no permitido', 'Solo los jugadores pueden realizar reservas de canchas.');
      return;
    }

    setReservando(true);
    const resultado = await ReservasServicio.crearReserva({
      espacioId: espacio.id,
      nombreEspacio: espacio.nombre,
      turnoId: turnoSeleccionado.id,
      usuarioId: usuario.id,
      cantidadPersonas,
      fecha: fechaSeleccionada,
      inicio: turnoSeleccionado.inicio,
      nombreUsuario: usuario.nombre,
      telefonoUsuario: usuario.telefono,
    });
    setReservando(false);

    if (esError(resultado)) {
      await Haptica.errorIngreso();
      Alert.alert('No se pudo reservar', resultado.error.mensaje);
      return;
    }

    setMostrarModal(false);
    const reservaCreada = resultado.datos;

    if (Platform.OS === 'web') {
      const ver = typeof window !== 'undefined'
        ? window.confirm(`¡Turno Reservado!\nTu turno para ${espacio.nombre} a las ${turnoSeleccionado.inicio} hs fue confirmado.\n\n¿Deseás ver tu comprobante y código QR ahora?`)
        : false;
      if (ver) {
        router.replace(`/reserva/${reservaCreada.id}` as any);
      } else {
        cargarTurnos();
      }
      return;
    }

    Alert.alert(
      '¡Turno Reservado!',
      `Tu turno para ${espacio.nombre} a las ${turnoSeleccionado.inicio} hs fue confirmado. Se guardó tu código QR de acceso.`,
      [
        {
          text: 'Ver mi reserva y QR',
          onPress: () => router.replace(`/reserva/${reservaCreada.id}` as any),
        },
        {
          text: 'Aceptar',
          style: 'cancel',
          onPress: () => cargarTurnos(),
        },
      ]
    );
  };

  if (cargandoEspacio) {
    return <EstadoCarga mensaje="Cargando disponibilidad..." />;
  }

  if (errorMensaje || !espacio) {
    return (
      <EstadoError
        mensaje={errorMensaje || 'Espacio no disponible.'}
        onReintentar={() => router.back()}
      />
    );
  }

  const diaActualInfo = proximosDias.find(d => d.fecha === fechaSeleccionada);

  return (
    <View style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      {/* Encabezado del espacio */}
      <View style={[styles.encabezadoEspacio, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
        <View style={styles.encabezadoTexto}>
          <Text style={[styles.nombreEspacio, { color: colores.texto }]}>{espacio.nombre}</Text>
          <Text style={[styles.subtituloEspacio, { color: colores.textoSecundario }]}>
            {espacio.complejo} • {espacio.superficie}
          </Text>
        </View>
        <View style={styles.precioBadge}>
          <Text style={styles.precioMonto}>${espacio.precioPorHora.toLocaleString('es-AR')}</Text>
          <Text style={styles.precioTexto}>por hora</Text>
        </View>
      </View>

      {/* Selector de los próximos 7 días */}
      <View style={styles.seccionDias}>
        <Text style={[styles.seccionTitulo, { color: colores.texto }]}>Seleccionar día:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listaDias}
        >
          {proximosDias.map(dia => {
            const seleccionado = dia.fecha === fechaSeleccionada;
            return (
              <TouchableOpacity
                key={dia.fecha}
                style={[
                  styles.botonDia,
                  {
                    backgroundColor: seleccionado ? Colores.primarioClaro : colores.tarjeta,
                    borderColor: seleccionado ? Colores.primarioClaro : colores.borde,
                  },
                ]}
                onPress={() => seleccionarDia(dia.fecha)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.diaSemanaTexto,
                    { color: seleccionado ? '#FFFFFF' : colores.textoSecundario },
                  ]}
                >
                  {dia.diaSemana}
                </Text>
                <Text
                  style={[
                    styles.diaNumeroTexto,
                    { color: seleccionado ? '#FFFFFF' : colores.texto },
                  ]}
                >
                  {dia.diaMes.split(' ')[0]}
                </Text>
                <Text
                  style={[
                    styles.diaMesTexto,
                    { color: seleccionado ? 'rgba(255,255,255,0.85)' : colores.textoMuted },
                  ]}
                >
                  {dia.diaMes.split(' ')[1]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Grilla de turnos de 8:00 a 24:00 */}
      <View style={styles.seccionTurnos}>
        <View style={styles.cabeceraTurnos}>
          <Text style={[styles.diaSeleccionadoTitulo, { color: colores.texto }]}>
            Turnos del {diaActualInfo?.etiqueta} ({diaActualInfo?.fecha})
          </Text>
          <Text style={[styles.instruccionToque, { color: colores.textoMuted }]}>
            Tocá un turno libre para reservar
          </Text>
        </View>

        {cargandoTurnos ? (
          <View style={styles.cargandoTurnosBox}>
            <ActivityIndicator size="small" color={Colores.primarioClaro} />
            <Text style={[styles.cargandoTurnosTexto, { color: colores.textoMuted }]}>
              Cargando grilla de turnos...
            </Text>
          </View>
        ) : (
          <GrillaTurnos
            turnos={turnos}
            turnoSeleccionado={turnoSeleccionado}
            onSeleccionarTurno={abrirModalReserva}
          />
        )}
      </View>

      {/* Modal: Segundo toque para confirmar la reserva */}
      <Modal
        visible={mostrarModal}
        transparent
        animationType="slide"
        onRequestClose={() => setMostrarModal(false)}
      >
        <View style={styles.modalFondo}>
          <View style={[styles.modalContenido, { backgroundColor: colores.tarjeta }]}>
            <View style={styles.modalBarraTop} />

            <View style={styles.modalCabecera}>
              <View>
                <Text style={[styles.modalTitulo, { color: colores.texto }]}>Reservar Turno</Text>
                <Text style={[styles.modalSubtitulo, { color: colores.textoSecundario }]}>
                  {espacio.nombre}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setMostrarModal(false)}
                style={styles.modalBotonCerrar}
              >
                <Icono nombre="close" size={24} color={colores.textoMuted} />
              </TouchableOpacity>
            </View>

            {turnoSeleccionado && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Resumen del turno */}
                <View style={[styles.tarjetaResumenModal, { backgroundColor: colores.fondo, borderColor: colores.borde }]}>
                  <View style={styles.modalFilaDato}>
                    <Icono nombre="calendar-outline" size={18} color={Colores.primarioClaro} />
                    <Text style={[styles.modalDatoEtiqueta, { color: colores.textoSecundario }]}>Día:</Text>
                    <Text style={[styles.modalDatoValor, { color: colores.texto }]}>
                      {fechaSeleccionada} ({diaActualInfo?.diaSemana})
                    </Text>
                  </View>

                  <View style={styles.modalFilaDato}>
                    <Icono nombre="time-outline" size={18} color={Colores.primarioClaro} />
                    <Text style={[styles.modalDatoEtiqueta, { color: colores.textoSecundario }]}>Horario:</Text>
                    <Text style={[styles.modalDatoValor, { color: colores.texto }]}>
                      {turnoSeleccionado.inicio} a {turnoSeleccionado.fin} hs
                    </Text>
                  </View>

                  <View style={styles.modalFilaDato}>
                    <Icono nombre="pricetag-outline" size={18} color={Colores.primarioClaro} />
                    <Text style={[styles.modalDatoEtiqueta, { color: colores.textoSecundario }]}>Precio:</Text>
                    <Text style={[styles.modalDatoValor, { color: Colores.primarioClaro, fontWeight: '800' }]}>
                      ${espacio.precioPorHora.toLocaleString('es-AR')} (se paga en el lugar)
                    </Text>
                  </View>
                </View>

                {/* Selector de Deporte */}
                {deportes.length > 0 && (
                  <View style={styles.campoSelector}>
                    <Text style={[styles.campoLabel, { color: colores.texto }]}>Deporte:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {deportes.map(d => {
                        const esElegido = d.id === deporteElegidoId;
                        return (
                          <TouchableOpacity
                            key={d.id}
                            style={[
                              styles.chipDeporte,
                              {
                                backgroundColor: esElegido ? Colores.primarioClaro : colores.fondo,
                                borderColor: esElegido ? Colores.primarioClaro : colores.borde,
                              },
                            ]}
                            onPress={() => setDeporteElegidoId(d.id)}
                          >
                            <Icono
                              nombre={d.icono}
                              size={15}
                              color={esElegido ? '#FFFFFF' : d.color}
                              style={{ marginRight: 6 }}
                            />
                            <Text
                              style={[
                                styles.chipDeporteTexto,
                                { color: esElegido ? '#FFFFFF' : colores.texto },
                              ]}
                            >
                              {d.nombre}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Cuántos van a ser */}
                <View style={styles.campoSelector}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.campoLabel, { color: colores.texto }]}>
                      ¿Cuántos van a ser? (Máx. {espacio.capacidad}):
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: Colores.primarioClaro }}>
                      {cantidadPersonas} personas
                    </Text>
                  </View>

                  <View style={styles.contadorContainer}>
                    <TouchableOpacity
                      style={[styles.botonContador, { backgroundColor: colores.fondo, borderColor: colores.borde }]}
                      onPress={() => setCantidadPersonas(prev => Math.max(1, prev - 1))}
                      disabled={cantidadPersonas <= 1}
                    >
                      <Icono nombre="remove" size={20} color={colores.texto} />
                    </TouchableOpacity>

                    <Text style={[styles.contadorValor, { color: colores.texto }]}>
                      {cantidadPersonas}
                    </Text>

                    <TouchableOpacity
                      style={[styles.botonContador, { backgroundColor: colores.fondo, borderColor: colores.borde }]}
                      onPress={() => setCantidadPersonas(prev => Math.min(espacio.capacidad, prev + 1))}
                      disabled={cantidadPersonas >= espacio.capacidad}
                    >
                      <Icono nombre="add" size={20} color={colores.texto} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Aviso de cancelación */}
                <View style={styles.avisoReglas}>
                  <Icono nombre="information-circle-outline" size={18} color={Colores.secundario} />
                  <Text style={[styles.avisoReglasTexto, { color: colores.textoSecundario }]}>
                    Se puede cancelar sin aviso hasta 4 horas antes del turno.
                  </Text>
                </View>

                {/* Botón de Confirmación */}
                <TouchableOpacity
                  style={[styles.botonConfirmarReserva, { opacity: reservando ? 0.7 : 1 }]}
                  onPress={confirmarReserva}
                  disabled={reservando}
                >
                  {reservando ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icono nombre="checkmark-circle-outline" size={22} color="#FFFFFF" />
                      <Text style={styles.botonConfirmarTexto}>Confirmar Reserva</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botonCancelarModal}
                  onPress={() => setMostrarModal(false)}
                >
                  <Text style={[styles.botonCancelarModalTexto, { color: colores.textoMuted }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  encabezadoEspacio: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  encabezadoTexto: {
    flex: 1,
    marginRight: 10,
  },
  nombreEspacio: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtituloEspacio: {
    fontSize: 12,
    marginTop: 2,
  },
  precioBadge: {
    alignItems: 'flex-end',
  },
  precioMonto: {
    fontSize: 18,
    fontWeight: '800',
    color: Colores.primarioClaro,
  },
  precioTexto: {
    fontSize: 11,
    color: Colores.textoMuted,
  },
  seccionDias: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  seccionTitulo: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listaDias: {
    paddingHorizontal: 16,
    gap: 8,
  },
  botonDia: {
    width: 66,
    height: 72,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  diaSemanaTexto: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  diaNumeroTexto: {
    fontSize: 20,
    fontWeight: '800',
    marginVertical: 1,
  },
  diaMesTexto: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  seccionTurnos: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  cabeceraTurnos: {
    marginBottom: 8,
  },
  diaSeleccionadoTitulo: {
    fontSize: 15,
    fontWeight: '700',
  },
  instruccionToque: {
    fontSize: 12,
    marginTop: 2,
  },
  cargandoTurnosBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cargandoTurnosTexto: {
    fontSize: 13,
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 20 : 0,
  },
  modalContenido: {
    width: '100%',
    maxWidth: 480,
    borderRadius: Platform.OS === 'web' ? 20 : 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'web' ? 24 : 36,
    paddingTop: 16,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'web' ? 8 : -4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalBarraTop: {
    width: 40,
    height: 5,
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalCabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitulo: {
    fontSize: 13,
    marginTop: 2,
  },
  modalBotonCerrar: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 10,
  },
  tarjetaResumenModal: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  modalFilaDato: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalDatoEtiqueta: {
    fontSize: 13,
    width: 70,
    fontWeight: '500',
  },
  modalDatoValor: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  campoSelector: {
    marginBottom: 16,
  },
  campoLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  chipDeporte: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipDeporteTexto: {
    fontSize: 12,
    fontWeight: '600',
  },
  contadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  botonContador: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorValor: {
    fontSize: 18,
    fontWeight: '800',
  },
  avisoReglas: {
    flexDirection: 'row',
    backgroundColor: 'rgba(232, 170, 66, 0.12)',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    alignItems: 'center',
    marginBottom: 18,
  },
  avisoReglasTexto: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  botonConfirmarReserva: {
    backgroundColor: Colores.primarioClaro,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botonConfirmarTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  botonCancelarModal: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  botonCancelarModalTexto: {
    fontSize: 13,
  },
});
