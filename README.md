# Headent Client

Cliente para [Tvheadend](https://tvheadend.org/) diseñado para **Android TV**, Google TV, TV Boxes y dispositivos móviles: televisión en directo, guía de programación (EPG), grabaciones (DVR) y radio.

El proyecto cuenta con dos vertientes:
1. **Aplicación nativa de Android / Android TV (Kotlin + Compose + libVLC + TIF):** El cliente nativo que incluye integración con el *TV Input Framework (TIF)* para la app oficial "Live Channels" de Google.
2. **Entorno de simulación Web / Preview (React + Vite + Tailwind CSS):** Interfaz para probar, depurar y previsualizar la experiencia de TV y el mando a distancia directamente desde el navegador.

---

## 📺 Instalación y Ejecución en Android TV / Google TV

### Requisitos Previos

- Dispositivo con **Android TV**, **Google TV** o Android Box (Android 6.0 API 23 o superior).
- Televisor y ordenador conectados a la **misma red Wi-Fi o Ethernet**.
- Un servidor **Tvheadend** (4.2 o 4.3+) accesible en la red local.
- **Android Studio** o el SDK de Android con herramientas de línea de comandos (`adb`).

---

### Paso 1: Habilitar Opciones de Desarrollador y Depuración en Android TV

1. En tu Android TV, abre **Ajustes** (icono de engranaje) ➔ **Preferencias del dispositivo** (o **Sistema**) ➔ **Información**.
2. Desplázate hasta la opción **Compilación del SO de Android TV** y pulsa el botón **OK** del mando **7 veces seguidas** hasta que aparezca el mensaje: *"¡Ya eres desarrollador!"*.
3. Regresa al menú anterior y entra en **Opciones para desarrolladores**.
4. Activa la casilla **Depuración por USB** y **Depuración por red / Depuración inalámbrica**.
5. Anota la **dirección IP** de tu Android TV (puedes verla en *Ajustes ➔ Red e Internet ➔ Tu red Wi-Fi/Ethernet*).

---

### Paso 2: Compilar el APK de Android TV

Desde la terminal en el equipo de desarrollo:

```bash
# Otorgar permisos de ejecución al wrapper de Gradle (si estás en Linux/macOS)
chmod +x gradlew

# Compilar el APK en modo Debug para Android TV
./gradlew :androidApp:assembleDebug
```

El archivo generado estará ubicado en:
```
androidApp/build/outputs/apk/debug/androidApp-debug.apk
```

---

### Paso 3: Instalar el APK en el Android TV

#### Opción A: Instalación directa por red con ADB (Recomendada)

1. Conecta tu ordenador al Android TV mediante ADB:
   ```bash
   adb connect <IP_DE_TU_ANDROID_TV>:5555
   ```
   *(Acepta en la pantalla del televisor el mensaje de "Permitir siempre la depuración desde este equipo").*

2. Instala el APK compilado:
   ```bash
   adb install -r androidApp/build/outputs/apk/debug/androidApp-debug.apk
   ```

#### Opción B: Mediante Pendrive USB o la app "Send Files to TV"

1. Copia el archivo `androidApp-debug.apk` a una memoria USB o transfiérelo a la TV mediante aplicaciones como *Send Files to TV* o *Downloader*.
2. Con un explorador de archivos en la TV (como *X-plore* o *File Commander*), pulsa sobre el APK para instalarlo.

---

### Paso 4: Configuración Inicial de Tvheadend

1. Abre **Headent Client** desde la fila de aplicaciones de Android TV.
2. Ve a **Ajustes ➔ Servidores ➔ Añadir Servidor**.
3. Ingresa los datos de tu servidor Tvheadend:
   - **Nombre:** Nombre identificativo (ej. *Mi Tvheadend Casa*).
   - **Host / IP:** Dirección IP local del servidor (ej. `192.168.1.100`).
   - **Puerto HTTP:** Generalmente `9981`.
   - **Puerto HTSP:** `9982`.
   - **Usuario y Contraseña:** Credenciales con permisos de streaming y DVR.
4. Pulsa **Probar Conexión**. Una vez confirmada la conexión exitosa, pulsa **Guardar Servidor**.

---

### Paso 5: Integración con "Live Channels" de Android TV (TIF)

Headent Client implementa el framework oficial de Google **TV Input Framework (TIF)**, lo que permite que tus canales de Tvheadend se sintonicen directamente desde la app nativa **Live Channels** (*Canales de TV en directo*) de Android TV con la guía del sistema:

1. En tu Android TV, abre la aplicación **Live Channels** (o *Canales de TV*).
2. Desplázate hacia abajo en el menú o mantén pulsado el botón central para acceder a **Ajustes de canales**.
3. Selecciona **Fuentes de entrada de TV**.
4. Verás listado **Headent Client (Tvheadend)** como proveedor disponible. Selecciónalo.
5. Se abrirá la pantalla de configuración (`TvInputSetupActivity`). Pulsa en **Iniciar Sincronización**.
6. El servicio en segundo plano (`TvhSyncWorker`) descargará:
   - La lista completa de canales, números y logotipos (*picons*).
   - La guía de programación EPG para las próximas 24 horas.
7. ¡Listo! Al volver a Live Channels, todos tus canales de Tvheadend estarán completamente integrados con cambio rápido, selector de pistas de audio (multilenguaje) y subtítulos DVB mediante el motor nativo **libVLC**.

---

### 🎮 Uso del Mando a Distancia (Teclas de Acceso Rápido)

La aplicación está diseñada para operar 100% con mando D-Pad:

| Botón del Mando | Acción |
|---|---|
| **Cruceta / Flechas (Arriba / Abajo)** | Cambiar de canal en el reproductor (CH+ / CH-) o navegar por las listas. |
| **Cruceta (Izquierda / Derecha)** | Retroceder / Avanzar 10 segundos en reproducciones y grabaciones. |
| **Centro / OK** | Seleccionar elemento, abrir barra de información *Zap Bar* o reproducir canal. |
| **Guía / Guide (G)** | Abre instantáneamente la parrilla EPG de programación. |
| **Info (I)** | Muestra los detalles completos, sinopsis y opción de grabar programa. |
| **Botón Rojo (1)** | Acceso directo a la sección de **Canales de TV**. |
| **Botón Verde (2)** | Acceso directo a la sección de **Emisoras de Radio**. |
| **Botón Amarillo (3)** | Acceso directo al **Archivo de Grabaciones (DVR)**. |
| **Botón Azul (4)** | Acceso directo a **Ajustes del Sistema**. |
| **Teclas Numéricas (0–9)** | Zapping directo marcando el número del canal. |

---

## 💻 Entorno de Desarrollo y Simulación Web (React + Vite)

Para probar la interfaz, el reproductor y la lógica de control remoto en el navegador sin necesidad de encender un televisor:

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo en el puerto 3000
npm run dev

# 3. Compilar bundle de producción
npm run build

# 4. Validar sintaxis y tipos de TypeScript
npm run lint
```

El simulador web incluye:
- **Modo TV vs. Modo Móvil:** Selector en la barra superior.
- **Mando Android TV Virtual:** Widget flotante en la esquina inferior derecha con cruceta D-Pad, OK, botón Guía y teclas de color funcionales.
- **Simulador de Live Channels (TIF):** Vista previa de la superposición nativa de canales de Android TV sobre vídeo en directo.
- **Servidor Demo Incorporado:** Permite probar reproducción, guía EPG y grabaciones de inmediato con transmisiones de prueba.

---

## 📄 Licencia

Publicado bajo la licencia de código abierto [MIT](LICENSE).
