import { obtenerBD } from '../basedatos/sqlite';
import { Espacio, Deporte, RespuestaExito, RespuestaError } from '../tipos';
import { crearExito, crearError } from './api';
import { ESPACIOS_MOCK } from '../mocks/espacios';
import { DEPORTES_MOCK } from '../mocks/deportes';

export const EspaciosServicio = {
  async obtenerEspacios(filtros?: { deporteId?: string; complejo?: string }): Promise<RespuestaExito<Espacio[]> | RespuestaError> {
    try {
      const db = await obtenerBD();
      let query = 'SELECT * FROM espacios WHERE activo = 1';
      const params: any[] = [];

      if (filtros?.deporteId) {
        query += ' AND deporteId = ?';
        params.push(filtros.deporteId);
      }
      if (filtros?.complejo) {
        query += ' AND complejo = ?';
        params.push(filtros.complejo);
      }

      const rows = await db.getAllAsync<any>(query, params);
      const espacios: Espacio[] = rows.map(r => ({
        id: r.id,
        nombre: r.nombre,
        deporteId: r.deporteId,
        complejo: r.complejo,
        superficie: r.superficie,
        techado: Boolean(r.techado),
        iluminacion: Boolean(r.iluminacion),
        capacidad: r.capacidad,
        precioPorHora: r.precioPorHora,
        coordenadas: { latitud: r.latitud, longitud: r.longitud },
        imagenes: JSON.parse(r.imagenes),
        videoUrl: r.videoUrl || null,
        reglas: r.reglas,
        activo: Boolean(r.activo),
      }));

      return crearExito(espacios, { total: espacios.length, pagina: 1, porPagina: 20 });
    } catch {
      let filtrados = [...ESPACIOS_MOCK];
      if (filtros?.deporteId) filtrados = filtrados.filter(e => e.deporteId === filtros.deporteId);
      if (filtros?.complejo) filtrados = filtrados.filter(e => e.complejo === filtros.complejo);
      return crearExito(filtrados, { total: filtrados.length, pagina: 1, porPagina: 20 });
    }
  },

  async obtenerEspacioPorId(id: string): Promise<RespuestaExito<Espacio> | RespuestaError> {
    try {
      const db = await obtenerBD();
      const r = await db.getFirstAsync<any>('SELECT * FROM espacios WHERE id = ?', [id]);
      if (!r) {
        const mock = ESPACIOS_MOCK.find(e => e.id === id);
        if (mock) return crearExito(mock);
        return crearError('ESPACIO_NO_ENCONTRADO', 'El espacio deportivo no existe.');
      }
      return crearExito({
        id: r.id,
        nombre: r.nombre,
        deporteId: r.deporteId,
        complejo: r.complejo,
        superficie: r.superficie,
        techado: Boolean(r.techado),
        iluminacion: Boolean(r.iluminacion),
        capacidad: r.capacidad,
        precioPorHora: r.precioPorHora,
        coordenadas: { latitud: r.latitud, longitud: r.longitud },
        imagenes: JSON.parse(r.imagenes),
        videoUrl: r.videoUrl || null,
        reglas: r.reglas,
        activo: Boolean(r.activo),
      });
    } catch {
      const mock = ESPACIOS_MOCK.find(e => e.id === id);
      if (mock) return crearExito(mock);
      return crearError('ESPACIO_NO_ENCONTRADO', 'El espacio deportivo no existe.');
    }
  },

  async obtenerDeportes(): Promise<RespuestaExito<Deporte[]> | RespuestaError> {
    try {
      const db = await obtenerBD();
      const rows = await db.getAllAsync<Deporte>('SELECT * FROM deportes');
      if (rows && rows.length > 0) {
        return crearExito(rows);
      }
      return crearExito(DEPORTES_MOCK);
    } catch {
      return crearExito(DEPORTES_MOCK);
    }
  },

  async actualizarPrecioPorHora(espacioId: string, nuevoPrecio: number): Promise<RespuestaExito<boolean> | RespuestaError> {
    try {
      const db = await obtenerBD();
      await db.runAsync('UPDATE espacios SET precioPorHora = ? WHERE id = ?', [nuevoPrecio, espacioId]);
      const mock = ESPACIOS_MOCK.find(e => e.id === espacioId);
      if (mock) mock.precioPorHora = nuevoPrecio;
      return crearExito(true);
    } catch {
      return crearError('ERROR_ACTUALIZAR_PRECIO', 'No se pudo actualizar el precio del espacio.');
    }
  }
};
