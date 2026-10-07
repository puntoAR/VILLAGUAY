import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useTema } from '../../src/contexto/ThemeContext';
import { useAuth } from '../../src/contexto/AuthContext';
import { Icono } from '../../src/componentes/Icono';
import { Colores } from '../../src/constantes/tema';

export default function TabsLayout() {
  const { esOscuro, colores } = useTema();
  const { usuario, esEncargadoOAdmin } = useAuth();
  const router = useRouter();

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
        headerRight: () => (
          <TouchableOpacity
            style={[
              styles.botonHeaderLogin,
              {
                backgroundColor: usuario
                  ? 'rgba(232, 170, 66, 0.25)'
                  : 'rgba(255, 255, 255, 0.22)',
              },
            ]}
            onPress={() => router.push('/login')}
            activeOpacity={0.7}
          >
            <Icono
              nombre={usuario ? 'person-circle-outline' : 'log-in-outline'}
              size={18}
              color={usuario ? Colores.acento : '#FFFFFF'}
            />
            <Text
              style={[
                styles.textoHeaderLogin,
                { color: usuario ? Colores.acento : '#FFFFFF' },
              ]}
            >
              {usuario ? usuario.nombre.split(' ')[0] : 'Ingresar'}
            </Text>
          </TouchableOpacity>
        ),
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
          href: esEncargadoOAdmin ? null : undefined,
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
          href: esEncargadoOAdmin ? undefined : null,
          title: usuario?.rol === 'encargado' ? 'Predio' : 'Dirección',
          headerTitle: usuario?.rol === 'encargado' ? 'Control Operativo de Predio' : 'Dirección de Deportes Villaguay',
          tabBarIcon: ({ color, focused }) => (
            <Icono
              nombre={
                usuario?.rol === 'encargado'
                  ? (focused ? 'clipboard' : 'clipboard-outline')
                  : (focused ? 'analytics' : 'analytics-outline')
              }
              size={22}
              color={color}
            />
          ),
          tabBarBadge: esEncargadoOAdmin ? (usuario?.rol === 'encargado' ? 'Predio' : 'Macro') : undefined,
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

const styles = StyleSheet.create({
  botonHeaderLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 14,
    gap: 5,
  },
  textoHeaderLogin: {
    fontSize: 12,
    fontWeight: '800',
  },
});
