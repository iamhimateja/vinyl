# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Quick Play: drag & drop files to play without importing
- Shadcn UI components (Button, Dialog, AlertDialog, Tooltip, Toaster)
- FFmpeg transcoding for M4A/AAC on Linux Electron
- Comprehensive E2E tests for audio playback (159 tests across formats)
- Test audio fixtures generator script
- Release management scripts

### Changed
- Optimized audio visualizer (reduced CPU usage, 30fps cap)
- Optimized song imports with batch processing and Map-based lookups
- Split vendor chunks for smaller bundle size
- Lazy loading for music-metadata library
- Replaced custom UI components with Shadcn equivalents

### Fixed
- M4A/AAC playback on Linux (via FFmpeg transcoding)
- Visualizer animation not updating
- Music info modal content overflow
- Audio format detection for opus, aiff, wma, ape

## [1.0.0] - 2024-01-16

Initial release.

### Features
- Local music playback (MP3, FLAC, WAV, OGG, M4A, Opus, WebM)
- Animated vinyl record player
- Crossfade and gapless playback
- 10-band equalizer with presets
- Audio visualizer (bars, waves, area)
- Playlists and favorites
- Library management with folder scanning
- Auto folder watching (desktop)
- Sleep timer
- Dark/light themes, 8 accent colors
- Keyboard shortcuts
- PWA offline support
- Electron desktop app (Windows, macOS, Linux)
- Procedural music generator
