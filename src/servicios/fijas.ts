import { obtenerBD } from '../basedatos/sqlite';
import { ReservaFija, RespuestaExito, RespuestaError } from '../tipos';
import { crearExito, crearError } from './api';
import { RESERVAS_FIJAS_MOCK } from '../mocks/fijas';

export const ReservasFijasServicio = {
  async obtenerFijas(): Promise<RespuestaExito<ReservaFija[]> | RespuestaError> {
    try {
      const db = await obtenerBD();
      const rows = await db.getAllAsync<any>('SELECT * FROM reservas_fijas');
      const fijas: ReservaFija[] = rows.map(r => ({
        id: r.id,
        espacioId: r.espacioId,
        titular: r.titular,
        dia: r.dia as any,
        inicio: r.inicio,
        fin: r.fin,
        desde: r.desde,
        hasta: r.hasta || null,
        activa: Boolean(r.activa),
      }));
      return crearExito(fijas);
    } catch {
      return crearExito(RESERVAS_FIJAS_MOCK);
    }
  },

  async crearFija(fija: Omit<ReservaFija, 'id'>): Promise<RespuestaExito<ReservaFija> | RespuestaError> {
    try {
      const db = await obtenerBD();
      const nueva: ReservaFija = {
        ...fija,
        id: `fij-${Date.now().toString().slice(-4)}`
      };

      await db.runAsync(
        'INSERT INTO reservas_fijas (id, espacioId, titular, dia, inicio, fin, desde, hasta, activa) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [nueva.id, nueva.espacioId, nueva.titular, nueva.dia, nueva.inicio, nueva.fin, nueva.desde, nueva.hasta || null, nueva.activa ? 1 : 0]
      );

      RESERVAS_FIJAS_MOCK.push(nueva);
      return crearExito(nueva);
    } catch {
      return crearError('ERROR_CREAR_FIJA', 'No se pudo guardar la reserva fija.');
    }
  },

  async eliminarFija(id: string): Promise<RespuestaExito<boolean> | RespuestaError> {
    try {
      const db = await obtenerBD();
      await db.runAsync('DELETE FROM reservas_fijas WHERE id = ?', [id]);
      const idx = RESERVAS_FIJAS_MOCK.findIndex(f => f.id === id);
      if (idx !== -1) RESERVAS_FIJAS_MOCK.splice(idx, 1);
      return crearExito(true);
    } catch {
      return crearError('ERROR_ELIMINAR_FIJA', 'No se pudo eliminar la reserva fija.');
    }
  }
};
