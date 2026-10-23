import { obtenerBD } from '../basedatos/sqlite';
import { Turno, EstadoTurno, RespuestaExito, RespuestaError } from '../tipos';
import { crearExito, crearError, esError } from './api';
import { EspaciosServicio } from './espacios';

export const TurnosServicio = {
  async obtenerGrillaDia(espacioId: string, fecha: string): Promise<RespuestaExito<Turno[]> | RespuestaError> {
    try {
      const respEspacio = await EspaciosServicio.obtenerEspacioPorId(espacioId);
      if (esError(respEspacio)) return respEspacio;
      const espacio = respEspacio.datos;

      const db = await obtenerBD();

      const bloqueos = await db.getAllAsync<any>(
        'SELECT * FROM bloqueos WHERE espacioId = ? AND fecha = ?',
        [espacioId, fecha]
      );

      const [anio, mes, dia] = fecha.split('-').map(Number);
      const fechaObj = new Date(anio, mes - 1, dia);
      const diaSemana = fechaObj.getDay();

      const fijas = await db.getAllAsync<any>(
        'SELECT * FROM reservas_fijas WHERE espacioId = ? AND dia = ? AND activa = 1 AND desde <= ? AND (hasta IS NULL OR hasta >= ?)',
        [espacioId, diaSemana, fecha, fecha]
      );

      const reservas = await db.getAllAsync<any>(
        'SELECT * FROM reservas WHERE espacioId = ? AND estado = "confirmada"',
        [espacioId]
      );

      const ahora = new Date();
      const fechaHoyStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
      const esHoy = fecha === fechaHoyStr;
      const horaActual = ahora.getHours();

      const turnos: Turno[] = [];

      for (let h = 8; h < 24; h++) {
        const horaInicioStr = `${String(h).padStart(2, '0')}:00`;
        const horaFinStr = `${String(h + 1).padStart(2, '0')}:00`;
        const turnoId = `tur-${espacioId}-${fecha.replace(/-/g, '')}-${String(h).padStart(2, '0')}`;

        let estado: EstadoTurno = 'libre';
        let motivoBloqueo: string | null = null;
        let reservaId: string | null = null;

        const bloqueoCoincidente = bloqueos.find(b => {
          if (!b.inicio) return true;
          return b.inicio <= horaInicioStr && (b.fin ? b.fin > horaInicioStr : true);
        });

        if (bloqueoCoincidente) {
          estado = 'mantenimiento';
          motivoBloqueo = bloqueoCoincidente.motivo;
        }

        if (estado === 'libre') {
          const fijaCoincidente = fijas.find(f => {
            return f.inicio <= horaInicioStr && (f.fin ? f.fin > horaInicioStr : true);
          });
          if (fijaCoincidente) {
            estado = 'fijo';
            motivoBloqueo = `FIJO - ${fijaCoincidente.titular}`;
          }
        }

        if (estado === 'libre') {
          const reservaCoincidente = reservas.find(r => r.turnoId === turnoId);
          if (reservaCoincidente) {
            estado = 'reservado';
            reservaId = reservaCoincidente.id;
          }
        }

        if (estado === 'libre' && esHoy && h <= horaActual) {
          motivoBloqueo = 'Horario transcurrido';
        }

        turnos.push({
          id: turnoId,
          espacioId,
          fecha,
          inicio: horaInicioStr,
          fin: horaFinStr,
          estado,
          reservaId,
          motivoBloqueo,
          precio: espacio.precioPorHora
        });
      }

      return crearExito(turnos, { total: turnos.length, pagina: 1, porPagina: 16 });
    } catch {
      return crearError('ERROR_GRILLA', 'Error al calcular la grilla de disponibilidad.');
    }
  },

  obtenerProximos7Dias(): { fecha: string; diaSemana: string; etiqueta: string; diaMes: string }[] {
    const diasSemanaNombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const diasMesNombres = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const resultado = [];
    const hoy = new Date();

     for (let i = 0; i < 7; i++) {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() + i);

      const anio = d.getFullYear();
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const dia = String(d.getDate()).padStart(2, '0');
      const fechaStr = `${anio}-${mes}-${dia}`;

      const diaSemana = diasSemanaNombres[d.getDay()];
      const etiqueta = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : `${diaSemana} ${dia}`;
      const diaMes = `${dia} ${diasMesNombres[d.getMonth()]}`;

      resultado.push({
        fecha: fechaStr,
        diaSemana,
        etiqueta,
        diaMes
      });
    }

    return resultado;
  }
};