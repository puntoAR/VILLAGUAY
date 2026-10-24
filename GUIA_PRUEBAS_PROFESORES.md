# 🧪 Guía Oficial de Pruebas para la Cátedra (UNER)
**Asignatura:** Desarrollo Web y Móvil  
**Proyecto:** Reservas Deportivas Villaguay  
**Objetivo:** Permitir a los evaluadores verificar en menos de 10 minutos la totalidad de los requerimientos curriculares (Unidades 3, 4, 5 y 6) y las reglas de negocio del PRD.

---

## 📋 Resumen del Juego de Pruebas Mínimo

El juego de pruebas está compuesto por **7 casos de prueba clave**. Cada caso valida una unidad temática y un flujo fundamental de la aplicación:

| ID | Escenario de Prueba | Roles Involucrados | Unidades Evaluadas | Tiempo Estimado |
| :---: | :--- | :---: | :---: | :---: |
| **CP-01** | Autenticación Segura y Segregación de Roles | Usuario, Encargado, Director | Unidad 3 y 6 | 1 min |
| **CP-02** | Catálogo, Filtros y Sensor de Movimiento (Shake) | Usuario | Unidad 3 y 4 | 1 min |
| **CP-03** | Detalle de Cancha, Video Nativo y Telemetría IoT (Luz) | Usuario | Unidad 3, 4 y 6 | 1.5 min |
| **CP-04** | Pase Digital de Acceso QR y Gestión de Turnos | Usuario | Unidad 3 y 5 | 1.5 min |
| **CP-05** | Control de Acceso en Puerta con Escáner QR | Encargado | Unidad 4 y 5 | 2 min |
| **CP-06** | Geolocalización de Complejos y Cálculo de Distancia | Cualquiera | Unidad 4 | 1 min |
| **CP-07** | Regla de Oro FileSystem (Foto Perfil) y Modo Oscuro | Cualquiera | Unidad 4 y 5 | 1.5 min |

---

## 🛠️ Paso a Paso para Ejecutar las Pruebas

### 🔹 CP-01: Autenticación Rápida y Segregación de Roles
* **Objetivo:** Comprobar el inicio de sesión, el resguardo seguro en `expo-secure-store` y la estricta segregación de roles del PRD.
* **Paso a paso:**
  1. En la pantalla de Login, observá la botonera de acceso rápido inferior:
     * Tocá **"Usuario"**: se autocompleta `usuario@villaguay.gob.ar`.
     * Tocá **"Iniciar Sesión"**: la app redirige a la pestaña de Canchas.
  2. Andá a la pestaña **Mi Perfil** y tocá **"Cerrar Sesión"**.
  3. Ahora tocá el botón **"Encargado"** (`encargado@villaguay.gob.ar`) e iniciá sesión.
  4. Andá a la pestaña **Mis Turnos**:
     * Verificá que en lugar de permitir reservas personales, aparece el banner institucional: *"Sesión: Encargado de Complejo — El personal municipal no genera reservas particulares"*, con el botón directo **"Abrir Escáner de Acceso QR"**.
* **Resultado Esperado:** Autenticación fluida sin escribir credenciales manuales, almacenamiento de token JWT en `SecureStore` y diferenciación visual y funcional del perfil municipal.

---

### 🔹 CP-02: Catálogo de Canchas, Filtros y Acelerómetro (Shake)
* **Objetivo:** Validar la grilla de canchas, el renderizado de imágenes (`expo-image`) y el ciclo del acelerómetro (`expo-sensors`).
* **Paso a paso:**
  1. Iniciá sesión con la cuenta **Usuario** (`usuario@villaguay.gob.ar`).
  2. En la pestaña **Canchas**, tocá el botón de filtro de deportes (por ejemplo, seleccioná **"Tenis"** o **"Básquet"**). La lista se filtrará mostrando únicamente las canchas de esa disciplina.
  3. **Prueba de hardware (Shake):**
     * *En celular físico (APK):* Sacudí enérgicamente el teléfono hacia los lados.
     * *En emulador:* Pulsá `Ctrl + M` y seleccioná "Shake Gesture".
  4. Sentirás una vibración háptica (`expo-haptics`) y los filtros se resetearán automáticamente mostrando nuevamente todas las canchas.
