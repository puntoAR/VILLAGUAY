// src/app/login.tsx
// Pantalla de inicio de sesión

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
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
  const [procesando, setProcesando] = useState(false);

  const manejarIngreso = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Datos requeridos', 'Por favor ingresá tu correo electrónico y tu contraseña.');
      return;
    }

    try {
      setProcesando(true);
      const resultado = await iniciarSesion(email.trim(), password);
      if (resultado.exito) {
        await Haptica.exito();
        router.replace('/(tabs)');
      } else {
        await Haptica.error();
        Alert.alert('No se pudo ingresar', resultado.mensaje || 'Credenciales inválidas.');
      }
    } catch (e: any) {
      await Haptica.error();
      Alert.alert('Error', e?.message || 'Ocurrió un error al iniciar sesión.');
    } finally {
      setProcesando(false);
    }
  };

  const manejarBiometria = async () => {
    await Haptica.seleccion();
    const ok = await autenticarBiometria();
    if (ok) {
      await Haptica.exito();
      await iniciarSesion('usuario@villaguay.gob.ar', 'password123');
      router.replace('/(tabs)');
    } else {
      await Haptica.error();
      Alert.alert('Error biométrico', 'No se pudo verificar la identidad.');
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
              placeholder="usuario@villaguay.gob.ar"
              placeholderTextColor={colores.textoMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
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
            { backgroundColor: Colores.primarioClaro, opacity: pressed || procesando ? 0.8 : 1 },
          ]}
          onPress={manejarIngreso}
          disabled={procesando}
        >
          {procesando ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.textoBotonIngreso}>Ingresar</Text>
          )}
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

        {/* Accesos rápidos para probar fácilmente */}
        <View style={[styles.tarjetaPrueba, { backgroundColor: colores.tarjeta, borderColor: colores.borde }]}>
          <Text style={[styles.tituloPrueba, { color: colores.textoSecundario }]}>
            ACCESOS RÁPIDOS DE PRUEBA:
          </Text>
          <View style={styles.filaPrueba}>
            <Pressable
              style={[styles.botonMiniPrueba, { backgroundColor: Colores.primarioClaro }]}
              onPress={() => {
                setEmail('usuario@villaguay.gob.ar');
                setPassword('password123');
              }}
            >
              <Text style={styles.textoMiniPrueba}>Usuario</Text>
            </Pressable>

            <Pressable
              style={[styles.botonMiniPrueba, { backgroundColor: Colores.acento }]}
              onPress={() => {
                setEmail('marcelo@villaguay.gob.ar');
                setPassword('password123');
              }}
            >
              <Text style={[styles.textoMiniPrueba, { color: '#000000' }]}>Encargado</Text>
            </Pressable>

            <Pressable
              style={[styles.botonMiniPrueba, { backgroundColor: '#3B82F6' }]}
              onPress={() => {
                setEmail('nahuel@villaguay.gob.ar');
                setPassword('password123');
              }}
            >
              <Text style={styles.textoMiniPrueba}>Director</Text>
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
    gap: 8,
  },
  botonMiniPrueba: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  textoMiniPrueba: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
