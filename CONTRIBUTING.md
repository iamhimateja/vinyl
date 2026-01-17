# Contributing

## Setup

```bash
git clone <repo>
cd vinyl-music-player
bun install
bunx playwright install  # For E2E tests
```

## Development

```bash
bun run dev              # Web at http://localhost:5173
bun run electron:dev     # Desktop app
```

## Testing

```bash
bun run test             # Unit tests
bun run test:watch       # Watch mode
bun run test:e2e         # E2E tests (generate fixtures first)
bun run test:e2e:ui      # E2E with interactive UI
```

Generate test audio fixtures (requires FFmpeg):
```bash
cd e2e/fixtures && ./generate-test-audio.sh
```

## Code Style

- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Run `bun run lint` before committing
- Run `bun run typecheck` to check types

---

# Release Process

## Scripts

All release scripts are in `scripts/`:

| Script | Purpose |
|--------|---------|
| `release.sh` | Bump version, update changelog, create tag |
| `version.sh` | Check current version, calculate next version |
| `changelog-gen.sh` | Generate changelog from commits |

## Creating a Release

### 1. Check current version

```bash
./scripts/version.sh current    # Shows current version
./scripts/version.sh next       # Suggests next version based on commits
```

### 2. Preview the release (dry run)

```bash
./scripts/release.sh patch --dry-run   # or minor/major
```

This shows what will happen without making changes.

### 3. Run the release

```bash
./scripts/release.sh patch   # Bug fixes only
./scripts/release.sh minor   # New features
./scripts/release.sh major   # Breaking changes
```

The script will:
1. Bump version in `package.json`
2. Update `CHANGELOG.md`
3. Run tests
4. Build the project
5. Create a git commit and tag

### 4. Push and create GitHub release

```bash
git push && git push --tags
```

Then create a release on GitHub with the built artifacts from `dist-electron/`.

## Version Numbering

We use [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 -> 2.0.0): Breaking changes
- **MINOR** (1.0.0 -> 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 -> 1.0.1): Bug fixes only

## Changelog

We follow [Keep a Changelog](https://keepachangelog.com/) format.

### Generate changelog entries

```bash
./scripts/changelog-gen.sh           # From last tag
./scripts/changelog-gen.sh v1.0.0    # From specific tag
```

Copy the output into `CHANGELOG.md` under `[Unreleased]`.

### Commit types to changelog sections

| Commit | Changelog Section |
|--------|-------------------|
| `feat:` | Added |
| `fix:` | Fixed |
| `docs:` | Changed |
| `refactor:`, `perf:`, `chore:` | Changed |
| `test:` | Added (tests) |
| Breaking (`!` or `BREAKING CHANGE:`) | Breaking Changes |

## Building Desktop Apps

```bash
bun run electron:build
```

Output goes to `dist-electron/`:
- Linux: `.AppImage`, `.deb`
- macOS: `.dmg`, `.zip`
- Windows: `.exe` (installer), portable `.exe`

## Checklist Before Release

- [ ] All tests pass: `bun run test && bun run test:e2e`
- [ ] Build succeeds: `bun run build`
- [ ] Desktop build works: `bun run electron:build`
- [ ] Changelog is updated
- [ ] Version bump makes sense (patch/minor/major)

## Hotfix Process

For urgent fixes to a released version:

```bash
git checkout -b hotfix/v1.0.1 v1.0.0   # Branch from the release tag
# Make fixes
./scripts/release.sh patch
git push && git push --tags
```

Then merge back to main:
```bash
git checkout main
git merge hotfix/v1.0.1
```
