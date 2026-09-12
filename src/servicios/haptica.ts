import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const Haptica = {
  // Vibración para ingreso exitoso verificado en la puerta
  async exitoIngreso() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  },

  // Vibración para ingreso inválido, turno vencido o cancha errónea
  async errorIngreso() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {}
  },

  // Toque suave para selección de turnos en grilla
  async seleccionSuave() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  },

  // Impacto medio al confirmar reserva
  async confirmacion() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  }
};
