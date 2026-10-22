// src/servicios/notificaciones.ts
// Unidad 4: Notificaciones locales, canales prioritarios en Android y comportamiento en primer plano

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// 1. Configurar comportamiento en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificacionesServicio = {
  // 2. Inicializar canal prioritario para Android (Exigencia de la Cátedra)
  async configurarCanalAndroid(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('turnos-villaguay', {
        name: 'Recordatorio de Turnos',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1A4D2E',
        sound: 'default',
      });
    }
  },

  // 3. Solicitar permisos en tiempo de ejecución
  async solicitarPermisos(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
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
