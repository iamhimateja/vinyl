import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAudioPlayer } from './useAudioPlayer';
import type { Song } from '../types';

// Mock dependencies
vi.mock('../lib/db', () => ({
  savePlayerState: vi.fn(),
  getPlayerState: vi.fn().mockResolvedValue(null),
}));

vi.mock('./useSongs', () => ({
  getCachedFile: vi.fn(),
  setCachedFile: vi.fn(),
}));

vi.mock('../lib/platform', () => ({
  isDesktop: vi.fn().mockReturnValue(false),
  getAssetUrl: vi.fn(),
  fileExists: vi.fn().mockResolvedValue(false),
}));

vi.mock('../lib/audioMetadata', () => ({
  extractMetadata: vi.fn().mockResolvedValue({
    title: 'Quick Play Song',
    artist: 'Quick Play Artist',
    album: 'Quick Play Album',
    duration: 200,
    coverArt: undefined,
  }),
  isAudioFile: (file: File) => {
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a'];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    return audioExtensions.includes(ext);
  },
  generateId: () => `test-id-${Date.now()}`,
}));

// Create a mock Audio class
class MockAudio {
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  load = vi.fn();
  src = '';
  currentTime = 0;
  duration = 200;
  volume = 0.7;
  playbackRate = 1;
  readyState = 4;
  
  private eventListeners: Map<string, Set<() => void>> = new Map();
  
  addEventListener(event: string, handler: () => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);
    
    // Simulate canplay event firing immediately
    if (event === 'canplay') {
      setTimeout(() => handler(), 10);
    }
  }
  
  removeEventListener(event: string, handler: () => void) {
    this.eventListeners.get(event)?.delete(handler);
  }
}

// Store original Audio
const originalAudio = global.Audio;

