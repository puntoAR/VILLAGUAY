import React from 'react';
import { LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTema } from '../src/contexto/ThemeContext';
import { AuthProvider } from '../src/contexto/AuthContext';
import { RedProvider } from '../src/contexto/RedContext';
import { BannerDesconexion } from '../src/componentes/BannerDesconexion';
import { Colores } from '../src/constantes/tema';

// Ocultar alertas flotantes no críticas de Expo Go para ver la interfaz directamente
LogBox.ignoreAllLogs(true);

function ContenidoPrincipal() {
  const { esOscuro, colores } = useTema();

  return (
    <>
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
        <Stack.Screen
          name="login"
          options={{
            title: 'Iniciar Sesión',
            presentation: 'modal',
          }}
        />
        <Stack.Screen name="+not-found" options={{ title: 'No encontrado' }} />
      </Stack>
    </>
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
