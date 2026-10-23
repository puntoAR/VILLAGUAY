// src/mocks/usuarios.ts
// Usuarios de prueba del sistema

import { Usuario } from '../tipos';

export const USUARIOS_MOCK: Usuario[] = [
  {
    id: 'usr-jugador-1',
    nombre: 'Usuario Deportista',
    email: 'usuario@villaguay.gob.ar',
    telefono: '3455-401122',
    rol: 'jugador',
    espaciosFavoritos: ['esp-01', 'esp-02'],
    cancelacionesTardias: 0,
    ausencias: 0,
    password: 'password123',
  },
  {
    id: 'usr-encargado',
    nombre: 'Encargado de Complejo',
    email: 'encargado@villaguay.gob.ar',
    telefono: '3455-442211',
    rol: 'encargado',
    espaciosFavoritos: [],
    cancelacionesTardias: 0,
    ausencias: 0,
    password: 'password123',
  },
  {
    id: 'usr-director',
    nombre: 'Director de Deportes',
    email: 'director@villaguay.gob.ar',
    telefono: '3455-554433',
    rol: 'administrador',
    espaciosFavoritos: [],
    cancelacionesTardias: 0,
    ausencias: 0,
    password: 'password123',
  },
  // Alias de compatibilidad
  {
    id: 'usr-marcelo',
    nombre: 'Encargado de Complejo',
    email: 'marcelo@villaguay.gob.ar',
    telefono: '3455-442211',
    rol: 'encargado',
    espaciosFavoritos: [],
    cancelacionesTardias: 0,
    ausencias: 0,
    password: 'password123',
  },
  {
    id: 'usr-nahuel',
    nombre: 'Director de Deportes',
    email: 'nahuel@villaguay.gob.ar',
    telefono: '3455-554433',
    rol: 'administrador',
    espaciosFavoritos: [],
    cancelacionesTardias: 0,
    ausencias: 0,
    password: 'password123',
  },
];
