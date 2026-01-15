# 🎵 Vinyl Music Player

A minimal, offline-first music web app that feels like a personal vinyl player. Built with React, Tailwind CSS, and IndexedDB.

![Vinyl Music Player](./public/icons/icon.svg)

## ✨ Features

- **🔌 Offline-First**: Works entirely in the browser, no backend required
- **💾 User-Owned Data**: All music stored locally in IndexedDB
- **🎨 Minimal UI**: Clean, distraction-free interface
- **📀 Expressive Playback**: Animated vinyl record that spins while playing
- **📱 PWA Support**: Installable as a native-like app
- **🎛️ Full Playback Control**: Play, pause, skip, seek, volume, shuffle, repeat
- **📁 Easy Import**: Import single files or entire folders
- **📋 Playlist Management**: Create and manage playlists
- **🎮 Media Session**: Lock screen and hardware controls support

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+

### Installation

```bash
# Clone the repository (or navigate to the project folder)
cd vinyl-music-player

# Install dependencies
bun install

# Start development server
bun dev

# Build for production
bun run build

# Preview production build
bun preview

# Type check
bun run typecheck
```

### Development

The app will be available at `http://localhost:5173`

## 🏗️ Project Structure

```
vinyl-music-player/
├── public/
│   ├── icons/           # PWA icons
│   ├── manifest.json    # PWA manifest
│   └── sw.js           # Service worker
├── src/
│   ├── components/      # React components
│   │   ├── VinylPlayer.tsx      # Animated vinyl record
│   │   ├── PlayerControls.tsx   # Playback controls
│   │   ├── SongList.tsx         # Song list component
│   │   ├── ImportMusic.tsx      # File import modal
│   │   ├── PlaylistView.tsx     # Playlist management
│   │   └── ...
│   ├── hooks/           # Custom React hooks
│   │   ├── useAudioPlayer.ts    # Audio playback logic
│   │   ├── useSongs.ts          # Song management
│   │   └── usePlaylists.ts      # Playlist management
│   ├── lib/             # Utilities
│   │   ├── db.ts               # IndexedDB operations
│   │   └── audioMetadata.ts    # Metadata extraction
│   ├── types/           # TypeScript types
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
└── package.json
```

## 🎨 Design System

### Colors

| Name | Value | Usage |
|------|-------|-------|
| vinyl-bg | `#1a1a1a` | Background |
| vinyl-surface | `#242424` | Cards, sidebar |
| vinyl-accent | `#d4a574` | Accent, highlights |
| vinyl-text | `#e5e5e5` | Primary text |
| vinyl-text-muted | `#888888` | Secondary text |

### Animations

- **Vinyl Spin**: 3-second rotation while playing
- **Wobble**: Buffering indicator
- **Pulse Glow**: Playing state glow effect

## 📦 Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **IndexedDB (idb)** - Local storage
- **Lucide React** - Icons
- **Vite** - Build tool

## 🔒 Privacy

This app is completely private:
- No data is sent to any server
- All music is stored locally in your browser
- Works offline after first load
- No analytics or tracking

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Inspired by the tactile experience of vinyl records
- Icons from [Lucide](https://lucide.dev/)
