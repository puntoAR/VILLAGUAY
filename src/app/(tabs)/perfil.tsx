// src/app/(tabs)/perfil.tsx
// Unidad 3: Sistema de temas claro/oscuro con AsyncStorage
// Unidad 4: Selector de foto con expo-image-picker y persistencia en Paths.document con expo-file-system
// Unidad 6: Biometría local (expo-local-authentication) y enlaces web (expo-web-browser)

import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Alert, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexto/AuthContext';
import { useTema } from '../../contexto/ThemeContext';
import { Icono } from '../../componentes/Icono';
import { Colores } from '../../constantes/tema';
import { Haptica } from '../../servicios/haptica';
import { MultimediaServicio } from '../../servicios/multimedia';
import { BDService } from '../../basedatos/sqlite';

export default function PantallaPerfil() {
  const { usuario, cerrarSesion, autenticarBiometria, soportaBiometria, actualizarAvatar } = useAuth();
  const { esOscuro, alternarTema, colores } = useTema();
  const router = useRouter();

  const [cambiandoFoto, setCambiandoFoto] = useState(false);

  // Unidad 4: Selector de foto y persistencia de Paths.cache a Paths.document
  const cambiarFotoPerfil = async () => {
    try {
      setCambiandoFoto(true);
      const uriPersistida = await MultimediaServicio.seleccionarFotoPerfil();
      if (uriPersistida && usuario) {
        // Actualizar en SQLite sincrónicamente y en el contexto
        BDService.actualizarAvatarUsuarioSync(usuario.id, uriPersistida);
        actualizarAvatar(uriPersistida);
        Haptica.exito();
        Alert.alert('Foto actualizada', 'Tu foto de perfil fue persistida en el almacenamiento seguro del dispositivo.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo actualizar la foto.');
    } finally {
      setCambiandoFoto(false);
    }
  };

  // Unidad 6: Prueba de biometría local
  const probarBiometria = async () => {
    Haptica.seleccion();
    const ok = await autenticarBiometria();
    if (ok) {
      Haptica.exito();
      Alert.alert('Identidad verificada ✅', 'Autenticación biométrica exitosa mediante huella o rostro.');
    } else {
      Haptica.error();
      Alert.alert('Error biométrico', 'No se pudo verificar la huella o el rostro.');
    }
  };

  // Unidad 6: Enlace externo con expo-web-browser
  const abrirPortalMunicipal = async () => {
    Haptica.seleccion();
    await WebBrowser.openBrowserAsync('https://villaguay.gob.ar/deportes');
  };

  const handleCerrarSesion = async () => {
    Alert.alert('Cerrar Sesión', '¿Deseás salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          await cerrarSesion();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      {/* Tarjeta de Usuario */}
      <View style={[styles.tarjetaUsuario, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
        <Pressable onPress={cambiarFotoPerfil} style={styles.avatarContenedor}>
          {usuario?.avatarUrl ? (
            <Image
              source={{ uri: usuario.avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icono nombre="person" size={40} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.badgeCamara}>
            <Icono nombre="camera" size={12} color="#FFFFFF" />
          </View>
        </Pressable>

        <View style={styles.infoUsuario}>
          <Text style={[styles.nombre, { color: colores.texto }]}>
            {usuario?.nombre || 'Martín Fernández'}
          </Text>
          <Text style={[styles.email, { color: colores.textoSecundario }]}>
            {usuario?.email || 'martin@villaguay.gob.ar'}
          </Text>
          <Text style={[styles.rol, { color: Colores.primarioClaro }]}>
            Rol: {(usuario?.rol || 'jugador').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Sección Preferencias y Sistema de Temas */}
      <View style={styles.seccion}>
        <Text style={[styles.tituloSeccion, { color: colores.textoSecundario }]}>PREFERENCIAS</Text>

        <View style={[styles.filaOpcion, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
          <View style={styles.filaOpcionIzq}>
            <Icono nombre={esOscuro ? 'moon' : 'sunny'} size={20} color={Colores.primarioClaro} />
            <Text style={[styles.textoOpcion, { color: colores.texto }]}>Modo Oscuro</Text>
          </View>
          <Switch
            value={esOscuro}
            onValueChange={alternarTema}
            trackColor={{ false: '#CBD5E1', true: Colores.primarioClaro }}
          />
        </View>

        {soportaBiometria && (
          <Pressable
            style={({ pressed }) => [
              styles.filaOpcion,
              { backgroundColor: colores.tarjeta, borderColor: colores.borde, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={probarBiometria}
          >
            <View style={styles.filaOpcionIzq}>
              <Icono nombre="finger-print" size={20} color={Colores.primarioClaro} />
              <Text style={[styles.textoOpcion, { color: colores.texto }]}>Probar Biometría (Face/Huella)</Text>
            </View>
            <Icono nombre="chevron-forward" size={18} color={colores.textoMuted} />
          </Pressable>
        )}
      </View>

      {/* Sección Institucional y Enlaces Externos */}
      <View style={styles.seccion}>
        <Text style={[styles.tituloSeccion, { color: colores.textoSecundario }]}>INFORMACIÓN INSTITUCIONAL</Text>

        <Pressable
          style={({ pressed }) => [
            styles.filaOpcion,
            { backgroundColor: colores.tarjeta, borderColor: colores.borde, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={abrirPortalMunicipal}
        >
          <View style={styles.filaOpcionIzq}>
            <Icono nombre="globe-outline" size={20} color={Colores.primarioClaro} />
            <Text style={[styles.textoOpcion, { color: colores.texto }]}>Portal Municipal de Deportes</Text>
          </View>
          <Icono nombre="open-outline" size={18} color={colores.textoMuted} />
        </Pressable>

        <View style={[styles.tarjetaIoT, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
          <Icono nombre="hardware-chip-outline" size={20} color={Colores.acento} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.tituloIoT, { color: colores.texto }]}>Integración IoT (Mark Weiser)</Text>
            <Text style={[styles.descIoT, { color: colores.textoMuted }]}>
              El sistema conecta con la telemetría del predio para encender reflectores nocturnos automáticamente según las reservas activas.
            </Text>
          </View>
        </View>
      </View>

      {/* Botón Cerrar Sesión */}
      <Pressable
        style={({ pressed }) => [
          styles.botonSalir,
          { opacity: pressed ? 0.8 : 1 },
        ]}
        onPress={handleCerrarSesion}
      >
        <Icono nombre="log-out-outline" size={18} color="#FFFFFF" />
        <Text style={styles.textoBotonSalir}>Cerrar Sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 16,
  },
  tarjetaUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 16,
    marginBottom: 20,
  },
  avatarContenedor: {
    position: 'relative',
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  avatarPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colores.primarioClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCamara: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colores.acento,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoUsuario: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    fontSize: 17,
    fontWeight: '800',
  },
  email: {
    fontSize: 12,
  },
  rol: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  seccion: {
    marginBottom: 20,
    gap: 8,
  },
  tituloSeccion: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  filaOpcion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  filaOpcionIzq: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textoOpcion: {
    fontSize: 14,
    fontWeight: '600',
  },
  tarjetaIoT: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginTop: 4,
  },
  tituloIoT: {
    fontSize: 13,
    fontWeight: '700',
  },
  descIoT: {
    fontSize: 11,
    lineHeight: 16,
  },
  botonSalir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colores.peligro,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
    marginBottom: 40,
  },
  textoBotonSalir: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
