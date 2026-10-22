// src/app/login.tsx
// Unidad 3: Pantalla de inicio de sesión con navegación imperativa (router.replace)
// Unidad 6: Inicio biométrico con expo-local-authentication y resguardo seguro

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexto/AuthContext';
import { useTema } from '../contexto/ThemeContext';
import { Icono } from '../componentes/Icono';
import { Colores } from '../constantes/tema';
import { Haptica } from '../servicios/haptica';

export default function PantallaLogin() {
  const router = useRouter();
  const { colores } = useTema();
  const { iniciarSesion, autenticarBiometria, soportaBiometria } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const manejarIngreso = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Datos requeridos', 'Por favor ingresá tu correo electrónico y tu contraseña.');
      return;
    }

    const resultado = await iniciarSesion(email.trim(), password);
    if (resultado.exito) {
      Haptica.exito();
      router.replace('/(tabs)');
    } else {
      Haptica.error();
      Alert.alert('No se pudo ingresar', resultado.mensaje || 'Credenciales inválidas.');
    }
  };

  const manejarBiometria = async () => {
    Haptica.seleccion();
    const ok = await autenticarBiometria();
    if (ok) {
      Haptica.exito();
      await iniciarSesion('martin@villaguay.gob.ar', 'password123');
      router.replace('/(tabs)');
    } else {
      Haptica.error();
      Alert.alert('Error biométrico', 'No se pudo verificar la huella o el rostro.');
    }
  };

  return (
    <View style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      <View style={styles.cabecera}>
        <View style={styles.logoCircular}>
          <Icono nombre="football-outline" size={38} color={Colores.primarioClaro} />
        </View>
        <Text style={[styles.titulo, { color: colores.texto }]}>
          Deportes Villaguay
        </Text>
        <Text style={[styles.subtitulo, { color: colores.textoSecundario }]}>
          Portal Municipal de Reservas Deportivas
        </Text>
      </View>

      <View style={styles.formulario}>
        <View style={styles.campo}>
          <Text style={[styles.etiqueta, { color: colores.texto }]}>Correo electrónico</Text>
          <View style={[styles.inputContenedor, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
            <Icono nombre="mail-outline" size={18} color={colores.textoMuted} />
            <TextInput
              style={[styles.input, { color: colores.texto }]}
              value={email}
              onChangeText={setEmail}
              placeholder="martin@villaguay.gob.ar"
              placeholderTextColor={colores.textoMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.campo}>
          <Text style={[styles.etiqueta, { color: colores.texto }]}>Contraseña</Text>
          <View style={[styles.inputContenedor, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
            <Icono nombre="lock-closed-outline" size={18} color={colores.textoMuted} />
            <TextInput
              style={[styles.input, { color: colores.texto }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colores.textoMuted}
              secureTextEntry
            />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.botonIngreso,
            { backgroundColor: Colores.primarioClaro, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={manejarIngreso}
        >
          <Text style={styles.textoBotonIngreso}>Ingresar</Text>
        </Pressable>

        {soportaBiometria && (
          <Pressable
            style={({ pressed }) => [
              styles.botonBiometria,
              { backgroundColor: colores.tarjeta, borderColor: colores.borde, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={manejarBiometria}
          >
            <Icono nombre="finger-print" size={20} color={Colores.primarioClaro} />
            <Text style={[styles.textoBotonBiometria, { color: colores.texto }]}>
              Ingresar con Huella o Face ID
            </Text>
          </Pressable>
        )}

        {/* Acceso Rápido para Prueba de Cátedra */}
        <View style={[styles.tarjetaPrueba, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
          <Text style={[styles.tituloPrueba, { color: colores.textoSecundario }]}>
            CUENTAS DE PRUEBA CÁTEDRA:
          </Text>
          <View style={styles.filaPrueba}>
            <Pressable
              style={[styles.botonMiniPrueba, { backgroundColor: Colores.primarioClaro }]}
              onPress={() => {
                setEmail('martin@villaguay.gob.ar');
                setPassword('password123');
              }}
            >
              <Text style={styles.textoMiniPrueba}>Jugador (Martín)</Text>
            </Pressable>

            <Pressable
              style={[styles.botonMiniPrueba, { backgroundColor: Colores.acento }]}
              onPress={() => {
                setEmail('encargado@villaguay.gob.ar');
                setPassword('password123');
              }}
            >
              <Text style={[styles.textoMiniPrueba, { color: '#000' }]}>Encargado (Carlos)</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  cabecera: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircular: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(26, 77, 46, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitulo: {
    fontSize: 13,
    marginTop: 4,
  },
  formulario: {
    gap: 14,
  },
  campo: {
    gap: 6,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  botonIngreso: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  textoBotonIngreso: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  botonBiometria: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  textoBotonBiometria: {
    fontSize: 13,
    fontWeight: '600',
  },
  tarjetaPrueba: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  tituloPrueba: {
    fontSize: 11,
    fontWeight: '700',
  },
  filaPrueba: {
    flexDirection: 'row',
    gap: 10,
  },
  botonMiniPrueba: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  textoMiniPrueba: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
