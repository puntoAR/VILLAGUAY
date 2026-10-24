# Simulador de Preguntas y Respuestas para la Defensa Oral
## Reservas Deportivas Villaguay — Cátedra UNER
**Duración total de la defensa**: 15 a 20 minutos (~3.5 a 4 minutos por integrante)  
**Proyecto**: Reservas Deportivas Villaguay (React Native + Expo SDK 52 / React 19)

---

## 👤 Integrante 1: Arquitectura, Expo Router y Componentes Primitivos (Unidad 3)

### 1. ¿Cómo funciona el enrutamiento basado en archivos de Expo Router y qué rol cumple `_layout.tsx` en `src/app/` y en `src/app/(tabs)/`?
* **Respuesta**: La estructura del directorio `src/app/` define automáticamente las URLs y pantallas mediante el sistema de archivos. `_layout.tsx` actúa como contenedor del árbol de navegación: el de la raíz inyecta los Providers globales (`AuthProvider`, `ThemeProvider`, `RedProvider`), monta el marco responsivo centrado para web de escritorio y define el `Stack` principal; mientras que el de `(tabs)/` define la barra de pestañas fija sin recargar el estado global de la app.
* **Referencia en código**: `src/app/_layout.tsx` (líneas 25-108) y `src/app/(tabs)/_layout.tsx`.

### 2. ¿Por qué reemplazaron `TouchableOpacity` por `Pressable` y cómo gestionan el feedback visual?
* **Respuesta**: `Pressable` es el componente primitivo moderno recomendado por React Native porque ofrece un control granular de los estados de interacción (`pressed`, `hovered`, `focused`) con un rendimiento superior. El feedback visual lo gestionamos mediante funciones de estilo: `style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}`.
* **Referencia en código**: `src/componentes/TarjetaEspacio.tsx` (líneas 21-31).

### 3. ¿Cuál es la diferencia entre navegar declarativamente con `<Link>` o imperativamente con `router.replace` / `router.push`?
* **Respuesta**: `<Link>` es declarativo y admite la propiedad `prefetch`, permitiendo que Expo Router precargue el componente destino en memoria antes del toque del usuario. La navegación imperativa (`router`) se usa dentro de controladores lógicos; por ejemplo, al iniciar sesión se usa `router.replace('/(tabs)')` para sustituir el historial y evitar que el usuario vuelva al formulario con el botón atrás.
* **Referencia en código**: `src/componentes/TarjetaEspacio.tsx` (línea 21) y `src/app/login.tsx` (líneas 32-45).

### 4. ¿Cómo se leen y tipifican los parámetros en una ruta dinámica como `/espacio/[id]`?
* **Respuesta**: Se capturan mediante el hook `useLocalSearchParams<{ id: string }>()`. Expo Router devuelve los parámetros como cadenas de texto (`string`), por lo que si se requiere operar matemáticamente con ellos, se convierten explícitamente (`Number(id)`).
* **Referencia en código**: `src/app/espacio/[id].tsx` (línea 22).

### 5. ¿Qué utilidad tiene el archivo `+not-found.tsx`?
* **Respuesta**: Gestiona rutas no coincidentes o errores 404. Si la app intenta navegar a un enlace roto o parámetro inexistente, este componente intercepta el error, evita que la app quede en pantalla blanca y muestra una UI amigable para regresar a la pantalla principal.
* **Referencia en código**: `src/app/+not-found.tsx` (líneas 10-28).

---

## 👤 Integrante 2: Sensores, Hápticos y Hardware del Dispositivo (Unidad 4 - Parte A)

### 1. ¿Cuáles son los 4 pasos del ciclo formal de vida de un sensor con `expo-sensors`?
* **Respuesta**: 1) Verificar disponibilidad del hardware con `isAvailableAsync()`, 2) Definir frecuencia de muestreo con `setUpdateInterval(300)`, 3) Suscribir listener con `addListener()`, 4) Liberar la suscripción con `sub.remove()` dentro del retorno (cleanup) del hook `useEffect`.
* **Referencia en código**: `src/servicios/sensores.ts` (líneas 10-41).

### 2. ¿Qué ocurriría si se omite el `return () => sub.remove()` en el `useEffect` del acelerómetro?
* **Respuesta**: Se produciría una fuga de memoria (*memory leak*). El sensor continuaría escuchando eventos en segundo plano aun después de desmontar la pantalla, degradando el rendimiento del teléfono y consumiendo batería de forma innecesaria.
* **Referencia en código**: `src/servicios/sensores.ts` (líneas 35-40).

### 3. ¿Cómo detectan matemáticamente la sacudida (*shake*) del teléfono para resetear filtros?
* **Respuesta**: Se calcula el módulo o magnitud de aceleración combinada en los tres ejes espaciales mediante la raíz cuadrada: $\text{magnitud} = \sqrt{x^2 + y^2 + z^2}$. Cuando supera el umbral de 2.4G, se confirma una sacudida intencional, se dispara vibración con `Haptica.exito()` y se vacía el filtro de búsqueda restaurando todas las canchas.
* **Referencia en código**: `src/servicios/sensores.ts` (líneas 24-32).

