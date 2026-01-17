# Vinyl Music Player

A local music player with a vinyl record aesthetic. Works offline. No accounts, no tracking.

**Platforms:** Web (PWA), Windows, macOS, Linux

---

## Install

### Desktop App
Download from [Releases](../../releases).

**Linux users:** Install FFmpeg for M4A/AAC support:
```bash
sudo apt install ffmpeg
```

### Web Version
Build and host it yourself (see Development section).

---

## Features

- Play local music files (MP3, FLAC, WAV, OGG, M4A, and more)
- Create playlists
- 10-band equalizer with presets
- Audio visualizer
- Sleep timer
- Drag & drop to play files instantly
- Dark/light themes

---

## Supported Formats

| Format | Windows/macOS | Linux Desktop | Web |
|--------|---------------|---------------|-----|
| MP3, WAV, OGG, FLAC, Opus, WebM | Yes | Yes | Yes |
| M4A/AAC | Yes | Yes (needs FFmpeg) | Yes |

Linux automatically transcodes unsupported formats using FFmpeg.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Pause |
| Arrow Left/Right | Seek 5 seconds |
| Arrow Up/Down | Volume |
| M | Mute |
| S | Shuffle |
| R | Repeat |
| N / P | Next / Previous track |
| ? | Show all shortcuts |

---

## Known Issues

1. **Large libraries (10,000+ songs)** - May get slow
2. **Linux M4A** - Requires FFmpeg installed
3. **Web folder access** - Need to re-select folder after refresh

---

## Development

```bash
bun install
bun run dev              # Web dev server
bun run electron:dev     # Desktop app
bun run test             # Unit tests
bun run test:e2e         # E2E tests
bun run build            # Build web
bun run electron:build   # Build desktop
```

For E2E tests, generate test audio first:
```bash
cd e2e/fixtures && ./generate-test-audio.sh
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for release process and guidelines.

---

## License

MIT
