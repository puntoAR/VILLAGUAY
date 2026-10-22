// src/servicios/sensores.ts
// Unidad 4: Sensores del dispositivo (Acelerómetro) siguiendo el ciclo formal exigido por la cátedra

import { useEffect } from 'react';
import { Accelerometer } from 'expo-sensors';
import { Platform } from 'react-native';
import { Haptica } from './haptica';

export function useAcelerometroShake(onShake: () => void, umbral: number = 2.4) {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    let sub: any = null;

    // 1. Comprobar disponibilidad del hardware en el dispositivo
    Accelerometer.isAvailableAsync().then(disponible => {
      if (!disponible) return;

      // 2. Establecer el intervalo de actualización (300 ms)
      Accelerometer.setUpdateInterval(300);

      // 3. Suscribir listener al acelerómetro
      sub = Accelerometer.addListener(({ x, y, z }) => {
        // Cálculo de magnitud de aceleración combinada: sqrt(x^2 + y^2 + z^2)
        const magnitud = Math.sqrt(x * x + y * y + z * z);

        // Si la magnitud supera el umbral de movimiento brusco (shake)
        if (magnitud > umbral) {
          Haptica.exito();
          onShake();
        }
      });
    });

    // 4. Liberar suscripción obligatoriamente al desmontar el componente
    return () => {
      if (sub && typeof sub.remove === 'function') {
        sub.remove();
      }
    };
  }, [onShake, umbral]);
}
