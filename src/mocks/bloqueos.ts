import { BloqueoMantenimiento } from '../tipos';

export const BLOQUEOS_MOCK: BloqueoMantenimiento[] = [
  {
    id: 'bloq-01',
    espacioId: 'esp-03',
    fecha: '2026-09-08',
    inicio: null, // Todo el día
    fin: null,
    motivo: 'Cancha anegada por lluvia intensa. Inutilizable por 48 hs.',
    creadoEn: '2026-09-07T08:00:00-03:00'
  },
  {
    id: 'bloq-02',
    espacioId: 'esp-02',
    fecha: '2026-09-19',
    inicio: '20:00',
    fin: '21:00',
    motivo: 'Mantenimiento preventivo de luminarias LED',
    creadoEn: '2026-09-06T12:00:00-03:00'
  }
];
