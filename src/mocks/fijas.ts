import { ReservaFija } from '../tipos';

export const RESERVAS_FIJAS_MOCK: ReservaFija[] = [
  {
    id: 'fij-07',
    espacioId: 'esp-02',
    titular: 'Grupo de los martes',
    dia: 2, // Martes
    inicio: '21:00',
    fin: '22:00',
    desde: '2026-03-01',
    hasta: null,
    activa: true
  },
  {
    id: 'fij-08',
    espacioId: 'esp-01',
    titular: 'Club Atlético Sarmiento - Sub 17',
    dia: 4, // Jueves
    inicio: '18:00',
    fin: '20:00',
    desde: '2026-03-01',
    hasta: null,
    activa: true
  },
  {
    id: 'fij-09',
    espacioId: 'esp-04',
    titular: 'Liga Municipal de Básquet',
    dia: 6, // Sábado
    inicio: '09:00',
    fin: '12:00',
    desde: '2026-04-01',
    hasta: null,
    activa: true
  }
];
