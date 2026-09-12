import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTema } from '../src/contexto/ThemeContext';
import { useAuth } from '../src/contexto/AuthContext';
import { ReservasServicio } from '../src/servicios/reservas';
import { AuthServicio } from '../src/servicios/auth';
import { esError } from '../src/servicios/api';
import { Reserva } from '../src/tipos';
import { Icono } from '../src/componentes/Icono';
import { Colores } from '../src/constantes/tema';
import { Haptica } from '../src/servicios/haptica';

export default function PantallaEscanerPuerta() {
  const router = useRouter();
  const { colores } = useTema();
  const { usuario, esEncargadoOAdmin } = useAuth();

  const [permiso, solicitarPermiso] = useCameraPermissions();
  const [autenticadoBiometria, setAutenticadoBiometria] = useState<boolean>(false);
  const [verificandoBiometria, setVerificandoBiometria] = useState<boolean>(true);
  const [antorchaEncendida, setAntorchaEncendida] = useState<boolean>(false);
  const [bloqueoEscaneo, setBloqueoEscaneo] = useState<boolean>(false);

  // Modo ingreso manual para emergencias o web
  const [codigoManual, setCodigoManual] = useState<string>('');
  const [mostrarModalManual, setMostrarModalManual] = useState<boolean>(false);

  // Resultado de validación
  const [resultadoValidacion, setResultadoValidacion] = useState<{
    exito: boolean;
    titulo: string;
    mensaje: string;
    reserva?: Reserva;
  } | null>(null);

  // Ejecutar verificación biométrica al ingresar a la pantalla
  const ejecutarAutenticacionBiometrica = async () => {
    setVerificandoBiometria(true);
    const resp = await AuthServicio.autenticarConBiometria(
      'Verificá tu identidad para habilitar el control de ingresos de la Dirección de Deportes'
    );
    setVerificandoBiometria(false);
    if (resp.exito) {
      setAutenticadoBiometria(true);
    } else {
      setAutenticadoBiometria(false);
    }
  };

  useEffect(() => {
    ejecutarAutenticacionBiometrica();
  }, []);

  // Procesar código leído (sea por cámara o manual)
  const procesarCodigo = async (codigo: string) => {
    if (bloqueoEscaneo) return;
    setBloqueoEscaneo(true);

    const codigoLimpio = codigo.trim().toUpperCase();
    const resp = await ReservasServicio.validarIngresoQr(codigoLimpio);

    if (esError(resp)) {
      await Haptica.errorIngreso();
      setResultadoValidacion({
        exito: false,
        titulo: 'ACCESO DENEGADO ❌',
        mensaje: resp.error.mensaje,
      });
    } else {
      await Haptica.exitoIngreso();
      setResultadoValidacion({
        exito: true,
        titulo: 'INGRESO AUTORIZADO ✅',
        mensaje: resp.datos.mensaje,
        reserva: resp.datos.reserva,
      });
    }
  };

  const manejarCodigoEscaneado = ({ data }: { data: string }) => {
    if (!bloqueoEscaneo && data) {
      procesarCodigo(data);
    }
  };

  const reanudarEscaneo = () => {
    setResultadoValidacion(null);
    setBloqueoEscaneo(false);
  };

  const marcarComoAusenteManual = async (reservaId: string) => {
    Alert.alert(
      'Marcar Ausente',
      '¿Confirmás que el titular no se presentó? Esto sumará una inasistencia a su legajo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar Inasistencia',
          style: 'destructive',
          onPress: async () => {
            await ReservasServicio.marcarAusente(reservaId);
            Alert.alert('Asentado', 'La inasistencia ha sido registrada.');
            reanudarEscaneo();
          },
        },
      ]
    );
  };

  // Si no pasó la biometría requerida por cátedra
  if (verificandoBiometria) {
    return (
      <View style={[styles.centrado, { backgroundColor: colores.fondo }]}>
        <ActivityIndicator size="large" color={Colores.primarioClaro} />
        <Text style={[styles.textoEstado, { color: colores.texto }]}>
          Validando credenciales biométricas...
        </Text>
      </View>
    );
  }

  if (!autenticadoBiometria) {
    return (
      <View style={[styles.centrado, { backgroundColor: colores.fondo, padding: 24 }]}>
        <Icono nombre="finger-print-outline" size={64} color={Colores.advertencia} />
        <Text style={[styles.tituloBloqueo, { color: colores.texto }]}>Acceso Restringido</Text>
        <Text style={[styles.descripcionBloqueo, { color: colores.textoSecundario }]}>
          El módulo de escáner en puerta requiere autenticación biométrica (huella dactilar o reconocimiento facial) del personal autorizado.
        </Text>
        <TouchableOpacity
          style={[styles.botonReintentarBiometria, { backgroundColor: Colores.primarioClaro }]}
          onPress={ejecutarAutenticacionBiometrica}
        >
          <Icono nombre="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.botonReintentarTexto}>Reintentar Autenticación</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botonSalir} onPress={() => router.back()}>
          <Text style={[styles.botonSalirTexto, { color: colores.textoMuted }]}>
            Volver al Panel de Gestión
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      {/* Vista de Cámara o Fallback Web/Sin permisos */}
      {Platform.OS === 'web' || !permiso?.granted ? (
        <View style={[styles.camaraFallback, { backgroundColor: '#0F172A' }]}>
          <Icono nombre="camera-outline" size={56} color="#94A3B8" />
          <Text style={styles.textoFallbackTitulo}>
            {!permiso?.granted ? 'Permiso de cámara no concedido' : 'Modo Simulador Web'}
          </Text>
          <Text style={styles.textoFallbackDesc}>
            {!permiso?.granted
              ? 'Concedé permiso a la cámara para leer los códigos QR físicos o utilizá el ingreso de código manual.'
              : 'En entorno web o sin sensor de cámara podés ingresar el código alfanumerico que figura en el ticket.'}
          </Text>

          {!permiso?.granted && (
            <TouchableOpacity
              style={styles.botonPedirPermiso}
              onPress={solicitarPermiso}
            >
              <Text style={styles.botonPedirPermisoTexto}>Habilitar Cámara</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.botonAbrirManual}
            onPress={() => setMostrarModalManual(true)}
          >
            <Icono nombre="keypad-outline" size={20} color="#FFFFFF" />
            <Text style={styles.botonAbrirManualTexto}>Ingresar Código Manual</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={antorchaEncendida}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={bloqueoEscaneo ? undefined : manejarCodigoEscaneado}
        >
          {/* Capa de diseño del visor de escaneo */}
          <View style={styles.capaOscuraSuperior}>
            <Text style={styles.instruccionCamara}>
              Apuntá al código QR del comprobante de reserva
            </Text>
          </View>

          <View style={styles.filaCentralVisor}>
            <View style={styles.capaOscuraLateral} />
            <View style={styles.cuadroEscaneo}>
              {/* Esquinas decorativas del visor */}
              <View style={[styles.esquina, styles.esquinaTL]} />
              <View style={[styles.esquina, styles.esquinaTR]} />
              <View style={[styles.esquina, styles.esquinaBL]} />
              <View style={[styles.esquina, styles.esquinaBR]} />
            </View>
            <View style={styles.capaOscuraLateral} />
          </View>

          <View style={styles.capaOscuraInferior}>
            {/* Controles de linterna y teclado */}
            <View style={styles.barraControlesCamara}>
              <TouchableOpacity
                style={[
                  styles.botonControl,
                  antorchaEncendida && styles.botonControlActivo,
                ]}
                onPress={() => setAntorchaEncendida(prev => !prev)}
              >
                <Icono
                  nombre={antorchaEncendida ? 'flashlight' : 'flashlight-outline'}
                  size={24}
                  color="#FFFFFF"
                />
                <Text style={styles.textoBotonControl}>
                  {antorchaEncendida ? 'Luz ON' : 'Linterna'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botonControl}
                onPress={() => setMostrarModalManual(true)}
              >
                <Icono nombre="keypad-outline" size={24} color="#FFFFFF" />
                <Text style={styles.textoBotonControl}>Manual</Text>
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      )}

      {/* Modal / Card de Resultado de la Verificación */}
      <Modal
        visible={resultadoValidacion !== null}
        transparent
        animationType="fade"
        onRequestClose={reanudarEscaneo}
      >
        <View style={styles.modalFondo}>
          <View
            style={[
              styles.tarjetaResultado,
              {
                backgroundColor: resultadoValidacion?.exito ? '#F0FDF4' : '#FEF2F2',
                borderColor: resultadoValidacion?.exito ? Colores.exito : Colores.peligro,
              },
            ]}
          >
            <View
              style={[
                styles.iconoResultadoCirculo,
                {
                  backgroundColor: resultadoValidacion?.exito ? Colores.exito : Colores.peligro,
                },
              ]}
            >
              <Icono
                nombre={resultadoValidacion?.exito ? 'checkmark' : 'close'}
                size={40}
                color="#FFFFFF"
              />
            </View>

            <Text
              style={[
                styles.tituloResultado,
                { color: resultadoValidacion?.exito ? '#166534' : '#991B1B' },
              ]}
            >
              {resultadoValidacion?.titulo}
            </Text>

            <Text
              style={[
                styles.mensajeResultado,
                { color: resultadoValidacion?.exito ? '#14532D' : '#7F1D1D' },
              ]}
            >
              {resultadoValidacion?.mensaje}
            </Text>

            {resultadoValidacion?.reserva && (
              <View style={styles.datosResultadoBox}>
                <Text style={styles.datoResultadoItem}>
                  👥 Deportistas permitidos: {resultadoValidacion.reserva.cantidadPersonas}
                </Text>
                <Text style={styles.datoResultadoItem}>
                  🎫 Código: {resultadoValidacion.reserva.codigoQr}
                </Text>
              </View>
            )}

            <View style={styles.filaBotonesResultado}>
              <TouchableOpacity
                style={[
                  styles.botonSiguiente,
                  {
                    backgroundColor: resultadoValidacion?.exito
                      ? Colores.exito
                      : Colores.peligro,
                  },
                ]}
                onPress={reanudarEscaneo}
              >
                <Text style={styles.botonSiguienteTexto}>
                  {resultadoValidacion?.exito ? 'Escanear siguiente turno' : 'Intentar nuevamente'}
                </Text>
              </TouchableOpacity>

              {resultadoValidacion?.reserva && !resultadoValidacion.exito && (
                <TouchableOpacity
                  style={styles.botonMarcarAusente}
                  onPress={() => marcarComoAusenteManual(resultadoValidacion.reserva!.id)}
                >
                  <Text style={styles.botonMarcarAusenteTexto}>Marcar inasistencia</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para Ingreso Manual de Código Alfanumérico */}
      <Modal
        visible={mostrarModalManual}
        transparent
        animationType="slide"
        onRequestClose={() => setMostrarModalManual(false)}
      >
        <View style={styles.modalFondo}>
          <View style={[styles.modalManualContenido, { backgroundColor: colores.tarjeta }]}>
            <Text style={[styles.modalManualTitulo, { color: colores.texto }]}>
              Ingreso Manual de Código
            </Text>
            <Text style={[styles.modalManualSubtitulo, { color: colores.textoSecundario }]}>
              Ingresá el código alfanumérico que figura en el ticket del usuario (Ej: VGY-001-01-1800)
            </Text>

            <TextInput
              style={[
                styles.inputManual,
                {
                  backgroundColor: colores.fondo,
                  color: colores.texto,
                  borderColor: colores.borde,
                },
              ]}
              value={codigoManual}
              onChangeText={setCodigoManual}
              placeholder="Ej: VGY-1234-01-2000"
              placeholderTextColor={colores.textoMuted}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <View style={styles.botonesManualFila}>
              <TouchableOpacity
                style={[styles.botonManualSecundario, { borderColor: colores.borde }]}
                onPress={() => {
                  setMostrarModalManual(false);
                  setCodigoManual('');
                }}
              >
                <Text style={[styles.botonManualSecundarioTexto, { color: colores.texto }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.botonManualPrimario,
                  { backgroundColor: Colores.primarioClaro },
                ]}
                onPress={() => {
                  if (!codigoManual.trim()) {
                    Alert.alert('Atención', 'Por favor ingresá un código.');
                    return;
                  }
                  setMostrarModalManual(false);
                  procesarCodigo(codigoManual);
                  setCodigoManual('');
                }}
              >
                <Text style={styles.botonManualPrimarioTexto}>Verificar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  textoEstado: {
    fontSize: 14,
    fontWeight: '600',
  },
  tituloBloqueo: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
  },
  descripcionBloqueo: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  botonReintentarBiometria: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  botonReintentarTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  botonSalir: {
    marginTop: 16,
    padding: 8,
  },
  botonSalirTexto: {
    fontSize: 13,
    fontWeight: '600',
  },
  camaraFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 14,
  },
  textoFallbackTitulo: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  textoFallbackDesc: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
  botonPedirPermiso: {
    backgroundColor: Colores.primarioClaro,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  botonPedirPermisoTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  botonAbrirManual: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 6,
  },
  botonAbrirManualTexto: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  capaOscuraSuperior: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  instruccionCamara: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filaCentralVisor: {
    flexDirection: 'row',
    height: 250,
  },
  capaOscuraLateral: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  cuadroEscaneo: {
    width: 250,
    height: 250,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  esquina: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#E8AA42',
  },
  esquinaTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  esquinaTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  esquinaBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  esquinaBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  capaOscuraInferior: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  barraControlesCamara: {
    flexDirection: 'row',
    gap: 32,
  },
  botonControl: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    gap: 4,
  },
  botonControlActivo: {
    backgroundColor: Colores.secundario,
  },
  textoBotonControl: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tarjetaResultado: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  iconoResultadoCirculo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tituloResultado: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  mensajeResultado: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  datosResultadoBox: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    padding: 12,
    borderRadius: 10,
    width: '100%',
    gap: 4,
    marginBottom: 18,
  },
  datoResultadoItem: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  filaBotonesResultado: {
    width: '100%',
    gap: 10,
  },
  botonSiguiente: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  botonSiguienteTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  botonMarcarAusente: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  botonMarcarAusenteTexto: {
    color: Colores.advertencia,
    fontWeight: '700',
    fontSize: 13,
  },
  modalManualContenido: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    padding: 20,
    gap: 14,
  },
  modalManualTitulo: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalManualSubtitulo: {
    fontSize: 13,
    lineHeight: 18,
  },
  inputManual: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  botonesManualFila: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  botonManualSecundario: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botonManualSecundarioTexto: {
    fontSize: 14,
    fontWeight: '600',
  },
  botonManualPrimario: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botonManualPrimarioTexto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
