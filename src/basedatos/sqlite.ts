// src/basedatos/sqlite.ts
// Unidad 5: Base de datos relacional con API Sincrónica estricta de expo-sqlite

import * as SQLite from 'expo-sqlite';
import { Espacio, Deporte, Reserva, Turno, Usuario } from '../tipos';

// Apertura sincrónica de la base de datos
export const db = SQLite.openDatabaseSync('reservas_villaguay_catedra.db');

// Inicialización sincrónica del esquema
export function inicializarBaseDatosSync() {
  db.execSync(`
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

    CREATE TABLE IF NOT EXISTS turnos (
      id TEXT PRIMARY KEY NOT NULL,
      espacioId TEXT NOT NULL,
      fecha TEXT NOT NULL,
      inicio TEXT NOT NULL,
      fin TEXT NOT NULL,
      estado TEXT NOT NULL,
      reservaId TEXT,
      precio INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reservas (
      id TEXT PRIMARY KEY NOT NULL,
      turnoId TEXT NOT NULL,
      espacioId TEXT NOT NULL,
      usuarioId TEXT NOT NULL,
      cantidadPersonas INTEGER NOT NULL,
      codigoQr TEXT NOT NULL,
      estado TEXT NOT NULL,
      creadaEn TEXT NOT NULL,
      cancelableHasta TEXT NOT NULL,
      conLuz INTEGER DEFAULT 0,
      montoTotal INTEGER NOT NULL,
      nombreEspacio TEXT
    );

    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY NOT NULL,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL,
      telefono TEXT NOT NULL,
      rol TEXT NOT NULL,
      avatarUrl TEXT,
      password TEXT
    );
  `);

  // Sembrar datos iniciales si la tabla de espacios está vacía
  const count = db.getFirstSync<{ total: number }>('SELECT COUNT(*) as total FROM espacios');
  if (!count || count.total === 0) {
    db.withTransactionSync(() => {
      // 1. Deportes
      const deportesIniciales: Deporte[] = [
        { id: 'dep-futbol', nombre: 'Fútbol', icono: 'football-outline', color: '#16A34A' },
        { id: 'dep-basquet', nombre: 'Básquet', icono: 'basketball-outline', color: '#EA580C' },
        { id: 'dep-tenis', nombre: 'Tenis', icono: 'tennisball-outline', color: '#CA8A04' },
        { id: 'dep-voley', nombre: 'Vóley', icono: 'baseball-outline', color: '#0284C7' },
        { id: 'dep-padel', nombre: 'Pádel', icono: 'tennisball-outline', color: '#9333EA' },
      ];
      for (const d of deportesIniciales) {
        db.runSync(
          'INSERT OR REPLACE INTO deportes (id, nombre, icono, color) VALUES (?, ?, ?, ?)',
          [d.id, d.nombre, d.icono, d.color]
        );
      }

      // 2. Canchas Municipales de Villaguay
      const espaciosIniciales: Espacio[] = [
        {
          id: 'esp-01',
          nombre: 'Cancha 1 — Fútbol 5 Sintético',
          deporteId: 'dep-futbol',
          complejo: 'Polideportivo Municipal',
          superficie: 'Césped sintético con caucho',
          techado: false,
          iluminacion: true,
          capacidad: 10,
          precioPorHora: 12000,
          coordenadas: { latitud: -31.8642, longitud: -59.0281 },
          imagenes: [
            'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop',
          ],
          videoUrl: 'local:recorrido_espacio',
          reglas: 'Uso obligatorio de zapatillas de fútbol 5 (sin tapones de aluminio). Cancelaciones con 4hs de anticipación.',
          activo: true,
        },
        {
          id: 'esp-02',
          nombre: 'Gimnasio Techado Parquet (Básquet/Vóley)',
          deporteId: 'dep-basquet',
          complejo: 'Polideportivo Municipal',
          superficie: 'Parquet flotante lustrado',
          techado: true,
          iluminacion: true,
          capacidad: 16,
          precioPorHora: 15000,
          coordenadas: { latitud: -31.8645, longitud: -59.0278 },
          imagenes: [
            'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop',
          ],
          videoUrl: 'local:recorrido_espacio',
          reglas: 'Calzado deportivo con suela de goma limpia exclusivamente. Prohibido alimentos y bebidas azucaradas.',
          activo: true,
        },
        {
          id: 'esp-03',
          nombre: 'Cancha Tenis 1 — Polvo de Ladrillo',
          deporteId: 'dep-tenis',
          complejo: 'Parque Berduc',
          superficie: 'Polvo de ladrillo',
          techado: false,
          iluminacion: true,
          capacidad: 4,
          precioPorHora: 9000,
          coordenadas: { latitud: -31.8595, longitud: -59.0340 },
          imagenes: [
            'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&auto=format&fit=crop',
          ],
          videoUrl: null,
          reglas: 'Pasar la esterilla y regar al finalizar el turno. Calzado específico de tenis sin taco.',
          activo: true,
        },
        {
          id: 'esp-04',
          nombre: 'Cancha Pádel Cristal Techada',
          deporteId: 'dep-padel',
          complejo: 'Parque Berduc',
          superficie: 'Césped sintético azul y blindex',
          techado: true,
          iluminacion: true,
          capacidad: 4,
          precioPorHora: 14000,
          coordenadas: { latitud: -31.8598, longitud: -59.0335 },
          imagenes: [
            'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop',
          ],
          videoUrl: 'local:recorrido_espacio',
          reglas: 'Paletas con cordón de seguridad ajustado. Ingreso 5 minutos antes.',
          activo: true,
        },
      ];

      for (const e of espaciosIniciales) {
        db.runSync(
          `INSERT OR REPLACE INTO espacios 
          (id, nombre, deporteId, complejo, superficie, techado, iluminacion, capacidad, precioPorHora, latitud, longitud, imagenes, videoUrl, reglas, activo) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

      // 3. Usuarios base
      const usuariosIniciales: Usuario[] = [
        {
          id: 'usr-jugador-1',
          nombre: 'Martín Fernández',
          email: 'martin@villaguay.gob.ar',
          telefono: '3455-401122',
          rol: 'jugador',
          password: 'password123',
        },
        {
          id: 'usr-encargado-1',
          nombre: 'Carlos Benítez (Encargado)',
          email: 'encargado@villaguay.gob.ar',
          telefono: '3455-442211',
          rol: 'encargado',
          password: 'password123',
        },
      ];

      for (const u of usuariosIniciales) {
        db.runSync(
          'INSERT OR REPLACE INTO usuarios (id, nombre, email, telefono, rol, avatarUrl, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [u.id, u.nombre, u.email, u.telefono, u.rol, u.avatarUrl || null, u.password || 'password123']
        );
      }

      // 4. Turnos para el día de hoy
      const hoy = new Date().toISOString().split('T')[0];
      const horarios = ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
      horarios.forEach((inicio, i) => {
        const finHora = parseInt(inicio.split(':')[0]) + 1;
        const fin = `${finHora}:00`;
        const idTurno = `tur-01-${hoy}-${inicio.replace(':', '')}`;
        db.runSync(
          'INSERT OR REPLACE INTO turnos (id, espacioId, fecha, inicio, fin, estado, reservaId, precio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [idTurno, 'esp-01', hoy, inicio, fin, i === 2 ? 'reservado' : 'libre', i === 2 ? 'res-01-demo' : null, 12000]
        );
      });

      // 5. Reserva de muestra
      db.runSync(
        `INSERT OR REPLACE INTO reservas 
        (id, turnoId, espacioId, usuarioId, cantidadPersonas, codigoQr, estado, creadaEn, cancelableHasta, conLuz, montoTotal, nombreEspacio) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'res-01-demo',
          `tur-01-${hoy}-1900`,
          'esp-01',
          'usr-jugador-1',
          10,
          'QR-VGY-01-1900',
          'confirmada',
          new Date().toISOString(),
          new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
          1,
          14500,
          'Cancha 1 — Fútbol 5 Sintético',
        ]
      );
    });
  }
}

