import { Usuario } from '../tipos';

export const USUARIOS_MOCK: Usuario[] = [
  {
    id: 'usr-207',
    nombre: 'Emiliano Ruiz',
    email: 'emiliano@mail.com',
    telefono: '3455-401122',
    rol: 'jugador',
    espaciosFavoritos: ['esp-02', 'esp-08'],
    cancelacionesTardias: 1,
    ausencias: 0
  },
  {
    id: 'usr-marcelo',
    nombre: 'Marcelo (Encargado Polideportivo)',
    email: 'marcelo@villaguay.gob.ar',
    telefono: '3455-554433',
    rol: 'encargado',
    espaciosFavoritos: [],
    cancelacionesTardias: 0,
    ausencias: 0
  },
  {
    id: 'usr-nahuel',
    nombre: 'Nahuel Ojeda (Director Deportes)',
    email: 'nahuel@villaguay.gob.ar',
    telefono: '3455-998877',
    rol: 'administrador',
    espaciosFavoritos: ['esp-01', 'esp-03'],
    cancelacionesTardias: 0,
    ausencias: 0
  }
];
