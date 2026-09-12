import React from 'react';
import { Tabs } from 'expo-router';
import { useTema } from '../../src/contexto/ThemeContext';
import { useAuth } from '../../src/contexto/AuthContext';
import { Icono } from '../../src/componentes/Icono';
import { Colores } from '../../src/constantes/tema';

export default function TabsLayout() {
  const { esOscuro, colores } = useTema();
  const { esEncargadoOAdmin } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: esOscuro ? Colores.oscuro.tarjeta : Colores.primario,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        tabBarStyle: {
          backgroundColor: esOscuro ? Colores.oscuro.tarjeta : '#FFFFFF',
          borderTopColor: colores.borde,
          height: 60,
          paddingBottom: 8,
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
          headerTitle: 'Reservas Deportivas Villaguay',
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
          title: 'Complejos',
          headerTitle: 'Ubicación de Complejos',
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
        name="mis-reservas"
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
        name="admin"
        options={{
          title: 'Gestión',
          headerTitle: 'Panel de Encargado y Admin',
          tabBarIcon: ({ color, focused }) => (
            <Icono
              nombre={focused ? 'shield-checkmark' : 'shield-checkmark-outline'}
              size={22}
              color={color}
            />
          ),
          tabBarBadge: esEncargadoOAdmin ? 'Admin' : undefined,
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          headerTitle: 'Mi Cuenta y Preferencias',
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
