// src/servicios/notificaciones.ts
// Notificaciones locales y canal para Android

import { Platform, LogBox } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Silenciar advertencia informativa de Expo Go en SDK 53
LogBox.ignoreLogs([
  '[expo-notifications]',
  'Push notifications (remote notifications) are unavailable in Expo Go',
  'Cannot find native module',
  'ExpoTopicSubscriptionModule',
]);

// Interceptar advertencia de consola informativa de expo-notifications en Expo Go
const advertenciaOriginal = console.warn;
console.warn = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('[expo-notifications]')) {
    return;
  }
  advertenciaOriginal(...args);
};

const esExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Importación defensiva compatible con Expo Go (donde FCM topics no están vinculados) y APK Standalone (EAS Build)
let Notifications: any = null;
if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
  } catch (error) {
    // Silenciar error de módulo nativo en Expo Go
  }
}

// 1. Configurar comportamiento en primer plano si el módulo está disponible
if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {}
}

export const NotificacionesServicio = {
  // Canal de notificaciones para Android
  async configurarCanalAndroid(): Promise<void> {
    if (Platform.OS === 'android' && Notifications && typeof Notifications.setNotificationChannelAsync === 'function') {
      try {
        await Notifications.setNotificationChannelAsync('turnos-villaguay', {
          name: 'Recordatorio de Turnos',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1A4D2E',
          sound: 'default',
        });
      } catch {}
    }
  },

  // 3. Solicitar permisos en tiempo de ejecución
  async solicitarPermisos(): Promise<boolean> {
    if (Platform.OS === 'web' || !Notifications) return false;
    try {
      const { status: actual } = await Notifications.getPermissionsAsync();
      let finalStatus = actual;
      if (actual !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch {
      return false;
    }
  },

  // 4. Programar recordatorio local para el turno (2 horas antes o inmediato en 5s si es próximo)
  async programarRecordatorio(nombreEspacio: string, inicio: string): Promise<string | null> {
    if (Platform.OS === 'web') return null;

    if (!Notifications) {
      console.log(`[Notificaciones - Expo Go] Recordatorio simulado: Turno en ${nombreEspacio} a las ${inicio} hs.`);
      return `notif-mock-${Date.now()}`;
    }

    try {
      const concedido = await this.solicitarPermisos();
      if (!concedido) return null;

      await this.configurarCanalAndroid();

      return await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏆 Deportes Villaguay — Recordatorio',
          body: `Tu turno en ${nombreEspacio} comienza hoy a las ${inicio} hs. ¡Llevá tu código QR listo en el celular!`,
          data: { inicio },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5, // Demostración inmediata a los 5 segundos
        },
      });
    } catch (e) {
      console.warn('[Notificaciones] Error al programar:', e);
      return null;
    }
  }
};