### 4. ¿Qué tres estados de permisos gestiona `useCameraPermissions` en `expo-camera`?
* **Respuesta**: `undetermined` (aún no se le solicitó permiso al usuario), `granted` (permiso concedido) y `denied` (permiso rechazado). Si no está concedido, la pantalla no renderiza la cámara y ofrece un botón explícito para invocar `solicitarPermiso()`, además de una caja de validación manual para pruebas en PC.
* **Referencia en código**: `src/app/escaner.tsx` (líneas 19-48 y 60-70).

### 5. ¿Qué variantes de `expo-haptics` implementaron y en qué eventos de la app se accionan?
* **Respuesta**: `selectionAsync` para toques en la interfaz y selección de filtros; `impactAsync(Medium)` al pulsar botones de confirmación de reserva; y `notificationAsync(Success / Error)` al escanear el QR en puerta para dar confirmación sensorial inmediata al encargado de cancha.
* **Referencia en código**: `src/servicios/haptica.ts` (líneas 7-34).

---

## 👤 Integrante 3: Multimedia, Geolocalización y File System (Unidad 4 - Parte B)

### 1. ¿En qué consiste la "Regla Crítica" de `expo-file-system` respecto a las fotos de perfil?
* **Respuesta**: Las imágenes devueltas por `expo-image-picker` se guardan inicialmente en la caché volátil del teléfono (`Paths.cache`). El sistema operativo puede eliminarlas automáticamente cuando escasea memoria. Para que persistan permanentemente, deben copiarse explícitamente a la carpeta de documentos de la app (`Paths.document`) mediante la nueva API orientada a objetos (`new File`, `archivoOrigen.copy(archivoDestino)`).
* **Referencia en código**: `src/servicios/multimedia.ts` (líneas 33-54).

### 2. ¿Qué ventajas tiene el componente `<Image>` de `expo-image` sobre el nativo de React Native?
* **Respuesta**: `expo-image` utiliza motores nativos modernos (Glide en Android / SDWebImage en iOS). Implementa almacenamiento en caché en disco y memoria de forma automática, soporta formatos optimizados y permite transiciones fluidas (`transition={250}`) para evitar saltos visuales al cargar fotos.
* **Referencia en código**: `src/componentes/TarjetaEspacio.tsx` (líneas 33-38).

### 3. ¿Cómo se implementó la reproducción de video y por qué se evitó `expo-av`?
* **Respuesta**: Se utilizó la nueva biblioteca `expo-video` porque `expo-av` fue declarada obsoleta y eliminada en las versiones recientes de Expo. `expo-video` desacopla la lógica del reproductor (`useVideoPlayer`) de la vista nativa (`VideoView`), garantizando soporte Picture-in-Picture, bucle automático y controles nativos.
* **Referencia en código**: `src/componentes/ReproductorVideo.tsx` (líneas 18-45).

### 4. ¿Por qué solicitaron permisos de ubicación solo en primer plano (`requestForegroundPermissionsAsync`)?
* **Respuesta**: Porque la aplicación solo necesita ubicar al usuario mientras tiene la pantalla del mapa abierta para calcular la distancia a los complejos de Villaguay. Solicitar permisos en segundo plano (`background`) es innecesario para este PRD, consume batería excesiva y provoca advertencias de privacidad en las tiendas de aplicaciones.
* **Referencia en código**: `src/app/(tabs)/mapa.tsx` (líneas 48-62).

### 5. ¿Cómo calcularon la distancia en kilómetros entre el usuario y los complejos?
* **Respuesta**: A partir de la coordenada actual devuelta por `expo-location` y las coordenadas geográficas fijas del Polideportivo y Parque Berduc, aplicando la fórmula trigonométrica de Haversine para convertir diferencias de latitud y longitud en kilómetros sobre la curvatura terrestre.
* **Referencia en código**: `src/app/(tabs)/mapa.tsx` (líneas 64-80).

---

## 👤 Integrante 4: Redes, Consumo de API y Gestión de Estado Reactivo (Unidad 5 - Parte A)

### 1. ¿Cómo está estructurado el cliente HTTP centralizado y cómo inyecta el token de seguridad?
* **Respuesta**: En `src/servicios/api.ts` se creó la clase `ClienteHttp`. Antes de despachar cada petición, un interceptor asincrónico recupera el token de sesión guardado en `expo-secure-store` y lo adjunta en los encabezados HTTP bajo el formato estándar `Authorization: Bearer <token>`.
* **Referencia en código**: `src/servicios/api.ts` (líneas 28-50).

### 2. ¿Para qué sirve `AbortController` en el cliente de red?
* **Respuesta**: Permite cancelar solicitudes HTTP salientes si exceden un tiempo límite de respuesta o si el usuario abandona la pantalla antes de recibir respuesta, previniendo cuelgues en la interfaz y llamadas huérfanas al servidor.
* **Referencia en código**: `src/servicios/api.ts` (líneas 51-75).

