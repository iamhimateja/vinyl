import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings } from './useSettings';

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns default settings on initial load', () => {
    const { result } = renderHook(() => useSettings());
    
    // isLoaded becomes true after the first useEffect runs
    // Since we're using renderHook, effects run synchronously in the test
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.settings.theme).toBe('dark');
    expect(result.current.settings.accentColor).toBe('#d4a574');
    expect(result.current.settings.defaultVolume).toBe(0.7);
    expect(result.current.settings.autoPlay).toBe(true);
  });

  it('loads settings from localStorage', () => {
    const savedSettings = {
      theme: 'light',
      accentColor: '#8B5CF6',
      defaultVolume: 0.5,
    };
    localStorage.setItem('vinyl-app-settings', JSON.stringify(savedSettings));

    const { result } = renderHook(() => useSettings());
    
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.settings.theme).toBe('light');
    expect(result.current.settings.accentColor).toBe('#8B5CF6');
    expect(result.current.settings.defaultVolume).toBe(0.5);
  });

  it('falls back to default accent color if saved color is invalid', () => {
    const savedSettings = {
      accentColor: '#INVALID',
    };
    localStorage.setItem('vinyl-app-settings', JSON.stringify(savedSettings));

    const { result } = renderHook(() => useSettings());
    
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.settings.accentColor).toBe('#d4a574');
  });

  it('updateSetting updates a single setting', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSetting('theme', 'light');
    });

    expect(result.current.settings.theme).toBe('light');
  });

  it('updateSettings updates multiple settings', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({
        theme: 'light',
        defaultVolume: 0.3,
        autoPlay: false,
      });
    });

    expect(result.current.settings.theme).toBe('light');
    expect(result.current.settings.defaultVolume).toBe(0.3);
    expect(result.current.settings.autoPlay).toBe(false);
  });

  it('resetSettings restores defaults', () => {
    const { result } = renderHook(() => useSettings());

    // Change some settings
    act(() => {
      result.current.updateSettings({
        theme: 'light',
        defaultVolume: 0.3,
      });
    });

    expect(result.current.settings.theme).toBe('light');

    // Reset
    act(() => {
      result.current.resetSettings();
    });

    expect(result.current.settings.theme).toBe('dark');
    expect(result.current.settings.defaultVolume).toBe(0.7);
  });

  it('toggleTheme toggles between light and dark', () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.theme).toBe('dark');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.settings.theme).toBe('light');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.settings.theme).toBe('dark');
  });

  it('setTheme sets specific theme', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.settings.theme).toBe('light');
  });

  it('setDefaultVolume clamps value between 0 and 1', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.setDefaultVolume(1.5);
    });
    expect(result.current.settings.defaultVolume).toBe(1);

    act(() => {
      result.current.setDefaultVolume(-0.5);
    });
    expect(result.current.settings.defaultVolume).toBe(0);

    act(() => {
      result.current.setDefaultVolume(0.5);
    });
    expect(result.current.settings.defaultVolume).toBe(0.5);
  });

  it('saves settings to localStorage with debounce', async () => {
    vi.useFakeTimers();
    
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSetting('theme', 'light');
    });

    // Settings not saved immediately
    expect(localStorage.getItem('vinyl-app-settings')).toBeNull();

    // Fast-forward past debounce
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    const saved = JSON.parse(localStorage.getItem('vinyl-app-settings') || '{}');
    expect(saved.theme).toBe('light');
    
    vi.useRealTimers();
  });

  it('setDefaultRepeatMode updates repeat mode', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.setDefaultRepeatMode('all');
    });

    expect(result.current.settings.defaultRepeatMode).toBe('all');
  });

  it('setDefaultShuffleMode updates shuffle mode', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.setDefaultShuffleMode(true);
    });

    expect(result.current.settings.defaultShuffleMode).toBe(true);
  });

  it('setQueueBehavior updates queue behavior', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.setQueueBehavior('append');
    });

    expect(result.current.settings.queueBehavior).toBe('append');
  });
});
