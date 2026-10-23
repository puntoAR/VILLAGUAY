// src/app/escaner.tsx
// Escáner de código QR para control de acceso

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, TextInput, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useTema } from '../contexto/ThemeContext';
import { Icono } from '../componentes/Icono';
import { Colores } from '../constantes/tema';
import { Haptica } from '../servicios/haptica';
import { ReservasServicio } from '../servicios/reservas';
import { esError } from '../servicios/api';

export default function PantallaEscanerQR() {
  const { colores } = useTema();
  const router = useRouter();

  const [permiso, solicitarPermiso] = useCameraPermissions();
  const [escaneado, setEscaneado] = useState<boolean>(false);
  const [codigoManual, setCodigoManual] = useState<string>('');

  const procesarCodigo = async (codigo: string) => {
    if (escaneado || !codigo.trim()) return;
    setEscaneado(true);

    const resp = await ReservasServicio.validarIngresoQr(codigo.trim());

    if (!esError(resp)) {
      await Haptica.exito();
      Alert.alert(
        'ACCESO AUTORIZADO ✅',
        `${resp.datos.mensaje}\nReserva: ${resp.datos.reserva.id}`,
        [{ text: 'Aceptar', onPress: () => setEscaneado(false) }]
      );
    } else {
      await Haptica.error();
      Alert.alert(
        'ACCESO DENEGADO ❌',
        resp.error.mensaje,
        [{ text: 'Reintentar', onPress: () => setEscaneado(false) }]
      );
    }
  };

  const manejarCodigoLeido = ({ data }: { data: string }) => {
    procesarCodigo(data);
  };

  // En navegadores web donde CameraView no tiene soporte de cámara trasera nativa
  if (Platform.OS === 'web' || !permiso?.granted) {
    return (
      <View style={[styles.contenedorWeb, { backgroundColor: colores.fondo }]}>
        <Icono nombre="qr-code-outline" size={60} color={Colores.primarioClaro} />
        <Text style={[styles.tituloWeb, { color: colores.texto }]}>Control de Acceso QR</Text>
        <Text style={[styles.descWeb, { color: colores.textoSecundario }]}>
          {Platform.OS === 'web'
            ? 'En navegador de escritorio podés validar ingresando el código manualmente:'
            : 'Se requiere permiso de cámara para escanear en tiempo real:'}
        </Text>

        {!permiso?.granted && Platform.OS !== 'web' && (
          <Pressable
            style={[styles.botonPermiso, { backgroundColor: Colores.primarioClaro }]}
            onPress={solicitarPermiso}
          >
            <Text style={styles.textoBotonPermiso}>Conceder Permiso de Cámara</Text>
          </Pressable>
        )}

        {/* Validación manual (útil para pruebas en PC o si la cámara no enfoca) */}
        <View style={styles.cajaManual}>
          <TextInput
            style={[styles.inputManual, { backgroundColor: colores.tarjeta, color: colores.texto, borderColor: colores.borde }]}
            placeholder="Ej: VGY-01-esp-01-1900"
            placeholderTextColor={colores.textoMuted}
            value={codigoManual}
            onChangeText={setCodigoManual}
            autoCapitalize="characters"
          />
          <Pressable
            style={[styles.botonValidarManual, { backgroundColor: Colores.primarioClaro }]}
            onPress={() => procesarCodigo(codigoManual)}
          >
            <Text style={styles.textoBotonManual}>Validar Acceso</Text>
          </Pressable>
        </View>

        <Pressable style={styles.botonVolver} onPress={() => router.back()}>
          <Text style={[styles.textoVolver, { color: colores.textoSecundario }]}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={escaneado ? undefined : manejarCodigoLeido}
      />

      <View style={styles.overlay}>
        <Text style={styles.textoInstruccion}>
          Apuntá al código QR del usuario para autorizar el ingreso
        </Text>

        <View style={styles.marcoMira}>
          <View style={[styles.esquina, styles.esquinaTL]} />
          <View style={[styles.esquina, styles.esquinaTR]} />
          <View style={[styles.esquina, styles.esquinaBL]} />
          <View style={[styles.esquina, styles.esquinaBR]} />
        </View>

        <Pressable style={styles.botonCerrar} onPress={() => router.back()}>
          <Text style={styles.textoBotonCerrar}>Cerrar Escáner</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#000',
  },
  contenedorWeb: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  tituloWeb: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  descWeb: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  botonPermiso: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 6,
  },
  textoBotonPermiso: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cajaManual: {
    width: '100%',
    maxWidth: 340,
    gap: 10,
    marginTop: 14,
  },
  inputManual: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    textAlign: 'center',
  },
  botonValidarManual: {
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotonManual: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  botonVolver: {
    marginTop: 20,
    padding: 10,
  },
  textoVolver: {
    fontSize: 14,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  textoInstruccion: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    textAlign: 'center',
  },
  marcoMira: {
    width: 240,
    height: 240,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  esquina: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: Colores.acento,
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
  botonCerrar: {
    marginTop: 36,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  textoBotonCerrar: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
