import { obtenerBD } from '../basedatos/sqlite';
import { BloqueoMantenimiento, RespuestaExito, RespuestaError } from '../tipos';
import { crearExito, crearError } from './api';
import { BLOQUEOS_MOCK } from '../mocks/bloqueos';
import { NotificacionesServicio } from './notificaciones';

export const BloqueosServicio = {
  async obtenerBloqueos(): Promise<RespuestaExito<BloqueoMantenimiento[]> | RespuestaError> {
    try {
      const db = await obtenerBD();
      const rows = await db.getAllAsync<BloqueoMantenimiento>('SELECT * FROM bloqueos ORDER BY fecha DESC');
      return crearExito(rows);
    } catch {
      return crearExito(BLOQUEOS_MOCK);
    }
  },

  async crearBloqueo(bloqueo: Omit<BloqueoMantenimiento, 'id' | 'creadoEn'> & { nombreEspacio?: string }): Promise<RespuestaExito<BloqueoMantenimiento> | RespuestaError> {
    try {
      const db = await obtenerBD();
      const nuevo: BloqueoMantenimiento = {
        ...bloqueo,
        id: `bloq-${Date.now().toString().slice(-4)}`,
        creadoEn: new Date().toISOString(),
      };

      await db.runAsync(
        'INSERT INTO bloqueos (id, espacioId, fecha, inicio, fin, motivo, creadoEn) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nuevo.id, nuevo.espacioId, nuevo.fecha, nuevo.inicio || null, nuevo.fin || null, nuevo.motivo, nuevo.creadoEn]
      );

      BLOQUEOS_MOCK.push(nuevo);

      if (bloqueo.nombreEspacio) {
        await NotificacionesServicio.avisarSuspension(bloqueo.nombreEspacio, bloqueo.motivo);
      }

      return crearExito(nuevo);
    } catch {
      return crearError('ERROR_CREAR_BLOQUEO', 'No se pudo registrar el bloqueo.');
    }
  },

  async eliminarBloqueo(id: string): Promise<RespuestaExito<boolean> | RespuestaError> {
    try {
      const db = await obtenerBD();
      await db.runAsync('DELETE FROM bloqueos WHERE id = ?', [id]);
      const index = BLOQUEOS_MOCK.findIndex(b => b.id === id);
      if (index !== -1) BLOQUEOS_MOCK.splice(index, 1);
      return crearExito(true);
    } catch {
      return crearError('ERROR_ELIMINAR_BLOQUEO', 'No se pudo remover el bloqueo.');
    }
  }
};
