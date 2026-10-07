import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Reserva, Espacio } from '../tipos';
import { useTema } from '../contexto/ThemeContext';
import { Icono } from './Icono';
import { Colores } from '../constantes/tema';
import { useRouter } from 'expo-router';

interface Props {
  reserva: Reserva;
  espacio?: Espacio;
  onCancelar?: (id: string) => void;
}

export const TarjetaReserva: React.FC<Props> = ({ reserva, espacio, onCancelar }) => {
  const { colores } = useTema();
  const router = useRouter();

  const fechaObj = new Date(reserva.creadaEn);
  const ahora = new Date().getTime();
  const limiteCancelacion = new Date(reserva.cancelableHasta).getTime();
  const esCancelableSinAviso = ahora < limiteCancelacion;

  let estadoTexto = 'CONFIRMADA';
  let badgeFondo = colores.libre;
  let badgeTexto = colores.libreTexto;

  if (reserva.estado === 'cumplida') {
    estadoTexto = 'CUMPLIDA / INGRESÓ';
    badgeFondo = '#E0F2FE';
    badgeTexto = '#0369A1';
  } else if (reserva.estado === 'cancelada') {
    estadoTexto = 'CANCELADA';
    badgeFondo = colores.reservado;
    badgeTexto = colores.reservadoTexto;
  } else if (reserva.estado === 'ausente') {
    estadoTexto = 'NO SE PRESENTÓ';
    badgeFondo = colores.mantenimiento;
    badgeTexto = colores.textoMuted;
  }

  return (
    <View
      style={[
        styles.tarjeta,
        { backgroundColor: colores.tarjeta, borderColor: colores.borde },
      ]}
    >
      <View style={styles.encabezado}>
        <View style={styles.titular}>
          <Text style={[styles.nombreEspacio, { color: colores.texto }]}>
            {espacio?.nombre || reserva.nombreEspacio || `Espacio ${reserva.espacioId}`}
          </Text>
          <Text style={[styles.complejo, { color: colores.textoSecundario }]}>
            {espacio?.complejo || 'Polideportivo Municipal Villaguay'}
          </Text>
        </View>

        <View style={[styles.badgeEstado, { backgroundColor: badgeFondo }]}>
          <Text style={[styles.badgeTexto, { color: badgeTexto }]}>{estadoTexto}</Text>
        </View>
      </View>

      <View style={styles.datosFila}>
        <View style={styles.datoItem}>
          <Icono nombre="time-outline" size={16} color={Colores.primarioClaro} />
          <Text style={[styles.datoTexto, { color: colores.texto }]}>
            Turno: {reserva.turnoId.split('-').pop()}:00 hs
          </Text>
        </View>

        <View style={styles.datoItem}>
          <Icono nombre="people-outline" size={16} color={Colores.primarioClaro} />
          <Text style={[styles.datoTexto, { color: colores.texto }]}>
            {reserva.cantidadPersonas} deportistas
          </Text>
        </View>
      </View>

      {/* Fila de Iluminación y Estado de Pago */}
      <View style={[styles.datosFila, { alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }]}>
        <View style={styles.datoItem}>
          <Icono
            nombre={reserva.conLuz ? 'bulb' : 'sunny-outline'}
            size={16}
            color={reserva.conLuz ? '#D97706' : Colores.primarioClaro}
          />
          <Text style={[styles.datoTexto, { color: reserva.conLuz ? '#D97706' : colores.texto, fontWeight: reserva.conLuz ? '700' : '500' }]}>
            {reserva.conLuz ? '💡 Con Luz nocturna' : '☀️ Sin Luz'}
          </Text>
        </View>

        <View
          style={[
            styles.badgePago,
            {
              backgroundColor: reserva.estadoPago === 'pagado' ? '#DCFCE7' : '#FEF3C7',
              borderColor: reserva.estadoPago === 'pagado' ? '#86EFAC' : '#FDE68A',
            },
          ]}
        >
          <Text
            style={[
              styles.badgePagoTexto,
              { color: reserva.estadoPago === 'pagado' ? '#166534' : '#92400E' },
            ]}
          >
            {reserva.estadoPago === 'pagado'
              ? `✅ Pagado: $${(reserva.montoTotal ?? espacio?.precioHora ?? 0).toLocaleString('es-AR')}`
              : `⏳ Por abonar: $${(reserva.montoTotal ?? espacio?.precioHora ?? 0).toLocaleString('es-AR')}`}
          </Text>
        </View>
      </View>

      <View style={[styles.seccionQr, { backgroundColor: colores.fondo, borderColor: colores.borde }]}>
        <View style={styles.qrColumna}>
          <Text style={[styles.qrTitulo, { color: colores.texto }]}>Código de ingreso:</Text>
          <Text style={styles.qrCodigo}>{reserva.codigoQr}</Text>
          <Text style={[styles.qrAviso, { color: colores.textoMuted }]}>Mostráselo al encargado en la puerta</Text>
        </View>

        <TouchableOpacity
          style={styles.botonVerQr}
          onPress={() => router.push(`/reserva/${reserva.id}` as any)}
        >
          <Icono nombre="qr-code-outline" size={24} color="#FFFFFF" />
          <Text style={styles.botonVerQrTexto}>Ver QR</Text>
        </TouchableOpacity>
      </View>

      {reserva.estado === 'confirmada' && (
        <View style={styles.footer}>
          <Text style={[styles.avisoCancelacion, { color: esCancelableSinAviso ? Colores.exito : Colores.advertencia }]}>
            {esCancelableSinAviso
              ? '✓ Cancelable sin penalización'
              : '⚠️ Cancelación tardía (quedará registrada)'}
          </Text>

          {onCancelar && (
            <TouchableOpacity
              style={[styles.botonCancelar, { borderColor: Colores.peligro }]}
              onPress={() => onCancelar(reserva.id)}
            >
              <Text style={[styles.botonCancelarTexto, { color: Colores.peligro }]}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tarjeta: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titular: {
    flex: 1,
    marginRight: 10,
  },
  nombreEspacio: {
    fontSize: 17,
    fontWeight: '700',
  },
  complejo: {
    fontSize: 12,
    marginTop: 2,
  },
  badgeEstado: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeTexto: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  datosFila: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  datoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  datoTexto: {
    fontSize: 13,
    fontWeight: '500',
  },
  seccionQr: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  qrColumna: {
    flex: 1,
  },
  qrTitulo: {
    fontSize: 11,
    fontWeight: '600',
  },
  qrCodigo: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A4D2E',
    letterSpacing: 1,
    marginVertical: 2,
  },
  qrAviso: {
    fontSize: 11,
  },
  botonVerQr: {
    backgroundColor: Colores.primarioClaro,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    gap: 2,
  },
  botonVerQrTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  avisoCancelacion: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  botonCancelar: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  botonCancelarTexto: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgePago: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgePagoTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
});
