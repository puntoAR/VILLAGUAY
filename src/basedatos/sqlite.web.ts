// src/basedatos/sqlite.web.ts
// Adaptador de datos en memoria y LocalStorage para pruebas en navegador web (PC)

import { Espacio, Deporte, Reserva, ReservaFija, BloqueoMantenimiento, Usuario } from '../tipos';
import { ESPACIOS_MOCK } from '../mocks/espacios';
import { DEPORTES_MOCK } from '../mocks/deportes';
import { RESERVAS_MOCK } from '../mocks/reservas';
import { RESERVAS_FIJAS_MOCK } from '../mocks/fijas';
import { BLOQUEOS_MOCK } from '../mocks/bloqueos';
import { USUARIOS_MOCK } from '../mocks/usuarios';

const CLAVE_LOCAL_RESERVAS = 'reservas_vgy_web';
const CLAVE_LOCAL_BLOQUEOS = 'bloqueos_vgy_web';
const CLAVE_LOCAL_ESPACIOS = 'espacios_vgy_web';
const CLAVE_LOCAL_FIJAS = 'fijas_vgy_web';
const CLAVE_LOCAL_USUARIOS = 'usuarios_vgy_web';

function persistirWeb() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(CLAVE_LOCAL_RESERVAS, JSON.stringify(RESERVAS_MOCK));
      window.localStorage.setItem(CLAVE_LOCAL_BLOQUEOS, JSON.stringify(BLOQUEOS_MOCK));
      window.localStorage.setItem(CLAVE_LOCAL_ESPACIOS, JSON.stringify(ESPACIOS_MOCK));
      window.localStorage.setItem(CLAVE_LOCAL_FIJAS, JSON.stringify(RESERVAS_FIJAS_MOCK));
      window.localStorage.setItem(CLAVE_LOCAL_USUARIOS, JSON.stringify(USUARIOS_MOCK));
    } catch {}
  }
}

function inicializarDesdeLocalStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const guardadas = window.localStorage.getItem(CLAVE_LOCAL_RESERVAS);
      if (guardadas) {
        const parsed = JSON.parse(guardadas);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const idsExistentes = new Set(parsed.map((r: any) => r.id));
          for (const m of RESERVAS_MOCK) {
            if (!idsExistentes.has(m.id)) {
              parsed.push(m);
            }
          }
          RESERVAS_MOCK.length = 0;
          RESERVAS_MOCK.push(...parsed);
        }
      }

      const bGuardados = window.localStorage.getItem(CLAVE_LOCAL_BLOQUEOS);
      if (bGuardados) {
        const parsedB = JSON.parse(bGuardados);
        if (Array.isArray(parsedB) && parsedB.length > 0) {
          const idsB = new Set(parsedB.map((b: any) => b.id));
          for (const m of BLOQUEOS_MOCK) {
            if (!idsB.has(m.id)) parsedB.push(m);
          }
          BLOQUEOS_MOCK.length = 0;
          BLOQUEOS_MOCK.push(...parsedB);
        }
      }

      const eGuardados = window.localStorage.getItem(CLAVE_LOCAL_ESPACIOS);
      if (eGuardados) {
        const parsedE = JSON.parse(eGuardados);
        if (Array.isArray(parsedE) && parsedE.length > 0) {
          parsedE.forEach((pe: Espacio) => {
            const idx = ESPACIOS_MOCK.findIndex(x => x.id === pe.id);
            if (idx >= 0) ESPACIOS_MOCK[idx].precioPorHora = pe.precioPorHora;
          });
        }
      }

      const fGuardadas = window.localStorage.getItem(CLAVE_LOCAL_FIJAS);
      if (fGuardadas) {
        const parsedF = JSON.parse(fGuardadas);
        if (Array.isArray(parsedF) && parsedF.length > 0) {
          const idsF = new Set(parsedF.map((f: any) => f.id));
          for (const m of RESERVAS_FIJAS_MOCK) {
            if (!idsF.has(m.id)) parsedF.push(m);
          }
          RESERVAS_FIJAS_MOCK.length = 0;
          RESERVAS_FIJAS_MOCK.push(...parsedF);
        }
      }

      const uGuardados = window.localStorage.getItem(CLAVE_LOCAL_USUARIOS);
      if (uGuardados) {
        const parsedU = JSON.parse(uGuardados);
        if (Array.isArray(parsedU) && parsedU.length > 0) {
          const idsU = new Set(parsedU.map((u: any) => u.id));
          for (const m of USUARIOS_MOCK) {
            if (!idsU.has(m.id)) parsedU.push(m);
          }
          USUARIOS_MOCK.length = 0;
          USUARIOS_MOCK.push(...parsedU);
        }
      }
    } catch {}
  }
}

inicializarDesdeLocalStorage();

export interface InterfazBD {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: any[]): Promise<{ changes: number; lastInsertRowId: number }>;
  getAllAsync<T = any>(sql: string, params?: any[]): Promise<T[]>;
  getFirstAsync<T = any>(sql: string, params?: any[]): Promise<T | null>;
}

class WebDatabaseMock implements InterfazBD {
  async execAsync(_sql: string): Promise<void> {}

