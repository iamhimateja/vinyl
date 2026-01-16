# Contributing to Vinyl Music Player

Thank you for your interest in contributing to Vinyl Music Player! This document provides guidelines and information to help you get started.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Coding Guidelines](#coding-guidelines)
- [Testing](#testing)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Issue Guidelines](#issue-guidelines)
- [Community](#community)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

### Prerequisites

- **[Bun](https://bun.sh/)** - Fast all-in-one JavaScript runtime (required)
- **Git** for version control
- For desktop development: Electron is included in dependencies

### Installing Bun

```bash
# macOS, Linux, WSL
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# Verify installation
bun --version
```

### First-time Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/vinyl-music-player.git
   cd vinyl-music-player
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/iamhimateja/vinyl-music-player.git
   ```

4. **Install dependencies**:
   ```bash
   bun install
   ```

5. **Start development server**:
   ```bash
   bun run dev
   ```

## Development Setup

### Web Development

```bash
# Start Vite dev server (http://localhost:5173)
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Type checking
bun run typecheck

# Linting
bun run lint

# Run tests
bun run test
```

### Desktop (Electron) Development

```bash
# Start Electron in development mode
bun run electron:dev

# Build desktop app
bun run electron:build
```

### Running Tests

```bash
# Run unit tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage

# Run E2E tests
bun run test:e2e
```

## Project Structure

```
vinyl-music-player/
├── .github/              # GitHub Actions, templates
│   ├── workflows/        # CI/CD workflows
│   ├── ISSUE_TEMPLATE/   # Issue templates
│   └── PULL_REQUEST_TEMPLATE.md
├── electron/             # Electron main process
│   ├── main.cjs          # Main process entry
│   └── preload.cjs       # Preload script (context bridge)
├── public/               # Static assets
│   ├── fonts/            # Self-hosted fonts
│   └── icons/            # App icons
├── src/
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── types/            # TypeScript types
│   ├── __tests__/        # Unit tests
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── tests/                # E2E tests
├── package.json
├── vite.config.ts
└── vitest.config.ts
```

## Making Changes

### Branching Strategy

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Keep your branch updated**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

**Examples:**
```
feat(player): add crossfade support between tracks
fix(visualizer): correct frequency data processing
docs(readme): update installation instructions
test(hooks): add tests for useAudioPlayer
```

## Coding Guidelines

### TypeScript

- Use strict TypeScript with no implicit `any`
- Define interfaces for all component props
- Export types from `src/types/index.ts`
- Prefer `interface` over `type` for object shapes

```typescript
// Good
interface PlayerControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  disabled?: boolean;
}

// Avoid
type PlayerControlsProps = {
  isPlaying: boolean;
  onTogglePlay: () => void;
}
```

### React Components

- Use functional components with hooks
- Keep components focused and small
- Extract reusable logic into custom hooks
- Use `React.memo` for expensive pure components

```typescript
// Good
export function PlayerControls({ isPlaying, onTogglePlay }: PlayerControlsProps) {
  return (
    <button onClick={onTogglePlay}>
      {isPlaying ? <Pause /> : <Play />}
    </button>
  );
}

// Avoid class components
```

### Styling

- Use Tailwind CSS utility classes
- Follow the project's design system (colors, spacing)
- Use CSS variables for theming (defined in `index.css`)
- Keep responsive design in mind (mobile-first)

```tsx
// Good
<div className="flex items-center gap-4 p-4 bg-vinyl-surface rounded-lg">

// Avoid inline styles
<div style={{ display: 'flex', padding: '16px' }}>
```

### Hooks

- Prefix custom hooks with `use`
- Keep hooks focused on a single responsibility
- Return stable references with `useCallback`/`useMemo`
- Document complex hooks with JSDoc comments

### Accessibility

- Use semantic HTML elements
- Include ARIA attributes where needed
- Ensure keyboard navigation works
- Maintain sufficient color contrast

## Testing

### Unit Tests

- Test utility functions and hooks
- Use Vitest and React Testing Library
- Mock external dependencies

```typescript
// Example test
import { describe, it, expect } from 'vitest';
import { formatDuration } from '../lib/utils';

describe('formatDuration', () => {
  it('formats seconds to mm:ss', () => {
    expect(formatDuration(125)).toBe('2:05');
  });

  it('handles zero', () => {
    expect(formatDuration(0)).toBe('0:00');
  });
});
```

### Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerControls } from '../components/PlayerControls';

describe('PlayerControls', () => {
  it('renders play button when paused', () => {
    render(<PlayerControls isPlaying={false} onTogglePlay={() => {}} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### E2E Tests

- Located in `tests/` directory
- Use Playwright for browser automation
- Test critical user flows

## Submitting a Pull Request

1. **Ensure your code is ready**:
   - [ ] All tests pass (`bun run test`)
   - [ ] No TypeScript errors (`bun run typecheck`)
   - [ ] No linting errors (`bun run lint`)
   - [ ] Code is formatted

2. **Update documentation** if needed

3. **Create a Pull Request**:
   - Use the PR template
   - Reference related issues
   - Provide clear description of changes
   - Include screenshots for UI changes

4. **Respond to review feedback**:
   - Be open to suggestions
   - Make requested changes
   - Keep the conversation constructive

## Issue Guidelines

### Bug Reports

When reporting a bug, please include:
- Description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, browser, app version)
- Screenshots/videos if applicable

### Feature Requests

For feature requests, please include:
- Clear description of the feature
- Use case / motivation
- Potential implementation approach (optional)
- Mockups/wireframes if applicable

### Good First Issues

Look for issues labeled `good first issue` - these are suitable for newcomers to the project.

## Community

- **Discussions**: Use GitHub Discussions for questions and ideas
- **Issues**: For bugs and feature requests
- **Pull Requests**: For code contributions

### Getting Help

If you're stuck:
1. Check existing issues and discussions
2. Read the documentation
3. Ask in GitHub Discussions
4. Tag maintainers in your PR if needed

## Recognition

Contributors are recognized in:
- The README contributors section
- Release notes
- The project's GitHub contributors page

Thank you for contributing to Vinyl Music Player! 🎵
