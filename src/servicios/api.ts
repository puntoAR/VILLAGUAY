import { RespuestaExito, RespuestaError, MetaApi } from '../tipos';

export function crearExito<T>(datos: T, meta?: MetaApi): RespuestaExito<T> {
  return { datos, meta };
}

export function crearError(codigo: string, mensaje: string): RespuestaError {
  return {
    error: {
      codigo,
      mensaje
    }
  };
}

export function esError(respuesta: any): respuesta is RespuestaError {
  return respuesta && typeof respuesta === 'object' && 'error' in respuesta;
}
