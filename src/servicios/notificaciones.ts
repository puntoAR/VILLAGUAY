import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const esExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Importación defensiva compatible con Expo Go (SDK 53/54) y APK Standalone (EAS Build)
let Notifications: typeof import('expo-notifications') | null = null;
if (!esExpoGo && Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
  } catch (error) {
    // En Expo Go las notificaciones remotas nativas están restringidas
  }
}

// Configurar el handler solo si no estamos en Expo Go y el módulo está disponible
if (!esExpoGo && Notifications && typeof Notifications.setNotificationHandler === 'function') {
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
  } catch (e) {
    // Silenciar error en modo desarrollo
  }
}

export const NotificacionesServicio = {
  async solicitarPermisos(): Promise<boolean> {
    if (Platform.OS === 'web' || !Notifications) return false;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch {
      return false;
    }
  },

  // Recordatorio programado 2 horas antes del turno
  async programarRecordatorioTurno(
    reservaId: string,
    nombreEspacio: string,
    fecha: string,
    inicio: string
  ): Promise<string | null> {
    if (Platform.OS === 'web') return null;

    if (!Notifications) {
      console.log(`[Notificaciones - Modo Expo Go] Recordatorio programado: Tu turno en ${nombreEspacio} es el ${fecha} a las ${inicio} hs.`);
      return `notif-mock-${Date.now()}`;
    }

    try {
      const concedido = await this.solicitarPermisos();
      if (!concedido) return null;

      // Calcular fecha y hora del turno menos 2 horas
      const [anio, mes, dia] = fecha.split('-').map(Number);
      const [hora, min] = inicio.split(':').map(Number);
      const fechaTurno = new Date(anio, mes - 1, dia, hora, min);
      const fechaAviso = new Date(fechaTurno.getTime() - 2 * 60 * 60 * 1000);

      const ahora = new Date();
      if (fechaAviso.getTime() <= ahora.getTime()) {
        // Si faltan menos de 2 horas, programar aviso en 5 segundos
        return await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Recordatorio de Turno - Villaguay Deportes',
            body: `Tu turno en ${nombreEspacio} es hoy a las ${inicio} hs. ¡No olvides llevar tu código QR!`,
            data: { reservaId },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 },
        });
      }

      return await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Recordatorio de Turno - Villaguay Deportes',
          body: `Recordatorio: Tu turno en ${nombreEspacio} comienza en 2 horas (${inicio} hs).`,
          data: { reservaId },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fechaAviso },
      });
    } catch (e) {
      console.warn('[Notificaciones] No se pudo programar:', e);
      return null;
    }
  },

  // Notificación de aviso por suspensión de lluvia o mantenimiento
  async avisarSuspension(nombreEspacio: string, motivo: string): Promise<void> {
    if (Platform.OS === 'web') return;

    if (!Notifications) {
      console.log(`[Notificaciones - Modo Expo Go] Aviso de suspensión: ${nombreEspacio} suspendido por ${motivo}`);
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Aviso Importante: Suspensión de Turno',
          body: `El espacio ${nombreEspacio} ha sido suspendido. Motivo: ${motivo}`,
        },
        trigger: null, // Inmediata
      });
    } catch (e) {
      console.warn('[Notificaciones] Error al avisar suspensión:', e);
    }
  },

  // Notificación cuando se libera un turno de un espacio favorito
  async avisarTurnoLiberado(nombreEspacio: string, fecha: string, hora: string): Promise<void> {
    if (Platform.OS === 'web') return;

    if (!Notifications) {
      console.log(`[Notificaciones - Modo Expo Go] Turno liberado: ${nombreEspacio} el ${fecha} a las ${hora} hs.`);
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⭐ ¡Turno liberado en tu espacio favorito!',
          body: `Se liberó un turno en ${nombreEspacio} para el ${fecha} a las ${hora} hs. ¡Aprovechalo antes de que se ocupe!`,
        },
        trigger: null,
      });
    } catch (e) {
      console.warn('[Notificaciones] Error al avisar turno liberado:', e);
    }
  },
};
