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

  // Modal de reserva (Segundo toque del flujo)
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null);
  const [mostrarModal, setMostrarModal] = useState<boolean>(false);
  const [cantidadPersonas, setCantidadPersonas] = useState<number>(2);
  const [conLuz, setConLuz] = useState<boolean>(false);
  const [deporteElegidoId, setDeporteElegidoId] = useState<string>('');
  const [reservando, setReservando] = useState<boolean>(false);

  const CANON_LUZ = 2500;
  const precioBase = espacio?.precioPorHora || 0;
  const precioTotal = precioBase + (conLuz ? CANON_LUZ : 0);

  // Cargar información del espacio
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

  // Cargar turnos del día seleccionado
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
    if (!usuario) {
      Alert.alert(
        'Iniciar Sesión Requerido',
        'Podés consultar la disponibilidad libremente, pero para confirmar un turno debés ingresar con tu cuenta o registrarte.',
        [
          { text: 'Seguir mirando', style: 'cancel' },
          {
            text: 'Iniciar Sesión / Registrarme',
            onPress: () => router.push('/login'),
          },
        ]
      );
      return;
    }

    if (usuario.rol === 'encargado' || usuario.rol === 'administrador') {
      const rolTexto = usuario.rol === 'administrador' ? 'Director de Deportes' : 'Encargado del Predio';
      Alert.alert(
        'Modo Consulta — Personal Municipal',
        `Como ${rolTexto}, podés supervisar las canchas y consultar la disponibilidad de los turnos, pero la reserva de alquileres está reservada exclusivamente para los jugadores y vecinos.`
      );
      return;
    }

    const horaInicioNum = parseInt(turno.inicio.split(':')[0], 10);
    const sugiereLuz = horaInicioNum >= 19 && (espacio?.iluminacion ?? false);
    setConLuz(sugiereLuz);
    setTurnoSeleccionado(turno);
    setCantidadPersonas(Math.min(2, espacio?.capacidad || 10));
    setMostrarModal(true);
  };

  const confirmarReserva = async () => {
    if (!espacio || !turnoSeleccionado || !usuario) return;

    if (usuario.rol !== 'jugador') {
      Alert.alert('Acceso no permitido', 'Solo los usuarios con rol de jugador pueden realizar reservas de canchas.');
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
      conLuz,
      montoTotal: precioTotal,
      estadoPago: 'pendiente',
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

    Alert.alert(
      '¡Reserva Confirmada! 🎾',
      `Tu turno para ${espacio.nombre} a las ${turnoSeleccionado.inicio} hs fue confirmado exitosamente. Se ha generado tu código QR de acceso para la puerta.`,
      [
        {
          text: 'Ver mi QR de ingreso',
          onPress: () => router.replace(`/reserva/${reservaCreada.id}` as any),
        },
        {
          text: 'Seguir explorando',
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
      {/* Resumen del espacio */}
      <View style={[styles.encabezadoEspacio, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
        <View style={styles.encabezadoTexto}>
          <Text style={[styles.nombreEspacio, { color: colores.texto }]}>{espacio.nombre}</Text>
          <Text style={[styles.subtituloEspacio, { color: colores.textoSecundario }]}>
            {espacio.complejo} • {espacio.superficie}
          </Text>
        </View>
        <View style={styles.precioBadge}>
          <Text style={styles.precioMonto}>${espacio.precioPorHora.toLocaleString('es-AR')}</Text>
          <Text style={styles.precioTexto}>/ hora</Text>
        </View>
      </View>

      {/* Banner informativo de modo consulta para personal municipal */}
      {usuario && (usuario.rol === 'encargado' || usuario.rol === 'administrador') && (
        <View
          style={[
            styles.bannerPersonal,
            { backgroundColor: colores.tarjeta, borderColor: '#D97706' },
          ]}
        >
          <Icono nombre="eye-outline" size={22} color="#D97706" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.bannerPersonalTitulo, { color: colores.texto }]}>
              Modo Supervisión ({usuario.rol === 'administrador' ? 'Dirección de Deportes' : 'Encargado de Predio'})
            </Text>
            <Text style={[styles.bannerPersonalDesc, { color: colores.textoSecundario }]}>
              Tenés acceso a la consulta y supervisión de turnos de la cancha. La reserva de alquileres está reservada exclusivamente para los jugadores y vecinos.
            </Text>
          </View>
        </View>
      )}

      {/* Selector de 7 días */}
      <View style={styles.seccionDias}>
        <Text style={[styles.seccionTitulo, { color: colores.texto }]}>Seleccioná una fecha:</Text>
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

      {/* Grilla horaria 8:00 a 24:00 */}
      <View style={styles.seccionTurnos}>
        <View style={styles.cabeceraTurnos}>
          <Text style={[styles.diaSeleccionadoTitulo, { color: colores.texto }]}>
            Turnos del {diaActualInfo?.etiqueta} ({diaActualInfo?.fecha})
          </Text>
          <Text style={[styles.instruccionToque, { color: colores.textoMuted }]}>
            Tocá un horario libre para reservar
          </Text>
        </View>

        {cargandoTurnos ? (
          <View style={styles.cargandoTurnosBox}>
            <ActivityIndicator size="small" color={Colores.primarioClaro} />
            <Text style={[styles.cargandoTurnosTexto, { color: colores.textoMuted }]}>
              Calculando disponibilidad de la cancha...
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

      {/* Modal Bottom Sheet: Segundo toque para confirmar la reserva */}
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
                <Text style={[styles.modalTitulo, { color: colores.texto }]}>Confirmar Reserva</Text>
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
                {/* Resumen fecha y horario */}
                <View style={[styles.tarjetaResumenModal, { backgroundColor: colores.fondo, borderColor: colores.borde }]}>
                  <View style={styles.modalFilaDato}>
                    <Icono nombre="calendar-outline" size={18} color={Colores.primarioClaro} />
                    <Text style={[styles.modalDatoEtiqueta, { color: colores.textoSecundario }]}>Fecha:</Text>
                    <Text style={[styles.modalDatoValor, { color: colores.texto }]}>
                      {fechaSeleccionada} ({diaActualInfo?.diaSemana})
                    </Text>
                  </View>

                  <View style={styles.modalFilaDato}>
                    <Icono nombre="time-outline" size={18} color={Colores.primarioClaro} />
                    <Text style={[styles.modalDatoEtiqueta, { color: colores.textoSecundario }]}>Horario:</Text>
                    <Text style={[styles.modalDatoValor, { color: colores.texto }]}>
                      {turnoSeleccionado.inicio} a {turnoSeleccionado.fin} hs (1 hora)
                    </Text>
                  </View>

                  <View style={styles.modalFilaDato}>
                    <Icono nombre="pricetag-outline" size={18} color={Colores.primarioClaro} />
                    <Text style={[styles.modalDatoEtiqueta, { color: colores.textoSecundario }]}>Tarifa base:</Text>
                    <Text style={[styles.modalDatoValor, { color: Colores.primarioClaro, fontWeight: '800' }]}>
                      ${espacio.precioPorHora.toLocaleString('es-AR')}
                    </Text>
                  </View>
                </View>

                {/* Selector de Iluminación Artificial (Con / Sin Luz) */}
                <View style={styles.campoSelector}>
                  <Text style={[styles.campoLabel, { color: colores.texto }]}>
                    Iluminación de la Cancha:
                  </Text>
                  {espacio.iluminacion ? (
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity
                        style={[
                          styles.tarjetaOpcionLuz,
                          {
                            backgroundColor: !conLuz ? Colores.primarioClaro + '15' : colores.fondo,
                            borderColor: !conLuz ? Colores.primarioClaro : colores.borde,
                            borderWidth: !conLuz ? 2 : 1,
                          },
                        ]}
                        onPress={() => setConLuz(false)}
                      >
                        <Icono nombre="sunny-outline" size={20} color={!conLuz ? Colores.primarioClaro : colores.textoSecundario} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.tituloOpcionLuz, { color: colores.texto }]}>Sin Luz</Text>
                          <Text style={{ fontSize: 11, color: colores.textoSecundario }}>Tarifa base</Text>
                        </View>
                        <Text style={[styles.precioOpcionLuz, { color: colores.texto }]}>+$0</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.tarjetaOpcionLuz,
                          {
                            backgroundColor: conLuz ? '#F59E0B18' : colores.fondo,
                            borderColor: conLuz ? '#F59E0B' : colores.borde,
                            borderWidth: conLuz ? 2 : 1,
                          },
                        ]}
                        onPress={() => setConLuz(true)}
                      >
                        <Icono nombre="bulb" size={20} color={conLuz ? '#F59E0B' : colores.textoSecundario} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.tituloOpcionLuz, { color: colores.texto }]}>Con Luz</Text>
                          <Text style={{ fontSize: 11, color: colores.textoSecundario }}>Torres nocturnas</Text>
                        </View>
                        <Text style={[styles.precioOpcionLuz, { color: '#D97706', fontWeight: '800' }]}>+$2.500</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={[styles.avisoSinLuz, { backgroundColor: colores.fondo, borderColor: colores.borde }]}>
                      <Icono nombre="sunny-outline" size={16} color={colores.textoMuted} />
                      <Text style={{ color: colores.textoMuted, fontSize: 12 }}>
                        Este espacio funciona exclusivamente con luz solar (sin reflectores).
                      </Text>
                    </View>
                  )}
                </View>

                {/* Selector de cantidad de jugadores */}
                <View style={styles.campoSelector}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.campoLabel, { color: colores.texto }]}>
                      Cantidad de deportistas (Máx. {espacio.capacidad}):
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: Colores.primarioClaro }}>
                      {cantidadPersonas} {cantidadPersonas === 1 ? 'jugador' : 'jugadores'}
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
                      {cantidadPersonas} {cantidadPersonas === 1 ? 'persona' : 'personas'}
                    </Text>

                    <TouchableOpacity
                      style={[styles.botonContador, { backgroundColor: colores.fondo, borderColor: colores.borde }]}
                      onPress={() => setCantidadPersonas(prev => Math.min(espacio.capacidad, prev + 1))}
                      disabled={cantidadPersonas >= espacio.capacidad}
                    >
                      <Icono nombre="add" size={20} color={colores.texto} />
                    </TouchableOpacity>
                  </View>

                  {/* Atajos rápidos de jugadores según capacidad */}
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                    {[2, 4, Math.floor(espacio.capacidad / 2), espacio.capacidad]
                      .filter((val, idx, arr) => val <= espacio.capacidad && val > 0 && arr.indexOf(val) === idx)
                      .map(cant => (
                        <TouchableOpacity
                          key={cant}
                          style={[
                            styles.chipPresetJugadores,
                            {
                              backgroundColor: cantidadPersonas === cant ? Colores.primarioClaro : colores.fondo,
                              borderColor: colores.borde,
                            },
                          ]}
                          onPress={() => setCantidadPersonas(cant)}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '700',
                              color: cantidadPersonas === cant ? '#FFFFFF' : colores.texto,
                            }}
                          >
                            {cant} jug.
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </View>

                {/* Desglose de Pago transparente */}
                <View style={[styles.desgloseCaja, { backgroundColor: colores.fondo, borderColor: colores.borde }]}>
                  <View style={styles.desgloseFila}>
                    <Text style={{ color: colores.textoSecundario, fontSize: 13 }}>Alquiler cancha:</Text>
                    <Text style={{ color: colores.texto, fontSize: 13, fontWeight: '600' }}>
                      ${precioBase.toLocaleString('es-AR')}
                    </Text>
                  </View>
                  {conLuz && (
                    <View style={styles.desgloseFila}>
                      <Text style={{ color: colores.textoSecundario, fontSize: 13 }}>💡 Iluminación nocturna:</Text>
                      <Text style={{ color: '#D97706', fontSize: 13, fontWeight: '700' }}>
                        +${CANON_LUZ.toLocaleString('es-AR')}
                      </Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.desgloseFila,
                      { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colores.borde, paddingTop: 6, marginTop: 4 },
                    ]}
                  >
                    <Text style={{ color: colores.texto, fontSize: 15, fontWeight: '800' }}>Total a abonar:</Text>
                    <Text style={{ color: Colores.primarioClaro, fontSize: 18, fontWeight: '900' }}>
                      ${precioTotal.toLocaleString('es-AR')}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: colores.textoMuted, marginTop: 4 }}>
                    * Se abona en puerta al encargado del predio.
                  </Text>
                </View>

                {/* Avisos de política de cancelación y normas de la Dirección de Deportes */}
                <View style={styles.avisoReglas}>
                  <Icono nombre="information-circle-outline" size={20} color={Colores.secundario} />
                  <Text style={[styles.avisoReglasTexto, { color: colores.textoSecundario }]}>
                    Podés cancelar sin penalización hasta 4 horas antes. Cancelaciones con menos de 4 hs o ausencias quedarán registradas en tu legajo deportivo.
                  </Text>
                </View>

                {/* Botón de Confirmación Definitiva */}
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
                      <Text style={styles.botonConfirmarTexto}>Confirmar Reserva Ahora</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botonCancelarModal}
                  onPress={() => setMostrarModal(false)}
                >
                  <Text style={[styles.botonCancelarModalTexto, { color: colores.textoMuted }]}>
                    Volver a los horarios
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
  bannerPersonal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  bannerPersonalTitulo: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerPersonalDesc: {
    fontSize: 11,
    lineHeight: 15,
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    justifyContent: 'flex-end',
  },
  modalContenido: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    maxHeight: '85%',
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
    width: 105,
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
  contadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  botonContador: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorValor: {
    fontSize: 16,
    fontWeight: '800',
  },
  avisoReglas: {
    flexDirection: 'row',
    backgroundColor: 'rgba(232, 170, 66, 0.1)',
    borderRadius: 10,
    padding: 12,
    gap: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  avisoReglasTexto: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  botonConfirmarReserva: {
    backgroundColor: Colores.primarioClaro,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colores.primarioClaro,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  botonConfirmarTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  botonCancelarModal: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  botonCancelarModalTexto: {
    fontSize: 13,
    fontWeight: '600',
  },
  tarjetaOpcionLuz: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  tituloOpcionLuz: {
    fontSize: 13,
    fontWeight: '700',
  },
  precioOpcionLuz: {
    fontSize: 12,
  },
  avisoSinLuz: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipPresetJugadores: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  desgloseCaja: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  desgloseFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
