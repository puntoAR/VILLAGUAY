import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import {
  Espacio,
  ReservaFija,
  BloqueoMantenimiento,
  Turno,
  Reserva,
} from '../../src/tipos';
import { EspaciosServicio } from '../../src/servicios/espacios';
import { TurnosServicio } from '../../src/servicios/turnos';
import { BloqueosServicio } from '../../src/servicios/bloqueos';
import { ReservasFijasServicio } from '../../src/servicios/fijas';
import { ReservasServicio } from '../../src/servicios/reservas';
import { esError } from '../../src/servicios/api';
import { useAuth } from '../../src/contexto/AuthContext';
import { useTema } from '../../src/contexto/ThemeContext';
import { Icono } from '../../src/componentes/Icono';
import { Colores } from '../../src/constantes/tema';
import { useRouter } from 'expo-router';

type SeccionAdmin = 'agenda' | 'bloqueos' | 'fijas' | 'precios';

export default function PantallaAdmin() {
  const { colores } = useTema();
  const { usuario } = useAuth();
  const router = useRouter();

  const [seccionActiva, setSeccionActiva] = useState<SeccionAdmin>('agenda');

  // Datos
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [bloqueos, setBloqueos] = useState<BloqueoMantenimiento[]>([]);
  const [fijas, setFijas] = useState<ReservaFija[]>([]);
  const [reservasHoy, setReservasHoy] = useState<Reserva[]>([]);

  // Agenda del día
  const [espacioAgendaId, setEspacioAgendaId] = useState<string>('esp-01');
  const [turnosAgenda, setTurnosAgenda] = useState<Turno[]>([]);

  // Modal Nuevo Bloqueo
  const [modalBloqueo, setModalBloqueo] = useState(false);
  const [bloqueoEspacioId, setBloqueoEspacioId] = useState('esp-01');
  const [bloqueoFecha, setBloqueoFecha] = useState(new Date().toISOString().split('T')[0]);
  const [bloqueoDiaCompleto, setBloqueoDiaCompleto] = useState(true);
  const [bloqueoInicio, setBloqueoInicio] = useState('08:00');
  const [bloqueoFin, setBloqueoFin] = useState('24:00');
  const [bloqueoMotivo, setBloqueoMotivo] = useState('');

  // Modal Nueva Reserva Fija
  const [modalFija, setModalFija] = useState(false);
  const [fijaEspacioId, setFijaEspacioId] = useState('esp-02');
  const [fijaTitular, setFijaTitular] = useState('');
  const [fijaDia, setFijaDia] = useState<number>(2); // Martes
  const [fijaInicio, setFijaInicio] = useState('21:00');
  const [fijaFin, setFijaFin] = useState('22:00');

  // Modificar Precio
  const [precioEspacioId, setPrecioEspacioId] = useState('esp-01');
  const [nuevoPrecio, setNuevoPrecio] = useState('12000');

  const cargarDatos = async () => {
    const respEsp = await EspaciosServicio.obtenerEspacios();
    if (!esError(respEsp)) {
      setEspacios(respEsp.datos);
      if (respEsp.datos.length > 0 && !espacioAgendaId) {
        setEspacioAgendaId(respEsp.datos[0].id);
      }
    }

    const respBloq = await BloqueosServicio.obtenerBloqueos();
    if (!esError(respBloq)) {
      setBloqueos(respBloq.datos);
    }

    const respFijas = await ReservasFijasServicio.obtenerFijas();
    if (!esError(respFijas)) {
      setFijas(respFijas.datos);
    }

    const respAlq = await ReservasServicio.obtenerAlquileresPredio();
    if (!esError(respAlq)) {
      setReservasHoy(respAlq.datos);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarTurnosAgenda = async (idEsp: string) => {
    const hoy = new Date().toISOString().split('T')[0];
    const resp = await TurnosServicio.obtenerGrillaDia(idEsp, hoy);
    if (!esError(resp)) {
      setTurnosAgenda(resp.datos);
    }
  };

  useEffect(() => {
    if (espacioAgendaId) {
      cargarTurnosAgenda(espacioAgendaId);
    }
  }, [espacioAgendaId]);

  // Guardar Bloqueo
  const handleCrearBloqueo = async () => {
    if (!bloqueoMotivo.trim()) {
      Alert.alert('Motivo requerido', 'Por favor escribí el motivo del bloqueo (ej: Lluvia, Cancha anegada, Pintura).');
      return;
    }

    const resp = await BloqueosServicio.crearBloqueo({
      espacioId: bloqueoEspacioId,
      fecha: bloqueoFecha,
      inicio: bloqueoDiaCompleto ? null : bloqueoInicio,
      fin: bloqueoDiaCompleto ? null : bloqueoFin,
      motivo: bloqueoMotivo.trim(),
    });

    if (esError(resp)) {
      Alert.alert('Error', resp.error.mensaje);
      return;
    }

    Alert.alert('Bloqueo guardado', 'El bloqueo ha sido registrado correctamente.');
    setModalBloqueo(false);
    setBloqueoMotivo('');
    cargarDatos();
    if (espacioAgendaId === bloqueoEspacioId) {
      cargarTurnosAgenda(espacioAgendaId);
    }
  };

  // Eliminar Bloqueo
  const handleEliminarBloqueo = async (idBloqueo: string) => {
    Alert.alert('Levantar Bloqueo', '¿Deseás eliminar este bloqueo y volver a liberar los turnos?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await BloqueosServicio.eliminarBloqueo(idBloqueo);
          cargarDatos();
          cargarTurnosAgenda(espacioAgendaId);
        },
      },
    ]);
  };

  // Guardar Reserva Fija
  const handleCrearFija = async () => {
    if (!fijaTitular.trim()) {
      Alert.alert('Titular requerido', 'Ingresá el nombre del grupo o club titular.');
      return;
    }

    const resp = await ReservasFijasServicio.crearFija({
      espacioId: fijaEspacioId,
      titular: fijaTitular.trim(),
      dia: fijaDia as any,
      inicio: fijaInicio,
      fin: fijaFin,
      desde: new Date().toISOString().split('T')[0],
      hasta: null,
      activa: true,
    });

    if (esError(resp)) {
      Alert.alert('Error', resp.error.mensaje);
      return;
    }

    Alert.alert('Reserva fija guardada', 'La reserva fija ha sido registrada.');
    setModalFija(false);
    setFijaTitular('');
    cargarDatos();
    cargarTurnosAgenda(espacioAgendaId);
  };

  // Eliminar Reserva Fija
  const handleEliminarFija = async (idFija: string) => {
    Alert.alert('Eliminar Reserva Fija', '¿Deseás eliminar esta reserva fija semanal?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await ReservasFijasServicio.eliminarFija(idFija);
          cargarDatos();
          cargarTurnosAgenda(espacioAgendaId);
        },
      },
    ]);
  };

  // Cambiar Precio por Hora
  const handleActualizarPrecio = async () => {
    const precioNum = parseInt(nuevoPrecio, 10);
    if (isNaN(precioNum) || precioNum <= 0) {
      Alert.alert('Precio inválido', 'Ingresá un valor numérico mayor a 0.');
      return;
    }

    const resp = await EspaciosServicio.actualizarPrecioPorHora(precioEspacioId, precioNum);
    if (esError(resp)) {
      Alert.alert('Error', resp.error.mensaje);
      return;
    }

    Alert.alert('Precio actualizado', `El nuevo precio por hora es $${precioNum.toLocaleString('es-AR')}.`);
    cargarDatos();
  };

  // Marcar ausente a una reserva
  const handleMarcarAusente = async (reservaId: string) => {
    Alert.alert('Marcar Ausente', '¿Confirmás que el titular no se presentó al turno?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Marcar Ausente',
        style: 'destructive',
        onPress: async () => {
          await ReservasServicio.marcarAusente(reservaId);
          cargarDatos();
          cargarTurnosAgenda(espacioAgendaId);
        },
      },
    ]);
  };

  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return (
    <View style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      {/* Botón superior de acceso directo al Escáner QR de puerta */}
      <View style={styles.barraAccionRapida}>
        <TouchableOpacity
          style={styles.botonEscanerRapido}
          onPress={() => router.push('/escaner')}
        >
          <Icono nombre="qr-code-outline" size={22} color="#FFFFFF" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.botonEscanerTitulo}>Escanear QR en Puerta</Text>
            <Text style={styles.botonEscanerSub}>Validar ingreso y presentes con la cámara</Text>
          </View>
          <Icono nombre="chevron-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Pestañas de Navegación del Panel */}
      <View style={[styles.selectorSecciones, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 12 }}>
          {[
            { id: 'agenda', titulo: 'Agenda de Hoy', icono: 'calendar-outline' },
            { id: 'bloqueos', titulo: 'Bloqueos / Lluvia', icono: 'cloud-outline' },
            { id: 'fijas', titulo: 'Reservas Fijas', icono: 'repeat-outline' },
            { id: 'precios', titulo: 'Precios x Hora', icono: 'pricetag-outline' },
          ].map(sec => {
            const activo = seccionActiva === sec.id;
            return (
              <TouchableOpacity
                key={sec.id}
                style={[
                  styles.botonPestaña,
                  {
                    backgroundColor: activo ? Colores.primarioClaro : 'transparent',
                    borderColor: activo ? Colores.primarioClaro : colores.borde,
                  },
                ]}
                onPress={() => setSeccionActiva(sec.id as SeccionAdmin)}
              >
                <Icono
                  nombre={sec.icono}
                  size={15}
                  color={activo ? '#FFFFFF' : colores.textoSecundario}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.textoPestaña,
                    { color: activo ? '#FFFFFF' : colores.textoSecundario, fontWeight: activo ? '700' : '500' },
                  ]}
                >
                  {sec.titulo}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.cuerpo} showsVerticalScrollIndicator={false}>
        {/* ==================== SECCIÓN 1: AGENDA DEL DÍA ==================== */}
        {seccionActiva === 'agenda' && (
          <View style={styles.seccion}>
            <Text style={[styles.tituloSeccion, { color: colores.texto }]}>
              Agenda de turnos del día de hoy
            </Text>
            <Text style={[styles.descSeccion, { color: colores.textoSecundario }]}>
              Seleccioná un espacio para revisar la ocupación horaria:
            </Text>

            {/* Selector de espacio */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filaEspacios}>
              {espacios.map(e => {
                const activo = e.id === espacioAgendaId;
                return (
                  <TouchableOpacity
                    key={e.id}
                    style={[
                      styles.chipEspacio,
                      {
                        backgroundColor: activo ? Colores.primario : colores.tarjeta,
                        borderColor: activo ? Colores.primario : colores.borde,
                      },
                    ]}
                    onPress={() => setEspacioAgendaId(e.id)}
                  >
                    <Text
                      style={[
                        styles.chipEspacioTexto,
                        { color: activo ? '#FFFFFF' : colores.texto, fontWeight: activo ? '700' : '500' },
                      ]}
                    >
                      {e.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Grilla de turnos de hoy */}
            <View style={styles.listaTurnosAgenda}>
              {turnosAgenda.map(t => {
                let badgeFondo = colores.libre;
                let badgeTexto = colores.libreTexto;
                let etiqueta = 'LIBRE';
                let detalle = '';

                if (t.estado === 'reservado') {
                  badgeFondo = colores.reservado;
                  badgeTexto = colores.reservadoTexto;
                  etiqueta = 'RESERVADO';
                  const res = reservasHoy.find(r => r.turnoId === t.id);
                  detalle = res?.nombreUsuario ? `Titular: ${res.nombreUsuario}` : 'Turno ocupado';
                } else if (t.estado === 'mantenimiento') {
                  badgeFondo = colores.mantenimiento;
                  badgeTexto = colores.mantenimientoTexto;
                  etiqueta = 'BLOQUEADO';
                  detalle = t.motivoBloqueo || 'Mantenimiento';
                } else if (t.estado === 'fijo') {
                  badgeFondo = colores.fijo;
                  badgeTexto = colores.fijoTexto;
                  etiqueta = 'FIJO';
                  detalle = t.motivoBloqueo || 'Reserva fija';
                }

                const resAsociada = reservasHoy.find(r => r.turnoId === t.id && r.estado === 'confirmada');

                return (
                  <View
                    key={t.id}
                    style={[styles.tarjetaTurnoAgenda, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}
                  >
                    <View style={styles.horaTurnoAgenda}>
                      <Text style={[styles.horaTexto, { color: colores.texto }]}>{t.inicio}</Text>
                      <Text style={[styles.horaFinTexto, { color: colores.textoMuted }]}>a {t.fin}</Text>
                    </View>

                    <View style={{ flex: 1, paddingHorizontal: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={[styles.badgeEstado, { backgroundColor: badgeFondo }]}>
                          <Text style={[styles.badgeTexto, { color: badgeTexto }]}>{etiqueta}</Text>
                        </View>
                        {detalle ? (
                          <Text style={[styles.detalleTurno, { color: colores.texto }]} numberOfLines={1}>
                            {detalle}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    {resAsociada && (
                      <TouchableOpacity
                        style={styles.botonAusente}
                        onPress={() => handleMarcarAusente(resAsociada.id)}
                      >
                        <Text style={styles.botonAusenteTexto}>Marcar Ausente</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ==================== SECCIÓN 2: BLOQUEOS ==================== */}
        {seccionActiva === 'bloqueos' && (
          <View style={styles.seccion}>
            <View style={styles.encabezadoSeccionFila}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.tituloSeccion, { color: colores.texto }]}>
                  Bloqueos por Lluvia o Mantenimiento
                </Text>
                <Text style={[styles.descSeccion, { color: colores.textoSecundario }]}>
                  Desactiva turnos con motivo escrito para que no puedan ser reservados.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.botonAgregar, { backgroundColor: Colores.primarioClaro }]}
                onPress={() => setModalBloqueo(true)}
              >
                <Icono nombre="add" size={18} color="#FFFFFF" />
                <Text style={styles.botonAgregarTexto}>Nuevo Bloqueo</Text>
              </TouchableOpacity>
            </View>

            {bloqueos.length === 0 ? (
              <View style={[styles.cajaVacia, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
                <Icono nombre="checkmark-circle-outline" size={32} color={Colores.primarioClaro} />
                <Text style={[styles.textoVacio, { color: colores.texto }]}>No hay canchas bloqueadas actualmente.</Text>
              </View>
            ) : (
              bloqueos.map(b => {
                const esp = espacios.find(e => e.id === b.espacioId);
                return (
                  <View
                    key={b.id}
                    style={[styles.tarjetaElemento, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.elementoTitulo, { color: colores.texto }]}>
                        {esp?.nombre || b.espacioId}
                      </Text>
                      <Text style={[styles.elementoSub, { color: colores.textoSecundario }]}>
                        Fecha: {b.fecha} • {b.inicio ? `${b.inicio} a ${b.fin} hs` : 'Día entero'}
                      </Text>
                      <Text style={[styles.elementoMotivo, { color: Colores.advertencia }]}>
                        Motivo: "{b.motivo}"
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.botonEliminar}
                      onPress={() => handleEliminarBloqueo(b.id)}
                    >
                      <Icono nombre="trash-outline" size={18} color={Colores.peligro} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ==================== SECCIÓN 3: RESERVAS FIJAS ==================== */}
        {seccionActiva === 'fijas' && (
          <View style={styles.seccion}>
            <View style={styles.encabezadoSeccionFila}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.tituloSeccion, { color: colores.texto }]}>
                  Reservas Fijas Semanales
                </Text>
                <Text style={[styles.descSeccion, { color: colores.textoSecundario }]}>
                  Turnos asignados a grupos o clubes que se repiten todas las semanas.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.botonAgregar, { backgroundColor: Colores.primarioClaro }]}
                onPress={() => setModalFija(true)}
              >
                <Icono nombre="add" size={18} color="#FFFFFF" />
                <Text style={styles.botonAgregarTexto}>Nueva Fija</Text>
              </TouchableOpacity>
            </View>

            {fijas.map(f => {
              const esp = espacios.find(e => e.id === f.espacioId);
              return (
                <View
                  key={f.id}
                  style={[styles.tarjetaElemento, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.elementoTitulo, { color: colores.texto }]}>
                      {f.titular}
                    </Text>
                    <Text style={[styles.elementoSub, { color: colores.textoSecundario }]}>
                      {esp?.nombre || f.espacioId}
                    </Text>
                    <Text style={[styles.elementoHorarioFijo, { color: Colores.acento }]}>
                      Todos los {diasSemana[f.dia]} de {f.inicio} a {f.fin} hs
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.botonEliminar}
                    onPress={() => handleEliminarFija(f.id)}
                  >
                    <Icono nombre="trash-outline" size={18} color={Colores.peligro} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* ==================== SECCIÓN 4: PRECIOS ==================== */}
        {seccionActiva === 'precios' && (
          <View style={styles.seccion}>
            <Text style={[styles.tituloSeccion, { color: colores.texto }]}>
              Cambiar Precio por Hora
            </Text>
            <Text style={[styles.descSeccion, { color: colores.textoSecundario }]}>
              Modificá el valor del turno para cualquier espacio deportivo:
            </Text>

            <View style={[styles.cajaFormulario, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
              <Text style={[styles.etiquetaCampo, { color: colores.texto }]}>Seleccionar espacio:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 14 }}>
                {espacios.map(e => {
                  const elegido = e.id === precioEspacioId;
                  return (
                    <TouchableOpacity
                      key={e.id}
                      style={[
                        styles.chipEspacio,
                        {
                          backgroundColor: elegido ? Colores.primarioClaro : colores.fondo,
                          borderColor: elegido ? Colores.primarioClaro : colores.borde,
                        },
                      ]}
                      onPress={() => {
                        setPrecioEspacioId(e.id);
                        setNuevoPrecio(e.precioPorHora.toString());
                      }}
                    >
                      <Text style={{ color: elegido ? '#FFFFFF' : colores.texto, fontSize: 12, fontWeight: elegido ? '700' : '500' }}>
                        {e.nombre}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[styles.etiquetaCampo, { color: colores.texto }]}>Nuevo precio por hora ($ ARS):</Text>
              <View style={[styles.inputContenedor, { backgroundColor: colores.fondo, borderColor: colores.borde }]}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: Colores.primarioClaro }}>$</Text>
                <TextInput
                  style={[styles.input, { color: colores.texto }]}
                  value={nuevoPrecio}
                  onChangeText={setNuevoPrecio}
                  keyboardType="numeric"
                  placeholder="12000"
                  placeholderTextColor={colores.textoMuted}
                />
              </View>

              <TouchableOpacity
                style={[styles.botonGuardarPrecio, { backgroundColor: Colores.primarioClaro }]}
                onPress={handleActualizarPrecio}
              >
                <Icono nombre="save-outline" size={18} color="#FFFFFF" />
                <Text style={styles.botonGuardarPrecioTexto}>Guardar Nuevo Precio</Text>
              </TouchableOpacity>
            </View>

            {/* Listado de precios vigentes */}
            <Text style={[styles.subtituloLista, { color: colores.texto }]}>Precios actuales por espacio:</Text>
            {espacios.map(e => (
              <View
                key={e.id}
                style={[styles.filaPrecioVigente, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}
              >
                <Text style={[styles.nombreEspacioPrecio, { color: colores.texto }]}>{e.nombre}</Text>
                <Text style={[styles.valorEspacioPrecio, { color: Colores.primarioClaro }]}>
                  ${e.precioPorHora.toLocaleString('es-AR')} / h
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* MODAL NUEVO BLOQUEO */}
      <Modal visible={modalBloqueo} transparent animationType="slide">
        <View style={styles.modalFondo}>
          <View style={[styles.modalContenido, { backgroundColor: colores.tarjeta }]}>
            <Text style={[styles.modalTitulo, { color: colores.texto }]}>Bloquear Cancha / Día</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.etiquetaCampo, { color: colores.texto }]}>Espacio:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
                {espacios.map(e => (
                  <TouchableOpacity
                    key={e.id}
                    style={[
                      styles.chipEspacio,
                      {
                        backgroundColor: e.id === bloqueoEspacioId ? Colores.primarioClaro : colores.fondo,
                        borderColor: e.id === bloqueoEspacioId ? Colores.primarioClaro : colores.borde,
                      },
                    ]}
                    onPress={() => setBloqueoEspacioId(e.id)}
                  >
                    <Text style={{ color: e.id === bloqueoEspacioId ? '#FFFFFF' : colores.texto, fontSize: 11 }}>
                      {e.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.etiquetaCampo, { color: colores.texto }]}>Fecha (AAAA-MM-DD):</Text>
              <TextInput
                style={[styles.inputTexto, { backgroundColor: colores.fondo, color: colores.texto, borderColor: colores.borde }]}
                value={bloqueoFecha}
                onChangeText={setBloqueoFecha}
                placeholder="2026-09-19"
                placeholderTextColor={colores.textoMuted}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginVertical: 10 }}>
                <TouchableOpacity
                  style={[
                    styles.botonToggleDia,
                    {
                      backgroundColor: bloqueoDiaCompleto ? Colores.primarioClaro : colores.fondo,
                      borderColor: colores.borde,
                    },
                  ]}
                  onPress={() => setBloqueoDiaCompleto(true)}
                >
                  <Text style={{ color: bloqueoDiaCompleto ? '#FFFFFF' : colores.texto, fontSize: 12, fontWeight: '600' }}>
                    Día Completo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.botonToggleDia,
                    {
                      backgroundColor: !bloqueoDiaCompleto ? Colores.primarioClaro : colores.fondo,
                      borderColor: colores.borde,
                    },
                  ]}
                  onPress={() => setBloqueoDiaCompleto(false)}
                >
                  <Text style={{ color: !bloqueoDiaCompleto ? '#FFFFFF' : colores.texto, fontSize: 12, fontWeight: '600' }}>
                    Rango Horario
                  </Text>
                </TouchableOpacity>
              </View>

              {!bloqueoDiaCompleto && (
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.etiquetaCampo, { color: colores.texto }]}>Inicio (HH:MM):</Text>
                    <TextInput
                      style={[styles.inputTexto, { backgroundColor: colores.fondo, color: colores.texto, borderColor: colores.borde }]}
                      value={bloqueoInicio}
                      onChangeText={setBloqueoInicio}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.etiquetaCampo, { color: colores.texto }]}>Fin (HH:MM):</Text>
                    <TextInput
                      style={[styles.inputTexto, { backgroundColor: colores.fondo, color: colores.texto, borderColor: colores.borde }]}
                      value={bloqueoFin}
                      onChangeText={setBloqueoFin}
                    />
                  </View>
                </View>
              )}

              <Text style={[styles.etiquetaCampo, { color: colores.texto }]}>Motivo escrito:</Text>
              <TextInput
                style={[styles.inputTexto, { backgroundColor: colores.fondo, color: colores.texto, borderColor: colores.borde }]}
                value={bloqueoMotivo}
                onChangeText={setBloqueoMotivo}
                placeholder="Ej: Lluvia y cancha anegada, pintura..."
                placeholderTextColor={colores.textoMuted}
              />

              <View style={styles.filaBotonesModal}>
                <TouchableOpacity
                  style={[styles.botonModalCancelar, { borderColor: colores.borde }]}
                  onPress={() => setModalBloqueo(false)}
                >
                  <Text style={{ color: colores.texto, fontWeight: '600' }}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.botonModalGuardar, { backgroundColor: Colores.primarioClaro }]}
                  onPress={handleCrearBloqueo}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Guardar Bloqueo</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL NUEVA RESERVA FIJA */}
      <Modal visible={modalFija} transparent animationType="slide">
        <View style={styles.modalFondo}>
          <View style={[styles.modalContenido, { backgroundColor: colores.tarjeta }]}>
            <Text style={[styles.modalTitulo, { color: colores.texto }]}>Nueva Reserva Fija</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.etiquetaCampo, { color: colores.texto }]}>Espacio:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
                {espacios.map(e => (
                  <TouchableOpacity
                    key={e.id}
                    style={[
                      styles.chipEspacio,
                      {
                        backgroundColor: e.id === fijaEspacioId ? Colores.primarioClaro : colores.fondo,
                        borderColor: e.id === fijaEspacioId ? Colores.primarioClaro : colores.borde,
                      },
                    ]}
                    onPress={() => setFijaEspacioId(e.id)}
                  >
                    <Text style={{ color: e.id === fijaEspacioId ? '#FFFFFF' : colores.texto, fontSize: 11 }}>
                      {e.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.etiquetaCampo, { color: colores.texto }]}>Titular / Grupo:</Text>
              <TextInput
                style={[styles.inputTexto, { backgroundColor: colores.fondo, color: colores.texto, borderColor: colores.borde }]}
                value={fijaTitular}
                onChangeText={setFijaTitular}
                placeholder="Ej: Grupo de los martes, Club Sarmiento..."
                placeholderTextColor={colores.textoMuted}
              />

              <Text style={[styles.etiquetaCampo, { color: colores.texto }]}>Día de la semana:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
                {diasSemana.map((d, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.chipEspacio,
                      {
                        backgroundColor: fijaDia === idx ? Colores.primarioClaro : colores.fondo,
                        borderColor: fijaDia === idx ? Colores.primarioClaro : colores.borde,
                      },
                    ]}
                    onPress={() => setFijaDia(idx)}
                  >
                    <Text style={{ color: fijaDia === idx ? '#FFFFFF' : colores.texto, fontSize: 12 }}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.etiquetaCampo, { color: colores.texto }]}>Horario Inicio:</Text>
                  <TextInput
                    style={[styles.inputTexto, { backgroundColor: colores.fondo, color: colores.texto, borderColor: colores.borde }]}
                    value={fijaInicio}
                    onChangeText={setFijaInicio}
                    placeholder="21:00"
                    placeholderTextColor={colores.textoMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.etiquetaCampo, { color: colores.texto }]}>Horario Fin:</Text>
                  <TextInput
                    style={[styles.inputTexto, { backgroundColor: colores.fondo, color: colores.texto, borderColor: colores.borde }]}
                    value={fijaFin}
                    onChangeText={setFijaFin}
                    placeholder="22:00"
                    placeholderTextColor={colores.textoMuted}
                  />
                </View>
              </View>

              <View style={styles.filaBotonesModal}>
                <TouchableOpacity
                  style={[styles.botonModalCancelar, { borderColor: colores.borde }]}
                  onPress={() => setModalFija(false)}
                >
                  <Text style={{ color: colores.texto, fontWeight: '600' }}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.botonModalGuardar, { backgroundColor: Colores.primarioClaro }]}
                  onPress={handleCrearFija}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Guardar Fija</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  barraAccionRapida: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  botonEscanerRapido: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colores.primarioClaro,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  botonEscanerTitulo: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  botonEscanerSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
  },
  selectorSecciones: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  botonPestaña: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  textoPestaña: {
    fontSize: 12,
  },
  cuerpo: {
    flex: 1,
    padding: 16,
  },
  seccion: {
    marginBottom: 30,
  },
  tituloSeccion: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  descSeccion: {
    fontSize: 12,
    marginBottom: 14,
    lineHeight: 16,
  },
  encabezadoSeccionFila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 10,
  },
  botonAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  botonAgregarTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  filaEspacios: {
    gap: 8,
    marginBottom: 14,
  },
  chipEspacio: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipEspacioTexto: {
    fontSize: 12,
  },
  listaTurnosAgenda: {
    gap: 8,
  },
  tarjetaTurnoAgenda: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  horaTurnoAgenda: {
    width: 60,
  },
  horaTexto: {
    fontSize: 15,
    fontWeight: '700',
  },
  horaFinTexto: {
    fontSize: 10,
  },
  badgeEstado: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeTexto: {
    fontSize: 10,
    fontWeight: '800',
  },
  detalleTurno: {
    fontSize: 12,
    flex: 1,
  },
  botonAusente: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colores.peligro,
  },
  botonAusenteTexto: {
    color: Colores.peligro,
    fontSize: 11,
    fontWeight: '700',
  },
  tarjetaElemento: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    gap: 10,
  },
  elementoTitulo: {
    fontSize: 15,
    fontWeight: '700',
  },
  elementoSub: {
    fontSize: 12,
    marginTop: 2,
  },
  elementoMotivo: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  elementoHorarioFijo: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  botonEliminar: {
    padding: 8,
  },
  cajaVacia: {
    padding: 24,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  textoVacio: {
    fontSize: 13,
  },
  cajaFormulario: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  etiquetaCampo: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  botonGuardarPrecio: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 8,
    gap: 8,
  },
  botonGuardarPrecioTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  subtituloLista: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  filaPrecioVigente: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  nombreEspacioPrecio: {
    fontSize: 13,
    fontWeight: '500',
  },
  valorEspacioPrecio: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContenido: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  inputTexto: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  botonToggleDia: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  filaBotonesModal: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    marginBottom: 20,
  },
  botonModalCancelar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  botonModalGuardar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});
