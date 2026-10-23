// src/basedatos/sqlite.ts
// Base de datos SQLite local para almacenamiento persistente y fallback para web

import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { Espacio, Deporte, Reserva, ReservaFija, BloqueoMantenimiento, Usuario } from '../tipos';
import { ESPACIOS_MOCK } from '../mocks/espacios';
import { DEPORTES_MOCK } from '../mocks/deportes';
import { RESERVAS_MOCK } from '../mocks/reservas';
import { RESERVAS_FIJAS_MOCK } from '../mocks/fijas';
import { BLOQUEOS_MOCK } from '../mocks/bloqueos';
import { USUARIOS_MOCK } from '../mocks/usuarios';

let dbInstance: SQLite.SQLiteDatabase | null = null;

// Base de datos en memoria para Web (PC)
class WebDatabaseMock {
  async execAsync(_sql: string): Promise<void> {}

  async runAsync(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowId: number }> {
    const s = sql.toLowerCase();
    if (s.includes('insert into reservas')) {
      const [id, turnoId, espacioId, usuarioId, cantidadPersonas, codigoQr, estado, ingresoEn, creadaEn, cancelableHasta, conLuz, montoTotal, estadoPago, nombreUsuario, telefonoUsuario, nombreEspacio] = params;
      const existe = RESERVAS_MOCK.findIndex(r => r.id === id);
      const resObj: Reserva = {
        id,
        turnoId,
        espacioId,
        usuarioId,
        cantidadPersonas: Number(cantidadPersonas) || 10,
        codigoQr,
        estado: estado || 'confirmada',
        ingresoEn: ingresoEn || null,
        creadaEn: creadaEn || new Date().toISOString(),
        cancelableHasta: cancelableHasta || new Date().toISOString(),
        conLuz: Boolean(conLuz),
        montoTotal: Number(montoTotal) || 12000,
        estadoPago: estadoPago || 'pendiente',
        nombreUsuario,
        telefonoUsuario,
        nombreEspacio,
      };
      if (existe >= 0) {
        RESERVAS_MOCK[existe] = resObj;
      } else {
        RESERVAS_MOCK.unshift(resObj);
      }
    } else if (s.includes('update reservas set estado = "cancelada"')) {
      const id = params[0];
      const r = RESERVAS_MOCK.find(x => x.id === id);
      if (r) r.estado = 'cancelada';
    } else if (s.includes('update reservas set estado = "cumplida"')) {
      const id = params[1] ?? params[0];
      const r = RESERVAS_MOCK.find(x => x.id === id);
      if (r) {
        r.estado = 'cumplida';
        r.ingresoEn = new Date().toISOString();
      }
    } else if (s.includes('update reservas set estado = "ausente"')) {
      const id = params[0];
      const r = RESERVAS_MOCK.find(x => x.id === id);
      if (r) r.estado = 'ausente';
    } else if (s.includes('update reservas set estadopago = ?')) {
      const [nuevoEstado, id] = params;
      const r = RESERVAS_MOCK.find(x => x.id === id);
      if (r) r.estadoPago = nuevoEstado;
    } else if (s.includes('insert into bloqueos')) {
      const [id, espacioId, fecha, inicio, fin, motivo, creadoEn] = params;
      BLOQUEOS_MOCK.push({ id, espacioId, fecha, inicio, fin, motivo, creadoEn });
    } else if (s.includes('delete from bloqueos')) {
      const id = params[0];
      const idx = BLOQUEOS_MOCK.findIndex(b => b.id === id);
      if (idx >= 0) BLOQUEOS_MOCK.splice(idx, 1);
    }
    return { changes: 1, lastInsertRowId: 1 };
  }

  async getAllAsync<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const s = sql.toLowerCase();
    if (s.includes('from espacios')) {
      let lista = [...ESPACIOS_MOCK];
      if (params.length > 0) {
        if (s.includes('deporteid = ?') && s.includes('complejo = ?')) {
          lista = lista.filter(e => e.deporteId === params[0] && e.complejo === params[1]);
        } else if (s.includes('deporteid = ?')) {
          lista = lista.filter(e => e.deporteId === params[0]);
        } else if (s.includes('complejo = ?')) {
          lista = lista.filter(e => e.complejo === params[0]);
        }
      }
      return lista.map(e => ({
        ...e,
        latitud: e.coordenadas.latitud,
        longitud: e.coordenadas.longitud,
        imagenes: JSON.stringify(e.imagenes),
      })) as any;
    }

    if (s.includes('from deportes')) {
      return DEPORTES_MOCK as any;
    }

    if (s.includes('from bloqueos')) {
      let lista = [...BLOQUEOS_MOCK];
      if (params.length === 2 && s.includes('espacioid = ? and fecha = ?')) {
        lista = lista.filter(b => b.espacioId === params[0] && b.fecha === params[1]);
      }
      return lista as any;
    }

