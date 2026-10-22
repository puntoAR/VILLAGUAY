// src/app/_layout.tsx
// Unidad 3: Enrutador raíz con Stack, layout de contenedores y proveedores globales
// Unidad 5: Inicialización sincrónica de SQLite y QueryClientProvider

import React, { useEffect } from 'react';
import { View, StyleSheet, LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTema } from '../contexto/ThemeContext';
import { AuthProvider } from '../contexto/AuthContext';
import { RedProvider } from '../contexto/RedContext';
import { BannerDesconexion } from '../componentes/BannerDesconexion';
import { Colores } from '../constantes/tema';
import { inicializarBaseDatosSync } from '../basedatos/sqlite';

// Ignorar advertencias no críticas en emulador / Expo Go
LogBox.ignoreLogs([
  'expo-notifications:',
  'Cannot find native module',
  'ExpoTopicSubscriptionModule',
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

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <StatusBar style={esOscuro ? 'light' : 'dark'} />
      <BannerDesconexion />

      <Stack
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
        <Stack.Screen
          name="login"
          options={{
            title: 'Iniciar Sesión',
            headerBackTitle: 'Volver',
          }}
        />
        <Stack.Screen name="+not-found" options={{ title: 'No encontrado' }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  // Inicialización sincrónica de SQLite al levantar la aplicación
  useEffect(() => {
    try {
      inicializarBaseDatosSync();
    } catch (e) {
      console.warn('[SQLite] Error inicializando base de datos:', e);
    }
  }, []);

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
