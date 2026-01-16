import { describe, it, expect } from 'vitest';
import type {
  Song,
  Playlist,
  PlayerState,
  PlaybackState,
  Theme,
  RepeatMode,
  QueueBehavior,
  AppSettings,
} from './index';

describe('Types', () => {
  describe('Song', () => {
    it('has correct structure', () => {
      const song: Song = {
        id: 'test-id',
        title: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        duration: 180,
        sourceType: 'local',
        addedAt: Date.now(),
      };

      expect(song.id).toBe('test-id');
      expect(song.title).toBe('Test Song');
      expect(song.sourceType).toBe('local');
    });

    it('allows optional fields', () => {
      const song: Song = {
        id: 'test-id',
        title: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        duration: 180,
        sourceType: 'local',
        addedAt: Date.now(),
        coverArt: 'data:image/png;base64,...',
        fileName: 'test.mp3',
        fileSize: 1024,
        filePath: '/path/to/file.mp3',
      };

      expect(song.coverArt).toBeDefined();
      expect(song.fileName).toBe('test.mp3');
    });
  });

  describe('Playlist', () => {
    it('has correct structure', () => {
      const playlist: Playlist = {
        id: 'playlist-1',
        name: 'My Playlist',
        songIds: ['song-1', 'song-2'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(playlist.id).toBe('playlist-1');
      expect(playlist.songIds).toHaveLength(2);
    });
  });

  describe('PlayerState', () => {
    it('has correct structure', () => {
      const state: PlayerState = {
        currentSongId: 'song-1',
        position: 30,
        volume: 0.8,
        repeat: 'none',
        shuffle: false,
        isPlaying: true,
        queue: ['song-1', 'song-2'],
        queueIndex: 0,
        speed: 1,
        currentPlaylistId: null,
      };

      expect(state.volume).toBe(0.8);
      expect(state.repeat).toBe('none');
    });

    it('allows all repeat modes', () => {
      const modes: RepeatMode[] = ['none', 'one', 'all'];
      
      modes.forEach((mode) => {
        const state: PlayerState = {
          currentSongId: null,
          position: 0,
          volume: 1,
          repeat: mode,
          shuffle: false,
          isPlaying: false,
          queue: [],
          queueIndex: 0,
          speed: 1,
          currentPlaylistId: null,
        };
        expect(state.repeat).toBe(mode);
      });
    });
  });

  describe('PlaybackState', () => {
    it('has all valid states', () => {
      const states: PlaybackState[] = [
        'idle',
        'playing',
        'paused',
        'buffering',
        'ended',
      ];
      
      expect(states).toHaveLength(5);
    });
  });

  describe('Theme', () => {
    it('has all valid themes', () => {
      const themes: Theme[] = ['light', 'dark'];
      expect(themes).toHaveLength(2);
    });
  });

  describe('QueueBehavior', () => {
    it('has all valid behaviors', () => {
      const behaviors: QueueBehavior[] = ['replace', 'append', 'ask'];
      expect(behaviors).toHaveLength(3);
    });
  });

  describe('AppSettings', () => {
    it('has correct default structure', () => {
      const settings: AppSettings = {
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
      };

      expect(settings.theme).toBe('dark');
      expect(settings.appIcon).toBe('disc');
    });

    it('allows all app icon options', () => {
      const icons: AppSettings['appIcon'][] = [
        'disc',
        'music',
        'headphones',
        'vinyl',
      ];
      expect(icons).toHaveLength(4);
    });

    it('allows all visualizer styles', () => {
      const styles: AppSettings['visualizerStyle'][] = [
        'bars',
        'wave',
        'areaWave',
      ];
      expect(styles).toHaveLength(3);
    });

    it('allows all display modes', () => {
      const modes: AppSettings['displayMode'][] = ['vinyl', 'albumArt'];
      expect(modes).toHaveLength(2);
    });
  });
});
