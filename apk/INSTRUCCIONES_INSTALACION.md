# 📱 Deportes Villaguay — Guía Oficial de Entrega e Instalación del APK

> **Universidad Nacional de Entre Ríos (UNER)**  
> **Asignatura:** Desarrollo Web y Móvil  
> **Proyecto:** Reservas Deportivas Villaguay (React Native + Expo)  
> **Perfil de Build:** `preview` (`eas build --platform android --profile preview`)  
> **Tipo de Entrega:** Release APK instalable autónomo (sin Metro, sin PC)

---

## 📦 1. Datos Oficiales para la Entrega en el Campus Virtual UNER

Conforme a las consignas de la cátedra, esta sección contiene los enlaces directos y permanentes requeridos para la carga en el Campus:

| Elemento Requerido | Enlace Oficial / Detalle |
| :--- | :--- |
| **Link del Build (APK Release)** | [Descargar APK Oficial (Expo EAS)](https://expo.dev/artifacts/eas/Mbg5u_2e1Z5Zt9qwlHyE6bTr8tk3M4x-S3lFebe1yJ8.apk) |
| **Dashboard del Build en EAS** | [Ver Build en Expo Cloud](https://expo.dev/accounts/jgroman/projects/reservas-deportivas-villaguay/builds/7480e0a5-bb8c-487b-b7d9-cf7acccf50fd) |
| **Código Fuente (GitLab)** | [https://gitlab.com/unerdesarrolloweb2025/reservas-deportivas-villaguay](https://gitlab.com/unerdesarrolloweb2025/reservas-deportivas-villaguay) |
| **ID de Proyecto EAS** | `5e0aed43-a9ec-47c3-8351-9ed9214e6b6b` |
| **Identificador de Paquete** | `ar.gob.villaguay.reservasdeportivas` |
| **Versión del Build** | `1.0.0` (Build version code: `1`) |

---

## 📲 2. Instrucciones de Instalación en Celulares Android

El archivo `.apk` generado es completamente **autónomo**: no requiere tener la computadora encendida, ni cables USB, ni Expo Go, ni Metro Bundler.

### Paso a paso:
1. **Descargar el instalador:**
   * Abrí en el navegador de tu celular el siguiente enlace:
     👉 **[https://expo.dev/artifacts/eas/Mbg5u_2e1Z5Zt9qwlHyE6bTr8tk3M4x-S3lFebe1yJ8.apk](https://expo.dev/artifacts/eas/Mbg5u_2e1Z5Zt9qwlHyE6bTr8tk3M4x-S3lFebe1yJ8.apk)**
   * Esperá a que termine de descargarse el archivo `Mbg5u_2e1Z5Zt9qwlHyE6bTr8tk3M4x-S3lFebe1yJ8.apk` (~132 MB).

2. **Permitir instalación y aviso de Google Play Protect:**
   * Tocá la notificación de descarga o abrí la carpeta *Descargas* de tu teléfono.
   * Si Android muestra una advertencia de seguridad (*"Por motivos de seguridad, tu teléfono no tiene permitido instalar apps desconocidas de esta fuente"*):
     * Tocá en **Ajustes / Configuración**.
     * Activá la casilla o switch **"Permitir desde esta fuente"** (Chrome, Drive o Gestor de Archivos).
   * **Aviso de Google Play Protect** (*"Se bloqueó la app para proteger tu dispositivo"*):
     * Dado que es una app académica firmada con certificado de desarrollo propio y no proviene de Play Store, tocá el texto:  
       👉 **"Instalar de todas formas"** *(ubicado arriba del botón azul "Entendido")*.

3. **Instalar y Ejecutar:**
   * Tocá **Instalar**.
   * Una vez finalizado, seleccioná **Abrir**.
   * Verás el logo y nombre municipal de **Deportes Villaguay** en tu pantalla de inicio como cualquier aplicación nativa instalada.

---

## 🔑 3. Cuentas de Acceso y Credenciales de Prueba

Para facilitar las pruebas, la pantalla de Login incluye botones de acceso rápido de un toque:

### A) Cuenta Usuario / Jugador:
* **Correo:** `usuario@villaguay.gob.ar`
* **Contraseña:** `usuario123`
* **Rol:** Jugador regular. Puede reservar turnos, ver sus reservas activas, recibir recordatorios y generar su carnet de acceso QR.

### B) Cuenta Encargado de Complejo:
* **Correo:** `encargado@villaguay.gob.ar`
* **Contraseña:** `admin123`
* **Rol:** Encargado. Tiene habilitado el escáner de cámara integrado para validar accesos en la puerta de los complejos deportivos.

### C) Ingreso Biométrico:
* Tocando el botón **"Ingresar con Huella o Face ID"**, la app solicita confirmación biométrica mediante `expo-local-authentication` y autentica automáticamente.

---

## 🛠️ 4. Servicios Nativos y Tecnologías Integradas

La aplicación cubre la totalidad del temario curricular de la cátedra:

1. **Unidad 3 — Navegación y UI:**
   * Enrutamiento con Expo Router (`Stack` raíz protegido y 4 secciones en `Tabs`: Canchas, Mapa, Mis Turnos, Perfil).
   * Modo Claro y Modo Oscuro persistido en `AsyncStorage`.
   * Feedback háptico en botones y acciones clave (`expo-haptics`).

2. **Unidad 4 — Servicios del Dispositivo:**
   * **Cámara y Escaneo QR:** Lector de códigos QR en vivo con `expo-camera` para validación de ingresos al predio.
   * **Selector de Multimedia:** `expo-image-picker` para foto de perfil con persistencia desde directorio temporal a permanente (`expo-file-system`).
   * **Notificaciones Locales:** Recordatorios programados con canal prioritario Android y sonido personalizado (`expo-notifications`).

3. **Unidad 5 — Persistencia y Datos:**
   * **SQLite Local:** Base de datos relacional local sincrónica (`expo-sqlite` v15+) que garantiza funcionamiento offline con tablas de deportes, espacios, turnos, usuarios y reservas.
   * **TanStack Query:** Gestión de caché y revalidación en segundo plano (`staleTime: 3 min`).
   * **Sensor de Conectividad:** Detección de estado online/offline con `expo-network` y aviso contextual flotante.

4. **Unidad 6 — Resguardo Seguro y Mapas:**
   * **Geolocalización y Mapas:** `react-native-maps` con marcadores georreferenciados de los complejos de Villaguay (Polideportivo Municipal, Parque Berduc, Centro de Empleados de Comercio).
   * **Almacenamiento Cifrado:** Resguardo de tokens de sesión JWT con `expo-secure-store` en el almacén de claves del sistema.
   * **Biometría:** Autenticación local mediante `expo-local-authentication`.

---

## 🎓 5. Preparación para la Defensa Oral (15 a 20 minutos)

El repositorio incluye el archivo con las 25 preguntas y respuestas modelo organizadas individualmente para los 5 integrantes del grupo:
👉 **[Ver Cuestionario para la Defensa Oral (`PREGUNTAS_DEFENSA_ORAL.md`)](../PREGUNTAS_DEFENSA_ORAL.md)**
