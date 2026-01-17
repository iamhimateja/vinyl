# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Quick Play** - Drag & drop audio files to play instantly without importing to library
  - Drop zone overlay appears when dragging files over the app
  - Option to "Play Now" (temporary) or "Add to Library & Play"
  - Support for multiple files as temporary playlist queue
  - Metadata extraction and display for dropped files
- Comprehensive test coverage with Vitest (230 tests, up from 98)
- New `audioMetadata.test.ts` with 77 tests for format detection
- Format-specific playback tests for all supported audio types
- GitHub Actions CI/CD workflows
- Contributing guide with detailed instructions
- Issue and PR templates
- Security policy
- Dependabot configuration for automated dependency updates
- Release management scripts (`scripts/release.sh`)

### Fixed
- **Audio format support** - Fixed M4A and other formats not being detected
  - Added missing MIME types: `audio/mp4`, `audio/opus`, `audio/aiff`, `audio/x-ms-wma`, `audio/ape`
  - Added missing extensions: `.opus`, `.aiff`, `.aif`, `.wma`, `.ape`
  - Now supports 26 MIME types and 12 file extensions
  - Proper fallback from MIME type to extension detection

### Changed
- Updated ESLint configuration with better React hooks rules
- Exported `SUPPORTED_AUDIO_TYPES` and `SUPPORTED_AUDIO_EXTENSIONS` constants

## [1.0.0] - 2024-01-16

### Added
- 🎵 **Music Playback**
  - Play local audio files (MP3, FLAC, WAV, OGG, AAC, M4A, OPUS, and more)
  - Animated vinyl record visualization
  - Gapless playback
  - Crossfade between tracks (0-12s configurable)
  - Playback speed control (0.5x to 2x)
  - Queue management with drag-to-reorder
  - Shuffle and repeat modes

- 📁 **Library Management**
  - Folder scanning with recursive import
  - Auto-sync file watcher
  - First-launch setup wizard
  - Smart duplicate detection
  - Automatic metadata extraction

- 🎨 **Interface**
  - Vinyl player visualization
  - Album art display
  - Audio visualizer (bars, waves, area wave)
  - Light and dark themes
  - 8 customizable accent colors
  - Responsive design for desktop and mobile

- 🎛️ **Audio Features**
  - 10-band equalizer (60Hz to 16kHz)
  - EQ presets (Rock, Pop, Jazz, Classical, Bass Boost, etc.)
  - Sleep timer with countdown
  - Real-time audio processing via Web Audio API

- 📱 **Cross-Platform**
  - Web PWA with offline support
  - Desktop app via Electron (Windows, macOS, Linux)
  - Mobile-friendly touch interface

- 📋 **Organization**
  - Custom playlists
  - Favorites with heart button
  - Auto-playlist creation from folders
  - Search and filter

- 🎹 **Music Generator**
  - Built-in procedural music synthesizer
  - Multiple patterns (ambient, energetic, chill, epic)

- ⌨️ **Keyboard Shortcuts**
  - Space: Play/Pause
  - Arrow keys: Seek, Volume
  - M: Mute, S: Shuffle, R: Repeat
  - N/P: Next/Previous track

[Unreleased]: https://github.com/iamhimateja/vinyl-music-player/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/iamhimateja/vinyl-music-player/releases/tag/v1.0.0
