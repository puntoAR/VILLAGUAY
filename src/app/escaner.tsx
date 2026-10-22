// src/app/escaner.tsx
// Lector de códigos QR con cámara

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useTema } from '../contexto/ThemeContext';
import { Icono } from '../componentes/Icono';
import { Colores } from '../constantes/tema';
import { Haptica } from '../servicios/haptica';
import { BDService } from '../basedatos/sqlite';

export default function PantallaEscanerQR() {
  const { colores } = useTema();
  const router = useRouter();

  // Gestión de permisos en tiempo de ejecución (undetermined, granted, denied)
  const [permiso, solicitarPermiso] = useCameraPermissions();
  const [escaneado, setEscaneado] = useState<boolean>(false);

  if (!permiso) {
    return <View style={{ flex: 1, backgroundColor: colores.fondo }} />;
  }

  if (!permiso.granted) {
    return (
      <View style={[styles.contenedorCentrado, { backgroundColor: colores.fondo }]}>
        <Icono nombre="camera-outline" size={54} color={colores.textoMuted} />
        <Text style={[styles.tituloPermiso, { color: colores.texto }]}>Permiso de Cámara Requerido</Text>
        <Text style={[styles.descPermiso, { color: colores.textoSecundario }]}>
          Se necesita acceso a la cámara para escanear el código QR del turno deportivo en la puerta.
        </Text>
        <Pressable
          style={[styles.botonPermiso, { backgroundColor: Colores.primarioClaro }]}
          onPress={solicitarPermiso}
        >
          <Text style={styles.textoBotonPermiso}>Conceder Permiso</Text>
        </Pressable>
      </View>
    );
  }

  const manejarCodigoLeido = ({ data }: { data: string }) => {
    if (escaneado || !data) return;
    setEscaneado(true);

    // Validación sincrónica en SQLite
    const resultado = BDService.validarIngresoQrSync(data.trim());

    if (resultado.exito) {
      Haptica.exito();
      Alert.alert(
        'ACCESO AUTORIZADO ✅',
        resultado.mensaje,
        [{ text: 'Escanear Siguiente', onPress: () => setEscaneado(false) }]
      );
    } else {
      Haptica.error();
      Alert.alert(
        'ACCESO DENEGADO ❌',
        resultado.mensaje,
        [{ text: 'Reintentar', onPress: () => setEscaneado(false) }]
      );
    }
  };

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

      {/* Overlay de la mira del escáner */}
      <View style={styles.overlay}>
        <Text style={styles.textoInstruccion}>
          Apuntá la cámara hacia el código QR del turno
        </Text>
        <View style={styles.marcoMira}>
          <View style={[styles.esquina, styles.esquinaTL]} />
          <View style={[styles.esquina, styles.esquinaTR]} />
          <View style={[styles.esquina, styles.esquinaBL]} />
          <View style={[styles.esquina, styles.esquinaBR]} />
        </View>

        <Pressable
          style={styles.botonCerrar}
          onPress={() => router.back()}
        >
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
  contenedorCentrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  tituloPermiso: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  descPermiso: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  botonPermiso: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  textoBotonPermiso: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
