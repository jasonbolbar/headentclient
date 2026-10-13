# Headent Client (React)

Web and TV client for [Tvheadend](https://tvheadend.org/) — live TV, EPG TV guide, recordings (DVR), and radio, built with **React, TypeScript, Vite, and Tailwind CSS**. Rewritten from the original Kotlin Android client while faithfully preserving its full suite of features, data models, remote control key bindings, and modern navy/teal visual styling.

> **Disclaimer:** Headent Client is an independent client application and is **not** an official product of the Tvheadend project. The app contains **no** TV channels or media content — it connects to a Tvheadend server that you configure yourself. A built-in demo mode is provided for instant testing and evaluation.

## Key Features

- **Live TV Streaming:** Connect to Tvheadend HTTP/HTSP streams with automatic channel logo (picon) caching and subchannel number support (e.g. 5.1).
- **Dual Interface Modes:**
  - **TV Mode (Android TV / Set-Top Box):** Home launcher with Hero now-playing card, favourites row, and high-contrast D-pad remote navigable tiles.
  - **Phone / Tablet Mode:** Fluid mobile interface with responsive bottom navigation tabs.
- **Visual Themes:**
  - **Modern Theme:** Navy/teal dark glass palette with glowing accents and progress bars.
  - **Classic Theme:** Clean, high-density layout.
- **EPG Schedule Grid (TV Guide):**
  - Continuous multi-channel timeline with time intervals and red live on-air indicator line.
  - Multi-day picker (Today, Tomorrow, +2 days, +3 days).
  - Detailed programme dialog: summary, DVB genre classification, age ratings, series link URI, and direct one-click recording.
- **DVR Recordings & Archive:**
  - Categorized archive: Recent recordings, scheduled upcoming, automated timer rules (AutoRec), and genre categories (Movies, Series, Sports, Documentaries).
  - Recording playback with persistent resume positions.
  - Stop running recordings and delete finished files.
- **Radio Stations:**
  - DVB service-type filtered radio channels with dedicated now-playing line and progress.
  - Persistent **Mini Radio Bar** across all screens while listening.
- **In-App Video Player:**
  - Custom controls with Quick Zap bar showing now/next programme and time progress.
  - Channel switching with Up/Down arrow keys or CH+/-.
  - Audio and subtitle track picker.
  - Teletext simulator overlay with Fastext 4-colour buttons.
  - Timeshift seek bar for recordings.
- **TV Remote Hotkeys:**
  - **Red (1):** Live TV Channels
  - **Green (2):** Radio Stations
  - **Yellow (3):** Archive / DVR
  - **Blue (4):** Settings
  - **Guide (G):** EPG TV Guide
  - **0–9:** Direct channel number jumping
- **Parental Lock:** 4-digit PIN security to lock channels or settings.
- **Multi-Server & Backup:**
  - Configure multiple Tvheadend server profiles with connection test probe (`/api/serverinfo`).
  - Export and import full app configuration via JSON backup files.

## Tech Stack

- **Framework:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide Icons
- **Persistence:** LocalStorage with schema migrations and JSON export/import

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Build for production
npm run build
```
