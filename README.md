<p align="center">
  <img src="app_icon.png" width="128" alt="PrimeMix Logo" style="border-radius: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.3);" />
</p>

<h1 align="center">PrimeMix</h1>

<p align="center">
  <strong>Premium Ambient Sound Mixer for Windows Desktop</strong>
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://www.electronjs.org/"><img src="https://img.shields.io/badge/Electron-v31.0.0-blue.svg" alt="Electron"></a>
  <img src="https://img.shields.io/badge/Platform-Windows-lightgrey.svg" alt="Platform">
  <img src="https://img.shields.io/badge/Version-1.0.0-brightgreen.svg" alt="Version">
</p>

<br>

**PrimeMix** is a premium ambient sound mixer for Windows desktop, inspired by modern relaxing audio applications like Ambie. It comes pre-packaged with a curated library of **170+ handpicked, high-quality relaxing sounds** spanning across multiple categories. The app allows you to play up to 3 sounds simultaneously, adjust individual volume levels with smooth audio crossfading, play sequentially in playlist mode, save custom mixes, set sleep/focus timers, and fully customize sound titles, categories, and cover art.

---

## Key Features 🚀

### 📚 Rich Sound Library
- **170+ Curated Ambient Sounds**: Pre-loaded with high-fidelity, handpicked audio tracks designed specifically for deep focus, anxiety relief, meditation, and restful sleep.
- **Diverse Categories**: Easily browse through Nature, Urban, Animals, Music, Instrumental, and Noise categories.

### 🎵 Playback & Audio
- **Smart Simultaneous Audio Playback (Max 3 Sounds)**: Play up to 3 ambient sounds at once to create your ideal atmosphere.
- **Smooth Audio Crossfading**: Seamless fade-in and fade-out transitions when playing, pausing, or switching sounds.
- **3-State Global Play Button**: Intelligently shows **Play All**, **Pause All**, or **Resume** depending on the current playback state (with smart toast guidance if no sounds are selected).
- **Individual Volume Control**: Per-sound volume sliders with debounced disk saving (no constant I/O).
- **Media Key Support**: Control playback using your keyboard's `Play/Pause` media key or `Ctrl+Alt+P` global shortcut.

### 🔀 Playlist Mode (Sequential Play)
- **Sequential Playback**: Automatically plays sounds one after another (loop is disabled on tracks).
- **Smooth Transition**: A 2-second crossfade/fade duration between tracks when auto-advancing to the next sound.
- **Category Filter Integration**: Respects the active category filter (e.g., sequentially plays only your "Nature" or "Music" sounds).
- **Single Playback Focus**: Limits playback to one active sound to maintain focus on the playing sequence.

### ⭐ Favorites
- Mark any sound as a favorite with a single click on the heart icon.
- Filter the sound grid to show only your favorites via the **⭐ Favorites** category tab.
- Favorites are persisted across sessions via localStorage.

### ⏱ Sleep Timer
- Set a countdown from **15 minutes to 2 hours**.
- When the timer expires, sounds **smoothly pause** (not deleted) — resume anytime after waking up.
- Cancel the timer at any time with one click.

### 🍅 Focus Pomodoro Timer
- Built-in **Pomodoro technique** timer with **Work (25 min)** and **Break (5 min)** modes.
- Start, pause, and reset controls.
- Automatically switches to the next mode when a session completes, with a toast notification.

### 💾 Saved Mixes & Import/Export
- Save your current sound combination (including volumes) as a named **Mix**.
- Restore any saved mix with one click — sounds load sequentially after a smooth fade-out.
- **Export** all your mixes to a `.json` file to share or back up.
- **Import** mixes from a `.json` file on any PrimeMix installation.
- Graceful handling: if a mix contains missing files, you get a clear warning toast.

### 🪟 Mini Mode (Compact Overlay)
- Collapse the app into a **tiny floating overlay** (340×240px) that stays always-on-top.
- Shows active sounds with individual play/pause and remove buttons.
- Exit mini mode to restore the full interface with all your settings intact.

### 🎨 Dynamic Ambient Atmosphere
- The app background color **shifts dynamically** based on which sounds are currently playing:
  - 🌿 Nature sounds → cool green glow
  - 🎵 Music/Instrumental → neon purple
  - 🏙 Urban/Noise → warm amber
  - 🔮 Default → indigo blue