// Ejecutar inicialización sincrónica inmediatamente al importar el módulo
try {
  inicializarBaseDatosSync();
} catch (e) {
  console.warn('[SQLite] Error en inicialización sincrónica inmediata:', e);
}

// Métodos de acceso sincrónicos
export const BDService = {
  // Espacios
  obtenerEspaciosSync(filtroDeporte?: string): Espacio[] {
    try {
      let sql = 'SELECT * FROM espacios WHERE activo = 1';
      const params: any[] = [];
      if (filtroDeporte && filtroDeporte !== 'todos') {
        sql += ' AND deporteId = ?';
        params.push(filtroDeporte);
      }
      const rows = db.getAllSync<any>(sql, params);
      return rows.map(r => ({
        ...r,
        techado: Boolean(r.techado),
        iluminacion: Boolean(r.iluminacion),
        activo: Boolean(r.activo),
        imagenes: JSON.parse(r.imagenes || '[]'),
        coordenadas: { latitud: r.latitud, longitud: r.longitud },
      }));
    } catch {
      inicializarBaseDatosSync();
      return [];
    }
  },

  obtenerEspacioPorIdSync(id: string): Espacio | null {
    try {
      const r = db.getFirstSync<any>('SELECT * FROM espacios WHERE id = ?', [id]);
      if (!r) return null;
      return {
        ...r,
        techado: Boolean(r.techado),
        iluminacion: Boolean(r.iluminacion),
        activo: Boolean(r.activo),
        imagenes: JSON.parse(r.imagenes || '[]'),
        coordenadas: { latitud: r.latitud, longitud: r.longitud },
      };
    } catch {
      inicializarBaseDatosSync();
      return null;
    }
  },

  obtenerDeportesSync(): Deporte[] {
    try {
      return db.getAllSync<Deporte>('SELECT * FROM deportes');
    } catch {
      inicializarBaseDatosSync();
      try {
        return db.getAllSync<Deporte>('SELECT * FROM deportes');
      } catch {
        return [
          { id: 'dep-futbol', nombre: 'Fútbol', icono: 'football-outline', color: '#16A34A' },
          { id: 'dep-basquet', nombre: 'Básquet', icono: 'basketball-outline', color: '#EA580C' },
          { id: 'dep-tenis', nombre: 'Tenis', icono: 'tennisball-outline', color: '#CA8A04' },
          { id: 'dep-voley', nombre: 'Vóley', icono: 'baseball-outline', color: '#0284C7' },
          { id: 'dep-padel', nombre: 'Pádel', icono: 'tennisball-outline', color: '#9333EA' },
        ];
      }
    }
  },

  // Turnos
  obtenerTurnosDiaSync(espacioId: string, fecha: string): Turno[] {
    let rows = db.getAllSync<Turno>(
      'SELECT * FROM turnos WHERE espacioId = ? AND fecha = ? ORDER BY inicio ASC',
      [espacioId, fecha]
    );

    // Si aún no se generaron turnos para este día, generarlos dinámicamente
    if (!rows || rows.length === 0) {
      db.withTransactionSync(() => {
        const horarios = ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
        horarios.forEach(inicio => {
          const finHora = parseInt(inicio.split(':')[0]) + 1;
          const fin = `${finHora}:00`;
          const idTurno = `tur-${espacioId}-${fecha}-${inicio.replace(':', '')}`;
          db.runSync(
            'INSERT OR REPLACE INTO turnos (id, espacioId, fecha, inicio, fin, estado, reservaId, precio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [idTurno, espacioId, fecha, inicio, fin, 'libre', null, 12000]
          );
        });
      });
      rows = db.getAllSync<Turno>(
        'SELECT * FROM turnos WHERE espacioId = ? AND fecha = ? ORDER BY inicio ASC',
        [espacioId, fecha]
      );
    }
    return rows;
  },

  // Reservas
  crearReservaSync(datos: {
    espacioId: string;
    nombreEspacio: string;
    turnoId: string;
    usuarioId: string;
    cantidadPersonas: number;
    conLuz: boolean;
    montoTotal: number;
  }): Reserva {
    const id = `res-${Date.now().toString().slice(-5)}`;
    const codigoQr = `QR-VGY-${datos.espacioId}-${Date.now().toString().slice(-4)}`;
    const creadaEn = new Date().toISOString();
    const cancelableHasta = new Date(Date.now() + 4 * 3600 * 1000).toISOString();

    db.withTransactionSync(() => {
      // 1. Insertar reserva
      db.runSync(
        `INSERT INTO reservas 
        (id, turnoId, espacioId, usuarioId, cantidadPersonas, codigoQr, estado, creadaEn, cancelableHasta, conLuz, montoTotal, nombreEspacio)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          datos.turnoId,
          datos.espacioId,
          datos.usuarioId,
          datos.cantidadPersonas,
          codigoQr,
          'confirmada',
          creadaEn,
          cancelableHasta,
          datos.conLuz ? 1 : 0,
          datos.montoTotal,
          datos.nombreEspacio,
        ]
      );

      // 2. Marcar turno como reservado
      db.runSync(
        'UPDATE turnos SET estado = "reservado", reservaId = ? WHERE id = ?',
        [id, datos.turnoId]
      );
    });

    return {
      id,
      turnoId: datos.turnoId,
      espacioId: datos.espacioId,
      usuarioId: datos.usuarioId,
      cantidadPersonas: datos.cantidadPersonas,
      codigoQr,
      estado: 'confirmada',
      creadaEn,
      cancelableHasta,
      conLuz: datos.conLuz,
      montoTotal: datos.montoTotal,
      nombreEspacio: datos.nombreEspacio,
    };
  },

  cancelarReservaSync(reservaId: string): boolean {
    let exito = false;
    db.withTransactionSync(() => {
      const res = db.getFirstSync<Reserva>('SELECT * FROM reservas WHERE id = ?', [reservaId]);
      if (res) {
        db.runSync('UPDATE reservas SET estado = "cancelada" WHERE id = ?', [reservaId]);
        db.runSync('UPDATE turnos SET estado = "libre", reservaId = NULL WHERE id = ?', [res.turnoId]);
        exito = true;
      }
    });
    return exito;
  },

  obtenerMisReservasSync(usuarioId: string): Reserva[] {
    return db.getAllSync<Reserva>(
      'SELECT * FROM reservas WHERE usuarioId = ? ORDER BY creadaEn DESC',
      [usuarioId]
    );
  },

  validarIngresoQrSync(codigoQr: string): { exito: boolean; mensaje: string; reserva?: Reserva } {
    const res = db.getFirstSync<Reserva>(
      'SELECT * FROM reservas WHERE codigoQr = ?',
      [codigoQr]
    );

    if (!res) {
      return { exito: false, mensaje: 'Código QR inexistente o no emitido por Deportes Villaguay.' };
    }

    if (res.estado === 'cancelada') {
      return { exito: false, mensaje: 'Este turno fue cancelado previamente por el titular.' };
    }

    if (res.estado === 'cumplida') {
      return { exito: false, mensaje: 'Este turno ya fue utilizado para ingresar anteriormente.' };
    }

    // Marcar como cumplida
    db.runSync('UPDATE reservas SET estado = "cumplida" WHERE id = ?', [res.id]);
    return {
      exito: true,
      mensaje: `¡Ingreso autorizado! Cancha: ${res.nombreEspacio || res.espacioId}`,
      reserva: { ...res, estado: 'cumplida' },
    };
  },

  // Usuarios
  buscarUsuarioPorEmailSync(email: string): Usuario | null {
    return db.getFirstSync<Usuario>(
      'SELECT * FROM usuarios WHERE LOWER(email) = ?',
      [email.toLowerCase().trim()]
    );
  },

  actualizarAvatarUsuarioSync(usuarioId: string, avatarUrl: string) {
    db.runSync('UPDATE usuarios SET avatarUrl = ? WHERE id = ?', [avatarUrl, usuarioId]);
  }
};
