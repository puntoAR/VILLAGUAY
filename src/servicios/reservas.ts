import { obtenerBD } from '../basedatos/sqlite';
import { Reserva, RespuestaExito, RespuestaError } from '../tipos';
import { crearExito, crearError } from './api';
import { Haptica } from './haptica';
import { NotificacionesServicio } from './notificaciones';
import { RESERVAS_MOCK } from '../mocks/reservas';
import { USUARIOS_MOCK } from '../mocks/usuarios';

export const ReservasServicio = {
  // Crear una nueva reserva para un turno libre
  async crearReserva(params: {
    espacioId: string;
    nombreEspacio?: string;
    turnoId: string;
    usuarioId: string;
    cantidadPersonas: number;
    fecha: string;
    inicio: string;
    nombreUsuario?: string;
    telefonoUsuario?: string;
  }): Promise<RespuestaExito<Reserva> | RespuestaError> {
    try {
      const db = await obtenerBD();

      // Solo los usuarios con rol jugador pueden realizar reservas
      const usuarioObj = await db.getFirstAsync<any>(
        'SELECT rol FROM usuarios WHERE id = ?',
        [params.usuarioId]
      );
      if (usuarioObj && usuarioObj.rol !== 'jugador') {
        return crearError(
          'ACCESO_DENEGADO_ROL',
          'El personal municipal (encargados y directores) no puede realizar reservas particulares de canchas.'
        );
      }

      // Máximo de 3 reservas activas por persona
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

      // Comprobar si el turno ya fue reservado
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
      // Cancelable sin penalización hasta 4 horas antes
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
        cancelableHasta,
        nombreUsuario: params.nombreUsuario,
        telefonoUsuario: params.telefonoUsuario,
        nombreEspacio: params.nombreEspacio,
      };

      await db.runAsync(
        'INSERT INTO reservas (id, turnoId, espacioId, usuarioId, cantidadPersonas, codigoQr, estado, ingresoEn, creadaEn, cancelableHasta, nombreUsuario, telefonoUsuario, nombreEspacio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          nuevaReserva.id,
          nuevaReserva.turnoId,
          nuevaReserva.espacioId,
          nuevaReserva.usuarioId,
          nuevaReserva.cantidadPersonas,
          nuevaReserva.codigoQr,
          nuevaReserva.estado,
          nuevaReserva.ingresoEn || null,
          nuevaReserva.creadaEn,
          nuevaReserva.cancelableHasta,
          nuevaReserva.nombreUsuario || null,
          nuevaReserva.telefonoUsuario || null,
          nuevaReserva.nombreEspacio || null,
        ]
      );

      RESERVAS_MOCK.unshift(nuevaReserva);

      await Haptica.confirmacion();
      await NotificacionesServicio.programarRecordatorioTurno(
        nuevaReserva.id,
        params.nombreEspacio || 'Cancha',
        params.fecha,
        params.inicio
      );

      return crearExito(nuevaReserva);
    } catch {
      return crearError('ERROR_CREAR_RESERVA', 'No se pudo procesar la reserva.');
    }
  },

  // Obtener reservas del usuario separadas en próximas y pasadas
  async obtenerMisReservas(usuarioId: string): Promise<RespuestaExito<{ proximas: Reserva[]; pasadas: Reserva[] }> | RespuestaError> {
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
        nombreUsuario: r.nombreUsuario || undefined,
        telefonoUsuario: r.telefonoUsuario || undefined,
        nombreEspacio: r.nombreEspacio || undefined,
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

  // Obtener el detalle de una reserva por ID
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
        nombreUsuario: r.nombreUsuario || undefined,
        telefonoUsuario: r.telefonoUsuario || undefined,
        nombreEspacio: r.nombreEspacio || undefined,
      });
    } catch {
      const mock = RESERVAS_MOCK.filter(x => x.id === id)[0];
      if (mock) return crearExito(mock);
      return crearError('RESERVA_NO_ENCONTRADA', 'La reserva no existe.');
    }
  },

  // Cancelar una reserva (registra cancelación tardía si es a menos de 4 horas)
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

  // Validar código QR escaneado en puerta por el encargado
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

      // Validar si corresponde al día de hoy
      const partesTurno = r.turnoId.split('-');
      if (partesTurno.length >= 3) {
        const fechaTurnoStr = partesTurno[2]; // AAAAMMDD
        const ahora = new Date();
        const hoyStr = `${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, '0')}${String(ahora.getDate()).padStart(2, '0')}`;
        if (fechaTurnoStr !== hoyStr) {
          await Haptica.errorIngreso();
          return crearError('FECHA_INCORRECTA', 'El código corresponde a una reserva de otra fecha, no a la jornada de hoy.');
        }
      }

      // Validar si corresponde a la cancha actual si se especificó
      if (espacioIdActual && r.espacioId !== espacioIdActual) {
        await Haptica.errorIngreso();
        return crearError('CANCHA_INCORRECTA', `Este código pertenece al espacio #${r.espacioId}, no a esta cancha.`);
      }

      const ahoraIso = new Date().toISOString();
      await db.runAsync('UPDATE reservas SET estado = "cumplida", ingresoEn = ? WHERE id = ?', [ahoraIso, r.id]);

      const m = RESERVAS_MOCK.find(x => x.id === r.id);
      if (m) {
        m.estado = 'cumplida';
        m.ingresoEn = ahoraIso;
      }

      await Haptica.exitoIngreso();
      const horaLlegada = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

      return crearExito({
        reserva: {
          ...r,
          estado: 'cumplida',
          ingresoEn: ahoraIso,
        },
        mensaje: `Ingreso registrado a las ${horaLlegada} hs. Cantidad de jugadores: ${r.cantidadPersonas}.`
      });
    } catch {
      return crearError('ERROR_VALIDAR_QR', 'Error al procesar el código de ingreso.');
    }
  },

  // Marcar una reserva como no presentado (ausente) por el encargado
  async marcarAusente(reservaId: string): Promise<RespuestaExito<boolean> | RespuestaError> {
    try {
      const db = await obtenerBD();
      const r = await db.getFirstAsync<any>('SELECT * FROM reservas WHERE id = ?', [reservaId]);
      if (!r) {
        return crearError('RESERVA_NO_ENCONTRADA', 'La reserva no existe.');
      }

      await db.runAsync('UPDATE reservas SET estado = "ausente" WHERE id = ?', [reservaId]);
      await db.runAsync('UPDATE usuarios SET ausencias = ausencias + 1 WHERE id = ?', [r.usuarioId]);

      const m = RESERVAS_MOCK.find(x => x.id === reservaId);
      if (m) m.estado = 'ausente';

      const u = USUARIOS_MOCK.find(x => x.id === r.usuarioId);
      if (u) u.ausencias += 1;

      return crearExito(true);
    } catch {
      return crearError('ERROR_MARCAR_AUSENTE', 'No se pudo marcar la inasistencia.');
    }
  },

  // Obtener todas las reservas registradas
  async obtenerAlquileresPredio(): Promise<RespuestaExito<Reserva[]> | RespuestaError> {
    try {
      const db = await obtenerBD();
      const rows = await db.getAllAsync<any>('SELECT * FROM reservas ORDER BY creadaEn DESC');

      const mapeadas: Reserva[] = rows.map(r => ({
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
        nombreUsuario: r.nombreUsuario || undefined,
        telefonoUsuario: r.telefonoUsuario || undefined,
        nombreEspacio: r.nombreEspacio || undefined,
      }));

      const idSet = new Set(mapeadas.map(m => m.id));
      RESERVAS_MOCK.forEach(mock => {
        if (!idSet.has(mock.id)) {
          mapeadas.push(mock);
        }
      });

      return crearExito(mapeadas);
    } catch {
      return crearExito(RESERVAS_MOCK);
    }
  },
};