import { obtenerBD } from '../basedatos/sqlite';
import { Reserva, RespuestaExito, RespuestaError } from '../tipos';
import { crearExito, crearError } from './api';
import { Haptica } from './haptica';
import { NotificacionesServicio } from './notificaciones';
import { RESERVAS_MOCK } from '../mocks/reservas';
import { USUARIOS_MOCK } from '../mocks/usuarios';

export const ReservasServicio = {
  async crearReserva(params: {
    espacioId: string;
    nombreEspacio: string;
    turnoId: string;
    usuarioId: string;
    cantidadPersonas: number;
    fecha: string;
    inicio: string;
  }): Promise<RespuestaExito<Reserva> | RespuestaError> {
    try {
      const db = await obtenerBD();

      const activas = await db.getAllAsync<any>(
        'SELECT * FROM reservas WHERE usuarioId = ? AND estado = "confirmada"',
        [params.usuarioId]
      );

      if (activas.length >= 3) {
        return crearError(
          'LIMITE_RESERVAS',
          'Alcanzaste el máximo de 3 reservas activas simultáneas. Cancela o completa una anterior para reservar nuevamente.'
        );
      }

      const turnoTomado = await db.getFirstAsync<any>(
        'SELECT * FROM reservas WHERE turnoId = ? AND estado = "confirmada"',
        [params.turnoId]
      );
      if (turnoTomado) {
        return crearError('TURNO_OCUPADO', 'Ese turno ya fue reservado por otro usuario.');
      }

      const idReserva = `res-${Date.now().toString().slice(-4)}`;
      const horaLimpia = params.inicio.replace(':', '');
      const codigoQr = `VGY-${idReserva.replace('res-', '')}-${params.espacioId.replace('esp-', '')}-${horaLimpia}`;

      const ahoraIso = new Date().toISOString();
      const [anio, mes, dia] = params.fecha.split('-').map(Number);
      const [hora, min] = params.inicio.split(':').map(Number);
      const fechaTurno = new Date(anio, mes - 1, dia, hora, min);
      const cancelableHasta = new Date(fechaTurno.getTime() - 4 * 60 * 60 * 1000).toISOString();

      const nuevaReserva: Reserva = {
        id: idReserva,
        turnoId: params.turnoId,
        espacioId: params.espacioId,
        usuarioId: params.usuarioId,
        cantidadPersonas: params.cantidadPersonas,
        codigoQr,
        estado: 'confirmada',
        ingresoEn: null,
        creadaEn: ahoraIso,
        cancelableHasta
      };

      await db.runAsync(
        'INSERT INTO reservas (id, turnoId, espacioId, usuarioId, cantidadPersonas, codigoQr, estado, ingresoEn, creadaEn, cancelableHasta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          nuevaReserva.id,
          nuevaReserva.turnoId,
          nuevaReserva.espacioId,
          nuevaReserva.usuarioId,
          nuevaReserva.cantidadPersonas,
          nuevaReserva.codigoQr,
          nuevaReserva.estado,
          nuevaReserva.ingresoEn,
          nuevaReserva.creadaEn,
          nuevaReserva.cancelableHasta
        ]
      );

      RESERVAS_MOCK.unshift(nuevaReserva);

      await Haptica.confirmacion();
      await NotificacionesServicio.programarRecordatorioTurno(
        nuevaReserva.id,
        params.nombreEspacio,
        params.fecha,
        params.inicio
      );

      return crearExito(nuevaReserva);
    } catch {
      return crearError('ERROR_CREAR_RESERVA', 'No se pudo procesar la reserva.');
    }
  },

  async obtenerMisReservas(usuarioId: string): Promise<RespuestaExito< { proximas: Reserva[]; pasadas: Reserva[] }> | RespuestaError> {
    try {
      const db = await obtenerBD();
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM reservas WHERE usuarioId = ? ORDER BY creadaEn DESC',
        [usuarioId]
      );

      const reservas: Reserva[] = rows.map(r => ({
        id: r.id,
        turnoId: r.turnoId,
        espacioId: r.espacioId,
        usuarioId: r.usuarioId,
        cantidadPersonas: r.cantidadPersonas,
        codigoQr: r.codigoQr,
        estado: r.estado as any,
        ingresoEn: r.ingresoEn || null,
        creadaEn: r.creadaEn,
        cancelableHasta: r.cancelableHasta,
      }));

      const proximas = reservas.filter(r => r.estado === 'confirmada');
      const pasadas = reservas.filter(r => r.estado !== 'confirmada');

      return crearExito({ proximas, pasadas });
    } catch {
      const misMocks = RESERVAS_MOCK.filter(r => r.usuarioId === usuarioId);
      return crearExito({
        proximas: misMocks.filter(r => r.estado === 'confirmada'),
        pasadas: misMocks.filter(r => r.estado !== 'confirmada')
      });
    }
  },

  async obtenerReservaPorId(id: string): Promise<RespuestaExito<Reserva> | RespuestaError> {
    try {
      const db = await obtenerBD();
      const r = await db.getFirstAsync<any>('SELECT * FROM reservas WHERE id = ?', [id]);
      if (!r) {
        const mock = RESERVAS_MOCK.find(x => x.id === id);
        if (mock) return crearExito(mock);
        return crearError('RESERVA_NO_ENCONTRADA', 'La reserva no existe.');
      }
      return crearExito({
        id: r.id,
        turnoId: r.turnoId,
        espacioId: r.espacioId,
        usuarioId: r.usuarioId,
        cantidadPersonas: r.cantidadPersonas,
        codigoQr: r.codigoQr,
        estado: r.estado as any,
        ingresoEn: r.ingresoEn || null,
        creadaEn: r.creadaEn,
        cancelableHasta: r.cancelableHasta,
      });
    } catch {
      const mock = RESERVAS_MOCK.filter(x => x.id === id)[0];
      if (mock) return crearExito(mock);
      return crearError('RESERVA_NO_ENCONTRADA', 'La reserva no existe.');
    }
  },

  async cancelarReserva(reservaId: string, usuarioId: string): Promise<RespuestaExito<{ cancelacionTardia: boolean }> | RespuestaError> {
    try {
      const db = await obtenerBD();
      const reserva = await db.getFirstAsync<any>('SELECT * FROM reservas WHERE id = ?', [reservaId]);
      if (!reserva) {
        return crearError('RESERVA_NO_ENCONTRADA', 'La reserva no existe.');
      }

      const ahora = new Date().getTime();
      const limite = new Date(reserva.cancelableHasta).getTime();
      const esTardia = ahora > limite;

      await db.runAsync('UPDATE reservas SET estado = "cancelada" WHERE id = ?', [reservaId]);

      if (esTardia) {
        await db.runAsync('UPDATE usuarios SET cancelacionesTardias = cancelacionesTardias + 1 WHERE id = ?', [usuarioId]);
        const u = USUARIOS_MOCK.find(x => x.id === usuarioId);
        if (u) u.cancelacionesTardias += 1;
      }

      const m = RESERVAS_MOCK.find(r => r.id === reservaId);
      if (m) m.estado = 'cancelada';

      return crearExito({ cancelacionTardia: esTardia });
    } catch {
      return crearError('ERROR_CANCELAR', 'No se pudo cancelar la reserva.');
    }
  },

  async validarIngresoQr(codigoQr: string, espacioIdActual?: string): Promise<RespuestaExito<{ reserva: Reserva; mensaje: string }> | RespuestaError> {
    try {
      const db = await obtenerBD();
      const r = await db.getFirstAsync<any>('SELECT * FROM reservas WHERE codigoQr = ?', [codigoQr]);

      if (!r) {
        await Haptica.errorIngreso();
        return crearError('QR_INVALIDO', 'El código QR no corresponde a ninguna reserva registrada en el sistema.');
      }

      if (r.estado === 'cumplida') {
        await Haptica.errorIngreso();
        return crearError('TURNO_YA_INGRESADO', `Este turno ya ingresó previamente a las ${r.ingresoEn ? new Date(r.ingresoEn).toLocaleTimeString() : 'hora registrada'}.`);
      }

      if (r.estado === 'cancelada') {
        await Haptica.errorIngreso();
        return crearError('TURNO_CANCELADO', 'Esta reserva fue cancelada previamente.');
      }

      if (r.estado === 'ausente') {
        await Haptica.errorIngreso();
        return crearError('TURNO_AUSENTE', 'Esta reserva fue marcada como no presentado (ausente).');
      }

      if (espacioIdActual && r.espacioId !== espacioIdActual) {
        await Haptica.errorIngreso();
        return crearError('CANCHA_DISTINTA', `El código pertenece a otro espacio deportivo (${r.espacioId}), no a esta cancha.`);
      }

      const ahoraIso = new Date().toISOString();
      await db.runAsync('UPDATE reservas SET estado = "cumplida", ingresoEn = ? WHERE id = ?', [ahoraIso, r.id]);

      const resActualizada: Reserva = {
        id: r.id,
        turnoId: r.turnoId,
        espacioId: r.espacioId,
        usuarioId: r.usuarioId,
        cantidadPersonas: r.cantidadPersonas,
        codigoQr: r.codigoQr,
        estado: 'cumplida',
        ingresoEn: ahoraIso,
        creadaEn: r.creadaEn,
        cancelableHasta: r.cancelableHasta,
      };

      const m = RESERVAS_MOCK.find(x => x.id === r.id);
      if (m) {
        m.estado = 'cumplida';
        m.ingresoEn = ahoraIso;
      }

      await Haptica.exitoIngreso();
      return crearExito({
        reserva: resActualizada,
        mensaje: `Ingreso validado con éxito para ${r.cantidadPersonas} personas.`
      });
    } catch {
      await Haptica.errorIngreso();
      return crearError('ERROR_VALIDACION', 'Ocurrió un error al procesar el código.');
    }
  },

  async marcarAusente(reservaId: string): Promise<RespuestaExito<boolean> | RespuestaError> {
    try {
      const db = await obtenerBD();
      const r = await db.getFirstAsync<any>('SELECT * FROM reservas WHERE id = ?', [reservaId]);
      if (!r) return crearError('NO_ENCONTRADA', 'Reserva no encontrada.');

      await db.runAsync('UPDATE reservas SET estado = "ausente" WHERE id = ?', [reservaId]);
      await db.runAsync('UPDATE usuarios SET ausencias = ausencias + 1 WHERE id = ?', [r.usuarioId]);

      const u = USUARIOS_MOCK.find(x => x.id === r.usuarioId);
      if (u) u.ausencias += 1;

      const m = RESERVAS_MOCK.find(x => x.id === reservaId);
      if (m) m.estado = 'ausente';

      return crearExito(true);
    } catch {
      return crearError('ERROR_AUSENTE', 'No se pudo marcar como ausente.');
    }
  }
};