import * as SQLite from 'expo-sqlite';
import { Espacio, Deporte, Reserva, ReservaFija, BloqueoMantenimiento, Usuario } from '../tipos';
import { ESPACIOS_MOCK } from '../mocks/espacios';
import { DEPORTES_MOCK } from '../mocks/deportes';
import { RESERVAS_MOCK } from '../mocks/reservas';
import { RESERVAS_FIJAS_MOCK } from '../mocks/fijas';
import { BLOQUEOS_MOCK } from '../mocks/bloqueos';
import { USUARIOS_MOCK } from '../mocks/usuarios';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function obtenerBD(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('reservas_villaguay.db');
    await inicializarEsquema(dbInstance);
  }
  return dbInstance;
}

async function inicializarEsquema(db: SQLite.SQLiteDatabase) {
  // Crear tablas relacionales
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
      password TEXT
    );
  `);

  // Asegurar columna password si la base ya estaba creada
  try {
    await db.execAsync('ALTER TABLE usuarios ADD COLUMN password TEXT;');
  } catch {
    // Si ya existe la columna, SQLite arroja error que capturamos de forma segura
  }

  try {
    await db.execAsync(
      "UPDATE espacios SET videoUrl = 'local:recorrido_espacio' WHERE videoUrl LIKE '%commondatastorage.googleapis.com%';"
    );
  } catch {
    // ignorar si no aplica
  }

  // Migraciones para reservas (conLuz, montoTotal, estadoPago, nombreUsuario, telefonoUsuario, nombreEspacio)
  const colsReserva = [
    'conLuz INTEGER DEFAULT 0',
    'montoTotal INTEGER DEFAULT 0',
    'estadoPago TEXT DEFAULT "pendiente"',
    'nombreUsuario TEXT',
    'telefonoUsuario TEXT',
    'nombreEspacio TEXT'
  ];
  for (const col of colsReserva) {
    try {
      await db.execAsync(`ALTER TABLE reservas ADD COLUMN ${col};`);
    } catch {
      // Ignorar si ya existe
    }
  }

  // Sembrar datos iniciales si no existen
  const countEspacios = await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) as total FROM espacios');
  if (!countEspacios || countEspacios.total === 0) {
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

    for (const r of RESERVAS_MOCK) {
      await db.runAsync(
        'INSERT OR REPLACE INTO reservas (id, turnoId, espacioId, usuarioId, cantidadPersonas, codigoQr, estado, ingresoEn, creadaEn, cancelableHasta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.turnoId, r.espacioId, r.usuarioId, r.cantidadPersonas, r.codigoQr, r.estado, r.ingresoEn, r.creadaEn, r.cancelableHasta]
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
        [u.id, u.nombre, u.email, u.telefono, u.rol, JSON.stringify(u.espaciosFavoritos), u.cancelacionesTardias, u.ausencias, u.password || '123456']
      );
    }
  }
}
