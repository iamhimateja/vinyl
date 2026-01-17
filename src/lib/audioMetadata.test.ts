import { describe, it, expect } from 'vitest';
import { 
  isAudioFile, 
  formatDuration, 
  formatFileSize,
  generateId,
  SUPPORTED_AUDIO_TYPES,
  SUPPORTED_AUDIO_EXTENSIONS 
} from './audioMetadata';

describe('audioMetadata', () => {
  describe('isAudioFile', () => {
    describe('by extension', () => {
      it.each([
        ['song.mp3', true, 'MP3'],
        ['song.MP3', true, 'MP3 uppercase'],
        ['song.wav', true, 'WAV'],
        ['song.WAV', true, 'WAV uppercase'],
        ['song.ogg', true, 'OGG'],
        ['song.flac', true, 'FLAC'],
        ['song.aac', true, 'AAC'],
        ['song.m4a', true, 'M4A'],
        ['song.M4A', true, 'M4A uppercase'],
        ['song.webm', true, 'WebM'],
        ['song.opus', true, 'Opus'],
        ['song.OPUS', true, 'Opus uppercase'],
        ['song.aiff', true, 'AIFF'],
        ['song.aif', true, 'AIF (short AIFF)'],
        ['song.wma', true, 'WMA'],
        ['song.ape', true, 'APE (Monkey\'s Audio)'],
        ['document.pdf', false, 'PDF'],
        ['image.jpg', false, 'JPG'],
        ['video.mp4', false, 'MP4 video'],
        ['document.txt', false, 'TXT'],
        ['archive.zip', false, 'ZIP'],
      ])('detects %s as audio: %s (%s)', (filename, expected) => {
        const file = new File(['content'], filename, { type: '' });
        expect(isAudioFile(file)).toBe(expected);
      });
    });

    describe('by MIME type', () => {
      it.each([
        ['audio/mpeg', 'song.unknown', true, 'MP3 MIME'],
        ['audio/mp3', 'song.unknown', true, 'MP3 alternate MIME'],
        ['audio/wav', 'song.unknown', true, 'WAV MIME'],
        ['audio/wave', 'song.unknown', true, 'WAV alternate MIME'],
        ['audio/x-wav', 'song.unknown', true, 'WAV x-type MIME'],
        ['audio/ogg', 'song.unknown', true, 'OGG MIME'],
        ['audio/vorbis', 'song.unknown', true, 'Vorbis MIME'],
        ['audio/flac', 'song.unknown', true, 'FLAC MIME'],
        ['audio/x-flac', 'song.unknown', true, 'FLAC x-type MIME'],
        ['audio/aac', 'song.unknown', true, 'AAC MIME'],
        ['audio/mp4', 'song.unknown', true, 'MP4 audio MIME (M4A)'],
        ['audio/x-m4a', 'song.unknown', true, 'M4A x-type MIME'],
        ['audio/m4a', 'song.unknown', true, 'M4A MIME'],
        ['audio/webm', 'song.unknown', true, 'WebM MIME'],
        ['audio/opus', 'song.unknown', true, 'Opus MIME'],
        ['audio/aiff', 'song.unknown', true, 'AIFF MIME'],
        ['audio/x-aiff', 'song.unknown', true, 'AIFF x-type MIME'],
        ['audio/x-ms-wma', 'song.unknown', true, 'WMA MIME'],
        ['audio/ape', 'song.unknown', true, 'APE MIME'],
        ['audio/x-ape', 'song.unknown', true, 'APE x-type MIME'],
        ['video/mp4', 'video.mp4', false, 'Video MP4 MIME'],
        ['application/pdf', 'doc.pdf', false, 'PDF MIME'],
        ['text/plain', 'file.txt', false, 'Text MIME'],
      ])('detects MIME %s with file %s as audio: %s (%s)', (mimeType, filename, expected) => {
        const file = new File(['content'], filename, { type: mimeType });
        expect(isAudioFile(file)).toBe(expected);
      });
    });

    describe('edge cases', () => {
      it('handles files with no extension', () => {
        const file = new File(['content'], 'noextension', { type: '' });
        expect(isAudioFile(file)).toBe(false);
      });

      it('handles files with multiple dots', () => {
        const file = new File(['content'], 'my.song.file.mp3', { type: '' });
        expect(isAudioFile(file)).toBe(true);
      });

      it('prioritizes MIME type over extension', () => {
        // File with audio MIME but wrong extension should still be detected
        const file = new File(['content'], 'song.xyz', { type: 'audio/mpeg' });
        expect(isAudioFile(file)).toBe(true);
      });

      it('falls back to extension when MIME is empty', () => {
        const file = new File(['content'], 'song.m4a', { type: '' });
        expect(isAudioFile(file)).toBe(true);
      });

      it('falls back to extension when MIME is generic', () => {
        const file = new File(['content'], 'song.flac', { type: 'application/octet-stream' });
        expect(isAudioFile(file)).toBe(true);
      });

      it('handles case-insensitive MIME types', () => {
        const file = new File(['content'], 'song.unknown', { type: 'AUDIO/MPEG' });
        // Note: browsers typically lowercase MIME types, but we handle it
        expect(isAudioFile(file)).toBe(true);
      });
    });
  });

  describe('SUPPORTED_AUDIO_EXTENSIONS', () => {
    it('includes all documented formats', () => {
      const expectedFormats = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.webm', '.opus', '.aiff', '.aif', '.wma', '.ape'];
      expectedFormats.forEach(ext => {
        expect(SUPPORTED_AUDIO_EXTENSIONS).toContain(ext);
      });
    });

    it('has correct number of extensions', () => {
      expect(SUPPORTED_AUDIO_EXTENSIONS.length).toBe(12);
    });
  });

  describe('SUPPORTED_AUDIO_TYPES', () => {
    it('includes MP3 MIME types', () => {
      expect(SUPPORTED_AUDIO_TYPES).toContain('audio/mpeg');
      expect(SUPPORTED_AUDIO_TYPES).toContain('audio/mp3');
    });

    it('includes M4A/AAC MIME types', () => {
      expect(SUPPORTED_AUDIO_TYPES).toContain('audio/aac');
      expect(SUPPORTED_AUDIO_TYPES).toContain('audio/mp4');
      expect(SUPPORTED_AUDIO_TYPES).toContain('audio/x-m4a');
      expect(SUPPORTED_AUDIO_TYPES).toContain('audio/m4a');
    });

    it('includes lossless format MIME types', () => {
      expect(SUPPORTED_AUDIO_TYPES).toContain('audio/flac');
      expect(SUPPORTED_AUDIO_TYPES).toContain('audio/wav');
      expect(SUPPORTED_AUDIO_TYPES).toContain('audio/aiff');
    });

    it('includes modern format MIME types', () => {
      expect(SUPPORTED_AUDIO_TYPES).toContain('audio/opus');
      expect(SUPPORTED_AUDIO_TYPES).toContain('audio/webm');
    });
  });

  describe('formatDuration', () => {
    it.each([
      [0, '0:00'],
      [30, '0:30'],
      [60, '1:00'],
      [90, '1:30'],
      [125, '2:05'],
      [3600, '60:00'],
      [3661, '61:01'],
    ])('formats %s seconds as %s', (seconds, expected) => {
      expect(formatDuration(seconds)).toBe(expected);
    });

    it('handles undefined/null', () => {
      expect(formatDuration(undefined as unknown as number)).toBe('0:00');
      expect(formatDuration(null as unknown as number)).toBe('0:00');
    });

    it('handles NaN', () => {
      expect(formatDuration(NaN)).toBe('0:00');
    });

    it('handles Infinity', () => {
      expect(formatDuration(Infinity)).toBe('0:00');
    });

    it('handles negative numbers gracefully', () => {
      // Edge case - negative numbers produce unusual output but don't crash
      const result = formatDuration(-10);
      expect(typeof result).toBe('string');
    });
  });

  describe('formatFileSize', () => {
    it.each([
      [0, '0 Bytes'],
      [500, '500 Bytes'],
      [1024, '1 KB'],
      [1536, '1.5 KB'],
      [1048576, '1 MB'],
      [1572864, '1.5 MB'],
      [1073741824, '1 GB'],
    ])('formats %s bytes as %s', (bytes, expected) => {
      expect(formatFileSize(bytes)).toBe(expected);
    });
  });

  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('generates IDs with timestamp prefix', () => {
      const id = generateId();
      const parts = id.split('-');
      expect(parts.length).toBe(2);
      expect(Number(parts[0])).toBeGreaterThan(0);
    });

    it('generates IDs with alphanumeric suffix', () => {
      const id = generateId();
      const parts = id.split('-');
      expect(parts[1]).toMatch(/^[a-z0-9]+$/);
    });
  });
});
