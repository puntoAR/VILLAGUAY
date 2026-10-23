// src/app/(tabs)/perfil.tsx
// Perfil del usuario y configuración general

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

  const cambiarFotoPerfil = async () => {
    try {
      setCambiandoFoto(true);
      const uriPersistida = await MultimediaServicio.seleccionarFotoPerfil();
      if (uriPersistida && usuario) {
        BDService.actualizarAvatarUsuarioSync(usuario.id, uriPersistida);
        actualizarAvatar(uriPersistida);
        await Haptica.exito();
        Alert.alert('Foto actualizada', 'Tu foto de perfil fue actualizada correctamente.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo actualizar la foto.');
    } finally {
      setCambiandoFoto(false);
    }
  };

  const probarBiometria = async () => {
    await Haptica.seleccion();
    const ok = await autenticarBiometria();
    if (ok) {
      await Haptica.exito();
      Alert.alert('Identidad verificada', 'Autenticación biométrica exitosa.');
    } else {
      await Haptica.error();
      Alert.alert('Error', 'No se pudo verificar la huella o el rostro.');
    }
  };

  const abrirPortalMunicipal = async () => {
    await Haptica.seleccion();
    await WebBrowser.openBrowserAsync('https://villaguay.gob.ar/deportes');
  };

  const handleCerrarSesion = () => {
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
        <Pressable onPress={cambiarFotoPerfil} style={styles.avatarContenedor} disabled={cambiandoFoto}>
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
            {usuario?.nombre || 'Usuario'}
          </Text>
          <Text style={[styles.email, { color: colores.textoSecundario }]}>
            {usuario?.email || 'usuario@villaguay.gob.ar'}
          </Text>
          <View style={styles.filaRol}>
            <Text style={[styles.rol, { color: Colores.primarioClaro }]}>
              Rol: {(usuario?.rol || 'jugador').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Historial de penalizaciones */}
      <View style={[styles.tarjetaMetricas, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
        <View style={styles.itemMetrica}>
          <Text style={[styles.valorMetrica, { color: colores.texto }]}>
            {usuario?.cancelacionesTardias || 0}
          </Text>
          <Text style={[styles.etiquetaMetrica, { color: colores.textoMuted }]}>
            Cancelaciones tardías
          </Text>
        </View>
        <View style={[styles.separadorMetrica, { backgroundColor: colores.borde }]} />
        <View style={styles.itemMetrica}>
          <Text style={[styles.valorMetrica, { color: colores.texto }]}>
            {usuario?.ausencias || 0}
          </Text>
          <Text style={[styles.etiquetaMetrica, { color: colores.textoMuted }]}>
            Ausencias
          </Text>
        </View>
      </View>

      {/* Preferencias */}
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

      {/* Información Municipal */}
      <View style={styles.seccion}>
        <Text style={[styles.tituloSeccion, { color: colores.textoSecundario }]}>INFORMACIÓN MUNICIPAL</Text>

        <Pressable
          style={({ pressed }) => [
            styles.filaOpcion,
            { backgroundColor: colores.tarjeta, borderColor: colores.borde, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={abrirPortalMunicipal}
        >
          <View style={styles.filaOpcionIzq}>
            <Icono nombre="globe-outline" size={20} color={Colores.primarioClaro} />
            <Text style={[styles.textoOpcion, { color: colores.texto }]}>Sitio Municipal de Deportes</Text>
          </View>
          <Icono nombre="open-outline" size={18} color={colores.textoMuted} />
        </Pressable>

        <View style={[styles.tarjetaInfo, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
          <Icono nombre="business-outline" size={20} color={Colores.primarioClaro} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.tituloInfo, { color: colores.texto }]}>Dirección de Deportes de Villaguay</Text>
            <Text style={[styles.descInfo, { color: colores.textoMuted }]}>
              Complejo Polideportivo Municipal y Parque Berduc. Consultas y atención administrativa de 8 a 20 hs.
            </Text>
          </View>
        </View>
      </View>

      {/* Botón Salir */}
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
    marginBottom: 14,
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
    gap: 3,
  },
  nombre: {
    fontSize: 17,
    fontWeight: '800',
  },
  email: {
    fontSize: 12,
  },
  filaRol: {
    marginTop: 2,
  },
  rol: {
    fontSize: 11,
    fontWeight: '800',
  },
  tarjetaMetricas: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
  },
  itemMetrica: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  separadorMetrica: {
    width: 1,
    height: '70%',
  },
  valorMetrica: {
    fontSize: 18,
    fontWeight: '800',
  },
  etiquetaMetrica: {
    fontSize: 11,
    textAlign: 'center',
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
  tarjetaInfo: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginTop: 4,
  },
  tituloInfo: {
    fontSize: 13,
    fontWeight: '700',
  },
  descInfo: {
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
    marginTop: 6,
    marginBottom: 40,
  },
  textoBotonSalir: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