### 🗂 Sound Management
- **Add Sounds**: Import any `.mp3`, `.wav`, `.ogg`, `.flac`, or `.m4a` file directly via dialog.
- **Customize**: Edit sound title, category, and cover art from within the app.
- **Delete**: Remove sounds with confirmation dialog.
- **Open Folder**: Jump to the sounds directory in Explorer.
- **Real-time Folder Sync**: Drop audio files into the sounds folder — they appear instantly without restarting.

### 🌐 Multi-language Support (EN / TR)
- Toggle between **English** and **Turkish** with a single button.
- All UI text, category labels, sound names, and system tray menu update instantly.

### 🖥 System Tray Integration
- PrimeMix lives in the system tray when minimized or closed.
- Right-click the tray icon to **Play/Stop All**, or **Quit**.

### 🎨 Premium Glassmorphic UI
- Fully borderless frameless window with a custom titlebar.
- Hover animations, equalizer wave visuals on active cards.
- Category filter tabs, search bar, and compact grid layout.
- All modals close on overlay click (Escape-friendly UX).

---

## Screenshots & Icons 📸

<p align="center">
  <img src="app_icon.png" width="160" alt="PrimeMix Icon" style="border-radius: 20%; box-shadow: 0 10px 25px rgba(0,0,0,0.3);" />
</p>

### 📱 Main Application
<p align="center">
  <img src="screenshots/main_app.png" width="800" alt="PrimeMix Main Interface" style="border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);" />
</p>

### 🎵 Active Sounds & Custom Mixing
<p align="center">
  <img src="screenshots/active_sounds.png" width="800" alt="PrimeMix Active Sounds Panel" style="border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);" />
</p>

### 🗟 Mini Mode (Compact Overlay)
<p align="center">
  <img src="screenshots/mini_mode.png" width="340" alt="PrimeMix Mini Mode" style="border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);" />
</p>

---

## Getting Started 🛠️

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone or download this repository:
   ```bash
   git clone https://github.com/MaximusPrime77/PrimeMix.git
   cd PrimeMix
   ```
2. Place your ambient sound files in the target directory:
   `C:\Users\MAXIMUS\PROJECTS\PrimeMixSound`
   *(Or modify `main.js` to change the `SOUNDS_DIR` path to your preference)*.
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the App
Start the app in development mode:
```bash
npm start
```

### Packaging / Building Portable Executable
To package the app into a standalone portable `.exe` for Windows:
```bash
npm run build
```
Once the build completes, your portable executable will be located in the `dist/` directory.

> [!IMPORTANT]
> **How to Run the Portable Version (`PrimeMix.1.0.0.portable.exe`):**
>
> - **Dedicated Folder Required:** Place the `.exe` inside a dedicated folder. On first launch it will create a `PrimeMix_Data` folder in the same directory to store audio files, cover art, and configuration.
> - **First Launch Delay:** On the very first launch, the app will take a few seconds to copy the default sounds to `PrimeMix_Data`.
> - **Portability:** To carry your setup to another computer, copy both the `.exe` and the adjacent `PrimeMix_Data` folder together.

---

## Project Structure 📁

```
PrimeMix/
├── package.json             # Build config & dependencies
├── main.js                  # Electron main process (tray, window, IPC, watcher, media:// protocol)
├── preload.js               # Secure IPC bridge (contextBridge)
├── app_icon.png             # High-res blue-purple app logo
├── tray_icon.png            # System tray icon
└── renderer/                # Frontend assets
    ├── index.html           # UI layout, all modals (Edit, SaveMix, About, Confirm)
    ├── styles.css           # Glassmorphic styling, compact card grid, Pomodoro, Mini Mode
    ├── app.js               # Full playback engine, Favorites, Pomodoro, Sleep Timer,
    │                        #   Mini Mode, Import/Export, Dynamic Atmosphere, i18n
    └── locales/
        ├── tr.json          # Turkish translations
        └── en.json          # English translations
```

---

## Technologies Used 💻

- **Electron** (v31.0.0) — Desktop shell, IPC, system tray, global shortcuts
- **Node.js** — Native `fs` module, async I/O, directory watching
- **HTML5 Audio API** — Looping, crossfading, volume control
- **Vanilla CSS** — Glassmorphism, backdrop filters, CSS animations
- **localStorage** — Persistent favorites, mixes, language preference

---

## Author 👤

Developed and designed with ❤️ by **Maximus Decimus Meridius**
- **GitHub**: [@MaximusPrime77](https://github.com/MaximusPrime77)
- **Email**: b.maximus.prime@gmail.com

---

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
