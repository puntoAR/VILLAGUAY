import React, { useEffect } from 'react';
import { View, StyleSheet, LogBox, Platform } from 'react-native';
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

// Control de rutas privadas (el catálogo y la disponibilidad son públicos)
function ProtectorRutas() {
  const { usuario, cargando } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;

    const rutaActual = segments[0] as string;

    // El escáner de puerta es exclusivo para encargados y administradores
    if (rutaActual === 'escaner' && (!usuario || usuario.rol === 'jugador')) {
      router.replace('/login');
    }
  }, [usuario, cargando, segments]);

  return null;
}

function ContenidoPrincipal() {
  const { esOscuro, colores } = useTema();
  const { cargando } = useAuth();

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
          initialRouteName="(tabs)"
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