* **Resultado Esperado:** Detección de aceleración combinada $\sqrt{x^2+y^2+z^2} > 2.4$, feedback háptico inmediato y restauración del catálogo completo.

---

### 🔹 CP-03: Detalle de Cancha, Video Nativo y Telemetría IoT (Luz)
* **Objetivo:** Evaluar navegación con parámetros (`useLocalSearchParams`), reproducción de video (`expo-video`) y concepto de Computación Ubicua / IoT (Mark Weiser).
* **Paso a paso:**
  1. En la lista de canchas, tocá la tarjeta de **"Cancha 2 — Fútbol 5"** (Polideportivo Municipal).
  2. En el detalle, observá el bloque **"Video del Espacio Deportivo"**:
     * El video nativo se reproduce automáticamente en bucle y silenciado (`expo-video`).
     * Podés pausar o activar pantalla completa con los controles nativos.
  3. En la sección **"Grilla Horaria (8:00 a 24:00 hs)"**, elegí un horario que figure como **LIBRE** (verde).
  4. Se abrirá el modal de confirmación:
     * Modificá la cantidad de jugadores con los botones `+` y `-`.
     * Activá la casilla **"Solicitar Iluminación Nocturna (+ $2.500)"**: observá cómo el total a abonar se recalcula automáticamente sumando el canon municipal.
  5. Tocá **"Confirmar Reserva"**: la app te felicitará y te consultará si querés ir a ver tu turno.
* **Resultado Esperado:** Inserción atómica en la base de datos SQLite local, feedback sensorial de confirmación y modelado del smartphone como actuador IoT municipal.

---

### 🔹 CP-04: Pase Digital de Acceso QR y Gestión de Turnos
* **Objetivo:** Verificar la visualización del pase de acceso offline, cálculo de fechas y lógica de cancelación anticipada.
* **Paso a paso:**
  1. Dirigite a la pestaña **Mis Turnos**:
     * Verificá que el turno recién creado (o los turnos cargados) se muestran con:
       - 📅 **Fecha del Turno:** Formateada en texto claro (ej. *Sábado 24 de Octubre 2026*).
       - 🕒 **Horario exacto:** Ej. *19:00 a 20:00 hs*.
       - 👥 **Detalle:** Jugadores e ícono de iluminación nocturna (💡).
       - 💵 **Monto total y estado de pago** (Abonado / Pendiente en boletería).
       - 📱 **Código QR nítido:** Conteniendo la firma del turno para ser leído sin conexión a internet.
  2. Tocá el botón **"Cancelar turno"**:
     * Si faltan más de 4 horas para el turno, el sistema indicará que la cancelación es sin penalización.
     * Al confirmar, el turno se traslada a la pestaña **Historial** con la etiqueta roja **CANCELADA**.
* **Resultado Esperado:** Actualización en tiempo real mediante `useFocusEffect` sin desincronización de pestañas y funcionamiento 100% offline.

---

### 🔹 CP-05: Control de Acceso en Puerta con Escáner QR
* **Objetivo:** Validar la cámara nativa (`expo-camera`), lectura de códigos QR y flujo del encargado de complejo.
* **Paso a paso:**
  1. Cerrá sesión y entrá con la cuenta **Encargado** (`encargado@villaguay.gob.ar`).
  2. Tocá el botón con el ícono de **Código QR** en la esquina superior derecha del encabezado (o el botón verde del banner).
  3. **En Celular (APK):**
     * La app pedirá permiso de cámara en tiempo de ejecución (`useCameraPermissions`).
     * Al enfocar el código QR de un turno de jugador (desde otro teléfono o pantalla), emitirá un sonido/vibración háptica y mostrará:  
       `ACCESO AUTORIZADO ✅ - Ingreso registrado exitosamente`.
  4. **En Navegador Web / PC:**
     * Dado que las PCs de escritorio no tienen cámara trasera nativa integrada en el canvas, la app provee una **caja de validación manual**.
     * Ingresá el código de prueba `VGY-1180-02-1900` y tocá **"Validar Acceso"**.
