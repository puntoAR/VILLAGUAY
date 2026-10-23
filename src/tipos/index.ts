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
  fecha: string;
  inicio: string;
  fin: string;
  estado: EstadoTurno;
  reservaId: string | null;
  motivoBloqueo: string | null;
  precio: number;
}

export type EstadoReserva = 'confirmada' | 'cancelada' | 'cumplida' | 'ausente';

export interface Reserva {
  id: string;
  turnoId: string;
  espacioId: string;
  usuarioId: string;
  cantidadPersonas: number;
  codigoQr: string;
  estado: EstadoReserva;
  ingresoEn: string | null;
  creadaEn: string;
  cancelableHasta: string;
  conLuz?: boolean;
  montoTotal?: number;
  nombreUsuario?: string;
  telefonoUsuario?: string;
  nombreEspacio?: string;
}

export interface RespuestaAuth {
  usuario: Usuario;
  token: string;
}

export interface ReservaFija {
  id: string;
  espacioId: string;
  titular: string;
  dia: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  inicio: string;
  fin: string;
  desde: string;
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