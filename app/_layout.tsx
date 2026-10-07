import React, { useEffect } from 'react';
import { View, StyleSheet, LogBox } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTema } from '../src/contexto/ThemeContext';
import { AuthProvider, useAuth } from '../src/contexto/AuthContext';
import { RedProvider } from '../src/contexto/RedContext';
import { BannerDesconexion } from '../src/componentes/BannerDesconexion';
import { EstadoCarga } from '../src/componentes/EstadoCarga';
import { Colores } from '../src/constantes/tema';

// Ignorar advertencias no críticas de módulos nativos en Expo Go
LogBox.ignoreLogs([
  'expo-notifications:',
  'Cannot find native module',
  'ExpoTopicSubscriptionModule',
]);

// Guardián de autenticación: la app va directo al login y espera a que el usuario se loguee
function ProtectorRutas() {
  const { usuario, cargando } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;

    const enLogin = segments[0] === 'login';

    if (!usuario && !enLogin) {
      // Si no hay usuario y no está en login, redirige de inmediato a la pantalla de login
      router.replace('/login');
    } else if (usuario && enLogin) {
      // Si ya está autenticado y sigue en login, ingresa a las canchas
      router.replace('/(tabs)');
    }
  }, [usuario, cargando, segments]);

  return null;
}

function ContenidoPrincipal() {
  const { esOscuro, colores } = useTema();
  const { cargando } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <StatusBar style={esOscuro ? 'light' : 'dark'} />
      <BannerDesconexion />

      <Stack
        initialRouteName="login"
        screenOptions={{
          headerStyle: {
            backgroundColor: esOscuro ? Colores.oscuro.tarjeta : Colores.primario,
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
          contentStyle: {
            backgroundColor: colores.fondo,
          },
        }}
      >
        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="espacio/[id]"
          options={{
            title: 'Detalle del Espacio',
            headerBackTitle: 'Atrás',
          }}
        />
        <Stack.Screen
          name="grilla/[id]"
          options={{
            title: 'Disponibilidad de Turnos',
            headerBackTitle: 'Cancha',
          }}
        />
        <Stack.Screen
          name="reserva/[id]"
          options={{
            title: 'Mi Turno y Código QR',
            headerBackTitle: 'Reservas',
          }}
        />
        <Stack.Screen
          name="escaner"
          options={{
            title: 'Control de Ingreso en Puerta',
            headerBackTitle: 'Volver',
          }}
        />
        <Stack.Screen name="+not-found" options={{ title: 'No encontrado' }} />
      </Stack>

      {/* Control reactivo de acceso */}
      <ProtectorRutas />

      {/* Overlay de carga mientras inicializa SQLite y credenciales */}
      {cargando && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colores.fondo, zIndex: 999 }]}>
          <EstadoCarga mensaje="Iniciando sistema de reservas..." />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RedProvider>
          <AuthProvider>
            <ContenidoPrincipal />
          </AuthProvider>
        </RedProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
