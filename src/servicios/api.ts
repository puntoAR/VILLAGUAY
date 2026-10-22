// src/servicios/api.ts
// Cliente de API y sincronización con base local

import * as SecureStore from 'expo-secure-store';
import { Espacio, Turno, Reserva, RespuestaApi } from '../tipos';
import { BDService } from '../basedatos/sqlite';

// URL del backend
export const API_BASE_URL = 'https://api-reservas-villaguay.uner.edu.ar/v1';

// Cliente HTTP configurable con soporte para AbortController
export class ClienteHttp {
  private urlBase: string;

  constructor(urlBase: string = API_BASE_URL) {
    this.urlBase = urlBase;
  }

  // Interceptor para inyectar token Bearer desde expo-secure-store
  private async obtenerHeaders(): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    try {
      const token = await SecureStore.getItemAsync('auth_bearer_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // Ignorar en plataformas sin secure-store
    }
    return headers;
  }

  async get<T>(ruta: string, signal?: AbortSignal): Promise<T> {
    const headers = await this.obtenerHeaders();
    const respuesta = await fetch(`${this.urlBase}${ruta}`, {
      method: 'GET',
      headers,
      signal,
    });
    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}: ${respuesta.statusText}`);
    }
    return respuesta.json();
  }

  async post<T>(ruta: string, cuerpo: any, signal?: AbortSignal): Promise<T> {
    const headers = await this.obtenerHeaders();
    const respuesta = await fetch(`${this.urlBase}${ruta}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(cuerpo),
      signal,
    });
    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}: ${respuesta.statusText}`);
    }
    return respuesta.json();
  }
}

export const clienteHttp = new ClienteHttp();

// Capa de Servicio que integra API Remota + Persistencia Sincrónica en SQLite
export const ApiCatedraServicio = {
  // 1. Obtener canchas (Consulta API con fallback y caché en SQLite)
  async obtenerEspacios(filtroDeporte?: string): Promise<Espacio[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500); // 2.5s timeout para no trabar la UI

    try {
      // Llamada remota al backend
      const datosRemotos = await clienteHttp.get<Espacio[]>(
        `/espacios${filtroDeporte ? `?deporteId=${filtroDeporte}` : ''}`,
        controller.signal
      );
      clearTimeout(timeout);
      return datosRemotos;
    } catch {
      clearTimeout(timeout);
      // Persistencia local: Servir sincrónicamente desde SQLite
      return BDService.obtenerEspaciosSync(filtroDeporte);
    }
  },

  // 2. Obtener turnos de una cancha para una fecha
  async obtenerTurnos(espacioId: string, fecha: string): Promise<Turno[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    try {
      const datos = await clienteHttp.get<Turno[]>(
        `/turnos?espacioId=${espacioId}&fecha=${fecha}`,
        controller.signal
      );
      clearTimeout(timeout);
      return datos;
    } catch {
      clearTimeout(timeout);
      return BDService.obtenerTurnosDiaSync(espacioId, fecha);
    }
  },

  // 3. Crear reserva
  async crearReserva(datos: {
    espacioId: string;
    nombreEspacio: string;
    turnoId: string;
    usuarioId: string;
    cantidadPersonas: number;
    conLuz: boolean;
    montoTotal: number;
  }): Promise<Reserva> {
    try {
      return await clienteHttp.post<Reserva>('/reservas', datos);
    } catch {
      // Registrar y persistir en la base SQLite local
      return BDService.crearReservaSync(datos);
    }
  },

  // 4. Cancelar reserva
  async cancelarReserva(reservaId: string): Promise<boolean> {
    try {
      await clienteHttp.post(`/reservas/${reservaId}/cancelar`, {});
      BDService.cancelarReservaSync(reservaId);
      return true;
    } catch {
      return BDService.cancelarReservaSync(reservaId);
    }
  },

  // 5. Mis reservas
  async obtenerMisReservas(usuarioId: string): Promise<Reserva[]> {
    try {
      return await clienteHttp.get<Reserva[]>(`/reservas/usuario/${usuarioId}`);
    } catch {
      return BDService.obtenerMisReservasSync(usuarioId);
    }
  }
};
