// src/tipos/index.ts
// Tipos y modelos de datos

export interface Coordenadas {
  latitud: number;
  longitud: number;
}

export interface Espacio {
  id: string;
  nombre: string;
  deporteId: string;
  complejo: string;
  superficie: string;
  techado: boolean;
  iluminacion: boolean;
  capacidad: number;
  precioPorHora: number;
  coordenadas: Coordenadas;
  imagenes: string[];
  videoUrl: string | null;
  reglas: string;
  activo: boolean;
}

export interface Deporte {
  id: string;
  nombre: string;
  icono: string;
  color: string;
}

export type EstadoTurno = 'libre' | 'reservado' | 'mantenimiento';

export interface Turno {
  id: string;
  espacioId: string;
  fecha: string; // YYYY-MM-DD
  inicio: string; // HH:MM
  fin: string; // HH:MM
  estado: EstadoTurno;
  reservaId: string | null;
  precio: number;
}

export type EstadoReserva = 'confirmada' | 'cancelada' | 'cumplida';

export interface Reserva {
  id: string;
  turnoId: string;
  espacioId: string;
  usuarioId: string;
  cantidadPersonas: number;
  codigoQr: string;
  estado: EstadoReserva;
  creadaEn: string;
  cancelableHasta: string;
  conLuz?: boolean;
  montoTotal: number;
  nombreEspacio?: string;
}

export type Rol = 'jugador' | 'encargado' | 'administrador';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  rol: Rol;
  avatarUrl?: string | null;
  password?: string;
}

export interface RespuestaApi<T> {
  datos: T;
  mensaje?: string;
}
