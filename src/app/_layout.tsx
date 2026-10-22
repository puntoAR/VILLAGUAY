// src/app/_layout.tsx
// Unidad 3: Enrutador raíz con Stack, layout de contenedores y proveedores globales
// Unidad 5: Inicialización sincrónica de SQLite y QueryClientProvider

import React, { useEffect } from 'react';
import { View, StyleSheet, LogBox, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTema } from '../contexto/ThemeContext';
import { AuthProvider, useAuth } from '../contexto/AuthContext';
import { RedProvider } from '../contexto/RedContext';
import { BannerDesconexion } from '../componentes/BannerDesconexion';
import { Colores } from '../constantes/tema';
import { inicializarBaseDatosSync } from '../basedatos/sqlite';

// Ignorar advertencias no críticas en emulador / Expo Go
LogBox.ignoreLogs([
  '[expo-notifications]',
  'Push notifications (remote notifications) are unavailable in Expo Go',
  'Cannot find native module',
  'ExpoTopicSubscriptionModule',
  'expo-notifications:',
]);

// Instanciar cliente global de TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutos de caché fresca
      retry: 1,
    },
  },
});

function NavegacionPrincipal() {
  const { esOscuro, colores } = useTema();
  const { usuario, cargando } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Control de Acceso y Protección de Rutas (Unidad 3 y 6)
  useEffect(() => {
    if (cargando) return;

    const enLogin = segments[0] === 'login';

    if (!usuario && !enLogin) {
      // Si no hay sesión activa, obligar ingreso por Login
      router.replace('/login');
    } else if (usuario && enLogin) {
      // Si ya está autenticado y está en Login, navegar al catálogo
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
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
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
  );
}

export default function RootLayout() {
  // Inicialización sincrónica inmediata de SQLite antes de montar las pantallas
  try {
    inicializarBaseDatosSync();
  } catch (e) {
    console.warn('[SQLite] Error inicializando base de datos:', e);
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RedProvider>
            <AuthProvider>
              <NavegacionPrincipal />
            </AuthProvider>
          </RedProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
