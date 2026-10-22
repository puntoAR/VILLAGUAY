// src/app/(tabs)/_layout.tsx
// Unidad 3: Navegación por pestañas (Tabs) con 4 secciones recomendadas (3 a 5)

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTema } from '../../contexto/ThemeContext';
import { Icono } from '../../componentes/Icono';
import { Colores } from '../../constantes/tema';

export default function TabsLayout() {
  const { esOscuro, colores } = useTema();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const alturaInferior = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: esOscuro ? Colores.oscuro.tarjeta : Colores.primario,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
        },
        headerRight: () => (
          <Pressable
            style={({ pressed }) => [
              styles.botonScanner,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => router.push('/escaner')}
          >
            <Icono nombre="qr-code-outline" size={20} color="#FFFFFF" />
          </Pressable>
        ),
        tabBarStyle: {
          backgroundColor: esOscuro ? Colores.oscuro.tarjeta : '#FFFFFF',
          borderTopColor: colores.borde,
          height: 58 + alturaInferior,
          paddingBottom: alturaInferior,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colores.acento,
        tabBarInactiveTintColor: colores.textoMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Canchas',
          headerTitle: 'Deportes Villaguay',
          tabBarIcon: ({ color, focused }) => (
            <Icono
              nombre={focused ? 'football' : 'football-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="mapa"
        options={{
          title: 'Mapa',
          headerTitle: 'Complejos Deportivos',
          tabBarIcon: ({ color, focused }) => (
            <Icono
              nombre={focused ? 'map' : 'map-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="turnos"
        options={{
          title: 'Mis Turnos',
          headerTitle: 'Mis Reservas',
          tabBarIcon: ({ color, focused }) => (
            <Icono
              nombre={focused ? 'calendar' : 'calendar-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Mi Perfil',
          headerTitle: 'Perfil y Preferencias',
          tabBarIcon: ({ color, focused }) => (
            <Icono
              nombre={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  botonScanner: {
    marginRight: 16,
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});
