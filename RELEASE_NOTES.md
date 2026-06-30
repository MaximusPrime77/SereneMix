# 🌟 PrimeMix v1.0.0 (Ultimate Ambient Sound Mixer)

**PrimeMix** is a lightweight, premium-looking, and borderless ambient sound mixer application developed specifically for Windows Desktop. Inspired by modern relaxing audio apps like Microsoft Store's Ambie, it features a curated library of **170+ handpicked, high-quality relaxing sounds** spanning across multiple categories. It allows you to play up to 3 sounds simultaneously, adjust individual volume levels with smooth audio crossfading, play sequentially in playlist mode, save custom mixes, set sleep/focus timers, and fully customize sound titles, categories, and cover art.

---

## 🚀 Key Features

- **📚 Rich Sound Library (170+ Handpicked Tracks):** Pre-loaded with high-fidelity, handpicked audio tracks designed specifically for deep focus, anxiety relief, meditation, and restful sleep. All audio filenames and titles have been professionally cleaned (removing date/website prefixes like `www.fesliyanstudios.com`).
- **🔀 Playlist Mode (Sequential Play):** Automatically plays sounds one after another (loop is disabled on tracks). Respects the active category filter with a smooth 2-second crossfade/fade transition between tracks.
- **🌐 Multi-language Support (EN/TR):** Switch between English and Turkish dynamically. The interface, settings, and sound names/categories translate instantly, and the system tray menu synchronizes with the active language.
- **🎵 Smart Simultaneous Playback (Max 3 Sounds):** Play up to 3 nature or ambient sounds simultaneously and adjust individual volume levels to create your perfect peaceful atmosphere.
- **⏯️ 3-State Playback & Media Keys:** Smart global controls (**Play All** / **Pause All** / **Resume**). Control playback globally using your keyboard's `Play/Pause` media key or `Ctrl+Alt+P` shortcut (with smart toast guidance if no sounds are selected).
- **⭐ Favorites System:** Mark your favorite sounds with a heart icon and filter them instantly using the dedicated **⭐ Favorites** tab.
- **🍅 Focus Pomodoro Timer:** Built-in Pomodoro technique timer supporting **Work (25m)** and **Break (5m)** sessions with automatic mode switching and toast notifications.
- **🪟 Mini Mode (Compact Overlay):** Collapse the application into a sleek, pinned always-on-top compact overlay (340x240px) to control sounds while multitasking.
- **💾 Saved Mixes & Import/Export:** Save your custom sound and volume combinations. Easily **Export** or **Import** your mixes as JSON files to share across computers.
- **🎨 Dynamic Ambient Atmosphere:** Experience responsive background color shifts tailored to active sound categories (Cool Green for Nature, Neon Purple for Music, Warm Amber for Urban).
- **🌙 Smart Sleep Timer:** Set a timer from 15 minutes to 2 hours. Active sounds smoothly fade out and pause without resetting your active list.
- **📌 System Tray Integration:** PrimeMix runs quietly in the system tray. Right-click the tray icon to play/stop sounds or exit.
- **✨ Premium Glassmorphic UI:** A fully borderless frameless window with custom titlebar, equalizer animations, and debounced volume sliders (optimized to fit perfectly on standard resolutions with no vertical scrolling in settings).
- **📁 Real-time Folder Syncing:** Drag and drop audio files (.mp3, .wav, .ogg, .flac, .m4a) into your sounds directory to load them instantly without restarting.

---

## 📦 Installation & Running

1. Download and extract **`PrimeMix-1.0.0-win.zip`** to a directory of your choice (e.g., `C:\Apps\PrimeMix\`).
2. Double-click **`PrimeMix.exe`** inside the extracted folder to start the application instantly.
*(Note: We highly recommend using the Zip version, as it runs directly from the local folder with no temp directory copy delays, giving you an instantaneous startup experience).*

---

## 🛠️ Technical Stack
- **Electron** (v33.4.11) & Node.js (native `fs` file watching & IPC communication)
- **HTML5 Audio API** (dynamic looping, debounced volume mapping & smooth crossfading)
- **Vanilla CSS** (glassmorphism, backdrop blur filters, dynamic atmosphere transitions)
- **Preload.js** (secure contextBridge IPC)

---

## 👤 Author / Developer
- **Developer:** Maximus Decimus Meridius
- **GitHub:** [@MaximusPrime77](https://github.com/MaximusPrime77)
- **Email:** b.maximus.prime@gmail.com