### 3. ¿Cómo interactúan la API remota y la base SQLite cuando el dispositivo se queda sin internet?
* **Respuesta**: La aplicación implementa resiliencia offline. Si la petición remota falla o `expo-network` detecta falta de conectividad, el cliente captura el error en su bloque `catch` y retorna los datos almacenados en SQLite local, mientras `BannerDesconexion.tsx` advierte visualmente al usuario.
* **Referencia en código**: `src/servicios/api.ts` y `src/componentes/BannerDesconexion.tsx`.

### 4. ¿Por qué se utiliza `useFocusEffect` en "Mis Turnos" en lugar de un simple `useEffect`?
* **Respuesta**: En Expo Router y React Navigation, las pantallas de la barra de pestañas (`Tabs`) permanecen montadas en memoria una vez abiertas. Un `useEffect` solo se ejecuta al montar la pestaña por primera vez, por lo que al confirmar una reserva en una cancha y volver a la pestaña, los turnos no se actualizaban. `useFocusEffect` resuelve esto re-consultando la base de datos cada vez que la pestaña gana el foco en pantalla.
* **Referencia en código**: `src/app/(tabs)/turnos.tsx` (líneas 46-56).

### 5. ¿Cómo se asegura la segregación de roles entre Jugador, Encargado y Director?
* **Respuesta**: Se implementó una doble barrera: a nivel visual en `espacio/[id].tsx` se bloquea la apertura del modal informando que el personal municipal solo gestiona y no reserva; y a nivel de servicio en `ReservasServicio.crearReserva` se consulta la tabla de usuarios en SQLite y se rechaza con `ACCESO_DENEGADO_ROL` si el rol no es `jugador`.
* **Referencia en código**: `src/servicios/reservas.ts` (líneas 27-38) y `src/app/espacio/[id].tsx` (líneas 90-105).

---

## 👤 Integrante 5: Persistencia Local, Seguridad, IoT y Compilación EAS (Unidades 5-B, 6 y DevOps)

### 1. ¿Por qué es fundamental la base relacional SQLite local en este proyecto?
* **Respuesta**: Porque permite almacenar de forma estructurada las canchas, bloqueos y reservas con consultas relacionales (`WHERE`, `ORDER BY`). Además, garantiza que el encargado pueda validar pases de acceso QR en la puerta del predio aun cuando se caiga la conexión a internet.
* **Referencia en código**: `src/basedatos/sqlite.ts` y `src/basedatos/sqlite.web.ts`.

### 2. ¿Cuándo se debe usar `AsyncStorage` y cuándo `SQLite`? ¿Qué guardaron en cada uno?
* **Respuesta**: `AsyncStorage` se destina a texto o JSONs pequeños y configuraciones clave-valor (guardamos el tema claro/oscuro del usuario). `SQLite` se utiliza para datos estructurados complejos que requieren consultas SQL, relaciones, filtros y transacciones (espacios, turnos y reservas).
* **Referencia en código**: `src/basedatos/asyncstorage.ts` (líneas 6-25) y `src/basedatos/sqlite.ts`.

### 3. ¿Por qué es una vulnerabilidad grave según OWASP Mobile guardar tokens en `AsyncStorage` y por qué usaron `expo-secure-store`?
* **Respuesta**: `AsyncStorage` guarda texto plano en el sistema de archivos del teléfono sin cifrar, accesible si el teléfono es inspeccionado o tiene root (vulnerabilidades OWASP M1 y M5). `expo-secure-store` almacena los tokens cifrados por hardware en el Android Keystore o el iOS Keychain.
* **Referencia en código**: `src/servicios/auth.ts` (líneas 15-40).

### 4. ¿Por qué configuraron canales prioritarios en `expo-notifications` y el permiso `POST_NOTIFICATIONS`?
* **Respuesta**: En Android 13 o superior (API 33+), el sistema operativo bloquea todas las notificaciones a menos que se declare el permiso `POST_NOTIFICATIONS` en `app.json`. Además, Android exige asociar cada notificación local a un canal con importancia `MAX` para que suene y aparezca como banner flotante.
* **Referencia en código**: `src/servicios/notificaciones.ts` (líneas 44-56) y `app.json` (línea 32).

### 5. ¿Cómo garantiza `eas.json` que la app funcione sin Metro y qué representa la opción de "Luz nocturna" en IoT?
* **Respuesta**: El perfil `preview` con `android.buildType: "apk"` empaqueta el bundle JS y todos los assets dentro del archivo instalable, permitiendo que corra de forma autónoma sin depender de una PC. Por su parte, la luz nocturna modela el concepto de Computación Ubicua de Mark Weiser, donde la app actúa como canal de telemetría y actuador remoto para encender la iluminación en las canchas de Villaguay.
* **Referencia en código**: `eas.json` (líneas 11-15) y `src/app/espacio/[id].tsx` (líneas 345-364).
