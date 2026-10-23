// src/app/_layout.tsx
// Enrutador principal y proveedores de la aplicación

import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, LogBox, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTema } from '../contexto/ThemeContext';
import { AuthProvider, useAuth } from '../contexto/AuthContext';
import { RedProvider } from '../contexto/RedContext';
import { BannerDesconexion } from '../componentes/BannerDesconexion';
import { Colores } from '../constantes/tema';
import { obtenerBD } from '../basedatos/sqlite';

// Ignorar avisos no críticos de entorno
LogBox.ignoreLogs([
  '[expo-notifications]',
  'Push notifications (remote notifications) are unavailable in Expo Go',
  'Cannot find native module',
  'ExpoTopicSubscriptionModule',
  'expo-notifications:',
]);

function NavegacionPrincipal() {
  const { esOscuro, colores } = useTema();
  const { usuario, cargando } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Control de sesión y redirección
  useEffect(() => {
    if (cargando) return;

    const enLogin = segments[0] === 'login';

    if (!usuario && !enLogin) {
      router.replace('/login');
    } else if (usuario && enLogin) {
      router.replace('/(tabs)');
    }
  }, [usuario, cargando, segments]);

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colores.fondo }}>
        <ActivityIndicator size="large" color={Colores.primarioClaro} />
      </View>
    );
  }

  return (
    <View style={[styles.contenedorExterior, { backgroundColor: esOscuro ? '#0B130E' : '#E2E8F0' }]}>
      <View
        style={[
          styles.marcoResponsive,
          {
            backgroundColor: colores.fondo,
            borderColor: esOscuro ? '#1E3A27' : '#CBD5E1',
          },
        ]}
      >
        <StatusBar style={esOscuro ? 'light' : 'dark'} />
        <BannerDesconexion />

        <Stack
          initialRouteName={usuario ? '(tabs)' : 'login'}
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
            }}
          />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="espacio/[id]"
            options={{
              title: 'Detalle de Cancha',
              headerBackTitle: 'Volver',
            }}
          />
          <Stack.Screen
            name="escaner"
            options={{
              title: 'Control de Acceso QR',
              headerBackTitle: 'Atrás',
            }}
          />
          <Stack.Screen name="+not-found" options={{ title: 'No encontrado' }} />
        </Stack>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorExterior: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcoResponsive: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 500 : undefined,
    height: '100%',
    overflow: 'hidden',
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'web' ? 0.12 : 0,
    shadowRadius: 20,
    elevation: Platform.OS === 'web' ? 8 : 0,
  },
});

export default function RootLayout() {
  useEffect(() => {
    obtenerBD().catch(err => {
      console.warn('[SQLite] Inicialización:', err);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RedProvider>
          <AuthProvider>
            <NavegacionPrincipal />
          </AuthProvider>
        </RedProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
