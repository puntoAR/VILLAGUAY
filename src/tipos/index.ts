// src/tipos/index.ts
// Tipos del Sistema de Reservas Deportivas - Dirección de Deportes de Villaguay

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

export type EstadoTurno = 'libre' | 'reservado' | 'fijo' | 'mantenimiento';

export interface Turno {
  id: string;
  espacioId: string;
  fecha: string; // "AAAA-MM-DD"
  inicio: string; // "HH:MM"
  fin: string; // "HH:MM"
  estado: EstadoTurno;
  reservaId: string | null;
  motivoBloqueo: string | null;
  precio: number;
}

export type EstadoReserva = 'confirmada' | 'cancelada' | 'cumplida' | 'ausente';
export type EstadoPago = 'pagado' | 'pendiente';

export interface Reserva {
  id: string;
  turnoId: string;
  espacioId: string;
  usuarioId: string;
  cantidadPersonas: number;
  codigoQr: string;
  estado: EstadoReserva;
  ingresoEn: string | null;
  creadaEn: string; // ISO 8601
  cancelableHasta: string; // ISO 8601
  conLuz?: boolean;
  montoTotal?: number;
  estadoPago?: EstadoPago;
  nombreUsuario?: string;
  telefonoUsuario?: string;
  nombreEspacio?: string;
  fecha?: string; // "AAAA-MM-DD"
  inicio?: string; // "HH:MM"
  fin?: string; // "HH:MM"
}

export interface MetricasMacro {
  recaudacionTotal: number;
  recaudacionCobrada: number;
  recaudacionPendiente: number;
  totalReservas: number;
  tasaOcupacion: number;
  reservasPorDeporte: { deporte: string; cantidad: number; color: string }[];
  rankingEspacios: { nombre: string; reservas: number }[];
  totalCanceladas: number;
  totalAusentes: number;
}

export interface ReservaFija {
  id: string;
  espacioId: string;
  titular: string;
  dia: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = domingo
  inicio: string;
  fin: string;
  desde: string; // "AAAA-MM-DD"
  hasta: string | null;
  activa: boolean;
}

export type Rol = 'jugador' | 'encargado' | 'administrador';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  rol: Rol;
  espaciosFavoritos: string[];
  cancelacionesTardias: number;
  ausencias: number;
  password?: string;
  avatarUrl?: string | null;
}

export interface CredencialesLogin {
  email: string;
  password?: string;
}

export interface DatosRegistro {
  nombre: string;
  email: string;
  telefono: string;
  password?: string;
  rol?: Rol;
}

export interface RespuestaAuth {
  usuario: Usuario;
  token: string;
}

export interface BloqueoMantenimiento {
  id: string;
  espacioId: string;
  fecha: string;
  inicio: string | null;
  fin: string | null;
  motivo: string;
  creadoEn: string;
}

export interface MetaApi {
  total: number;
  pagina: number;
  porPagina: number;
}

export interface RespuestaExito<T> {
  datos: T;
  meta?: MetaApi;
}

export interface DetalleErrorApi {
  codigo: string;
  mensaje: string;
}

export interface RespuestaError {
  error: DetalleErrorApi;
}
