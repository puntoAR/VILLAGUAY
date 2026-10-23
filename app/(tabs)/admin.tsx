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
  Linking,
} from 'react-native';
import {
  Espacio,
  ReservaFija,
  BloqueoMantenimiento,
  Turno,
  Usuario,
  Rol,
  Reserva,
  MetricasMacro,
} from '../../src/tipos';
import { EspaciosServicio } from '../../src/servicios/espacios';
import { TurnosServicio } from '../../src/servicios/turnos';
import { BloqueosServicio } from '../../src/servicios/bloqueos';
import { ReservasFijasServicio } from '../../src/servicios/fijas';
import { ReservasServicio } from '../../src/servicios/reservas';
import { AuthServicio } from '../../src/servicios/auth';
import { esError } from '../../src/servicios/api';
import { useAuth } from '../../src/contexto/AuthContext';
import { useTema } from '../../src/contexto/ThemeContext';
import { Icono } from '../../src/componentes/Icono';
import { Colores } from '../../src/constantes/tema';
import { useRouter } from 'expo-router';

type SeccionAdmin = 'alquileres' | 'agenda' | 'bloqueos' | 'macro' | 'precios' | 'fijas' | 'personal';

export default function PantallaAdmin() {
  const { colores } = useTema();
  const { usuario, esEncargadoOAdmin, esAdmin, esEncargado, cambiarRolDemo, cerrarSesion } = useAuth();
  const router = useRouter();

  // Pestaña inicial según rol
  const [seccionActiva, setSeccionActiva] = useState<SeccionAdmin>(
    usuario?.rol === 'administrador' ? 'macro' : 'alquileres'
  );

  // Sincronizar pestaña si cambia el rol
  useEffect(() => {
    if (usuario?.rol === 'administrador') {
      if (['alquileres', 'bloqueos'].includes(seccionActiva)) {
        setSeccionActiva('macro');
      }
    } else if (usuario?.rol === 'encargado') {
      if (['macro', 'precios', 'fijas', 'personal'].includes(seccionActiva)) {
        setSeccionActiva('alquileres');
      }
    }
  }, [usuario?.rol]);

  // Datos operativos del predio (Encargado)
  const [alquileres, setAlquileres] = useState<Reserva[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [bloqueos, setBloqueos] = useState<BloqueoMantenimiento[]>([]);
  const [turnosAgenda, setTurnosAgenda] = useState<Turno[]>([]);
  const [espacioAgendaId, setEspacioAgendaId] = useState<string>('esp-01');

  // Datos macro y estratégicos (Director)
  const [metricas, setMetricas] = useState<MetricasMacro | null>(null);
  const [fijas, setFijas] = useState<ReservaFija[]>([]);
  const [precioEspacioId, setPrecioEspacioId] = useState('esp-01');
  const [nuevoPrecio, setNuevoPrecio] = useState('12000');
  const [personal, setPersonal] = useState<Usuario[]>([]);

  // Modales
  const [modalBloqueoVisible, setModalBloqueoVisible] = useState(false);
  const [bloqueoEspacioId, setBloqueoEspacioId] = useState('esp-01');
  const [bloqueoFecha, setBloqueoFecha] = useState(new Date().toISOString().split('T')[0]);
  const [bloqueoMotivo, setBloqueoMotivo] = useState('');

  const [modalFijaVisible, setModalFijaVisible] = useState(false);
  const [fijaEspacioId, setFijaEspacioId] = useState('esp-02');
  const [fijaTitular, setFijaTitular] = useState('');
  const [fijaDia, setFijaDia] = useState<number>(2);
  const [fijaInicio, setFijaInicio] = useState('21:00');
  const [fijaFin, setFijaFin] = useState('22:00');

  const [modalPersonalVisible, setModalPersonalVisible] = useState(false);
  const [personalNombre, setPersonalNombre] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [personalTelefono, setPersonalTelefono] = useState('3455-');
  const [personalPassword, setPersonalPassword] = useState('123456');
  const [personalRol, setPersonalRol] = useState<Rol>('encargado');
  const [filtroRolPersonal, setFiltroRolPersonal] = useState<'todos' | 'administrador' | 'encargado' | 'jugador'>('todos');
  const [creandoPersonal, setCreandoPersonal] = useState(false);

  const cargarDatos = async () => {
    // Espacios comunes
    const respEsp = await EspaciosServicio.obtenerEspacios();
    if (!esError(respEsp)) {
      setEspacios(respEsp.datos);
      if (respEsp.datos.length > 0 && !espacioAgendaId) {
        setEspacioAgendaId(respEsp.datos[0].id);
      }
    }

    // Datos del encargado
    const respAlq = await ReservasServicio.obtenerAlquileresPredio();
    if (!esError(respAlq)) {
      setAlquileres(respAlq.datos);
    }

    const respBloq = await BloqueosServicio.obtenerBloqueos();
    if (!esError(respBloq)) {
      setBloqueos(respBloq.datos);
    }

    // Datos del director de deportes
    const respMet = await ReservasServicio.obtenerMetricasMacro();
    if (!esError(respMet)) {
      setMetricas(respMet.datos);
    }

    const respFij = await ReservasFijasServicio.obtenerFijas();
    if (!esError(respFij)) {
      setFijas(respFij.datos);
    }

    AuthServicio.obtenerTodosLosUsuarios().then(setPersonal);
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

  // Acción de cobro en puerta para el encargado
  const handleCambiarPago = async (reserva: Reserva) => {
    const nuevoEstado = reserva.estadoPago === 'pagado' ? 'pendiente' : 'pagado';
    const resp = await ReservasServicio.cambiarEstadoPago(reserva.id, nuevoEstado);
    if (!esError(resp)) {
      Alert.alert(
        nuevoEstado === 'pagado' ? '¡Cobro Registrado!' : 'Cobro Revertido',
        nuevoEstado === 'pagado'
          ? `Se cobraron $${(reserva.montoTotal || 12000).toLocaleString('es-AR')} a ${reserva.nombreUsuario || 'el vecino'}.`
          : 'El estado se devolvió a pendiente de cobro.'
      );
      cargarDatos();
    } else {
      Alert.alert('Error', resp.error.mensaje);
    }
  };

  // Escanear puerta con autenticación biométrica previa
  const abrirEscanerConBiometria = async () => {
    const auth = await AuthServicio.autenticarConBiometria(
      'Validar identidad con huella o rostro para operar el escáner de puerta'
    );
    if (auth.exito) {
      router.push('/escaner' as any);
    } else {
      Alert.alert('Autenticación biométrica', auth.mensajeError || 'No se pudo verificar la huella.');
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
      inicio: null,
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

  const handleCrearPersonal = async () => {
    if (!personalNombre.trim() || !personalEmail.trim() || !personalPassword.trim()) {
      Alert.alert('Datos incompletos', 'Nombre, email y contraseña son obligatorios.');
      return;
    }

    setCreandoPersonal(true);
    try {
      const resp = await AuthServicio.crearUsuarioPorAdmin(
        {
          nombre: personalNombre.trim(),
          email: personalEmail.trim().toLowerCase(),
          telefono: personalTelefono.trim(),
          password: personalPassword,
          rol: personalRol,
        },
        usuario?.rol
      );

      if (!esError(resp)) {
        Alert.alert(
          '¡Usuario Creado Exitosamente! 🎉',
          `Se dio de alta a ${resp.datos.nombre} con el rol ${resp.datos.rol.toUpperCase()}. Ya puede iniciar sesión en la aplicación.`
        );
        setModalPersonalVisible(false);
        setPersonalNombre('');
        setPersonalEmail('');
        setPersonalTelefono('3455-');
        setPersonalPassword('123456');
        cargarDatos();
      } else {
        Alert.alert('No se pudo crear el usuario', resp.error.mensaje);
      }
    } finally {
      setCreandoPersonal(false);
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

  // Si no es encargado ni admin (ej. jugador o sin sesión)
  if (!esEncargadoOAdmin) {
    return (
      <ScrollView style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
        <View style={[styles.tarjetaRestringida, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
          <Icono nombre="lock-closed" size={48} color={Colores.peligro} />
          <Text style={[styles.tituloRestringido, { color: colores.texto }]}>
            Acceso Exclusivo para Personal Municipal
          </Text>
          <Text style={[styles.subtituloRestringido, { color: colores.textoSecundario }]}>
            Esta sección está reservada para el personal de administración y encargados del predio (DAMIAN G, Maria Agustina García, Maria Agostina García).
          </Text>

          <View style={styles.cajaDemoSwitch}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colores.texto, marginBottom: 8 }}>
              Modo Demostración / Pruebas:
            </Text>
            <TouchableOpacity
              style={[styles.botonDemo, { backgroundColor: '#1A4D2E' }]}
              onPress={() => cambiarRolDemo('encargado')}
            >
              <Icono nombre="id-card" size={18} color="#FFFFFF" />
              <Text style={styles.botonDemoTexto}>Probar como Encargado (DAMIAN G / Agustina)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.botonDemo, { backgroundColor: '#D97706', marginTop: 8 }]}
              onPress={() => cambiarRolDemo('administrador')}
            >
              <Icono nombre="shield-checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.botonDemoTexto}>Probar como María Agostina (Dir. Deportes)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      {/* Barra de cabecera con perfil actual y selector de cambio rápido */}
      <View style={[styles.barraCabeceraRol, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icono
              nombre={esAdmin ? 'shield-checkmark' : 'id-card'}
              size={18}
              color={esAdmin ? '#D97706' : Colores.primarioClaro}
            />
            <Text style={[styles.tituloRolActual, { color: colores.texto }]}>
              {esAdmin ? 'Dirección de Deportes' : 'Encargado de Predio'}
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: colores.textoSecundario }}>
            Usuario: {usuario?.nombre} ({usuario?.rol?.toUpperCase()})
          </Text>
        </View>

        {/* Controles rápidos de rol y sesión */}
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <TouchableOpacity
            style={[
              styles.botonAlternarDemo,
              { backgroundColor: esAdmin ? 'rgba(26,77,46,0.1)' : 'rgba(217,119,6,0.1)' },
            ]}
            onPress={() => cambiarRolDemo(esAdmin ? 'encargado' : 'administrador')}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: esAdmin ? Colores.primario : '#D97706',
              }}
            >
              {esAdmin ? 'Ver como Encargado' : 'Ver como Director'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.botonAlternarDemo, { backgroundColor: 'rgba(220,38,38,0.12)' }]}
            onPress={async () => {
              Alert.alert('Cerrar Sesión', '¿Deseás salir de tu cuenta?', [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Salir',
                  style: 'destructive',
                  onPress: async () => {
                    await cerrarSesion();
                    router.replace('/login');
                  },
                },
              ]);
            }}
          >
            <Icono nombre="log-out-outline" size={14} color={Colores.peligro} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: Colores.peligro }}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ------------------------------------------------------------- */}
      {/* 1. SECCIÓN EXCLUSIVA ENCARGADO: BOTÓN BIOMÉTRICO ESCÁNER PUERTA */}
      {/* ------------------------------------------------------------- */}
      {esEncargado && (
        <View style={styles.seccionAccionPrincipal}>
          <TouchableOpacity
            style={styles.botonEscaner}
            activeOpacity={0.85}
            onPress={abrirEscanerConBiometria}
          >
            <Icono nombre="qr-code" size={28} color="#1A4D2E" />
            <View style={{ flex: 1 }}>
              <Text style={styles.botonEscanerTitulo}>Control de Ingreso en Puerta</Text>
              <Text style={styles.botonEscanerSub}>Escanear código QR de la reserva (con huella dactilar)</Text>
            </View>
            <Icono nombre="finger-print-outline" size={26} color="#1A4D2E" />
          </TouchableOpacity>
        </View>
      )}

      {/* ------------------------------------------------------------- */}
      {/* BARRA DE PESTAÑAS SEGREGADA POR ROL */}
      {/* ------------------------------------------------------------- */}
      <View style={[styles.barraPestanas, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
        {esEncargado ? (
          <>
            <TouchableOpacity
              style={[styles.pestana, seccionActiva === 'alquileres' && styles.pestanaActiva]}
              onPress={() => setSeccionActiva('alquileres')}
            >
              <Text style={[styles.pestanaTexto, seccionActiva === 'alquileres' && styles.pestanaTextoActivo]}>
                Alquileres ({alquileres.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pestana, seccionActiva === 'agenda' && styles.pestanaActiva]}
              onPress={() => setSeccionActiva('agenda')}
            >
              <Text style={[styles.pestanaTexto, seccionActiva === 'agenda' && styles.pestanaTextoActivo]}>
                Agenda Hoy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pestana, seccionActiva === 'bloqueos' && styles.pestanaActiva]}
              onPress={() => setSeccionActiva('bloqueos')}
            >
              <Text style={[styles.pestanaTexto, seccionActiva === 'bloqueos' && styles.pestanaTextoActivo]}>
                Lluvia / Mant.
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.pestana, seccionActiva === 'macro' && styles.pestanaActiva]}
              onPress={() => setSeccionActiva('macro')}
            >
              <Text style={[styles.pestanaTexto, seccionActiva === 'macro' && styles.pestanaTextoActivo]}>
                Tablero Macro
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pestana, seccionActiva === 'precios' && styles.pestanaActiva]}
              onPress={() => setSeccionActiva('precios')}
            >
              <Text style={[styles.pestanaTexto, seccionActiva === 'precios' && styles.pestanaTextoActivo]}>
                Tarifas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pestana, seccionActiva === 'fijas' && styles.pestanaActiva]}
              onPress={() => setSeccionActiva('fijas')}
            >
              <Text style={[styles.pestanaTexto, seccionActiva === 'fijas' && styles.pestanaTextoActivo]}>
                Fijas Clubes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pestana, seccionActiva === 'personal' && styles.pestanaActiva]}
              onPress={() => setSeccionActiva('personal')}
            >
              <Text style={[styles.pestanaTexto, seccionActiva === 'personal' && styles.pestanaTextoActivo]}>
                Personal ({personal.length})
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ============================================================= */}
      {/* ROL ENCARGADO: 1. QUIÉNES ALQUILARON & COBRO EN PUERTA */}
      {/* ============================================================= */}
      {esEncargado && seccionActiva === 'alquileres' && (
        <View style={styles.seccionContenido}>
          <View style={styles.filaTituloBoton}>
            <View>
              <Text style={[styles.seccionTitulo, { color: colores.texto }]}>Quiénes Alquilaron</Text>
              <Text style={{ color: colores.textoSecundario, fontSize: 12 }}>
                Control de jugadores, canon nocturno y cobro en puerta
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.botonRefrescar, { borderColor: colores.borde }]}
              onPress={cargarDatos}
            >
              <Icono nombre="refresh" size={16} color={colores.texto} />
            </TouchableOpacity>
          </View>

          {alquileres.length === 0 ? (
            <View style={[styles.tarjetaItem, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
              <Text style={{ color: colores.textoSecundario, textAlign: 'center', width: '100%', padding: 12 }}>
                No hay alquileres activos registrados por el momento.
              </Text>
            </View>
          ) : (
            alquileres.map(r => {
              const estaPagado = r.estadoPago === 'pagado';
              const monto = r.montoTotal || 12000;
              const esp = espacios.find(e => e.id === r.espacioId);

              return (
                <View
                  key={r.id}
                  style={[
                    styles.tarjetaAlquiler,
                    {
                      backgroundColor: colores.tarjeta,
                      borderColor: estaPagado ? '#86EFAC' : '#FDE68A',
                    },
                  ]}
                >
                  {/* Encabezado del alquiler */}
                  <View style={styles.alquilerEncabezado}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.alquilerNombreEspacio, { color: colores.texto }]}>
                        {r.nombreEspacio || esp?.nombre || `Espacio ${r.espacioId}`}
                      </Text>
                      <Text style={{ fontSize: 12, color: Colores.primarioClaro, fontWeight: '700' }}>
                        Turno: {r.turnoId.split('-').pop()}:00 hs • {r.cantidadPersonas} jugadores
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.badgePagoMini,
                        {
                          backgroundColor: estaPagado ? '#DCFCE7' : '#FEF3C7',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgePagoMiniTexto,
                          { color: estaPagado ? '#166534' : '#92400E' },
                        ]}
                      >
                        {estaPagado ? '✅ PAGADO' : '⏳ PENDIENTE'}
                      </Text>
                    </View>
                  </View>

                  {/* Datos del titular */}
                  <View style={styles.alquilerFilaTitular}>
                    <Icono nombre="person-outline" size={16} color={colores.textoSecundario} />
                    <Text style={[styles.alquilerTitularTexto, { color: colores.texto }]}>
                      Titular: <Text style={{ fontWeight: '700' }}>{r.nombreUsuario || 'Vecino / Jugador'}</Text>
                    </Text>
                  </View>

                  {/* Teléfono para contacto rápido */}
                  {r.telefonoUsuario ? (
                    <TouchableOpacity
                      style={styles.alquilerFilaTelefono}
                      onPress={() => Linking.openURL(`tel:${r.telefonoUsuario}`)}
                    >
                      <Icono nombre="call-outline" size={15} color={Colores.primarioClaro} />
                      <Text style={{ color: Colores.primarioClaro, fontSize: 13, fontWeight: '600' }}>
                        {r.telefonoUsuario} (Tocar para llamar)
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  {/* Iluminación y monto */}
                  <View style={styles.alquilerFilaDetalles}>
                    <View style={styles.alquilerChipLuz}>
                      <Icono
                        nombre={r.conLuz ? 'bulb' : 'sunny-outline'}
                        size={15}
                        color={r.conLuz ? '#D97706' : Colores.primarioClaro}
                      />
                      <Text style={{ fontSize: 12, fontWeight: '600', color: r.conLuz ? '#D97706' : colores.textoSecundario }}>
                        {r.conLuz ? 'Con Iluminación' : 'Luz Solar'}
                      </Text>
                    </View>

                    <Text style={[styles.alquilerMontoTexto, { color: colores.texto }]}>
                      Total: <Text style={{ fontWeight: '800', color: Colores.primario }}>${monto.toLocaleString('es-AR')}</Text>
                    </Text>
                  </View>

                  {/* Botón de Cobro en Puerta */}
                  <TouchableOpacity
                    style={[
                      styles.botonCobroPuerta,
                      {
                        backgroundColor: estaPagado ? 'rgba(22, 101, 52, 0.12)' : '#F59E0B',
                        borderColor: estaPagado ? '#166534' : '#D97706',
                      },
                    ]}
                    onPress={() => handleCambiarPago(r)}
                  >
                    <Icono
                      nombre={estaPagado ? 'checkmark-circle' : 'cash-outline'}
                      size={18}
                      color={estaPagado ? '#166534' : '#FFFFFF'}
                    />
                    <Text
                      style={[
                        styles.botonCobroPuertaTexto,
                        { color: estaPagado ? '#166534' : '#FFFFFF' },
                      ]}
                    >
                      {estaPagado
                        ? 'Cobrado en Puerta (Tocar para revertir)'
                        : `Marcar como Cobrado ($${monto.toLocaleString('es-AR')})`}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* ============================================================= */}
      {/* ROL ENCARGADO: 2. AGENDA DE HOY */}
      {/* ============================================================= */}
      {esEncargado && seccionActiva === 'agenda' && (
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

      {/* ============================================================= */}
      {/* ROL ENCARGADO: 3. SUSPENSIONES POR LLUVIA / MANTENIMIENTO */}
      {/* ============================================================= */}
      {esEncargado && seccionActiva === 'bloqueos' && (
        <View style={styles.seccionContenido}>
          <View style={styles.filaTituloBoton}>
            <Text style={[styles.seccionTitulo, { color: colores.texto }]}>Bloqueos por Lluvia / Mant.</Text>
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

      {/* ============================================================= */}
      {/* ROL DIRECTOR: 1. TABLERO MACRO ESTRATÉGICO */}
      {/* ============================================================= */}
      {esAdmin && seccionActiva === 'macro' && (
        <View style={styles.seccionContenido}>
          <View style={styles.filaTituloBoton}>
            <View>
              <Text style={[styles.seccionTitulo, { color: colores.texto }]}>Tablero de Gestión Macro</Text>
              <Text style={{ color: colores.textoSecundario, fontSize: 12 }}>
                Métricas integradas de la Dirección de Deportes de Villaguay
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.botonRefrescar, { borderColor: colores.borde }]}
              onPress={cargarDatos}
            >
              <Icono nombre="refresh" size={16} color={colores.texto} />
            </TouchableOpacity>
          </View>

          {/* Grilla de 4 KPIs principales */}
          <View style={styles.grillaKpi}>
            <View style={[styles.tarjetaKpi, { backgroundColor: colores.tarjeta, borderColor: '#86EFAC' }]}>
              <Icono nombre="cash-outline" size={24} color="#16A34A" />
              <Text style={[styles.valorKpi, { color: '#16A34A' }]}>
                ${(metricas?.recaudacionCobrada || 0).toLocaleString('es-AR')}
              </Text>
              <Text style={[styles.etiquetaKpi, { color: colores.textoSecundario }]}>Recaudación Cobrada</Text>
            </View>

            <View style={[styles.tarjetaKpi, { backgroundColor: colores.tarjeta, borderColor: '#FDE68A' }]}>
              <Icono nombre="time-outline" size={24} color="#D97706" />
              <Text style={[styles.valorKpi, { color: '#D97706' }]}>
                ${(metricas?.recaudacionPendiente || 0).toLocaleString('es-AR')}
              </Text>
              <Text style={[styles.etiquetaKpi, { color: colores.textoSecundario }]}>Pendiente en Puerta</Text>
            </View>

            <View style={[styles.tarjetaKpi, { backgroundColor: colores.tarjeta, borderColor: '#93C5FD' }]}>
              <Icono nombre="stats-chart" size={24} color="#2563EB" />
              <Text style={[styles.valorKpi, { color: '#2563EB' }]}>
                {metricas?.tasaOcupacion || 78}%
              </Text>
              <Text style={[styles.etiquetaKpi, { color: colores.textoSecundario }]}>Ocupación Media</Text>
            </View>

            <View style={[styles.tarjetaKpi, { backgroundColor: colores.tarjeta, borderColor: '#C4B5FD' }]}>
              <Icono nombre="calendar-outline" size={24} color="#7C3AED" />
              <Text style={[styles.valorKpi, { color: '#7C3AED' }]}>
                {metricas?.totalReservas || 0}
              </Text>
              <Text style={[styles.etiquetaKpi, { color: colores.textoSecundario }]}>Reservas del Mes</Text>
            </View>
          </View>

          {/* Demanda por Disciplina Deportiva */}
          <View style={[styles.cajaMacro, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
            <Text style={[styles.subtituloMacro, { color: colores.texto }]}>
              Distribución por Disciplina Deportiva
            </Text>
            {metricas?.reservasPorDeporte.map((dep, idx) => (
              <View key={idx} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colores.texto }}>{dep.deporte}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: dep.color }}>{dep.cantidad} turnos</Text>
                </View>
                <View style={[styles.barraProgresoFondo, { backgroundColor: colores.fondo }]}>
                  <View
                    style={[
                      styles.barraProgresoRelleno,
                      {
                        backgroundColor: dep.color,
                        width: `${Math.min(100, (dep.cantidad / 25) * 100)}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Ranking de Canchas Más Solicitadas */}
          <View style={[styles.cajaMacro, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
            <Text style={[styles.subtituloMacro, { color: colores.texto }]}>
              Ranking de Espacios con Mayor Demanda
            </Text>
            {metricas?.rankingEspacios.map((rk, idx) => (
              <View key={idx} style={styles.filaRanking}>
                <View
                  style={[
                    styles.medallaPosicion,
                    {
                      backgroundColor:
                        idx === 0 ? '#F59E0B' : idx === 1 ? '#94A3B8' : idx === 2 ? '#B45309' : Colores.primario,
                    },
                  ]}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>#{idx + 1}</Text>
                </View>
                <Text style={[styles.nombreRanking, { color: colores.texto }]}>{rk.nombre}</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: Colores.primarioClaro }}>
                  {rk.reservas} usos
                </Text>
              </View>
            ))}
          </View>

          {/* Balance de Sanciones y Cancelaciones */}
          <View style={[styles.cajaMacro, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
            <Text style={[styles.subtituloMacro, { color: colores.texto }]}>
              Control de Convivencia y Cancelaciones
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.tarjetaMiniBalance, { backgroundColor: colores.fondo }]}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: Colores.advertencia }}>
                  {metricas?.totalCanceladas || 0}
                </Text>
                <Text style={{ fontSize: 11, color: colores.textoSecundario }}>Cancelaciones con aviso</Text>
              </View>
              <View style={[styles.tarjetaMiniBalance, { backgroundColor: colores.fondo }]}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: Colores.peligro }}>
                  {metricas?.totalAusentes || 0}
                </Text>
                <Text style={{ fontSize: 11, color: colores.textoSecundario }}>Ausencias sin aviso (sanción)</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ============================================================= */}
      {/* ROL DIRECTOR: 2. TARIFAS Y PRECIOS POR HORA */}
      {/* ============================================================= */}
      {esAdmin && seccionActiva === 'precios' && (
        <View style={styles.seccionContenido}>
          <Text style={[styles.seccionTitulo, { color: colores.texto }]}>Tarifas y Precios por Hora</Text>

          <View style={[styles.formulario, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
            <Text style={[styles.label, { color: colores.texto }]}>Seleccionar Cancha o Espacio:</Text>
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
              <Text style={styles.botonGuardarTexto}>Actualizar Tarifa Municipal</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ============================================================= */}
      {/* ROL DIRECTOR: 3. RESERVAS FIJAS DE CLUBES Y CONVENIOS */}
      {/* ============================================================= */}
      {esAdmin && seccionActiva === 'fijas' && (
        <View style={styles.seccionContenido}>
          <View style={styles.filaTituloBoton}>
            <Text style={[styles.seccionTitulo, { color: colores.texto }]}>Convenios y Reservas Fijas</Text>
            <TouchableOpacity
              style={styles.botonNuevo}
              onPress={() => setModalFijaVisible(true)}
            >
              <Icono nombre="add" size={16} color="#FFFFFF" />
              <Text style={styles.botonNuevoTexto}>Nueva Fija</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.explicacionFijas, { color: colores.textoSecundario }]}>
            Acuerdos institucionales con clubes y asociaciones locales de Villaguay.
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

      {/* ============================================================= */}
      {/* ROL DIRECTOR: 4. GESTIÓN DE PERSONAL Y USUARIOS */}
      {/* ============================================================= */}
      {esAdmin && seccionActiva === 'personal' && (
        <View style={styles.seccionContenido}>
          <View style={styles.filaTituloBoton}>
            <View>
              <Text style={[styles.seccionTitulo, { color: colores.texto }]}>Usuarios y Personal del Sistema</Text>
              <Text style={{ color: colores.textoSecundario, fontSize: 12 }}>
                Gestión autorizada de administradores, encargados y jugadores
              </Text>
            </View>
            <TouchableOpacity
              style={styles.botonNuevo}
              onPress={() => setModalPersonalVisible(true)}
            >
              <Icono nombre="person-add-outline" size={16} color="#FFFFFF" />
              <Text style={styles.botonNuevoTexto}>+ Alta Usuario</Text>
            </TouchableOpacity>
          </View>

          {/* Filtros de roles para la lista */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[
                { id: 'todos', label: `Todos (${personal.length})` },
                { id: 'administrador', label: `Directores (${personal.filter(p => p.rol === 'administrador').length})` },
                { id: 'encargado', label: `Encargados (${personal.filter(p => p.rol === 'encargado').length})` },
                { id: 'jugador', label: `Jugadores (${personal.filter(p => p.rol === 'jugador').length})` },
              ].map(f => {
                const activo = filtroRolPersonal === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[
                      styles.chipEspacio,
                      {
                        backgroundColor: activo ? Colores.primarioClaro : colores.tarjeta,
                        borderColor: activo ? Colores.primarioClaro : colores.borde,
                      },
                    ]}
                    onPress={() => setFiltroRolPersonal(f.id as any)}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: activo ? '#FFFFFF' : colores.texto }}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {personal
            .filter(p => filtroRolPersonal === 'todos' || p.rol === filtroRolPersonal)
            .map(p => {
              const esAdminUser = p.rol === 'administrador';
              const esEncargadoUser = p.rol === 'encargado';
              let iconoRol = 'football-outline';
              let colorRol = Colores.primario;
              let badgeBg = 'rgba(26, 77, 46, 0.15)';

              if (esAdminUser) {
                iconoRol = 'shield-checkmark';
                colorRol = '#D97706';
                badgeBg = 'rgba(217, 119, 6, 0.15)';
              } else if (esEncargadoUser) {
                iconoRol = 'id-card';
                colorRol = Colores.secundario;
                badgeBg = 'rgba(232, 170, 66, 0.2)';
              }

              return (
                <View
                  key={p.id}
                  style={[
                    styles.tarjetaPersonal,
                    { backgroundColor: colores.tarjeta, borderColor: colores.borde },
                  ]}
                >
                  <View style={[styles.avatarPersonal, { backgroundColor: colorRol + '20' }]}>
                    <Icono
                      nombre={iconoRol}
                      size={24}
                      color={colorRol}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={[styles.nombrePersonal, { color: colores.texto }]}>{p.nombre}</Text>
                      <View
                        style={[
                          styles.badgeMiniRol,
                          { backgroundColor: badgeBg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeMiniRolTexto,
                            { color: colorRol },
                          ]}
                        >
                          {p.rol.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: colores.textoSecundario, fontSize: 12, marginTop: 2 }}>{p.email}</Text>
                    {p.telefono ? (
                      <Text style={{ color: colores.textoMuted, fontSize: 11, marginTop: 1 }}>
                        📞 {p.telefono}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
        </View>
      )}

      {/* ============================================================= */}
      {/* MODAL NUEVO BLOQUEO */}
      {/* ============================================================= */}
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

      {/* ============================================================= */}
      {/* MODAL NUEVA FIJA */}
      {/* ============================================================= */}
      <Modal visible={modalFijaVisible} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={[styles.modalCuerpo, { backgroundColor: colores.tarjeta }]}>
            <Text style={[styles.modalTitulo, { color: colores.texto }]}>Cargar Reserva Fija Semanal</Text>

            <Text style={[styles.label, { color: colores.texto }]}>Titular / Club / Grupo:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colores.fondo, borderColor: colores.borde, color: colores.texto }]}
              placeholder="Ej: Club Atlético Sarmiento"
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

      {/* ============================================================= */}
      {/* MODAL NUEVO PERSONAL (SOLO DIRECTOR DE DEPORTES) */}
      {/* ============================================================= */}
      <Modal visible={modalPersonalVisible} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={[styles.modalCuerpo, { backgroundColor: colores.tarjeta }]}>
            <Text style={[styles.modalTitulo, { color: colores.texto }]}>Alta de Nuevo Usuario / Personal</Text>
            <Text style={{ fontSize: 12, color: colores.textoSecundario, marginBottom: 12 }}>
              Como Administrador autenticado, tenés facultades para generar nuevos administradores, encargados y jugadores.
            </Text>

            <Text style={[styles.label, { color: colores.texto }]}>Rol a Asignar:</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
              <TouchableOpacity
                style={[
                  styles.chipRolModal,
                  {
                    flex: 1,
                    backgroundColor: personalRol === 'administrador' ? '#D97706' : colores.tarjeta,
                    borderColor: personalRol === 'administrador' ? '#D97706' : colores.borde,
                  },
                ]}
                onPress={() => setPersonalRol('administrador')}
              >
                <Icono
                  nombre="shield-checkmark"
                  size={15}
                  color={personalRol === 'administrador' ? '#FFFFFF' : '#D97706'}
                />
                <Text
                  style={[
                    styles.chipRolModalTexto,
                    { color: personalRol === 'administrador' ? '#FFFFFF' : colores.texto, fontSize: 11 },
                  ]}
                >
                  Admin
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chipRolModal,
                  {
                    flex: 1,
                    backgroundColor: personalRol === 'encargado' ? Colores.secundario : colores.tarjeta,
                    borderColor: personalRol === 'encargado' ? Colores.secundario : colores.borde,
                  },
                ]}
                onPress={() => setPersonalRol('encargado')}
              >
                <Icono
                  nombre="id-card"
                  size={15}
                  color={personalRol === 'encargado' ? '#FFFFFF' : Colores.secundario}
                />
                <Text
                  style={[
                    styles.chipRolModalTexto,
                    { color: personalRol === 'encargado' ? '#FFFFFF' : colores.texto, fontSize: 11 },
                  ]}
                >
                  Encargado
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chipRolModal,
                  {
                    flex: 1,
                    backgroundColor: personalRol === 'jugador' ? Colores.primarioClaro : colores.tarjeta,
                    borderColor: personalRol === 'jugador' ? Colores.primarioClaro : colores.borde,
                  },
                ]}
                onPress={() => setPersonalRol('jugador')}
              >
                <Icono
                  nombre="football-outline"
                  size={15}
                  color={personalRol === 'jugador' ? '#FFFFFF' : Colores.primarioClaro}
                />
                <Text
                  style={[
                    styles.chipRolModalTexto,
                    { color: personalRol === 'jugador' ? '#FFFFFF' : colores.texto, fontSize: 11 },
                  ]}
                >
                  Jugador
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colores.texto }]}>Nombre completo:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colores.fondo, borderColor: colores.borde, color: colores.texto }]}
              placeholder="Ej: Marcelo Gómez"
              placeholderTextColor={colores.textoMuted}
              value={personalNombre}
              onChangeText={setPersonalNombre}
            />

            <Text style={[styles.label, { color: colores.texto }]}>Email institucional:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colores.fondo, borderColor: colores.borde, color: colores.texto }]}
              placeholder="Ej: marcelo@villaguay.gob.ar"
              placeholderTextColor={colores.textoMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={personalEmail}
              onChangeText={setPersonalEmail}
            />

            <Text style={[styles.label, { color: colores.texto }]}>Teléfono de contacto:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colores.fondo, borderColor: colores.borde, color: colores.texto }]}
              placeholder="Ej: 3455-401122"
              placeholderTextColor={colores.textoMuted}
              keyboardType="phone-pad"
              value={personalTelefono}
              onChangeText={setPersonalTelefono}
            />

            <Text style={[styles.label, { color: colores.texto }]}>Contraseña de acceso:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colores.fondo, borderColor: colores.borde, color: colores.texto }]}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={colores.textoMuted}
              secureTextEntry
              value={personalPassword}
              onChangeText={setPersonalPassword}
            />

            <View style={styles.modalBotones}>
              <TouchableOpacity
                style={[styles.botonModal, { backgroundColor: colores.borde }]}
                onPress={() => setModalPersonalVisible(false)}
                disabled={creandoPersonal}
              >
                <Text style={{ color: colores.texto, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.botonModal, { backgroundColor: Colores.primario }]}
                onPress={handleCrearPersonal}
                disabled={creandoPersonal}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
                  {creandoPersonal ? 'Creando...' : 'Crear Usuario'}
                </Text>
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
  tarjetaRestringida: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  tituloRestringido: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtituloRestringido: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  cajaDemoSwitch: {
    width: '100%',
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    paddingTop: 16,
  },
  botonDemo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  botonDemoTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  barraCabeceraRol: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tituloRolActual: {
    fontSize: 14,
    fontWeight: '800',
  },
  botonAlternarDemo: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
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
    marginTop: 14,
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
    fontSize: 11,
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
    marginBottom: 4,
  },
  filaTituloBoton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  botonRefrescar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarjetaAlquiler: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  alquilerEncabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  alquilerNombreEspacio: {
    fontSize: 15,
    fontWeight: '700',
  },
  badgePagoMini: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePagoMiniTexto: {
    fontSize: 10,
    fontWeight: '800',
  },
  alquilerFilaTitular: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alquilerTitularTexto: {
    fontSize: 13,
  },
  alquilerFilaTelefono: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  alquilerFilaDetalles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  alquilerChipLuz: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  alquilerMontoTexto: {
    fontSize: 13,
  },
  botonCobroPuerta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  botonCobroPuertaTexto: {
    fontSize: 13,
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
  grillaKpi: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  tarjetaKpi: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  valorKpi: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  etiquetaKpi: {
    fontSize: 11,
    fontWeight: '600',
  },
  cajaMacro: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  subtituloMacro: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  barraProgresoFondo: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barraProgresoRelleno: {
    height: '100%',
    borderRadius: 4,
  },
  filaRanking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  medallaPosicion: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombreRanking: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  tarjetaMiniBalance: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
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
  tarjetaPersonal: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  avatarPersonal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26, 77, 46, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombrePersonal: {
    fontSize: 14,
    fontWeight: '700',
  },
  badgeMiniRol: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeMiniRolTexto: {
    fontSize: 10,
    fontWeight: '800',
  },
  chipRolModal: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  chipRolModalActivo: {
    backgroundColor: Colores.primario,
    borderColor: Colores.primario,
  },
  chipRolModalTexto: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipRolModalTextoActivo: {
    fontWeight: '700',
  },
});