  async runAsync(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowId: number }> {
    const s = sql.toLowerCase();

    if (s.includes('insert into reservas') || s.includes('insert or replace into reservas')) {
      const [id, turnoId, espacioId, usuarioId, cantidadPersonas, codigoQr, estado, ingresoEn, creadaEn, cancelableHasta, nombreUsuario, telefonoUsuario, nombreEspacio] = params;
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
        nombreUsuario,
        telefonoUsuario,
        nombreEspacio,
      };

      if (existe >= 0) {
        RESERVAS_MOCK[existe] = resObj;
      } else {
        RESERVAS_MOCK.unshift(resObj);
      }
      persistirWeb();
    } else if (s.includes('update reservas set estado = "cancelada"') || s.includes("update reservas set estado = 'cancelada'")) {
      const id = params[0];
      const r = RESERVAS_MOCK.find(x => x.id === id);
      if (r) r.estado = 'cancelada';
      persistirWeb();
    } else if (s.includes('update reservas set estado = "cumplida"') || s.includes("update reservas set estado = 'cumplida'")) {
      const id = params[1] ?? params[0];
      const r = RESERVAS_MOCK.find(x => x.id === id);
      if (r) {
        r.estado = 'cumplida';
        r.ingresoEn = new Date().toISOString();
      }
      persistirWeb();
    } else if (s.includes('update reservas set estado = "ausente"') || s.includes("update reservas set estado = 'ausente'")) {
      const id = params[0];
      const r = RESERVAS_MOCK.find(x => x.id === id);
      if (r) r.estado = 'ausente';
      persistirWeb();
    } else if (s.includes('insert into bloqueos') || s.includes('insert or replace into bloqueos')) {
      const [id, espacioId, fecha, inicio, fin, motivo, creadoEn] = params;
      BLOQUEOS_MOCK.push({ id, espacioId, fecha, inicio, fin, motivo, creadoEn });
      persistirWeb();
    } else if (s.includes('delete from bloqueos')) {
      const id = params[0];
      const idx = BLOQUEOS_MOCK.findIndex(b => b.id === id);
      if (idx >= 0) BLOQUEOS_MOCK.splice(idx, 1);
      persistirWeb();
    } else if (s.includes('insert into reservas_fijas') || s.includes('insert or replace into reservas_fijas')) {
      const [id, espacioId, titular, dia, inicio, fin, desde, hasta, activa] = params;
      RESERVAS_FIJAS_MOCK.push({ id, espacioId, titular, dia, inicio, fin, desde, hasta, activa: Boolean(activa) });
      persistirWeb();
    } else if (s.includes('delete from reservas_fijas')) {
      const id = params[0];
      const idx = RESERVAS_FIJAS_MOCK.findIndex(f => f.id === id);
      if (idx >= 0) RESERVAS_FIJAS_MOCK.splice(idx, 1);
      persistirWeb();
    } else if (s.includes('update espacios set precioporhora = ?')) {
      const [precio, id] = params;
      const esp = ESPACIOS_MOCK.find(e => e.id === id);
      if (esp) esp.precioPorHora = Number(precio);
      persistirWeb();
    } else if (s.includes('insert into usuarios') || s.includes('insert or replace into usuarios')) {
      const [id, nombre, email, telefono, rol, espaciosFavoritos, cancelacionesTardias, ausencias, password] = params;
      const existe = USUARIOS_MOCK.findIndex(u => u.id === id);
      const userObj: Usuario = {
        id,
        nombre,
        email,
        telefono,
        rol,
        espaciosFavoritos: typeof espaciosFavoritos === 'string' ? JSON.parse(espaciosFavoritos) : espaciosFavoritos || [],
        cancelacionesTardias: Number(cancelacionesTardias) || 0,
        ausencias: Number(ausencias) || 0,
        password,
      };
      if (existe >= 0) {
        USUARIOS_MOCK[existe] = userObj;
      } else {
        USUARIOS_MOCK.push(userObj);
      }
      persistirWeb();
    } else if (s.includes('update usuarios set cancelacionestardias = cancelacionestardias + 1')) {
      const id = params[0];
      const u = USUARIOS_MOCK.find(x => x.id === id);
      if (u) u.cancelacionesTardias = (u.cancelacionesTardias || 0) + 1;
      persistirWeb();
    } else if (s.includes('update usuarios set ausencias = ausencias + 1')) {
      const id = params[0];
      const u = USUARIOS_MOCK.find(x => x.id === id);
      if (u) u.ausencias = (u.ausencias || 0) + 1;
      persistirWeb();
    } else if (s.includes('update usuarios set espaciosfavoritos = ?')) {
      const [favs, id] = params;
      const u = USUARIOS_MOCK.find(x => x.id === id);
      if (u) u.espaciosFavoritos = typeof favs === 'string' ? JSON.parse(favs) : favs;
      persistirWeb();
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
      } else if (s.includes('espacioid = ?')) {
        lista = lista.filter(r => r.espacioId === params[0]);
      }
      return lista as any;
    }

    if (s.includes('from usuarios')) {
      return USUARIOS_MOCK.map(u => ({
        ...u,
        espaciosFavoritos: JSON.stringify(u.espaciosFavoritos),
      })) as any;
    }

    return [];
  }

  async getFirstAsync<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const s = sql.toLowerCase();

    if (s.includes('from usuarios')) {
      if (s.includes('lower(email) = ?')) {
        const email = String(params[0] || '').toLowerCase().trim();
        const u = USUARIOS_MOCK.find(x => x.email.toLowerCase().trim() === email);
        if (!u) return null;
        return {
          ...u,
          espaciosFavoritos: JSON.stringify(u.espaciosFavoritos),
        } as any;
      }
      if (s.includes('id = ?')) {
        const u = USUARIOS_MOCK.find(x => x.id === params[0]);
        if (!u) return null;
        return {
          ...u,
          espaciosFavoritos: JSON.stringify(u.espaciosFavoritos),
        } as any;
      }
    }

    if (s.includes('from reservas')) {
      if (s.includes('codigoqr = ?')) {
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

export async function obtenerBD(): Promise<any> {
  return webDbMockInstance;
}
