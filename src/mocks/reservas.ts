import { Reserva } from '../tipos';

export const RESERVAS_MOCK: Reserva[] = [
  {
    id: 'res-1180',
    turnoId: 'tur-0219-19',
    espacioId: 'esp-02',
    usuarioId: 'usr-207',
    cantidadPersonas: 10,
    codigoQr: 'VGY-1180-0219-19',
    estado: 'confirmada',
    ingresoEn: null,
    creadaEn: '2026-09-06T21:04:00-03:00',
    cancelableHasta: '2026-09-19T15:00:00-03:00'
  },
  {
    id: 'res-1181',
    turnoId: 'tur-0110-10',
    espacioId: 'esp-01',
    usuarioId: 'usr-207',
    cantidadPersonas: 10,
    codigoQr: 'VGY-1181-0110-10',
    estado: 'cumplida',
    ingresoEn: '2026-09-05T10:05:00-03:00',
    creadaEn: '2026-09-02T14:00:00-03:00',
    cancelableHasta: '2026-09-05T06:00:00-03:00'
  },
  {
    id: 'res-1182',
    turnoId: 'tur-0812-16',
    espacioId: 'esp-08',
    usuarioId: 'usr-207',
    cantidadPersonas: 4,
    codigoQr: 'VGY-1182-0812-16',
    estado: 'cancelada',
    ingresoEn: null,
    creadaEn: '2026-09-01T12:00:00-03:00',
    cancelableHasta: '2026-09-03T12:00:00-03:00'
  }
];
