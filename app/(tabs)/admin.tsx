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
import { Espacio, ReservaFija, BloqueoMantenimiento, Turno } from '../../src/tipos';
import { EspaciosServicio } from '../../src/servicios/espacios';
import { TurnosServicio } from '../../src/servicios/turnos';
import { BloqueosServicio } from '../../src/servicios/bloqueos';
import { ReservasFijasServicio } from '../../src/servicios/fijas';
import { AuthServicio } from '../../src/servicios/auth';
import { esError } from '../../src/servicios/api';
import { useAuth } from '../../src/contexto/AuthContext';
import { useTema } from '../../src/contexto/ThemeContext';
import { Icono } from '../../src/componentes/Icono';
import { Colores } from '../../src/constantes/tema';
import { useRouter } from 'expo-router';

export default function PantallaAdmin() {
  const { colores } = useTema();
  const { usuario, esEncargadoOAdmin, cambiarRolDemo } = useAuth();
  const router = useRouter();

  const [seccionActiva, setSeccionActiva] = useState<'agenda' | 'bloqueos' | 'fijas' | 'precios'>('agenda');
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [bloqueos, setBloqueos] = useState<BloqueoMantenimiento[]>([]);
  const [fijas, setFijas] = useState<ReservaFija[]>([]);

  // Agenda del día
  const [espacioAgendaId, setEspacioAgendaId] = useState<string>('esp-01');
  const [turnosAgenda, setTurnosAgenda] = useState<Turno[]>([]);

  // Modal para nuevo bloqueo
  const [modalBloqueoVisible, setModalBloqueoVisible] = useState(false);
  const [bloqueoEspacioId, setBloqueoEspacioId] = useState('esp-01');
  const [bloqueoFecha, setBloqueoFecha] = useState(new Date().toISOString().split('T')[0]);
  const [bloqueoMotivo, setBloqueoMotivo] = useState('');

  // Modal para nueva reserva fija
  const [modalFijaVisible, setModalFijaVisible] = useState(false);
  const [fijaEspacioId, setFijaEspacioId] = useState('esp-02');
  const [fijaTitular, setFijaTitular] = useState('');
  const [fijaDia, setFijaDia] = useState<number>(2); // Martes
  const [fijaInicio, setFijaInicio] = useState('21:00');
  const [fijaFin, setFijaFin] = useState('22:00');

  // Editor de precio
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

    const respFij = await ReservasFijasServicio.obtenerFijas();
    if (!esError(respFij)) {
      setFijas(respFij.datos);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (espacioAgendaId) {
      const hoy = new Date().toISOString().split('T')[0];
      TurnosServicio.obtenerGrillaDia(espacioAgendaId, hoy).then(resp => {
        if (!esError(resp)) {
          setTurnosAgenda(resp.datos);
        }
      });
    }
  }, [espacioAgendaId]);

  // Requisito 2 & 4: El encargado reingresa con biometría (huella/rostro) antes de escanear
  const abrirEscanerConBiometria = async () => {
    const auth = await AuthServicio.autenticarConBiometria(
      'Validar identidad con huella o rostro para operar el escáner de puerta'
    );
    if (auth.exito) {
      router.push('/escaner' as any);
    } else {
      Alert.alert('Autenticación fallida', auth.mensajeError || 'No se pudo verificar la huella.');
    }
  };

  const handleCrearBloqueo = async () => {
    if (!bloqueoMotivo.trim()) {
      Alert.alert('Atención', 'Por favor ingresa un motivo escrito para el bloqueo.');
      return;
    }

    const esp = espacios.find(e => e.id === bloqueoEspacioId);
    const resp = await BloqueosServicio.crearBloqueo({
      espacioId: bloqueoEspacioId,
      fecha: bloqueoFecha,
      inicio: null, // Día completo
      fin: null,
      motivo: bloqueoMotivo,
      nombreEspacio: esp?.nombre,
    });

    if (!esError(resp)) {
      Alert.alert('Bloqueo Registrado', 'Se suspendió el espacio y se emitieron los avisos pertinentes.');
      setModalBloqueoVisible(false);
      setBloqueoMotivo('');
      cargarDatos();
    } else {
      Alert.alert('Error', resp.error.mensaje);
    }
  };

  const handleCrearFija = async () => {
    if (!fijaTitular.trim()) {
      Alert.alert('Atención', 'Ingresa el nombre del grupo o club titular.');
      return;
    }

    const resp = await ReservasFijasServicio.crearFija({
      espacioId: fijaEspacioId,
      titular: fijaTitular,
      dia: fijaDia as any,
      inicio: fijaInicio,
      fin: fijaFin,
      desde: new Date().toISOString().split('T')[0],
      hasta: null,
      activa: true,
    });

    if (!esError(resp)) {
      Alert.alert('Reserva Fija Guardada', 'La regla semanal quedó activa y bloqueará ese turno en la grilla.');
      setModalFijaVisible(false);
      setFijaTitular('');
      cargarDatos();
    } else {
      Alert.alert('Error', resp.error.mensaje);
    }
  };

  const handleGuardarPrecio = async () => {
    const p = parseInt(nuevoPrecio, 10);
    if (isNaN(p) || p <= 0) {
      Alert.alert('Precio inválido', 'Ingresa un valor numérico válido.');
      return;
    }

    const resp = await EspaciosServicio.actualizarPrecioPorHora(precioEspacioId, p);
    if (!esError(resp)) {
      Alert.alert('Precio actualizado', `El precio por hora se fijó en $${p.toLocaleString('es-AR')}`);
      cargarDatos();
    } else {
      Alert.alert('Error', resp.error.mensaje);
    }
  };

  return (
    <ScrollView style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      {/* Selector de Rol Demo si está como jugador */}
      {!esEncargadoOAdmin && (
        <View style={styles.bannerRol}>
          <Text style={styles.bannerRolTexto}>
            Estás en modo Jugador. Cambiá a Encargado (Marcelo) o Admin para gestionar:
          </Text>
          <View style={styles.filaBotonesRol}>
            <TouchableOpacity
              style={styles.botonRol}
              onPress={() => cambiarRolDemo('encargado')}
            >
              <Text style={styles.botonRolTexto}>Soy Marcelo (Encargado)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.botonRol}
              onPress={() => cambiarRolDemo('administrador')}
            >
              <Text style={styles.botonRolTexto}>Soy Nahuel (Director)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Botón Escanear QR en la puerta con Biometría */}
      <View style={styles.seccionAccionPrincipal}>
        <TouchableOpacity
          style={styles.botonEscaner}
          activeOpacity={0.85}
          onPress={abrirEscanerConBiometria}
        >
          <Icono nombre="qr-code" size={28} color="#1A4D2E" />
          <View style={{ flex: 1 }}>
            <Text style={styles.botonEscanerTitulo}>Control de Ingreso en Puerta</Text>
            <Text style={styles.botonEscanerSub}>Escanear código QR de la reserva (con huella)</Text>
          </View>
          <Icono nombre="finger-print-outline" size={26} color="#1A4D2E" />
        </TouchableOpacity>
      </View>

      {/* Pestañas del Panel */}
      <View style={[styles.barraPestanas, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
        <TouchableOpacity
          style={[styles.pestana, seccionActiva === 'agenda' && styles.pestanaActiva]}
          onPress={() => setSeccionActiva('agenda')}
        >
          <Text style={[styles.pestanaTexto, seccionActiva === 'agenda' && styles.pestanaTextoActivo]}>Agenda</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pestana, seccionActiva === 'bloqueos' && styles.pestanaActiva]}
          onPress={() => setSeccionActiva('bloqueos')}
        >
          <Text style={[styles.pestanaTexto, seccionActiva === 'bloqueos' && styles.pestanaTextoActivo]}>Lluvia/Manten.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pestana, seccionActiva === 'fijas' && styles.pestanaActiva]}
          onPress={() => setSeccionActiva('fijas')}
        >
          <Text style={[styles.pestanaTexto, seccionActiva === 'fijas' && styles.pestanaTextoActivo]}>Fijas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pestana, seccionActiva === 'precios' && styles.pestanaActiva]}
          onPress={() => setSeccionActiva('precios')}
        >
          <Text style={[styles.pestanaTexto, seccionActiva === 'precios' && styles.pestanaTextoActivo]}>Precios</Text>
        </TouchableOpacity>
      </View>

      {/* 1. SECCIÓN AGENDA DEL DÍA */}
      {seccionActiva === 'agenda' && (
        <View style={styles.seccionContenido}>
          <Text style={[styles.seccionTitulo, { color: colores.texto }]}>Agenda de Hoy (Todos los Espacios)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {espacios.map(e => (
                <TouchableOpacity
                  key={e.id}
                  style={[
                    styles.chipEspacio,
                    {
                      backgroundColor: e.id === espacioAgendaId ? Colores.primarioClaro : colores.tarjeta,
                      borderColor: e.id === espacioAgendaId ? Colores.primarioClaro : colores.borde,
                    },
                  ]}
                  onPress={() => setEspacioAgendaId(e.id)}
                >
                  <Text style={{ color: e.id === espacioAgendaId ? '#FFFFFF' : colores.texto, fontSize: 12, fontWeight: '600' }}>
                    {e.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={[styles.tablaAgenda, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
            {turnosAgenda.map(t => (
              <View key={t.id} style={[styles.filaAgenda, { borderBottomColor: colores.borde }]}>
                <Text style={[styles.agendaHora, { color: colores.texto }]}>{t.inicio} hs</Text>
                <View style={styles.agendaEstado}>
                  <Text
                    style={[
                      styles.agendaEstadoBadge,
                      {
                        backgroundColor:
                          t.estado === 'libre'
                            ? colores.libre
                            : t.estado === 'reservado'
                            ? colores.reservado
                            : t.estado === 'fijo'
                            ? colores.fijo
                            : colores.mantenimiento,
                        color:
                          t.estado === 'libre'
                            ? colores.libreTexto
                            : t.estado === 'reservado'
                            ? colores.reservadoTexto
                            : t.estado === 'fijo'
                            ? colores.fijoTexto
                            : colores.mantenimientoTexto,
                      },
                    ]}
                  >
                    {t.estado.toUpperCase()}
                  </Text>
                  {t.motivoBloqueo && (
                    <Text style={[styles.agendaMotivo, { color: colores.textoSecundario }]} numberOfLines={1}>
                      {t.motivoBloqueo}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 2. SECCIÓN BLOQUEOS POR LLUVIA / MANTENIMIENTO */}
      {seccionActiva === 'bloqueos' && (
        <View style={styles.seccionContenido}>
          <View style={styles.filaTituloBoton}>
            <Text style={[styles.seccionTitulo, { color: colores.texto }]}>Bloqueos Registrados</Text>
            <TouchableOpacity
              style={styles.botonNuevo}
              onPress={() => setModalBloqueoVisible(true)}
            >
              <Icono nombre="add" size={16} color="#FFFFFF" />
              <Text style={styles.botonNuevoTexto}>Nuevo Bloqueo</Text>
            </TouchableOpacity>
          </View>

          {bloqueos.map(b => {
            const esp = espacios.find(e => e.id === b.espacioId);
            return (
              <View
                key={b.id}
                style={[styles.tarjetaItem, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tarjetaItemTitulo, { color: colores.texto }]}>
                    {esp?.nombre || b.espacioId}
                  </Text>
                  <Text style={[styles.tarjetaItemFecha, { color: Colores.advertencia }]}>
                    Fecha: {b.fecha} {b.inicio ? `(${b.inicio} a ${b.fin} hs)` : '(Jornada completa)'}
                  </Text>
                  <Text style={[styles.tarjetaItemMotivo, { color: colores.textoSecundario }]}>
                    Motivo: "{b.motivo}"
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={async () => {
                    await BloqueosServicio.eliminarBloqueo(b.id);
                    cargarDatos();
                  }}
                >
                  <Icono nombre="trash-outline" size={20} color={Colores.peligro} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* 3. SECCIÓN RESERVAS FIJAS */}
      {seccionActiva === 'fijas' && (
        <View style={styles.seccionContenido}>
          <View style={styles.filaTituloBoton}>
            <Text style={[styles.seccionTitulo, { color: colores.texto }]}>Reservas Fijas Semanales</Text>
            <TouchableOpacity
              style={styles.botonNuevo}
              onPress={() => setModalFijaVisible(true)}
            >
              <Icono nombre="add" size={16} color="#FFFFFF" />
              <Text style={styles.botonNuevoTexto}>Nueva Fija</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.explicacionFijas, { color: colores.textoSecundario }]}>
            Ocupan el turno automáticamente todas las semanas sin reserva previa manual.
          </Text>

          {fijas.map(f => {
            const esp = espacios.find(e => e.id === f.espacioId);
            const diasNombres = ['Domingos', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábados'];
            return (
              <View
                key={f.id}
                style={[styles.tarjetaItem, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}
              >
                <View>
                  <Text style={[styles.tarjetaItemTitulo, { color: colores.texto }]}>
                    {f.titular}
                  </Text>
                  <Text style={[styles.tarjetaItemFecha, { color: Colores.acento }]}>
                    {diasNombres[f.dia]} de {f.inicio} a {f.fin} hs
                  </Text>
                  <Text style={[styles.tarjetaItemMotivo, { color: colores.textoSecundario }]}>
                    {esp?.nombre || f.espacioId} • Vigente desde {f.desde}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* 4. SECCIÓN PRECIOS POR HORA */}
      {seccionActiva === 'precios' && (
        <View style={styles.seccionContenido}>
          <Text style={[styles.seccionTitulo, { color: colores.texto }]}>Modificar Precios por Hora</Text>

          <View style={[styles.formulario, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
            <Text style={[styles.label, { color: colores.texto }]}>Seleccionar Espacio Deportivo:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {espacios.map(e => (
                  <TouchableOpacity
                    key={e.id}
                    style={[
                      styles.chipEspacio,
                      {
                        backgroundColor: e.id === precioEspacioId ? Colores.primarioClaro : colores.tarjeta,
                        borderColor: e.id === precioEspacioId ? Colores.primarioClaro : colores.borde,
                      },
                    ]}
                    onPress={() => {
                      setPrecioEspacioId(e.id);
                      setNuevoPrecio(e.precioPorHora.toString());
                    }}
                  >
                    <Text style={{ color: e.id === precioEspacioId ? '#FFFFFF' : colores.texto, fontSize: 12 }}>
                      {e.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={[styles.label, { color: colores.texto }]}>Nuevo precio por hora ($):</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colores.fondo, borderColor: colores.borde, color: colores.texto }]}
              keyboardType="numeric"
              value={nuevoPrecio}
              onChangeText={setNuevoPrecio}
            />

            <TouchableOpacity style={styles.botonGuardar} onPress={handleGuardarPrecio}>
              <Text style={styles.botonGuardarTexto}>Actualizar Precio</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MODAL NUEVO BLOQUEO */}
      <Modal visible={modalBloqueoVisible} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={[styles.modalCuerpo, { backgroundColor: colores.tarjeta }]}>
            <Text style={[styles.modalTitulo, { color: colores.texto }]}>Registrar Bloqueo por Lluvia / Mantenimiento</Text>
            <Text style={[styles.label, { color: colores.texto }]}>Espacio a suspender:</Text>
            <ScrollView horizontal style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {espacios.map(e => (
                  <TouchableOpacity
                    key={e.id}
                    style={[
                      styles.chipEspacio,
                      {
                        backgroundColor: e.id === bloqueoEspacioId ? Colores.primarioClaro : colores.tarjeta,
                        borderColor: colores.borde,
                      },
                    ]}
                    onPress={() => setBloqueoEspacioId(e.id)}
                  >
                    <Text style={{ color: e.id === bloqueoEspacioId ? '#FFFFFF' : colores.texto, fontSize: 11 }}>
                      {e.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={[styles.label, { color: colores.texto }]}>Fecha (AAAA-MM-DD):</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colores.fondo, borderColor: colores.borde, color: colores.texto }]}
              value={bloqueoFecha}
              onChangeText={setBloqueoFecha}
            />

            <Text style={[styles.label, { color: colores.texto }]}>Motivo escrito obligatorio:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colores.fondo, borderColor: colores.borde, color: colores.texto, height: 70 }]}
              placeholder="Ej: Cancha anegada por lluvia torrencial."
              placeholderTextColor={colores.textoMuted}
              multiline
              value={bloqueoMotivo}
              onChangeText={setBloqueoMotivo}
            />

            <View style={styles.modalBotones}>
              <TouchableOpacity
                style={[styles.botonModal, { backgroundColor: colores.borde }]}
                onPress={() => setModalBloqueoVisible(false)}
              >
                <Text style={{ color: colores.texto, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.botonModal, { backgroundColor: Colores.peligro }]}
                onPress={handleCrearBloqueo}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Suspender Cancha</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL NUEVA FIJA */}
      <Modal visible={modalFijaVisible} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={[styles.modalCuerpo, { backgroundColor: colores.tarjeta }]}>
            <Text style={[styles.modalTitulo, { color: colores.texto }]}>Cargar Reserva Fija Semanal</Text>

            <Text style={[styles.label, { color: colores.texto }]}>Titular / Club / Grupo:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colores.fondo, borderColor: colores.borde, color: colores.texto }]}
              placeholder="Ej: Grupo de los martes"
              placeholderTextColor={colores.textoMuted}
              value={fijaTitular}
              onChangeText={setFijaTitular}
            />

            <Text style={[styles.label, { color: colores.texto }]}>Día de la semana:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {['Dom (0)', 'Lun (1)', 'Mar (2)', 'Mié (3)', 'Jue (4)', 'Vie (5)', 'Sáb (6)'].map((d, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.chipEspacio,
                    {
                      backgroundColor: fijaDia === idx ? Colores.acento : colores.tarjeta,
                      borderColor: colores.borde,
                    },
                  ]}
                  onPress={() => setFijaDia(idx)}
                >
                  <Text style={{ color: fijaDia === idx ? '#1A4D2E' : colores.texto, fontWeight: '700', fontSize: 11 }}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colores.texto }]}>Hora inicio:</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colores.fondo, borderColor: colores.borde, color: colores.texto }]}
                  value={fijaInicio}
                  onChangeText={setFijaInicio}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colores.texto }]}>Hora fin:</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colores.fondo, borderColor: colores.borde, color: colores.texto }]}
                  value={fijaFin}
                  onChangeText={setFijaFin}
                />
              </View>
            </View>

            <View style={styles.modalBotones}>
              <TouchableOpacity
                style={[styles.botonModal, { backgroundColor: colores.borde }]}
                onPress={() => setModalFijaVisible(false)}
              >
                <Text style={{ color: colores.texto, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.botonModal, { backgroundColor: Colores.primarioClaro }]}
                onPress={handleCrearFija}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Guardar Fija</Text>
              </TouchableOpacity>
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
  bannerRol: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  bannerRolTexto: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  filaBotonesRol: {
    flexDirection: 'row',
    gap: 8,
  },
  botonRol: {
    flex: 1,
    backgroundColor: '#D97706',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  botonRolTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  seccionAccionPrincipal: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  botonEscaner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colores.acento,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  botonEscanerTitulo: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A4D2E',
  },
  botonEscanerSub: {
    fontSize: 12,
    color: '#3D2D1B',
    marginTop: 2,
  },
  barraPestanas: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pestana: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pestanaActiva: {
    backgroundColor: Colores.primario,
  },
  pestanaTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  pestanaTextoActivo: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  seccionContenido: {
    padding: 16,
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  filaTituloBoton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  botonNuevo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colores.primarioClaro,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  botonNuevoTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  chipEspacio: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  tablaAgenda: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  filaAgenda: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  agendaHora: {
    width: 70,
    fontSize: 13,
    fontWeight: '700',
  },
  agendaEstado: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  agendaEstadoBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '800',
  },
  agendaMotivo: {
    fontSize: 12,
    flex: 1,
  },
  tarjetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  tarjetaItemTitulo: {
    fontSize: 15,
    fontWeight: '700',
  },
  tarjetaItemFecha: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  tarjetaItemMotivo: {
    fontSize: 12,
    marginTop: 2,
  },
  explicacionFijas: {
    fontSize: 12,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  formulario: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 14,
  },
  botonGuardar: {
    backgroundColor: Colores.primarioClaro,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  botonGuardarTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCuerpo: {
    borderRadius: 14,
    padding: 20,
  },
  modalTitulo: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 14,
  },
  modalBotones: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  botonModal: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});
