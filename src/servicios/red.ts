import * as Network from 'expo-network';
import { useState, useEffect } from 'react';

export const RedServicio = {
  async estaConectado(): Promise<boolean> {
    try {
      const estado = await Network.getNetworkStateAsync();
      return Boolean(estado.isConnected && estado.isInternetReachable !== false);
    } catch {
      return true; // Fallback optimista
    }
  }
};

export function useEstadoRed() {
  const [conectado, setConectado] = useState(true);

  useEffect(() => {
    let montado = true;
    const verificar = async () => {
      const ok = await RedServicio.estaConectado();
      if (montado) setConectado(ok);
    };

    verificar();
    const intervalo = setInterval(verificar, 6000);
    return () => {
      montado = false;
      clearInterval(intervalo);
    };
  }, []);

  return conectado;
}