describe('useAudioPlayer', () => {
  const mockSongs: Song[] = [
    {
      id: 'song-1',
      title: 'Test Song 1',
      artist: 'Test Artist',
      album: 'Test Album',
      duration: 180,
      sourceType: 'local',
      addedAt: Date.now(),
    },
    {
      id: 'song-2',
      title: 'Test Song 2',
      artist: 'Test Artist',
      album: 'Test Album',
      duration: 240,
      sourceType: 'local',
      addedAt: Date.now(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Audio constructor with a proper class
    global.Audio = MockAudio as unknown as typeof Audio;

    // Mock URL methods
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    global.Audio = originalAudio;
  });

  describe('initial state', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => useAudioPlayer(mockSongs));

      expect(result.current.currentSong).toBeUndefined();
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.playbackState).toBe('idle');
      expect(result.current.currentTime).toBe(0);
      expect(result.current.volume).toBe(0.7);
      expect(result.current.repeat).toBe('none');
      expect(result.current.shuffle).toBe(false);
    });

    it('exposes playFile function', () => {
      const { result } = renderHook(() => useAudioPlayer(mockSongs));
      expect(typeof result.current.playFile).toBe('function');
    });

    it('exposes playFiles function', () => {
      const { result } = renderHook(() => useAudioPlayer(mockSongs));
      expect(typeof result.current.playFiles).toBe('function');
    });
  });

  describe('playFile', () => {
    it('returns null for non-audio files', async () => {
      const { result } = renderHook(() => useAudioPlayer(mockSongs));
      const nonAudioFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });

      let playResult: Song | null = null;
      await act(async () => {
        playResult = await result.current.playFile(nonAudioFile);
      });

      expect(playResult).toBeNull();
    });

    it('creates a temporary song from audio file', async () => {
      const { result } = renderHook(() => useAudioPlayer(mockSongs));
      const audioFile = new File(['audio content'], 'test-song.mp3', { type: 'audio/mpeg' });

      let playResult: Song | null = null;
      await act(async () => {
        playResult = await result.current.playFile(audioFile);
      });

      expect(playResult).not.toBeNull();
      expect(playResult?.title).toBe('Quick Play Song');
      expect(playResult?.artist).toBe('Quick Play Artist');
      expect(playResult?.id).toMatch(/^quick-play-/);
    });

    it('sets the current song to the quick-play song', async () => {
      const { result } = renderHook(() => useAudioPlayer(mockSongs));
      const audioFile = new File(['audio content'], 'test-song.mp3', { type: 'audio/mpeg' });

      await act(async () => {
        await result.current.playFile(audioFile);
      });

      await waitFor(() => {
        expect(result.current.currentSong).not.toBeUndefined();
        expect(result.current.currentSong?.title).toBe('Quick Play Song');
      });
    });

    it('sets isPlaying to true after playing', async () => {
      const { result } = renderHook(() => useAudioPlayer(mockSongs));
      const audioFile = new File(['audio content'], 'test-song.mp3', { type: 'audio/mpeg' });

      await act(async () => {
        await result.current.playFile(audioFile);
      });

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
      });
    });

    it('creates blob URL for the file', async () => {
      const { result } = renderHook(() => useAudioPlayer(mockSongs));
      const audioFile = new File(['audio content'], 'test-song.mp3', { type: 'audio/mpeg' });

      await act(async () => {
        await result.current.playFile(audioFile);
      });

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(audioFile);
    });

    it('sets queue with only the quick-play song', async () => {
      const { result } = renderHook(() => useAudioPlayer(mockSongs));
      const audioFile = new File(['audio content'], 'test-song.mp3', { type: 'audio/mpeg' });

      await act(async () => {
        await result.current.playFile(audioFile);
      });

      await waitFor(() => {
        expect(result.current.queue).toHaveLength(1);
        expect(result.current.queue[0]).toMatch(/^quick-play-/);
      });
    });
  });

  describe('playFiles', () => {
    it('returns empty array for no audio files', async () => {
      const { result } = renderHook(() => useAudioPlayer(mockSongs));
      const nonAudioFiles = [
        new File(['content'], 'doc1.pdf', { type: 'application/pdf' }),
        new File(['content'], 'doc2.txt', { type: 'text/plain' }),
      ];

      let playResult: Song[] = [];
      await act(async () => {
        playResult = await result.current.playFiles(nonAudioFiles);
      });

      expect(playResult).toHaveLength(0);
    });

    it('creates temporary songs from multiple audio files', async () => {
      const { result } = renderHook(() => useAudioPlayer(mockSongs));
      const audioFiles = [
        new File(['audio 1'], 'song1.mp3', { type: 'audio/mpeg' }),
        new File(['audio 2'], 'song2.mp3', { type: 'audio/mpeg' }),
        new File(['audio 3'], 'song3.mp3', { type: 'audio/mpeg' }),
      ];

      let playResult: Song[] = [];
      await act(async () => {
        playResult = await result.current.playFiles(audioFiles);
      });

      expect(playResult).toHaveLength(3);
      playResult.forEach((song) => {
        expect(song.id).toMatch(/^quick-play-/);
      });
    });

    it('sets queue with all quick-play songs', async () => {
      const { result } = renderHook(() => useAudioPlayer(mockSongs));
      const audioFiles = [
        new File(['audio 1'], 'song1.mp3', { type: 'audio/mpeg' }),
        new File(['audio 2'], 'song2.mp3', { type: 'audio/mpeg' }),
      ];

      await act(async () => {
        await result.current.playFiles(audioFiles);
      });

      await waitFor(() => {
        expect(result.current.queue).toHaveLength(2);
      });
    });

    it('plays the first song in the list', async () => {
      const { result } = renderHook(() => useAudioPlayer(mockSongs));
      const audioFiles = [
        new File(['audio 1'], 'song1.mp3', { type: 'audio/mpeg' }),
        new File(['audio 2'], 'song2.mp3', { type: 'audio/mpeg' }),
      ];

      await act(async () => {
        await result.current.playFiles(audioFiles);
      });

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
        expect(result.current.queueSongs).toHaveLength(2);
      });
    });

    it('filters out non-audio files from mixed input', async () => {
      const { result } = renderHook(() => useAudioPlayer(mockSongs));
      const mixedFiles = [
        new File(['audio 1'], 'song1.mp3', { type: 'audio/mpeg' }),
        new File(['content'], 'doc.pdf', { type: 'application/pdf' }),
        new File(['audio 2'], 'song2.mp3', { type: 'audio/mpeg' }),
      ];

      let playResult: Song[] = [];
      await act(async () => {
        playResult = await result.current.playFiles(mixedFiles);
      });

      expect(playResult).toHaveLength(2);
    });

    it('sets currentPlaylistId to null for quick-play', async () => {
      const { result } = renderHook(() => useAudioPlayer(mockSongs));
      const audioFiles = [
        new File(['audio 1'], 'song1.mp3', { type: 'audio/mpeg' }),
      ];

      await act(async () => {
        await result.current.playFiles(audioFiles);
      });

      await waitFor(() => {
        expect(result.current.currentPlaylistId).toBeNull();
      });
    });
  });

  describe('queueSongs with quick-play', () => {
    it('includes quick-play songs in queueSongs', async () => {
      const { result } = renderHook(() => useAudioPlayer(mockSongs));
      const audioFile = new File(['audio content'], 'test-song.mp3', { type: 'audio/mpeg' });

      await act(async () => {
        await result.current.playFile(audioFile);
      });

      await waitFor(() => {
        expect(result.current.queueSongs).toHaveLength(1);
        expect(result.current.queueSongs[0].title).toBe('Quick Play Song');
      });
    });
  });
});
