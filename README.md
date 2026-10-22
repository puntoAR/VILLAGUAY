# Reservas Deportivas Villaguay — Versión Cátedra UNER
**Proyecto Final de Aplicación Móvil (React Native & Expo)**

Aplicación móvil desarrollada según los requerimientos del PRD de la Dirección de Deportes de la Municipalidad de Villaguay, Entre Ríos, estructurada estrictamente para cumplir y acreditar los contenidos de las **Unidades 3, 4, 5 y 6** de la cátedra.

> 📦 **Entrega Oficial del APK de Release**:
> - **Descarga Directa del APK**: [Descargar APK Oficial (Expo EAS)](https://expo.dev/artifacts/eas/wDtn76Iql9-oYq6JMugSnL9bEBaUDYLwd3lZjgrpSCQ.apk)
> - **Dashboard de Build en Expo Cloud**: [Build #2eeab8c7](https://expo.dev/accounts/jgroman/projects/reservas-deportivas-villaguay/builds/2eeab8c7-b570-4457-a018-ee0ba7ec411a).
> - **Instrucciones de Instalación**: Consultá [apk/INSTRUCCIONES_INSTALACION.md](./apk/INSTRUCCIONES_INSTALACION.md).
> - 📖 **Simulador de Defensa Oral**: Consultá las 25 preguntas y respuestas modelo en [PREGUNTAS_DEFENSA_ORAL.md](./PREGUNTAS_DEFENSA_ORAL.md).

---

## 🏛️ Mapa de Alineación Curricular por Unidad

### Unidad 3: Interfaz, Navegación y Expo Router
- **Estructura en `src/app/`**: Enrutamiento basado en archivos con `_layout.tsx`, pestañas agrupadas `(tabs)`, rutas dinámicas `espacio/[id].tsx`, y pantalla `+not-found.tsx`.
- **Componentes primitivos modernos**: Construcción de interfaces con `Pressable`, `View`, `Text` y `expo-image` (reemplazando `TouchableOpacity`).
- **Navegación declarativa**: Enlaces optimizados con `<Link href="..." prefetch>` en `TarjetaEspacio.tsx`.
- **Navegación imperativa y parámetros**: Uso de `router.replace` al iniciar sesión y lectura de parámetros dinámicos con el hook `useLocalSearchParams<{ id: string }>()`.
- **Patrón Tabs**: 4 pestañas directas (Canchas, Mapa, Mis Turnos y Perfil).

### Unidad 4: APIs del Dispositivo, Sensores, Multimedia y Notificaciones
- **Cámara (`expo-camera`)**: Pantalla `escaner.tsx` utilizando `<CameraView>` y control de permisos en tiempo de ejecución (`useCameraPermissions`) para validar pases QR en el ingreso a las canchas.
- **Galería y Sistema de Archivos (`expo-image-picker` & `expo-file-system`)**: En `perfil.tsx` se selecciona foto de perfil y se aplica la **regla crítica de la cátedra**: se copia el recurso desde la memoria volátil (`Paths.cache`) al almacenamiento permanente (`Paths.document`) mediante la nueva API orientada a objetos (`File`, `Paths`).
- **Renderizado eficiente (`expo-image`)**: Renderizado con transiciones suaves y caché optimizada en `TarjetaEspacio.tsx` y `perfil.tsx`.
- **Ubicación y Mapas (`expo-location` & `react-native-maps`)**: Pantalla `mapa.tsx` con marcadores del Polideportivo Municipal y Parque Berduc, geolocalización del usuario y cálculo de distancia en km.
- **Sensores de movimiento (`expo-sensors`)**: Implementación formal del ciclo del **Acelerómetro** en `src/servicios/sensores.ts` (`isAvailableAsync`, `setUpdateInterval`, `addListener` y `sub.remove()` en cleanup). Al sacudir el teléfono (shake), se resetean los filtros de búsqueda en `index.tsx`.
- **Hápticos (`expo-haptics`)**: Feedback táctil en selecciones, confirmaciones de reserva y lectura de QR.
- **Video (`expo-video`)**: Componente `ReproductorVideo.tsx` con `useVideoPlayer` y `VideoView` nativo para previsualizar la cancha en video.
- **Notificaciones (`expo-notifications`)**: Canal prioritario en Android (`turnos-villaguay`), visualización en primer plano con `setNotificationHandler` y programación del recordatorio del turno.

### Unidad 5: Redes y Persistencia de Datos
- **Consumo de API de la Cátedra**: Cliente HTTP centralizado en `src/servicios/api.ts` con URL base, inyección de token Bearer y cancelación de peticiones con `AbortController`.
- **TanStack Query (React Query)**:
  - `useQuery` para consulta de espacios y turnos con caché automática y tiempos de obsolescencia (`staleTime`).
  - `useMutation` para creación y cancelación de turnos con invalidación de caché (`queryClient.invalidateQueries`).
- **Detección de Red (`expo-network`)**: Componente `BannerDesconexion.tsx` que advierte visualmente cuando se pierde la conexión a internet.
- **Persistencia Local Dual**:
  - `AsyncStorage` (`@react-native-async-storage/async-storage`): Clave-valor para preferencias livianas (modo claro/oscuro persistido).
  - `SQLite` (`expo-sqlite`): **API sincrónica estricta** con `SQLite.openDatabaseSync()`, `execSync()`, `runSync()`, `getAllSync()`, `getFirstSync()` y transacciones atómicas con `withTransactionSync()`.

### Unidad 6: Seguridad, Computación Ubicua e IoT
- **Almacenamiento Seguro (`expo-secure-store`)**: Resguardo cifrado de tokens JWT de sesión.
- **Biometría Local (`expo-local-authentication`)**: Verificación de huella o rostro con validación de hardware disponible y fallback de contraseña.
- **Navegación Web (`expo-web-browser`)**: Apertura del portal municipal mediante `WebBrowser.openBrowserAsync`.
- **Computación Ubicua e IoT (Mark Weiser)**: En la reserva con "Iluminación Nocturna", el smartphone actúa como interfaz y disparador de telemetría/actuadores IoT en el complejo deportivo.

---

## 🚀 Instrucciones para Ejecutar y Compilar

### 1. Ejecución en Modo Desarrollo
```bash
# Iniciar Metro Bundler
npx expo start
```
Escanear el código QR con **Expo Go** en Android o presionar `a` para abrir en emulador.

### 2. Generación del APK Standalone (Consigna de Entrega)
Tal como exige la consigna, la app debe compilarse con EAS Build en el perfil preview:
```bash
# 1. Iniciar sesión en EAS (si no lo hiciste)
npx eas login

# 2. Compilar APK de preview para Android
npx eas build --platform android --profile preview
```
Al finalizar el proceso en la nube de Expo, EAS proporcionará un enlace directo para descargar el archivo `.apk` instalable en cualquier dispositivo Android sin necesidad de Metro ni computadora.

---

## 👥 Reparto Equitativo para la Defensa Oral (5 Integrantes — 15 a 20 min)

Cada integrante cuenta con un tiempo estimado de **3 a 4 minutos** para exponer su módulo y responder las preguntas técnicas de la mesa examinadora:

### 👤 Integrante 1: Arquitectura, Expo Router y Componentes Primitivos (Unidad 3)
- **Archivos a cargo**: `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`, `src/componentes/TarjetaEspacio.tsx`, `src/app/+not-found.tsx`.
- **Temas a defender**:
  - Estructura `src/app/` con enrutamiento basado en archivos, providers globales y configuración del Stack.
  - Navegación por pestañas `(tabs)` configurada con 4 pestañas directas (Canchas, Mapa, Turnos, Perfil).
  - Reemplazo de componentes heredados (`TouchableOpacity`) por componentes nativos primitivos: `Pressable`, `View`, `Text`.
  - Navegación declarativa utilizando `<Link href="..." prefetch>` vs navegación imperativa (`router.replace` en login).
  - Manejo de rutas inexistentes con `+not-found.tsx`.

### 👤 Integrante 2: Sensores, Hápticos y Hardware del Dispositivo (Unidad 4 - Parte 1)
- **Archivos a cargo**: `src/servicios/sensores.ts`, `src/servicios/haptica.ts`, `src/app/escaner.tsx`, `src/app/(tabs)/index.tsx`.
- **Temas a defender**:
  - Implementación formal del ciclo del **Acelerómetro** (`expo-sensors`): `isAvailableAsync()`, `setUpdateInterval(300)`, suscripción y liberación obligatoria en el retorno de `useEffect` con `sub.remove()`.
  - Detección matemática de sacudida (shake) mediante la aceleración combinada $\sqrt{x^2+y^2+z^2} > 2.4$ para resetear filtros en la lista de canchas.
  - Cámara en vivo: `<CameraView>` para escaneo de códigos QR en puerta y evaluación de permisos en tiempo de ejecución (`useCameraPermissions`).
  - Retroalimentación háptica (`expo-haptics`): `selectionAsync`, `impactAsync` y `notificationAsync`.

### 👤 Integrante 3: Multimedia, Geolocalización y File System (Unidad 4 - Parte 2)
- **Archivos a cargo**: `src/servicios/multimedia.ts`, `src/componentes/ReproductorVideo.tsx`, `src/app/(tabs)/mapa.tsx`, `src/app/(tabs)/perfil.tsx`.
- **Temas a defender**:
  - **Regla Crítica de la Cátedra**: Explicar por qué las imágenes de `expo-image-picker` quedan en la memoria volátil (`Paths.cache`) y cómo se copian explícitamente al almacenamiento permanente (`Paths.document`) mediante la API orientada a objetos (`File`, `Paths`) de `expo-file-system`.
  - Renderizado eficiente con `<Image>` de `expo-image` (caché y transiciones fluidas de 250ms).
  - Video nativo: `useVideoPlayer` y `VideoView` de `expo-video` para el recorrido de canchas.
  - Ubicación y mapas: `expo-location` (permisos en primer plano), marcadores de complejos en `react-native-maps` y fórmula de distancia euclídea en kilómetros.

### 👤 Integrante 4: Redes, Consumo de API y TanStack Query (Unidad 5 - Parte 1)
- **Archivos a cargo**: `src/servicios/api.ts`, `src/servicios/red.ts`, `src/componentes/BannerDesconexion.tsx`, `src/app/(tabs)/index.tsx`, `src/app/(tabs)/turnos.tsx`.
- **Temas a defender**:
  - Cliente HTTP centralizado (`ClienteHttp`): URL base configurable, inyección de token Bearer en headers y cancelación de peticiones con `AbortController`.
  - Detección del estado de conectividad con `expo-network` y renderizado condicional de `BannerDesconexion.tsx`.
  - Integración de **TanStack Query (React Query)**:
    - `useQuery`: Consulta de canchas y turnos con tiempos de obsolescencia (`staleTime: 3 min`) y re-obtención automática en segundo plano.
    - `useMutation`: Modificación para alta y cancelación de reservas, e invalidación de caché con `queryClient.invalidateQueries`.

### 👤 Integrante 5: Persistencia Local, Seguridad, IoT y Compilación EAS (Unidades 5, 6 y DevOps)
- **Archivos a cargo**: `src/basedatos/sqlite.ts`, `src/basedatos/asyncstorage.ts`, `src/servicios/auth.ts`, `src/servicios/notificaciones.ts`, `app.json`, `eas.json`.
- **Temas a defender**:
  - **Persistencia Local Dual**:
    - `expo-sqlite`: Uso de la **API sincrónica estricta** requerida por la cátedra (`SQLite.openDatabaseSync`, `execSync`, `runSync`, `getAllSync`, `getFirstSync`, `withTransactionSync`).
    - `AsyncStorage` (`@react-native-async-storage/async-storage`): Clave-valor para preferencias livianas (modo claro/oscuro).
  - Seguridad móvil: Resguardo de tokens de sesión en el almacén seguro de claves con `expo-secure-store`.
  - Biometría: Huella o rostro con `expo-local-authentication` (`hasHardwareAsync`, `authenticateAsync`) y fallback a contraseña.
  - Notificaciones locales: Configuración del canal prioritario en Android (`Notifications.setNotificationChannelAsync`) y permiso `POST_NOTIFICATIONS` en `app.json`.
  - Concepto de Computación Ubicua e IoT (Mark Weiser): Modelado del smartphone como actuador/telemetría para iluminación nocturna.
  - Compilación de entrega: Generación del APK autónomo para Android mediante `eas build --platform android --profile preview` sin depender de Metro.
