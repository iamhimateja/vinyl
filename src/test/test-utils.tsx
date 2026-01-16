import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import type { Song, Playlist, PlayerState, AppSettings } from '../types';

/**
 * Custom render function that wraps components with necessary providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return <BrowserRouter>{children}</BrowserRouter>;
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override render with our custom render
export { customRender as render };

/**
 * Factory functions for creating test data
 */
export function createMockSong(overrides: Partial<Song> = {}): Song {
  return {
    id: `song-${Math.random().toString(36).substring(7)}`,
    title: 'Test Song',
    artist: 'Test Artist',
    album: 'Test Album',
    duration: 180,
    sourceType: 'local',
    addedAt: Date.now(),
    ...overrides,
  };
}

export function createMockPlaylist(overrides: Partial<Playlist> = {}): Playlist {
  return {
    id: `playlist-${Math.random().toString(36).substring(7)}`,
    name: 'Test Playlist',
    songIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

export function createMockPlayerState(
  overrides: Partial<PlayerState> = {}
): PlayerState {
  return {
    currentSongId: null,
    position: 0,
    volume: 0.7,
    repeat: 'none',
    shuffle: false,
    isPlaying: false,
    queue: [],
    queueIndex: 0,
    speed: 1,
    currentPlaylistId: null,
    ...overrides,
  };
}

export function createMockSettings(
  overrides: Partial<AppSettings> = {}
): AppSettings {
  return {
    theme: 'dark',
    accentColor: '#d4a574',
    showAlbumArt: true,
    appTitle: 'Vinyl',
    appIcon: 'disc',
    autoPlay: true,
    gaplessPlayback: false,
    crossfadeDuration: 0,
    defaultVolume: 0.7,
    rememberVolume: true,
    defaultShuffleMode: false,
    defaultRepeatMode: 'none',
    queueBehavior: 'replace',
    clearQueueOnNewPlaylist: true,
    eqEnabled: true,
    eqPreset: 'Flat',
    displayMode: 'vinyl',
    visualizerEnabled: false,
    visualizerStyle: 'bars',
    skipDeleteConfirmation: false,
    ...overrides,
  };
}

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 5000
): Promise<void> {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * Format duration in seconds to mm:ss format (for test assertions)
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