    if (s.includes('from reservas_fijas')) {
      let lista = [...RESERVAS_FIJAS_MOCK];
      if (s.includes('espacioid = ? and dia = ?')) {
        const [espacioId, diaSemana, fecha] = params;
        lista = lista.filter(
          f => f.espacioId === espacioId && f.dia === diaSemana && f.activa && f.desde <= fecha && (!f.hasta || f.hasta >= fecha)
        );
      }
      return lista as any;
    }

    if (s.includes('from reservas')) {
      let lista = [...RESERVAS_MOCK];
      if (s.includes('usuarioid = ?') && s.includes('confirmada')) {
        lista = lista.filter(r => r.usuarioId === params[0] && r.estado === 'confirmada');
      } else if (s.includes('usuarioid = ?')) {
        lista = lista.filter(r => r.usuarioId === params[0]);
      } else if (s.includes('espacioid = ?') && s.includes('confirmada')) {
        lista = lista.filter(r => r.espacioId === params[0] && r.estado === 'confirmada');
      }
      return lista as any;
    }

    if (s.includes('from usuarios')) {
      return USUARIOS_MOCK as any;
    }

    return [];
  }

  async getFirstAsync<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const s = sql.toLowerCase();
    if (s.includes('from usuarios')) {
      if (s.includes('lower(email) = ?')) {
        const email = String(params[0] || '').toLowerCase().trim();
        const u = USUARIOS_MOCK.find(x => x.email.toLowerCase().trim() === email);
        return (u as any) || null;
      }
      if (s.includes('id = ?')) {
        const u = USUARIOS_MOCK.find(x => x.id === params[0]);
        return (u as any) || null;
      }
    }
    if (s.includes('from reservas')) {
      if (s.includes('codigogr = ?') || s.includes('codigoqr = ?')) {
        const r = RESERVAS_MOCK.find(x => x.codigoQr.trim().toUpperCase() === String(params[0]).trim().toUpperCase());
        return (r as any) || null;
      }
      if (s.includes('turnoid = ? and estado = "confirmada"')) {
        const r = RESERVAS_MOCK.find(x => x.turnoId === params[0] && x.estado === 'confirmada');
        return (r as any) || null;
      }
      if (s.includes('id = ?')) {
        const r = RESERVAS_MOCK.find(x => x.id === params[0]);
        return (r as any) || null;
      }
    }
    if (s.includes('from espacios where id = ?')) {
      const e = ESPACIOS_MOCK.find(x => x.id === params[0]);
      if (!e) return null;
      return {
        ...e,
        latitud: e.coordenadas.latitud,
        longitud: e.coordenadas.longitud,
        imagenes: JSON.stringify(e.imagenes),
      } as any;
    }
    return null;
  }
}

const webDbMockInstance = new WebDatabaseMock();

export interface InterfazBD {
  getAllAsync<T = any>(sql: string, params?: any[]): Promise<T[]>;
  getFirstAsync<T = any>(sql: string, params?: any[]): Promise<T | null>;
  runAsync(sql: string, params?: any[]): Promise<any>;
  execAsync(sql: string): Promise<void>;
}

export async function obtenerBD(): Promise<InterfazBD> {
  if (Platform.OS === 'web') {
    return webDbMockInstance;
  }
  try {
    if (!dbInstance) {
      dbInstance = await SQLite.openDatabaseAsync('reservas_villaguay.db');
      await inicializarEsquema(dbInstance);
    }
    return dbInstance as unknown as InterfazBD;
  } catch (e) {
    console.warn('[SQLite] Fallback a base en memoria:', e);
    return webDbMockInstance;
  }
}