* **Resultado Esperado:** Actualización en la base de datos cambiando el estado de la reserva a `cumplida`, registrando la hora de entrada y evitando accesos duplicados.

---

### 🔹 CP-06: Geolocalización de Complejos y Cálculo de Distancia
* **Objetivo:** Demostrar el uso de sensores de posición (`expo-location`) y renderizado de mapas (`react-native-maps`).
* **Paso a paso:**
  1. Andá a la pestaña **Mapa**.
  2. La app solicitará permiso de ubicación en primer plano (`requestForegroundPermissionsAsync`).
  3. Se mostrará el mapa con los marcadores de los dos centros deportivos de Villaguay:
     * **Polideportivo Municipal** (Savio y Paysandú).
     * **Parque Berduc** (San Martín y Parque Berduc).
  4. En la parte inferior, tocá la tarjeta de cada complejo para ver su dirección, canchas disponibles y la distancia calculada en kilómetros desde tu ubicación actual.
* **Resultado Esperado:** Obtención de coordenadas con precisión balanceada y centrado fluido de la cámara en el mapa.

---

### 🔹 CP-07: Regla de Oro FileSystem (Foto de Perfil) y Modo Oscuro
* **Objetivo:** Justificar la regla crítica de la cátedra para manejo de memoria en multimedia (`expo-file-system`) y persistencia clave-valor (`AsyncStorage`).
* **Paso a paso:**
  1. Andá a la pestaña **Mi Perfil**.
  2. Tocá el botón de la cámara sobre la foto de perfil:
     * Se abrirá la galería nativa mediante `expo-image-picker`.
     * Elegí cualquier imagen de tu dispositivo.
     * La imagen se recortará a proporción cuadrada (1:1).
  3. **Verificación técnica:** La app copia la imagen desde `Paths.cache` (memoria temporal que el sistema operativo borra cuando necesita espacio) hacia `Paths.document` (almacenamiento permanente de la app), asegurando que la foto nunca se pierda.
  4. En la sección **PREFERENCIAS**, activá el switch **"Modo Oscuro"**:
     * Toda la interfaz cambiará al instante a tonos oscuros de alto contraste.
     * Cerrá la aplicación o recargá la página (F5): el tema oscuro se mantendrá gracias a `AsyncStorage`.
* **Resultado Esperado:** Persistencia permanente de la imagen sin depender de la caché volátil y conservación del tema preferido del usuario.

---

## 🎯 Tabla Resumen de Respuestas Rápidas para la Mesa Examinadora

| Pregunta del Profesor | Respuesta Rápida y Precisa |
| :--- | :--- |
| *¿Por qué usan SQLite y no guardan todo en AsyncStorage?* | *"AsyncStorage solo maneja strings clave-valor para datos livianos como el tema visual. SQLite permite ejecutar consultas relacionales con índices, filtrar turnos por espacio y fecha, y mantener integridad transaccional."* |
| *¿Por qué no usan la ruta directa de la foto que devuelve ImagePicker?* | *"Porque ImagePicker devuelve un archivo en `Paths.cache`. Si el dispositivo se queda sin memoria, el sistema operativo limpia esa carpeta. Por eso copiamos explícitamente el archivo a `Paths.document` con la API orientada a objetos de FileSystem."* |
| *¿Cómo funciona el escaneo de QR si el predio no tiene internet?* | *"El código QR contiene la firma del turno en texto estructurado. Al escanearlo, el encargado consulta la base de datos local SQLite que ya sincronizó los turnos del día, validando el ingreso 100% offline."* |
| *¿Cómo aseguran que el sensor del acelerómetro no consuma batería de más?* | *"Se establece un intervalo de muestreo controlado (300 ms) y se libera la suscripción obligatoriamente en la función de limpieza (`cleanup`) del `useEffect` invocando `subscription.remove()`."* |
| *¿Dónde se guarda el token JWT del usuario?* | *"En `expo-secure-store`, que cifra la clave en hardware mediante Android Keystore o iOS Keychain, evitando la vulnerabilidad de guardarlo en texto plano en AsyncStorage."* |
