# Release Guide

Quick reference for releasing Vinyl Music Player.

## Version: 0.1.0

Current version in `package.json`: **0.1.0**

---

## Release Checklist

### Before Release

- [ ] All tests pass: `bun run test`
- [ ] E2E tests pass: `bun run test:e2e`
- [ ] Build succeeds: `bun run build`
- [ ] CHANGELOG.md is updated
- [ ] Version in package.json is correct

### Release Steps

```bash
# 1. Commit the version changes
git add package.json CHANGELOG.md
git commit -S -m "Release v0.1.0"

# 2. Create signed tag
git tag -s v0.1.0 -m "Release v0.1.0"

# 3. Push to GitHub
git push origin master
git push origin v0.1.0

# 4. Build desktop installers
bun run electron:build

# 5. Create GitHub release (upload files from dist-electron/)
gh release create v0.1.0 --title "v0.1.0" --notes "Initial public release" dist-electron/*
```

---

## Build Outputs

After `bun run electron:build`, find installers in `dist-electron/`:

| Platform | File | Type |
|----------|------|------|
| Linux | `Vinyl Music Player-0.1.0.AppImage` | Portable |
| Linux | `vinyl-music-player_0.1.0_amd64.deb` | Debian package |
| macOS | `Vinyl Music Player-0.1.0.dmg` | Disk image |
| macOS | `Vinyl Music Player-0.1.0-mac.zip` | Zip archive |
| Windows | `Vinyl Music Player Setup 0.1.0.exe` | Installer |
| Windows | `Vinyl Music Player 0.1.0.exe` | Portable |

---

## Version Bumping

For future releases:

```bash
# Bug fixes (0.1.0 -> 0.1.1)
./scripts/release.sh patch

# New features (0.1.0 -> 0.2.0)
./scripts/release.sh minor

# Breaking changes (0.1.0 -> 1.0.0)
./scripts/release.sh major

# Preview without changes
./scripts/release.sh patch --dry-run
```

---

## Manual Version Change

Edit `package.json`:
```json
"version": "0.1.0"
```

Update `CHANGELOG.md`:
```markdown
## [0.1.0] - 2026-01-18
```

---

## Cross-Platform Builds

Building for other platforms from Linux:

```bash
# Linux only (current platform)
bun run electron:build

# All platforms (needs Wine for Windows)
bun run electron:build -- --linux --mac --win
```

Note: macOS builds require macOS for code signing.

---

## Troubleshooting

**Build fails with missing dependencies:**
```bash
bun install
```

**Electron build fails:**
```bash
# Clean and rebuild
rm -rf dist dist-electron node_modules/.cache
bun install
bun run electron:build
```

**Tests fail:**
```bash
# Generate test audio fixtures first
cd e2e/fixtures && ./generate-test-audio.sh
bun run test:e2e
```
