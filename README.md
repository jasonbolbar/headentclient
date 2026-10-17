# Headent Client (Android TV & Google TV)

Cliente nativo para [Tvheadend](https://tvheadend.org/) diseñado exclusivamente para **Android TV**, **Google TV** y Android Boxes con integración oficial para el **TV Input Framework (TIF)** de Google y reproducción por hardware mediante **libVLC**.

---

## 📺 Características Nativas de Android TV

1. **Integración con "Live Channels" (TIF):**
   - Transforma tu servidor Tvheadend en un proveedor nativo del sistema Android TV.
   - Sintonización directa de canales en la app oficial de TV con la guía de programación (EPG) integrada en la interfaz del sistema operativo.
2. **Reproducción por Hardware con libVLC:**
   - Soporte para MPEG-TS, H.264, H.265 (HEVC), desentrelazado de vídeo adaptativo.
   - Selector multilenguaje de pistas de audio y subtítulos DVB / Teletexto.
3. **Sincronización en Segundo Plano con WorkManager:**
   - Descarga periódica de la parrilla de canales y eventos de la guía EPG para las próximas 24 horas directamente a `TvContract.Channels` y `TvContract.Programs`.

---

## 🛠️ Requisitos Previos

- Dispositivo con **Android TV**, **Google TV** o TV Box (Android 6.0 API 23 o superior).
- Un servidor **Tvheadend** (4.2 o 4.3+) accesible en la red local.
- Ordenador con **Android Studio** o el SDK de Android configurado.

---

## 🚀 Compilación e Instalación del APK

### Paso 1: Configurar el SDK de Android

Si compilas por primera vez mediante terminal, crea el archivo `local.properties` en la raíz del proyecto indicando la ruta a tu SDK:

**En macOS:**
```properties
sdk.dir=/Users/TU_USUARIO/Library/Android/sdk
```

**En Linux:**
```properties
sdk.dir=/home/TU_USUARIO/Android/Sdk
```

**En Windows:**
```properties
sdk.dir=C:\\Users\\TU_USUARIO\\AppData\\Local\\Android\\Sdk
```

---

### Paso 2: Compilar el APK Debug

```bash
# Otorgar permisos de ejecución al wrapper de Gradle (si es necesario)
chmod +x gradlew

# Compilar el módulo de la aplicación Android
./gradlew :androidApp:assembleDebug
```

El archivo APK generado se ubicará en:
```text
androidApp/build/outputs/apk/debug/androidApp-debug.apk
```

---

### Paso 3: Instalar en Android TV mediante ADB

1. Conecta tu televisor o Android TV Box por red:
   ```bash
   adb connect <IP_DE_TU_ANDROID_TV>:5555
   ```
2. Instala la aplicación:
   ```bash
   adb install -r androidApp/build/outputs/apk/debug/androidApp-debug.apk
   ```

---

## ⚙️ Configuración en Android TV

### Método A: Integración en "Live Channels" de Android TV (Recomendado)

1. Abre la aplicación **Live Channels** (o *Canales de TV en directo*) en tu televisor.
2. Ve a **Ajustes de canales ➔ Fuentes de entrada de TV**.
3. Selecciona **Headent Client (Tvheadend)**.
4. Se abrirá la pantalla de configuración (`TvInputSetupActivity`).
5. Pulsa en **Iniciar Sincronización**.
6. El servicio `TvhSyncWorker` descargará la lista de canales, logos y la guía EPG en el sistema.

### Método B: Aplicación Standalone

1. Abre **Headent Client** desde el launcher de Android TV.
2. Comprueba o ingresa los datos de conexión con tu servidor Tvheadend (IP, puerto HTTP 9981, credenciales).
3. Pulsa en **Sincronizar Canales TIF**.

---

## 📂 Estructura del Proyecto Nativo

```text
androidApp/
└── src/main/
    ├── AndroidManifest.xml                    # Declaración de permisos, TvInputService y Actividades
    ├── kotlin/sk/tvhclient/
    │   ├── android/
    │   │   ├── TvhApplication.kt             # Inicialización de la app y WorkManager
    │   │   ├── MainActivity.kt               # Launcher para Android TV
    │   │   ├── PlayerActivity.kt             # Reproductor nativo
    │   │   └── tif/
    │   │       ├── TvhTvInputService.kt      # Implementación de TvInputService con libVLC
    │   │       ├── TvhSyncWorker.kt          # Sincronización en segundo plano con TvContract
    │   │       ├── TvContractUtils.kt        # Mapeo de géneros DVB a Android TV
    │   │       └── TvInputSetupActivity.kt   # Pantalla de setup para Live Channels
    │   └── shared/
    │       ├── model/Models.kt               # Modelos Channel, EpgEvent, TvhServer
    │       ├── api/TvhApi.kt                 # Cliente HTTP Tvheadend
    │       ├── stream/StreamUrlBuilder.kt    # Generador de URLs de streaming y picons
    │       └── Tvh.kt                        # Almacenamiento persistente del servidor
    └── res/
        ├── drawable/tv_banner.png             # Banner para el launcher de Android TV
        ├── mipmap-*/ic_launcher.png           # Iconos de la aplicación
        ├── values/                            # Textos y tema Theme.Headent
        └── xml/tv_input_service.xml           # Descriptor XML del servicio TV Input
```

---

## 🎮 Controles de Mando a Distancia (D-Pad)

| Tecla / Botón | Función en Android TV |
|---|---|
| **Cruceta Arriba / Abajo** | Cambio de canal (CH+ / CH-) o navegación vertical |
| **Cruceta Izquierda / Derecha** | Avance y retroceso en reproductor |
| **Botón OK / Centro** | Selección, confirmación y barra de zapping |
| **Guía / Guide (G)** | Apertura directa de la parrilla de programación |
| **Info (I)** | Detalles del programa y opciones de grabación |

---

## 📄 Licencia

Publicado bajo licencia de código abierto [MIT](LICENSE).
