// src/servicios/api.ts
// Respuestas estándar y cliente HTTP preparado para la API de la cátedra

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { RespuestaExito, RespuestaError, MetaApi } from '../tipos';

export function crearExito<T>(datos: T, meta?: MetaApi): RespuestaExito<T> {
  return { datos, meta };
}

export function crearError(codigo: string, mensaje: string): RespuestaError {
  return {
    error: {
      codigo,
      mensaje,
    },
  };
}

export function esError(respuesta: any): respuesta is RespuestaError {
  return Boolean(respuesta && typeof respuesta === 'object' && 'error' in respuesta);
}

// Configuración base para cuando la cátedra habilite los endpoints
export const API_BASE_URL = 'https://api-reservas-villaguay.uner.edu.ar/v1';

export class ClienteHttp {
  private urlBase: string;

  constructor(urlBase: string = API_BASE_URL) {
    this.urlBase = urlBase;
  }

  private async obtenerHeaders(): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (Platform.OS !== 'web') {
      try {
        const token = await SecureStore.getItemAsync('auth_bearer_token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch {}
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
