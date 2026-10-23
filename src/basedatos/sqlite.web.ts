// src/basedatos/sqlite.web.ts
// Adaptador de datos en memoria y LocalStorage para navegador web (PC) sin dependencias nativas

import { Espacio, Deporte, Reserva, ReservaFija, BloqueoMantenimiento, Usuario } from '../tipos';
import { ESPACIOS_MOCK } from '../mocks/espacios';
import { DEPORTES_MOCK } from '../mocks/deportes';
import { RESERVAS_MOCK } from '../mocks/reservas';
import { RESERVAS_FIJAS_MOCK } from '../mocks/fijas';
import { BLOQUEOS_MOCK } from '../mocks/bloqueos';
import { USUARIOS_MOCK } from '../mocks/usuarios';

const CLAVE_LOCAL_RESERVAS = 'reservas_vgy_web';
const CLAVE_LOCAL_BLOQUEOS = 'bloqueos_vgy_web';

function persistirWeb() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(CLAVE_LOCAL_RESERVAS, JSON.stringify(RESERVAS_MOCK));
      window.localStorage.setItem(CLAVE_LOCAL_BLOQUEOS, JSON.stringify(BLOQUEOS_MOCK));
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
          // Asegurar que los datos de fecha y horario de los mocks estén sincronizados
          for (let i = 0; i < parsed.length; i++) {
            const m = RESERVAS_MOCK.find(x => x.id === parsed[i].id);
            if (m) {
              parsed[i] = { ...parsed[i], fecha: m.fecha, inicio: m.inicio, fin: m.fin, cancelableHasta: m.cancelableHasta, nombreEspacio: m.nombreEspacio };
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
    } catch {}
  }
}

inicializarDesdeLocalStorage();

export interface InterfazBD {
  getAllAsync<T = any>(sql: string, params?: any[]): Promise<T[]>;
  getFirstAsync<T = any>(sql: string, params?: any[]): Promise<T | null>;
  runAsync(sql: string, params?: any[]): Promise<any>;
  execAsync(sql: string): Promise<void>;
}

class WebDatabaseMock implements InterfazBD {
  async execAsync(_sql: string): Promise<void> {}

  async runAsync(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowId: number }> {
    const s = sql.toLowerCase();
    if (s.includes('insert into reservas')) {
      const [id, turnoId, espacioId, usuarioId, cantidadPersonas, codigoQr, estado, ingresoEn, creadaEn, cancelableHasta, conLuz, montoTotal, estadoPago, nombreUsuario, telefonoUsuario, nombreEspacio] = params;
      const existe = RESERVAS_MOCK.findIndex(r => r.id === id);

      let fechaTurno: string | undefined;
      let horaInicio: string | undefined;
      let horaFin: string | undefined;
      if (cancelableHasta) {
        try {
          const d = new Date(new Date(cancelableHasta).getTime() + 4 * 60 * 60 * 1000);
          if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dia = String(d.getDate()).padStart(2, '0');
            fechaTurno = `${y}-${m}-${dia}`;
            horaInicio = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            horaFin = `${String((d.getHours() + 1) % 24).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          }
        } catch {}
      }

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
        fecha: fechaTurno,
        inicio: horaInicio,
        fin: horaFin,
      };
      if (existe >= 0) {
        RESERVAS_MOCK[existe] = resObj;
      } else {
        RESERVAS_MOCK.unshift(resObj);
      }
      persistirWeb();
    } else if (s.includes('update reservas set estado = "cancelada"')) {
      const id = params[0];
      const r = RESERVAS_MOCK.find(x => x.id === id);
      if (r) r.estado = 'cancelada';
      persistirWeb();
    } else if (s.includes('update reservas set estado = "cumplida"')) {
      const id = params[1] ?? params[0];
      const r = RESERVAS_MOCK.find(x => x.id === id);
      if (r) {
        r.estado = 'cumplida';
        r.ingresoEn = new Date().toISOString();
      }
      persistirWeb();
    } else if (s.includes('update reservas set estado = "ausente"')) {
      const id = params[0];
      const r = RESERVAS_MOCK.find(x => x.id === id);
      if (r) r.estado = 'ausente';
      persistirWeb();
    } else if (s.includes('update reservas set estadopago = ?')) {
      const [nuevoEstado, id] = params;
      const r = RESERVAS_MOCK.find(x => x.id === id);
      if (r) r.estadoPago = nuevoEstado;
      persistirWeb();
    } else if (s.includes('insert into bloqueos')) {
      const [id, espacioId, fecha, inicio, fin, motivo, creadoEn] = params;
      BLOQUEOS_MOCK.push({ id, espacioId, fecha, inicio, fin, motivo, creadoEn });
      persistirWeb();
    } else if (s.includes('delete from bloqueos')) {
      const id = params[0];
      const idx = BLOQUEOS_MOCK.findIndex(b => b.id === id);
      if (idx >= 0) BLOQUEOS_MOCK.splice(idx, 1);
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
      }
      const idVistos = new Set<string>();
      lista = lista.filter(r => {
        if (idVistos.has(r.id)) return false;
        idVistos.add(r.id);
        return true;
      });
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

export async function obtenerBD(): Promise<InterfazBD> {
  return webDbMockInstance;
}

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
