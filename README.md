# 🎵 Vinyl Music Player

A beautiful, offline-first music player with vinyl aesthetics. Available as both a **Web App (PWA)** and a **Desktop App (Tauri)**.

![Vinyl Music Player](./public/icons/icon.svg)

## ✨ Features

### 🎵 Core Playback
- **Animated Vinyl Record** - Spins while playing with realistic grooves
- **Full Playback Controls** - Play, pause, skip, previous, seek
- **Volume Control** - With mute toggle
- **Shuffle Mode** - Randomize your queue
- **Repeat Modes** - Off, repeat all, repeat one
- **Gapless-like Playback** - Smooth transitions between tracks

### 🎛️ Audio Enhancement
- **10-Band Equalizer** - Fine-tune your sound (60Hz to 16kHz)
- **EQ Presets** - Flat, Rock, Pop, Jazz, Classical, Bass Boost, Treble Boost, Vocal, Electronic, Acoustic
- **Custom EQ** - Save your own presets
- **Real-time Processing** - Using Web Audio API

### 📋 Library Management
- **Import Music** - Single files or entire folders
- **Auto Metadata Extraction** - Artist, album, track number, duration, album art
- **Favorites** - Mark songs as favorites
- **Search** - Filter songs by title, artist, or album
- **Sorting** - By title, artist, album, date added, duration
- **Bulk Delete** - Remove multiple songs at once

### 📁 Playlist Support
- **Create Playlists** - Organize your music
- **Add/Remove Songs** - Manage playlist contents
- **Reorder Songs** - Drag to reorder (coming soon)
- **Delete Playlists** - With confirmation dialog

### 🎨 Customization
- **Dark/Light/System Theme** - Match your preference
- **Accent Colors** - Gold (default), Rose, Sky, Emerald, Violet, Amber
- **App Icons** - Disc, Music, Headphones options
- **Font Size** - Small, Medium, Large

### 📱 Platform Support
- **PWA (Progressive Web App)** - Install from browser
- **Desktop App** - Native app via Tauri (Linux, macOS, Windows)
- **Responsive Design** - Works on mobile, tablet, desktop
- **Keyboard Shortcuts** - Space (play/pause), arrows (seek), etc.

### 🔌 Other Features
- **Offline-First** - Works without internet after first load
- **Media Session API** - Lock screen controls, media keys support
- **Now Playing View** - Full-screen player with album art
- **Player Overlay** - Expandable mini-player
- **Tooltips** - Helpful hints throughout the app

---

## 🚫 Features NOT Included

