// src/servicios/notificaciones.ts
// Notificaciones locales y recordatorios

import { Platform, LogBox } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

LogBox.ignoreLogs([
  '[expo-notifications]',
  'Push notifications (remote notifications) are unavailable in Expo Go',
  'Cannot find native module',
  'ExpoTopicSubscriptionModule',
]);

const advertenciaOriginal = console.warn;
console.warn = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('[expo-notifications]')) {
    return;
  }
  advertenciaOriginal(...args);
};

let Notifications: any = null;
if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
  } catch {}
}

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

  async programarRecordatorio(nombreEspacio: string, inicio: string): Promise<string | null> {
    if (Platform.OS === 'web') return null;

    if (!Notifications) {
      return `notif-mock-${Date.now()}`;
    }

    try {
      const concedido = await this.solicitarPermisos();
      if (!concedido) return null;

      await this.configurarCanalAndroid();

      return await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Deportes Villaguay',
          body: `Tu turno en ${nombreEspacio} comienza hoy a las ${inicio} hs. ¡Mostrá el código QR al ingresar!`,
          data: { inicio },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5,
        },
      });
    } catch {
      return null;
    }
  },

  async programarRecordatorioTurno(_reservaId: string, nombreEspacio: string, _fecha: string, inicio: string): Promise<string | null> {
    return await this.programarRecordatorio(nombreEspacio, inicio);
  },

  async avisarSuspension(nombreEspacio: string, motivo: string): Promise<string | null> {
    if (Platform.OS === 'web' || !Notifications) return null;
    try {
      const concedido = await this.solicitarPermisos();
      if (!concedido) return null;

      await this.configurarCanalAndroid();

      return await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Cancha Suspendida por Clima / Mantenimiento',
          body: `Atención: ${nombreEspacio} fue suspendida. Motivo: ${motivo}`,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
        },
      });
    } catch {
      return null;
    }
  },
};