async function inicializarEsquema(db: SQLite.SQLiteDatabase) {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS deportes (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        icono TEXT NOT NULL,
        color TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS espacios (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        deporteId TEXT NOT NULL,
        complejo TEXT NOT NULL,
        superficie TEXT NOT NULL,
        techado INTEGER NOT NULL,
        iluminacion INTEGER NOT NULL,
        capacidad INTEGER NOT NULL,
        precioPorHora INTEGER NOT NULL,
        latitud REAL NOT NULL,
        longitud REAL NOT NULL,
        imagenes TEXT NOT NULL,
        videoUrl TEXT,
        reglas TEXT NOT NULL,
        activo INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS reservas (
        id TEXT PRIMARY KEY NOT NULL,
        turnoId TEXT NOT NULL,
        espacioId TEXT NOT NULL,
        usuarioId TEXT NOT NULL,
        cantidadPersonas INTEGER NOT NULL,
        codigoQr TEXT NOT NULL,
        estado TEXT NOT NULL,
        ingresoEn TEXT,
        creadaEn TEXT NOT NULL,
        cancelableHasta TEXT NOT NULL,
        conLuz INTEGER DEFAULT 0,
        montoTotal INTEGER DEFAULT 0,
        estadoPago TEXT DEFAULT 'pendiente',
        nombreUsuario TEXT,
        telefonoUsuario TEXT,
        nombreEspacio TEXT
      );

      CREATE TABLE IF NOT EXISTS reservas_fijas (
        id TEXT PRIMARY KEY NOT NULL,
        espacioId TEXT NOT NULL,
        titular TEXT NOT NULL,
        dia INTEGER NOT NULL,
        inicio TEXT NOT NULL,
        fin TEXT NOT NULL,
        desde TEXT NOT NULL,
        hasta TEXT,
        activa INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS bloqueos (
        id TEXT PRIMARY KEY NOT NULL,
        espacioId TEXT NOT NULL,
        fecha TEXT NOT NULL,
        inicio TEXT,
        fin TEXT,
        motivo TEXT NOT NULL,
        creadoEn TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        email TEXT NOT NULL,
        telefono TEXT NOT NULL,
        rol TEXT NOT NULL,
        espaciosFavoritos TEXT NOT NULL,
        cancelacionesTardias INTEGER NOT NULL,
        ausencias INTEGER NOT NULL,
        password TEXT,
        avatarUrl TEXT
      );
    `);

    // Sembrar 11 espacios y datos si la tabla está vacía
    const count = await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) as total FROM espacios');
    if (!count || count.total === 0) {
      for (const d of DEPORTES_MOCK) {
        await db.runAsync(
          'INSERT OR REPLACE INTO deportes (id, nombre, icono, color) VALUES (?, ?, ?, ?)',
          [d.id, d.nombre, d.icono, d.color]
        );
      }

      for (const e of ESPACIOS_MOCK) {
        await db.runAsync(
          'INSERT OR REPLACE INTO espacios (id, nombre, deporteId, complejo, superficie, techado, iluminacion, capacidad, precioPorHora, latitud, longitud, imagenes, videoUrl, reglas, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            e.id,
            e.nombre,
            e.deporteId,
            e.complejo,
            e.superficie,
            e.techado ? 1 : 0,
            e.iluminacion ? 1 : 0,
            e.capacidad,
            e.precioPorHora,
            e.coordenadas.latitud,
            e.coordenadas.longitud,
            JSON.stringify(e.imagenes),
            e.videoUrl,
            e.reglas,
            e.activo ? 1 : 0,
          ]
        );
      }

      for (const f of RESERVAS_FIJAS_MOCK) {
        await db.runAsync(
          'INSERT OR REPLACE INTO reservas_fijas (id, espacioId, titular, dia, inicio, fin, desde, hasta, activa) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [f.id, f.espacioId, f.titular, f.dia, f.inicio, f.fin, f.desde, f.hasta, f.activa ? 1 : 0]
        );
      }

      for (const b of BLOQUEOS_MOCK) {
        await db.runAsync(
          'INSERT OR REPLACE INTO bloqueos (id, espacioId, fecha, inicio, fin, motivo, creadoEn) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [b.id, b.espacioId, b.fecha, b.inicio, b.fin, b.motivo, b.creadoEn]
        );
      }

      for (const u of USUARIOS_MOCK) {
        await db.runAsync(
          'INSERT OR REPLACE INTO usuarios (id, nombre, email, telefono, rol, espaciosFavoritos, cancelacionesTardias, ausencias, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [u.id, u.nombre, u.email, u.telefono, u.rol, JSON.stringify(u.espaciosFavoritos), u.cancelacionesTardias, u.ausencias, u.password || 'password123']
        );
      }

      for (const r of RESERVAS_MOCK) {
        await db.runAsync(
          'INSERT OR REPLACE INTO reservas (id, turnoId, espacioId, usuarioId, cantidadPersonas, codigoQr, estado, ingresoEn, creadaEn, cancelableHasta, conLuz, montoTotal, estadoPago, nombreUsuario, telefonoUsuario, nombreEspacio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            r.id,
            r.turnoId,
            r.espacioId,
            r.usuarioId,
            r.cantidadPersonas,
            r.codigoQr,
            r.estado,
            r.ingresoEn,
            r.creadaEn,
            r.cancelableHasta,
            r.conLuz ? 1 : 0,
            r.montoTotal || 12000,
            r.estadoPago || 'pendiente',
            r.nombreUsuario || null,
            r.telefonoUsuario || null,
            r.nombreEspacio || null,
          ]
        );
      }
    }
  } catch (err) {
    console.warn('[SQLite] Error creando tablas:', err);
  }
}

// Servicio auxiliar sincrónico seguro
export const BDService = {
  buscarUsuarioPorEmailSync(email: string): Usuario | null {
    const e = email.toLowerCase().trim();
    return USUARIOS_MOCK.find(u => u.email.toLowerCase().trim() === e) || null;
  },
  obtenerUsuarioPorIdSync(id: string): Usuario | null {
    return USUARIOS_MOCK.find(u => u.id === id) || null;
  },
  actualizarAvatarUsuarioSync(usuarioId: string, avatarUrl: string) {
    const u = USUARIOS_MOCK.find(x => x.id === usuarioId);
    if (u) u.avatarUrl = avatarUrl;
  },
};
