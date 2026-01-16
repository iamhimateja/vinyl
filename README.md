# 🎵 Vinyl Music Player

A beautiful, minimal, offline-first music player that feels like a personal vinyl player. Built with React, TypeScript, and Electron.

![Vinyl Music Player](https://img.shields.io/badge/Platform-Web%20%7C%20Desktop-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🎧 Music Playback
- **Play local audio files** - MP3, FLAC, WAV, OGG, AAC, M4A, OPUS, and more
- **Animated Vinyl Record** - Spins while playing with realistic grooves
- **Gapless playback** - Seamless transitions between tracks
- **Crossfade** - Smooth blending between songs (configurable 0-12s)
- **Playback speed control** - 0.5x to 2x speed
- **Queue management** - Drag-to-reorder, add/remove songs
- **Shuffle & Repeat** - All standard playback modes

### 📁 Library Management (Desktop)
- **Folder scanning** - Import entire music folders recursively
- **Auto-sync** - Watch folders for new/removed files automatically
- **First-launch wizard** - Guided setup for new users
- **Smart duplicate detection** - Avoids importing the same song twice
- **Auto metadata extraction** - Artist, album, track number, duration, album art

### 🎨 Beautiful Interface
- **Vinyl player visualization** - Animated spinning record
- **Album art display** - Shows embedded artwork or vinyl mode
- **Audio visualizer** - Bars, waves, and area wave styles
- **Light & Dark themes** - Easy on the eyes
- **Customizable accent colors** - 8 color options
- **Responsive design** - Works on desktop and mobile

### 🎛️ Audio Features
- **10-band equalizer** - Fine-tune your sound (60Hz to 16kHz)
- **EQ presets** - Rock, Pop, Jazz, Classical, Bass Boost, and more
- **Sleep timer** - Auto-stop after set duration with countdown
- **Real-time processing** - Using Web Audio API

### 📱 Cross-Platform
- **Web PWA** - Install on any device, works offline
- **Desktop app** - Native Electron app for Windows, macOS, Linux
- **Mobile-friendly** - Touch-optimized interface

### 📋 Organization
- **Playlists** - Create and manage custom playlists
- **Favorites** - Quick access to loved songs with heart button
- **Auto-playlist creation** - Import folders as playlists
- **Search & filter** - Find songs quickly

### 🎹 Music Generator
- **Built-in synth** - Create procedural music
- **Multiple patterns** - Ambient, energetic, chill, epic
- **Real-time generation** - Infinite unique music

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- For desktop app: Electron (included in dependencies)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/vinyl-music-player.git
cd vinyl-music-player

# Install dependencies
bun install
```

---

## 📦 Commands

### Web Development

```bash
# Start development server (http://localhost:5173)
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Type checking
bun run tsc --noEmit

# Linting
bun run lint
```

### Desktop App (Electron)

```bash
# Start desktop app in development mode
bun run electron:dev

# Build desktop app for production
bun run electron:build
```

---

## 🖥️ Desktop App

The desktop app is built with [Electron](https://electronjs.org/) and provides:

### Advantages over Web Version
- **No file reconnection needed** - Direct file system access
- **Auto folder watching** - Detect new files automatically
- **First-launch wizard** - Guided initial setup
- **Native folder picker** - System file dialogs
- **Persistent settings** - Via electron-store
- **Show in File Manager** - Open file location directly

---

## 🏗️ Project Structure

```
vinyl-music-player/
├── electron/               # Electron main & preload
│   ├── main.cjs           # Main process (IPC, file system, watcher)
│   └── preload.cjs        # Preload script (context bridge)
├── public/
│   ├── fonts/             # Self-hosted Figtree font
│   ├── icons/             # PWA icons (SVG)
│   ├── _redirects         # Netlify redirects
│   └── serve.json         # Static server config
├── src/
│   ├── components/        # React components
│   │   ├── VinylPlayer.tsx          # Animated vinyl record
│   │   ├── PlayerControls.tsx       # Playback controls
│   │   ├── PlayerOverlay.tsx        # Expandable overlay
│   │   ├── NowPlaying.tsx           # Full-screen player
│   │   ├── AudioVisualizer.tsx      # Audio visualization
│   │   ├── DraggableQueueList.tsx   # Drag-to-reorder queue
│   │   ├── VirtualizedSongList.tsx  # Virtualized list
│   │   ├── ImportMusic.tsx          # File import modal
│   │   ├── LibrarySettings.tsx      # Library folder management
│   │   ├── FirstLaunchWizard.tsx    # Setup wizard
│   │   ├── PlaylistView.tsx         # Playlist management
│   │   ├── SettingsView.tsx         # Settings panel
│   │   ├── Equalizer.tsx            # 10-band EQ
│   │   ├── SleepTimer.tsx           # Sleep timer controls
│   │   ├── MusicGeneratorView.tsx   # Procedural music
│   │   └── ...                      # Other components
│   ├── hooks/             # Custom React hooks
│   │   ├── useAudioPlayer.ts        # Audio playback + crossfade
│   │   ├── useAudioVisualizer.ts    # Visualizer data
│   │   ├── useSongs.ts              # Song management
│   │   ├── usePlaylists.ts          # Playlist management
│   │   ├── useLibrary.ts            # Library folder management
│   │   ├── useEqualizer.ts          # Equalizer logic
│   │   ├── useSleepTimer.ts         # Sleep timer logic
│   │   ├── useSettings.ts           # App settings
│   │   └── usePWA.ts                # PWA utilities
│   ├── lib/               # Utilities
│   │   ├── db.ts                    # IndexedDB (Dexie)
│   │   ├── audioMetadata.ts         # Metadata extraction
│   │   ├── audioContext.ts          # Shared audio context
│   │   ├── platform.ts              # Platform abstraction
│   │   └── musicGenerator.ts        # Procedural music
│   ├── types/             # TypeScript types
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles (Tailwind v4)
├── package.json
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript config
└── eslint.config.js       # ESLint config
```

---

## 🎨 Customization

### Themes
- **Dark Mode** - Default, easy on the eyes
- **Light Mode** - Clean and bright

### Accent Colors
- Gold (default), Purple, Cyan, Emerald, Rose, Orange, Blue, Pink

### Display Options
- **Vinyl Mode** - Animated spinning record
- **Album Art Mode** - Focus on cover artwork
- **Visualizer** - Bars, wave, or area wave animations

### Personalization
- Custom app title
- Multiple app icon options
- Remember volume between sessions

---

## 📦 Technologies

### Frontend
- **React 19** - UI framework
- **TypeScript 5** - Type safety
- **Tailwind CSS v4** - Styling
- **Vite 6** - Build tool
- **React Router v7** - Navigation

### Audio
- **Web Audio API** - Audio processing (equalizer, visualizer)
- **music-metadata** - Metadata extraction
- **Media Session API** - System media controls

### Storage
- **IndexedDB (Dexie)** - Local database for songs
- **localStorage** - Settings persistence (web)
- **electron-store** - Settings persistence (desktop)

### Desktop (Electron)
- **Electron** - Desktop framework
- **chokidar** - File system watching
- **IPC** - Secure renderer-main communication

### Other
- **Lucide React** - Icons
- **react-tooltip** - Tooltips
- **@dnd-kit** - Drag and drop
- **@tanstack/react-virtual** - List virtualization
- **vite-plugin-pwa** - PWA generation

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` | Seek backward 5s |
| `→` | Seek forward 5s |
| `↑` | Volume up |
| `↓` | Volume down |
| `M` | Mute / Unmute |
| `S` | Toggle shuffle |
| `R` | Cycle repeat mode |
| `N` | Next track |
| `P` | Previous track |

---

## 🔒 Privacy

This app is completely private:
- ✅ No data sent to any server
- ✅ All music stored locally (IndexedDB or filesystem)
- ✅ Works offline after first load
- ✅ No analytics or tracking
- ✅ No accounts required
- ✅ Open source

---

## 💻 Desktop vs Web Features

| Feature | Desktop (Electron) | Web (PWA) |
|---------|-------------------|-----------|
| Import files | ✅ | ✅ |
| Import folders | ✅ | ✅ (session only) |
| Auto folder watching | ✅ | ❌ |
| First-launch wizard | ✅ | ❌ |
| Persistent folder access | ✅ | ❌ |
| Show in File Manager | ✅ | ❌ |
| Offline playback | ✅ | ✅ (cached only) |

---

## 🐛 Known Issues

1. **Web Version - File Reconnection**: Browser security requires re-selecting music folder after page refresh. Use the desktop app to avoid this.

2. **Large Libraries**: Performance may degrade with 10,000+ songs. Virtualized lists help but have limits.

3. **Metadata Extraction**: Some audio formats may not have full metadata support.

4. **Linux File Watcher**: May require increasing inotify limit for watching many folders.

---

## ✅ Recently Completed

- [x] Queue management UI (drag to reorder)
- [x] Audio visualization (bars, wave, area styles)
- [x] Crossfade between tracks
- [x] Sleep timer with countdown
- [x] Library folder scanning
- [x] Auto-sync file watcher
- [x] First-launch setup wizard
- [x] Electron desktop app

## 🛣️ Roadmap

- [ ] Drag-to-reorder playlist songs
- [ ] Import/Export library backup
- [ ] Windows/macOS desktop builds
- [ ] Lyrics display
- [ ] More visualizer styles
- [ ] Android app

---

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

## 📝 Supported Audio Formats

| Format | Extension | Notes |
|--------|-----------|-------|
| MP3 | `.mp3` | Most common |
| FLAC | `.flac` | Lossless |
| WAV | `.wav` | Uncompressed |
| OGG | `.ogg` | Vorbis |
| AAC | `.aac`, `.m4a` | Apple |
| OPUS | `.opus` | Modern codec |
| WebM | `.webm` | Web format |
| AIFF | `.aiff` | Apple lossless |
| WMA | `.wma` | Windows Media |
| APE | `.ape` | Monkey's Audio |

---

## 🙏 Acknowledgments

- Inspired by the tactile experience of vinyl records
- Icons from [Lucide](https://lucide.dev/)
- [Figtree Font](https://github.com/erikdkennedy/figtree) - Clean, modern typeface
- Built with [Electron](https://electronjs.org/) for desktop
- [dnd-kit](https://dndkit.com/) - Drag and drop
- [chokidar](https://github.com/paulmillr/chokidar) - File system watching
- Styled with [Tailwind CSS](https://tailwindcss.com/)
