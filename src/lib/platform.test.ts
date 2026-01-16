import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isElectron,
  isDesktop,
  getPlatformInfo,
  isFirstLaunch,
  completeSetup,
  resetSetup,
} from './platform';

describe('Platform utilities', () => {
  beforeEach(() => {
    // Reset window.electron before each test
    delete (window as { electron?: unknown }).electron;
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isElectron', () => {
    it('returns false when window.electron is not defined', () => {
      expect(isElectron()).toBe(false);
    });

    it('returns false when window.electron.isElectron is false', () => {
      (window as { electron?: { isElectron: boolean } }).electron = {
        isElectron: false,
      };
      expect(isElectron()).toBe(false);
    });

    it('returns true when window.electron.isElectron is true', () => {
      (window as { electron?: { isElectron: boolean } }).electron = {
        isElectron: true,
      };
      expect(isElectron()).toBe(true);
    });
  });

  describe('isDesktop', () => {
    it('returns false when not in Electron', () => {
      expect(isDesktop()).toBe(false);
    });

    it('returns true when in Electron', () => {
      (window as { electron?: { isElectron: boolean } }).electron = {
        isElectron: true,
      };
      expect(isDesktop()).toBe(true);
    });
  });

  describe('getPlatformInfo', () => {
    it('returns web platform when not in Electron', () => {
      const info = getPlatformInfo();
      expect(info.platform).toBe('web');
      expect(info.userAgent).toBe(navigator.userAgent);
    });

    it('returns electron platform when in Electron', () => {
      (window as { electron?: { isElectron: boolean } }).electron = {
        isElectron: true,
      };
      const info = getPlatformInfo();
      expect(info.platform).toBe('electron');
    });
  });

  describe('isFirstLaunch (web)', () => {
    it('returns true when localStorage does not have setup completed', async () => {
      const result = await isFirstLaunch();
      expect(result).toBe(true);
    });

    it('returns false when localStorage has setup completed', async () => {
      localStorage.setItem('vinyl-setup-completed', 'true');
      const result = await isFirstLaunch();
      expect(result).toBe(false);
    });
  });

  describe('completeSetup (web)', () => {
    it('sets localStorage item and returns true', async () => {
      const result = await completeSetup();
      expect(result).toBe(true);
      expect(localStorage.getItem('vinyl-setup-completed')).toBe('true');
    });
  });

  describe('resetSetup (web)', () => {
    it('removes localStorage item and returns true', async () => {
      localStorage.setItem('vinyl-setup-completed', 'true');
      const result = await resetSetup();
      expect(result).toBe(true);
      expect(localStorage.getItem('vinyl-setup-completed')).toBeNull();
    });
  });
});
