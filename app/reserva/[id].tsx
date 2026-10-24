import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { useTema } from '../../src/contexto/ThemeContext';
import { useAuth } from '../../src/contexto/AuthContext';
import { ReservasServicio } from '../../src/servicios/reservas';
import { EspaciosServicio } from '../../src/servicios/espacios';
import { esError } from '../../src/servicios/api';
import { Reserva, Espacio } from '../../src/tipos';
import { EstadoCarga } from '../../src/componentes/EstadoCarga';
import { EstadoError } from '../../src/componentes/EstadoError';
import { Icono } from '../../src/componentes/Icono';
import { Colores } from '../../src/constantes/tema';
import { Haptica } from '../../src/servicios/haptica';

export default function PantallaDetalleReserva() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colores } = useTema();
  const { usuario } = useAuth();

  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [espacio, setEspacio] = useState<Espacio | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  const cargarDatos = async () => {
    if (!id) return;
    setCargando(true);
    setErrorMensaje(null);

    const respReserva = await ReservasServicio.obtenerReservaPorId(id);
    if (esError(respReserva)) {
      setErrorMensaje(respReserva.error.mensaje);
      setCargando(false);
      return;
    }

    setReserva(respReserva.datos);

    const respEspacio = await EspaciosServicio.obtenerEspacioPorId(respReserva.datos.espacioId);
    if (!esError(respEspacio)) {
      setEspacio(respEspacio.datos);
    }

    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const abrirMapa = () => {
    if (!espacio) return;
    const { latitud, longitud } = espacio.coordenadas;
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(espacio.nombre)}@${latitud},${longitud}`,
      android: `geo:0,0?q=${latitud},${longitud}(${encodeURIComponent(espacio.nombre)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}`,
    });
    Linking.openURL(url as string).catch(() => {
      Alert.alert('Ubicación', `Coordenadas: ${latitud}, ${longitud}`);
    });
  };

  const ejecutarCancelacion = async () => {
    if (!reserva || !usuario) return;

    const limiteCancelacion = new Date(reserva.cancelableHasta).getTime();
    const ahora = new Date().getTime();
    const esTardia = ahora > limiteCancelacion;

    const mensajeAdvertencia = esTardia
      ? 'Faltan menos de 4 horas para el inicio del turno. Esta acción quedará registrada como CANCELACIÓN TARDÍA en tu legajo deportivo municipal. ¿Confirmás la cancelación?'
      : '¿Estás seguro de que deseas cancelar este turno? Se liberará inmediatamente para otros deportistas.';

    const ejecutarCancelacion = async () => {
      const resp = await ReservasServicio.cancelarReserva(reserva.id, usuario.id);
      if (esError(resp)) {
        Alert.alert('Error', resp.error.mensaje);
        return;
      }

      await Haptica.seleccionSuave();
      if (Platform.OS === 'web') {
        alert(
          resp.datos.cancelacionTardia
            ? 'El turno fue cancelado y se registró la penalización por cancelación tardía.'
            : 'El turno fue cancelado correctamente sin penalizaciones.'
        );
        router.replace('/(tabs)/mis-reservas' as any);
        return;
      }

      Alert.alert(
        'Turno cancelado',
        resp.datos.cancelacionTardia
          ? 'El turno fue cancelado y se registró la penalización por cancelación tardía.'
          : 'El turno fue cancelado correctamente sin penalizaciones.',
        [{ text: 'Entendido', onPress: () => router.replace('/(tabs)/mis-reservas' as any) }]
      );
    };

    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm(`Confirmar Cancelación:\n\n${mensajeAdvertencia}`) : true;
      if (ok) {
        ejecutarCancelacion();
      }
      return;
    }

    Alert.alert('Confirmar Cancelación', mensajeAdvertencia, [
      { text: 'No, mantener turno', style: 'cancel' },
      {
        text: 'Sí, cancelar turno',
        style: 'destructive',
        onPress: ejecutarCancelacion,
      },
    ]);
  };

  if (cargando) {
    return <EstadoCarga mensaje="Cargando comprobante..." />;
  }

  if (errorMensaje || !reserva) {
    return (
      <EstadoError
        mensaje={errorMensaje || 'No pudimos encontrar la reserva.'}
        onReintentar={cargarDatos}
      />
    );
  }

  const horaTurno = reserva.turnoId.split('-').pop() || '00';
  const esConfirmada = reserva.estado === 'confirmada';

  let estadoTexto = 'CONFIRMADA / ACTIVA';
  let badgeFondo = colores.libre;
  let badgeColor = colores.libreTexto;

  if (reserva.estado === 'cumplida') {
    estadoTexto = 'CUMPLIDA - ACCESO PERMITIDO';
    badgeFondo = '#E0F2FE';
    badgeColor = '#0369A1';
  } else if (reserva.estado === 'cancelada') {
    estadoTexto = 'CANCELADA';
    badgeFondo = colores.reservado;
    badgeColor = colores.reservadoTexto;
  } else if (reserva.estado === 'ausente') {
    estadoTexto = 'NO PRESENTADO (AUSENTE)';
    badgeFondo = colores.mantenimiento;
    badgeColor = colores.textoMuted;
  }

  return (
    <ScrollView
      style={[styles.contenedor, { backgroundColor: colores.fondo }]}
      contentContainerStyle={styles.contenido}
      showsVerticalScrollIndicator={false}
    >
      {/* Tarjeta de pase deportivo digital */}
      <View
        style={[
          styles.paseDeportivo,
          { backgroundColor: colores.tarjeta, borderColor: colores.borde },
        ]}
      >
        {/* Cabecera del ticket */}
        <View style={styles.paseCabecera}>
          <View style={styles.titularTicket}>
            <Text style={styles.entidad}>DIRECCIÓN DE DEPORTES VILLAGUAY</Text>
            <Text style={[styles.nombreEspacio, { color: colores.texto }]}>
              {espacio?.nombre || `Espacio #${reserva.espacioId}`}
            </Text>
            <Text style={[styles.complejo, { color: colores.textoSecundario }]}>
              {espacio?.complejo || 'Polideportivo Municipal'}
            </Text>
          </View>

          <View style={[styles.badgeEstado, { backgroundColor: badgeFondo }]}>
            <Text style={[styles.badgeEstadoTexto, { color: badgeColor }]}>{estadoTexto}</Text>
          </View>
        </View>

        {/* Separador tipo ticket recortado */}
        <View style={styles.separadorTicket}>
          <View style={[styles.muesca, styles.muescaIzq, { backgroundColor: colores.fondo }]} />
          <View style={[styles.lineaPunteada, { borderColor: colores.borde }]} />
          <View style={[styles.muesca, styles.muescaDer, { backgroundColor: colores.fondo }]} />
        </View>

        {/* Código QR central con fondo blanco para lectura perfecta */}
        <View style={styles.seccionQrCentrada}>
          <View style={styles.marcoQr}>
            <QRCode
              value={reserva.codigoQr}
              size={190}
              color="#000000"
              backgroundColor="#FFFFFF"
            />
          </View>

          <Text style={styles.codigoAlfanumerico}>{reserva.codigoQr}</Text>
          <Text style={[styles.avisoEscaner, { color: colores.textoMuted }]}>
            Presentá este código en el puesto de acceso al encargado municipal.
          </Text>
        </View>

        {/* Datos clave de la reserva */}
        <View style={[styles.grillaDetalles, { backgroundColor: colores.fondo, borderColor: colores.borde }]}>
          <View style={styles.itemDetalle}>
            <Text style={[styles.etiquetaDato, { color: colores.textoMuted }]}>HORA TURNO</Text>
            <Text style={[styles.valorDato, { color: colores.texto }]}>{horaTurno}:00 hs</Text>
          </View>

          <View style={styles.itemDetalle}>
            <Text style={[styles.etiquetaDato, { color: colores.textoMuted }]}>JUGADORES</Text>
            <Text style={[styles.valorDato, { color: colores.texto }]}>
              {reserva.cantidadPersonas} deportistas
            </Text>
          </View>

          <View style={styles.itemDetalle}>
            <Text style={[styles.etiquetaDato, { color: colores.textoMuted }]}>TITULAR</Text>
            <Text style={[styles.valorDato, { color: colores.texto }]}>
              {usuario?.nombre || 'Deportista'}
            </Text>
          </View>

          <View style={styles.itemDetalle}>
            <Text style={[styles.etiquetaDato, { color: colores.textoMuted }]}>TARIFA</Text>
            <Text style={[styles.valorDato, { color: Colores.primarioClaro }]}>
              ${espacio?.precioPorHora.toLocaleString('es-AR') || '1.500'}
            </Text>
          </View>
        </View>

        {reserva.ingresoEn && (
          <View style={styles.avisoIngresoConfirmado}>
            <Icono nombre="checkmark-circle" size={18} color="#0369A1" />
            <Text style={styles.avisoIngresoTexto}>
              Ingreso validado a las {new Date(reserva.ingresoEn).toLocaleTimeString()}
            </Text>
          </View>
        )}
      </View>

      {/* Botones de acción */}
      <View style={styles.seccionAcciones}>
        {espacio && (
          <TouchableOpacity
            style={[styles.botonAccion, styles.botonMapa]}
            onPress={abrirMapa}
            activeOpacity={0.8}
          >
            <Icono nombre="map-outline" size={20} color="#FFFFFF" />
            <Text style={styles.botonAccionTexto}>Cómo llegar al predio</Text>
          </TouchableOpacity>
        )}

        {esConfirmada && (
          <TouchableOpacity
            style={[styles.botonAccion, styles.botonCancelar]}
            onPress={ejecutarCancelacion}
            activeOpacity={0.8}
          >
            <Icono nombre="close-circle-outline" size={20} color={Colores.peligro} />
            <Text style={[styles.botonAccionTexto, { color: Colores.peligro }]}>
              Cancelar este turno
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.botonVolver, { borderColor: colores.borde }]}
          onPress={() => router.replace('/mis-reservas' as any)}
        >
          <Text style={[styles.botonVolverTexto, { color: colores.texto }]}>
            Ver todas mis reservas
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  contenido: {
    padding: 16,
    paddingBottom: 40,
  },
  paseDeportivo: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  paseCabecera: {
    padding: 20,
    gap: 8,
  },
  titularTicket: {
    gap: 2,
  },
  entidad: {
    fontSize: 11,
    fontWeight: '800',
    color: Colores.primarioClaro,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  nombreEspacio: {
    fontSize: 22,
    fontWeight: '800',
  },
  complejo: {
    fontSize: 13,
  },
  badgeEstado: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 4,
  },
  badgeEstadoTexto: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  separadorTicket: {
    position: 'relative',
    height: 30,
    justifyContent: 'center',
    marginVertical: 4,
  },
  lineaPunteada: {
    borderWidth: 1,
    borderStyle: 'dashed',
    marginHorizontal: 24,
  },
  muesca: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    top: 3,
  },
  muescaIzq: {
    left: -12,
  },
  muescaDer: {
    right: -12,
  },
  seccionQrCentrada: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  marcoQr: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  codigoAlfanumerico: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 3,
    color: '#1A4D2E',
    marginTop: 14,
  },
  avisoEscaner: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  grillaDetalles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  itemDetalle: {
    width: '50%',
    paddingVertical: 6,
  },
  etiquetaDato: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  valorDato: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  avisoIngresoConfirmado: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
    gap: 8,
  },
  avisoIngresoTexto: {
    color: '#0369A1',
    fontSize: 13,
    fontWeight: '600',
  },
  seccionAcciones: {
    gap: 12,
  },
  botonAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  botonMapa: {
    backgroundColor: Colores.primarioClaro,
  },
  botonCancelar: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: Colores.peligro,
  },
  botonAccionTexto: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  botonVolver: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  botonVolverTexto: {
    fontSize: 14,
    fontWeight: '600',
  },
});
