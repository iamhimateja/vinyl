# TODO - Vinyl Music Player

## 🚀 High Priority

### Mobile App (Capacitor)
**Status:** Planned

Add Android and iOS support using Capacitor to wrap the existing React web app.

#### Setup Steps
```bash
# 1. Install Capacitor
bun add @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios

# 2. Initialize Capacitor
bunx cap init "Vinyl Music Player" com.vinyl.musicplayer

# 3. Add platforms
bunx cap add android
bunx cap add ios

# 4. Build and sync
bun run build
bunx cap sync

# 5. Open in IDE
bunx cap open android  # Android Studio
bunx cap open ios      # Xcode
```

#### Required Capacitor Plugins
- `@capacitor/filesystem` - Access device music files
- `@capacitor/preferences` - Store settings
- `@capacitor/app` - App lifecycle events
- `@capacitor/status-bar` - Status bar styling
- `@capacitor-community/media` - Media library access

#### Code Changes Needed
- [ ] Add Capacitor configuration (`capacitor.config.ts`)
- [ ] Update `platform.ts` to detect Capacitor environment
- [ ] Implement native file system access for Capacitor
- [ ] Add mobile-specific UI adjustments
- [ ] Configure app icons for Android/iOS
- [ ] Set up splash screens
- [ ] Add mobile E2E tests (re-enable in `playwright.config.ts`)
- [ ] Test audio playback on Android/iOS
- [ ] Handle background audio playback
- [ ] Implement media session controls (lock screen)

#### Platform-Specific Notes

**Android:**
- Requires Android Studio
- Min SDK: 22 (Android 5.1)
- Target SDK: 33+
- Permissions: `READ_EXTERNAL_STORAGE`, `READ_MEDIA_AUDIO`

**iOS:**
- Requires Xcode + macOS
- Min iOS: 13.0
- Permissions: `NSAppleMusicUsageDescription`, `NSMicrophoneUsageDescription`

---

## 📋 Backlog

### Features
- [ ] Lyrics display (fetch from online sources)
- [ ] More visualizer styles
- [ ] Import/Export library backup
- [ ] Playlist sharing
- [ ] Scrobbling (Last.fm integration)
- [ ] Discord Rich Presence

### Improvements
- [ ] Image resizing for cover art on import (reduce storage)
- [ ] LRU cache with size limit for `fileCache`
- [ ] Lazy load routes with `React.lazy`
- [ ] Virtual scrolling improvements for 10k+ songs

### Platform
- [ ] Windows installer (NSIS)
- [ ] macOS DMG signing
- [ ] Linux Flatpak/Snap packages
- [ ] Auto-updater for desktop app

---

## ✅ Completed

- [x] Electron desktop app
- [x] PWA support
- [x] Audio visualizer (bars, wave, area)
- [x] Crossfade between tracks
- [x] Sleep timer
- [x] 10-band equalizer
- [x] Library folder watching
- [x] Quick play (drag & drop)
- [x] FFmpeg transcoding for M4A on Linux
- [x] shadcn/ui component migration
- [x] Performance optimizations (batch imports, Map lookups)
