import { Espacio } from '../tipos';

export const ESPACIOS_MOCK: Espacio[] = [
  {
    id: 'esp-01',
    nombre: 'Cancha 1 — Fútbol 5',
    deporteId: 'dep-futbol5',
    complejo: 'Polideportivo Municipal',
    superficie: 'césped sintético',
    techado: false,
    iluminacion: true,
    capacidad: 10,
    precioPorHora: 12000,
    coordenadas: { latitud: -31.8642, longitud: -59.0281 },
    imagenes: [
      'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop'
    ],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    reglas: 'Obligatorio calzado para sintético (sin tapones de aluminio). Cuidar las redes perimetrales.',
    activo: true
  },
  {
    id: 'esp-02',
    nombre: 'Cancha 2 — Fútbol 5',
    deporteId: 'dep-futbol5',
    complejo: 'Polideportivo Municipal',
    superficie: 'césped sintético',
    techado: false,
    iluminacion: true,
    capacidad: 10,
    precioPorHora: 12000,
    coordenadas: { latitud: -31.8645, longitud: -59.0284 },
    imagenes: [
      'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&auto=format&fit=crop'
    ],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    reglas: 'No se permite calzado con tapones de aluminio. Prohibido fumar en el predio.',
    activo: true
  },
  {
    id: 'esp-03',
    nombre: 'Cancha 3 — Fútbol 11',
    deporteId: 'dep-futbol11',
    complejo: 'Polideportivo Municipal',
    superficie: 'césped natural',
    techado: false,
    iluminacion: true,
    capacidad: 22,
    precioPorHora: 25000,
    coordenadas: { latitud: -31.8650, longitud: -59.0275 },
    imagenes: [
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop'
    ],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    reglas: 'Sujeto a condiciones climáticas. No usar con barro para preservar el césped natural.',
    activo: true
  },
  {
    id: 'esp-04',
    nombre: 'Cancha Básquet 1',
    deporteId: 'dep-basquet',
    complejo: 'Polideportivo Municipal',
    superficie: 'piso parquet',
    techado: true,
    iluminacion: true,
    capacidad: 10,
    precioPorHora: 10000,
    coordenadas: { latitud: -31.8638, longitud: -59.0288 },
    imagenes: [
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop'
    ],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    reglas: 'Exclusivo zapatillas de básquet con suela limpia de goma (no abrasiva).',
    activo: true
  },
  {
    id: 'esp-05',
    nombre: 'Cancha Básquet 2',
    deporteId: 'dep-basquet',
    complejo: 'Polideportivo Municipal',
    superficie: 'cemento alisado',
    techado: false,
    iluminacion: true,
    capacidad: 10,
    precioPorHora: 8000,
    coordenadas: { latitud: -31.8635, longitud: -59.0282 },
    imagenes: [
      'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&auto=format&fit=crop'
    ],
    videoUrl: null, // Caso feo: espacio sin video
    reglas: 'Uso recreativo diurno y nocturno. Respetar horarios vecinales.',
    activo: true
  },
  {
    id: 'esp-06',
    nombre: 'Cancha Vóley 1',
    deporteId: 'dep-voley',
    complejo: 'Polideportivo Municipal',
    superficie: 'piso deportivo sintético',
    techado: true,
    iluminacion: true,
    capacidad: 12,
    precioPorHora: 9000,
    coordenadas: { latitud: -31.8640, longitud: -59.0290 },
    imagenes: [
      'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&auto=format&fit=crop'
    ],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    reglas: 'Calzado deportivo limpio. Retirar objetos punzantes antes de ingresar.',
    activo: true
  },
  {
    id: 'esp-07',
    nombre: 'Gimnasio Cerrado Multiuso',
    deporteId: 'dep-futbol5',
    complejo: 'Polideportivo Municipal',
    superficie: 'parquet flotante',
    techado: true,
    iluminacion: true,
    capacidad: 30,
    precioPorHora: 15000,
    coordenadas: { latitud: -31.8644, longitud: -59.0292 },
    imagenes: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop'
    ],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    reglas: 'Prioridad clubes federados y escuelas municipales. Prohibido alimentos.',
    activo: true
  },
  {
    id: 'esp-08',
    nombre: 'Cancha Tenis 1',
    deporteId: 'dep-tenis',
    complejo: 'Parque Berduc',
    superficie: 'polvo de ladrillo',
    techado: false,
    iluminacion: true,
    capacidad: 4,
    precioPorHora: 11000,
    coordenadas: { latitud: -31.8595, longitud: -59.0340 },
    imagenes: [
      'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&auto=format&fit=crop'
    ],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    reglas: 'Pasar la esterilla y regar el polvo de ladrillo al finalizar el turno.',
    activo: true
  },
  {
    id: 'esp-09',
    nombre: 'Cancha Tenis 2',
    deporteId: 'dep-tenis',
    complejo: 'Parque Berduc',
    superficie: 'polvo de ladrillo',
    techado: false,
    iluminacion: true,
    capacidad: 4,
    precioPorHora: 11000,
    coordenadas: { latitud: -31.8597, longitud: -59.0343 },
    imagenes: [
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&auto=format&fit=crop'
    ],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    reglas: 'Obligatorio calzado plano para polvo de ladrillo.',
    activo: true
  },
  {
    id: 'esp-10',
    nombre: 'Cancha Básquet 3',
    deporteId: 'dep-basquet',
    complejo: 'Parque Berduc',
    superficie: 'cemento',
    techado: false,
    iluminacion: true,
    capacidad: 10,
    precioPorHora: 8000,
    coordenadas: { latitud: -31.8590, longitud: -59.0338 },
    imagenes: [
      'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop'
    ],
    videoUrl: null, // Sin video
    reglas: 'Cuidar aros y redes metálicas.',
    activo: true
  },
  {
    id: 'esp-11',
    nombre: 'Cancha Vóley 2',
    deporteId: 'dep-voley',
    complejo: 'Parque Berduc',
    superficie: 'arena',
    techado: false,
    iluminacion: false, // Sin luz para jugar de noche
    capacidad: 12,
    precioPorHora: 7000,
    coordenadas: { latitud: -31.8588, longitud: -59.0335 },
    imagenes: [
      'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&auto=format&fit=crop'
    ],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
    reglas: 'Solo horario diurno. Dejar la cancha libre de botellas o residuos.',
    activo: true
  }
];