- ❌ **Music Streaming** - No Spotify, Apple Music, etc. integration
- ❌ **Cloud Sync** - Music stays on your device only
- ❌ **Music Discovery** - No recommendations or radio
- ❌ **Lyrics Display** - No lyrics support
- ❌ **Audio Visualization** - No spectrum analyzer or visualizer
- ❌ **Crossfade** - No crossfade between tracks
- ❌ **Sleep Timer** - No auto-stop timer
- ❌ **Podcast Support** - Music only
- ❌ **Queue Management UI** - No drag-to-reorder queue
- ❌ **Smart Playlists** - No auto-generated playlists
- ❌ **Scrobbling** - No Last.fm integration
- ❌ **Multi-device Sync** - Single device only

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- For desktop app: [Rust](https://rustup.rs/) 1.77+

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

# Serve production build (http://localhost:3000)
bun run serve

# Type checking
bun run typecheck

# Linting
bun run lint
```

### Desktop App (Tauri)

```bash
# Start desktop app in development mode
bun run tauri:dev

# Build desktop app for production
bun run tauri:build

# Run Tauri CLI directly
bun run tauri [command]
```

### Rust Commands (in src-tauri/)

```bash
# Check Rust code compiles
cargo check

# Build Rust backend
cargo build

# Build release version
cargo build --release

# Run clippy lints
cargo clippy
```

---

## 🖥️ Desktop App

The desktop app is built with [Tauri v2](https://v2.tauri.app/) and provides:

### Advantages over Web Version
- **No file reconnection needed** - Direct file system access
- **Native folder picker** - System file dialogs
- **Better performance** - Native executable
- **System integration** - Taskbar, notifications, etc.

### Build Outputs

After running `bun run tauri:build`, packages are created in:
```
src-tauri/target/release/bundle/
├── deb/          # Debian package (.deb)
├── rpm/          # Red Hat package (.rpm)
└── appimage/     # AppImage (.AppImage)
```

### Installing Desktop App

**Debian/Ubuntu:**
```bash
sudo dpkg -i "Vinyl Music Player_1.0.0_amd64.deb"
```

**Fedora/RHEL:**
```bash
sudo rpm -i "Vinyl Music Player-1.0.0-1.x86_64.rpm"
```

**AppImage (any Linux):**
```bash
chmod +x "Vinyl Music Player_1.0.0_amd64.AppImage"
./"Vinyl Music Player_1.0.0_amd64.AppImage"
```

---

## 🏗️ Project Structure

```
vinyl-music-player/
├── public/
│   ├── icons/              # PWA icons (SVG)
│   ├── _redirects          # Netlify redirects
│   └── serve.json          # Static server config
├── src/
│   ├── components/         # React components
│   │   ├── VinylPlayer.tsx       # Animated vinyl record
│   │   ├── PlayerControls.tsx    # Playback controls
│   │   ├── BottomPlayer.tsx      # Bottom bar player
│   │   ├── PlayerOverlay.tsx     # Expandable overlay
│   │   ├── NowPlaying.tsx        # Full-screen player
│   │   ├── SongList.tsx          # Song list component
│   │   ├── VirtualizedSongList.tsx # Virtualized list for performance
│   │   ├── ImportMusic.tsx       # File import modal
│   │   ├── PlaylistView.tsx      # Playlist management
│   │   ├── SettingsView.tsx      # Settings panel
│   │   ├── Equalizer.tsx         # 10-band EQ
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   ├── TopNav.tsx            # Top navigation
│   │   ├── MobileNav.tsx         # Mobile navigation
│   │   ├── AboutView.tsx         # About page
│   │   ├── ConfirmDialog.tsx     # Confirmation dialogs
│   │   ├── Tooltip.tsx           # Tooltip component
│   │   └── ErrorBoundary.tsx     # Error handling
│   ├── hooks/              # Custom React hooks
│   │   ├── useAudioPlayer.ts     # Audio playback logic
│   │   ├── useSongs.ts           # Song management
│   │   ├── usePlaylists.ts       # Playlist management
│   │   ├── useEqualizer.ts       # Equalizer logic
│   │   ├── useSettings.ts        # App settings
│   │   ├── useTheme.ts           # Theme management
│   │   └── usePWA.ts             # PWA utilities
│   ├── lib/                # Utilities
│   │   ├── db.ts                 # IndexedDB operations
│   │   ├── audioMetadata.ts      # Metadata extraction
│   │   ├── platform.ts           # Platform abstraction (Web/Tauri)
│   │   └── musicGenerator.ts     # Procedural music (experimental)
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles (Tailwind)
├── src-tauri/              # Tauri/Rust backend
│   ├── src/
│   │   ├── main.rs               # Rust entry point
│   │   ├── lib.rs                # Tauri setup
│   │   └── commands.rs           # Rust commands
│   ├── capabilities/
│   │   └── default.json          # Security permissions
│   ├── icons/              # Desktop app icons
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── package.json
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript config
└── eslint.config.js        # ESLint config
```

---

## 🎨 Design System

### Theme Colors

| Variable | Light | Dark | Usage |
|----------|-------|------|-------|
| `--vinyl-bg` | `#f5f5f5` | `#1a1a1a` | Background |
| `--vinyl-surface` | `#ffffff` | `#242424` | Cards, panels |
| `--vinyl-border` | `#e0e0e0` | `#333333` | Borders |
| `--vinyl-text` | `#1a1a1a` | `#e5e5e5` | Primary text |
| `--vinyl-text-muted` | `#666666` | `#888888` | Secondary text |
| `--vinyl-accent` | varies | varies | Accent color |

### Accent Colors

| Name | Value | CSS Class |
|------|-------|-----------|
| Gold | `#d4a574` | Default |
| Rose | `#f43f5e` | `accent-rose` |
| Sky | `#0ea5e9` | `accent-sky` |
| Emerald | `#10b981` | `accent-emerald` |
| Violet | `#8b5cf6` | `accent-violet` |
| Amber | `#f59e0b` | `accent-amber` |

### Animations

- **Vinyl Spin** - 3s rotation while playing
- **Wobble** - Buffering state indicator
- **Pulse Glow** - Active playing indicator
- **Slide Transitions** - Panel animations

---

## 📦 Technologies

### Frontend
- **React 19** - UI framework
- **TypeScript 5.9** - Type safety
- **Tailwind CSS v4** - Styling
- **Vite 7** - Build tool
- **React Router v7** - Navigation

### Audio
- **Web Audio API** - Audio processing (equalizer)
- **music-metadata** - Metadata extraction
- **Media Session API** - System media controls

### Storage
- **IndexedDB (idb)** - Local database for songs
- **localStorage** - Settings persistence

### Desktop (Tauri)
- **Tauri v2** - Desktop framework
- **Rust** - Backend language
- **tauri-plugin-fs** - File system access
- **tauri-plugin-dialog** - Native dialogs
- **tauri-plugin-store** - Persistent storage
- **walkdir** - Directory traversal

### Other
- **Lucide React** - Icons
- **react-tooltip** - Tooltips
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

## 🐛 Known Issues

1. **Web Version - File Reconnection**: Browser security requires re-selecting music folder after page refresh. Use the desktop app to avoid this.

2. **Large Libraries**: Performance may degrade with 10,000+ songs. Virtualized lists help but have limits.

3. **Metadata Extraction**: Some audio formats may not have full metadata support.

---

## 🛣️ Roadmap

- [ ] Queue management UI (drag to reorder)
- [ ] Drag-to-reorder playlists
- [ ] Audio visualization (spectrum analyzer)
- [ ] Crossfade between tracks
- [ ] Sleep timer
- [ ] Import/Export library
- [ ] Windows/macOS desktop builds
- [ ] Android app (Tauri mobile)

---

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

## 🙏 Acknowledgments

- Inspired by the tactile experience of vinyl records
- Icons from [Lucide](https://lucide.dev/)
- Built with [Tauri](https://tauri.app/) for desktop
- Styled with [Tailwind CSS](https://tailwindcss.com/)
