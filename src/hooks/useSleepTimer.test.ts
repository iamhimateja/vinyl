import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSleepTimer, SLEEP_TIMER_PRESETS } from './useSleepTimer';

describe('useSleepTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic functionality', () => {
    it('initializes with inactive state', () => {
      const onTimerEnd = vi.fn();
      const { result } = renderHook(() => useSleepTimer(onTimerEnd));

      expect(result.current.isActive).toBe(false);
      expect(result.current.remainingTime).toBe(0);
      expect(result.current.totalTime).toBe(0);
      expect(result.current.isFadingOut).toBe(false);
    });

    it('starts timer with specified duration', () => {
      const onTimerEnd = vi.fn();
      const { result } = renderHook(() => useSleepTimer(onTimerEnd));

      act(() => {
        result.current.startTimer(60);
      });

      expect(result.current.isActive).toBe(true);
      expect(result.current.remainingTime).toBe(60);
      expect(result.current.totalTime).toBe(60);
    });

    it('counts down every second', () => {
      const onTimerEnd = vi.fn();
      const { result } = renderHook(() => useSleepTimer(onTimerEnd));

      act(() => {
        result.current.startTimer(60);
      });

      expect(result.current.remainingTime).toBe(60);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.remainingTime).toBe(59);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.remainingTime).toBe(54);
    });

    it('calls onTimerEnd when timer reaches zero', () => {
      const onTimerEnd = vi.fn();
      const { result } = renderHook(() => useSleepTimer(onTimerEnd));

      act(() => {
        result.current.startTimer(3);
      });

      expect(onTimerEnd).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(onTimerEnd).toHaveBeenCalledTimes(1);
      expect(result.current.isActive).toBe(false);
      expect(result.current.remainingTime).toBe(0);
    });

    it('stops timer when stopTimer is called', () => {
      const onTimerEnd = vi.fn();
      const { result } = renderHook(() => useSleepTimer(onTimerEnd));

      act(() => {
        result.current.startTimer(60);
      });

      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.stopTimer();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.remainingTime).toBe(0);
      expect(result.current.totalTime).toBe(0);
    });

    it('adds time to existing timer', () => {
      const onTimerEnd = vi.fn();
      const { result } = renderHook(() => useSleepTimer(onTimerEnd));

      act(() => {
        result.current.startTimer(60);
      });

      expect(result.current.remainingTime).toBe(60);
      expect(result.current.totalTime).toBe(60);

      act(() => {
        result.current.addTime(30);
      });

      expect(result.current.remainingTime).toBe(90);
      expect(result.current.totalTime).toBe(90);
    });

    it('formats remaining time correctly', () => {
      const onTimerEnd = vi.fn();
      const { result } = renderHook(() => useSleepTimer(onTimerEnd));

      // Test minutes:seconds format
      act(() => {
        result.current.startTimer(125); // 2:05
      });

      expect(result.current.formatRemainingTime()).toBe('2:05');

      // Test hours:minutes:seconds format
      act(() => {
        result.current.startTimer(3725); // 1:02:05
      });

      expect(result.current.formatRemainingTime()).toBe('1:02:05');

      // Test zero padding
      act(() => {
        result.current.startTimer(65); // 1:05
      });

      expect(result.current.formatRemainingTime()).toBe('1:05');
    });

    it('calculates progress correctly', () => {
      const onTimerEnd = vi.fn();
      const { result } = renderHook(() => useSleepTimer(onTimerEnd));

      act(() => {
        result.current.startTimer(100);
      });

      expect(result.current.getProgress()).toBe(0);

      act(() => {
        vi.advanceTimersByTime(50000); // 50 seconds
      });

      expect(result.current.getProgress()).toBe(50);
    });

    it('returns 0 progress when totalTime is 0', () => {
      const onTimerEnd = vi.fn();
      const { result } = renderHook(() => useSleepTimer(onTimerEnd));

      expect(result.current.getProgress()).toBe(0);
    });
  });

  describe('fade-out functionality', () => {
    it('starts fading when remaining time equals fade duration', () => {
      const onTimerEnd = vi.fn();
      const onVolumeChange = vi.fn();
      const getCurrentVolume = vi.fn(() => 0.8);
      
      const { result } = renderHook(() => useSleepTimer({
        onTimerEnd,
        onVolumeChange,
        getCurrentVolume,
        fadeOutDuration: 10, // 10 second fade
      }));

      act(() => {
        result.current.startTimer(15); // 15 seconds total
      });

      // Advance until fade zone (10 seconds remaining)
      act(() => {
        vi.advanceTimersByTime(5000); // 10 seconds remaining
      });

      expect(result.current.isFadingOut).toBe(true);
      expect(onVolumeChange).toHaveBeenCalled();
    });

    it('gradually decreases volume during fade-out', () => {
      const onTimerEnd = vi.fn();
      const onVolumeChange = vi.fn();
      const getCurrentVolume = vi.fn(() => 1.0);
      
      const { result } = renderHook(() => useSleepTimer({
        onTimerEnd,
        onVolumeChange,
        getCurrentVolume,
        fadeOutDuration: 10,
      }));

      act(() => {
        result.current.startTimer(12);
      });

      // Advance into fade zone
      act(() => {
        vi.advanceTimersByTime(2000); // 10 seconds remaining, start of fade
      });

      // Volume should be at ~100% (10/10)
      expect(onVolumeChange).toHaveBeenLastCalledWith(expect.closeTo(1.0, 0.1));

      act(() => {
        vi.advanceTimersByTime(5000); // 5 seconds remaining
      });

      // Volume should be at ~50% (5/10)
      expect(onVolumeChange).toHaveBeenLastCalledWith(expect.closeTo(0.5, 0.1));

      act(() => {
        vi.advanceTimersByTime(4000); // 1 second remaining
      });

      // Volume should be at ~10% (1/10)
      expect(onVolumeChange).toHaveBeenLastCalledWith(expect.closeTo(0.1, 0.1));
    });

    it('sets volume to 0 when timer ends', () => {
      const onTimerEnd = vi.fn();
      const onVolumeChange = vi.fn();
      const getCurrentVolume = vi.fn(() => 0.8);
      
      const { result } = renderHook(() => useSleepTimer({
        onTimerEnd,
        onVolumeChange,
        getCurrentVolume,
        fadeOutDuration: 5,
      }));

      act(() => {
        result.current.startTimer(5);
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(onTimerEnd).toHaveBeenCalled();
      // Last call should be volume 0
      expect(onVolumeChange).toHaveBeenLastCalledWith(0);
    });

    it('restores original volume when timer is stopped during fade', () => {
      const onTimerEnd = vi.fn();
      const onVolumeChange = vi.fn();
      const getCurrentVolume = vi.fn(() => 0.8);
      
      const { result } = renderHook(() => useSleepTimer({
        onTimerEnd,
        onVolumeChange,
        getCurrentVolume,
        fadeOutDuration: 10,
      }));

      act(() => {
        result.current.startTimer(12);
      });

      // Advance into fade zone
      act(() => {
        vi.advanceTimersByTime(5000); // 7 seconds remaining, in fade
      });

      expect(result.current.isFadingOut).toBe(true);

      // Stop timer
      act(() => {
        result.current.stopTimer();
      });

      // Should restore original volume
      expect(onVolumeChange).toHaveBeenLastCalledWith(0.8);
      expect(result.current.isFadingOut).toBe(false);
    });

    it('restores volume when adding time takes us out of fade zone', () => {
      const onTimerEnd = vi.fn();
      const onVolumeChange = vi.fn();
      const getCurrentVolume = vi.fn(() => 0.7);
      
      const { result } = renderHook(() => useSleepTimer({
        onTimerEnd,
        onVolumeChange,
        getCurrentVolume,
        fadeOutDuration: 10,
      }));

      act(() => {
        result.current.startTimer(12);
      });

      // Advance into fade zone
      act(() => {
        vi.advanceTimersByTime(5000); // 7 seconds remaining
      });

      expect(result.current.isFadingOut).toBe(true);

      // Add time to exit fade zone
      act(() => {
        result.current.addTime(30); // 37 seconds remaining
      });

      // Should restore original volume
      expect(onVolumeChange).toHaveBeenLastCalledWith(0.7);
      expect(result.current.isFadingOut).toBe(false);
    });

    it('works without fade-out when onVolumeChange is not provided', () => {
      const onTimerEnd = vi.fn();
      
      const { result } = renderHook(() => useSleepTimer(onTimerEnd));

      act(() => {
        result.current.startTimer(5);
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(onTimerEnd).toHaveBeenCalledTimes(1);
      expect(result.current.isFadingOut).toBe(false);
    });

    it('uses default fade duration of 30 seconds when not specified', () => {
      const onTimerEnd = vi.fn();
      const onVolumeChange = vi.fn();
      const getCurrentVolume = vi.fn(() => 1.0);
      
      const { result } = renderHook(() => useSleepTimer({
        onTimerEnd,
        onVolumeChange,
        getCurrentVolume,
        // fadeOutDuration not specified, should default to 30
      }));

      act(() => {
        result.current.startTimer(60);
      });

      // Advance to 31 seconds remaining - not yet fading
      act(() => {
        vi.advanceTimersByTime(29000);
      });

      expect(result.current.isFadingOut).toBe(false);

      // Advance to 30 seconds remaining - should start fading
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isFadingOut).toBe(true);
    });
  });

  describe('SLEEP_TIMER_PRESETS', () => {
    it('has correct preset values', () => {
      expect(SLEEP_TIMER_PRESETS).toHaveLength(6);
      
      expect(SLEEP_TIMER_PRESETS[0]).toEqual({ label: '15 min', value: 15 * 60 });
      expect(SLEEP_TIMER_PRESETS[1]).toEqual({ label: '30 min', value: 30 * 60 });
      expect(SLEEP_TIMER_PRESETS[2]).toEqual({ label: '45 min', value: 45 * 60 });
      expect(SLEEP_TIMER_PRESETS[3]).toEqual({ label: '1 hour', value: 60 * 60 });
      expect(SLEEP_TIMER_PRESETS[4]).toEqual({ label: '1.5 hours', value: 90 * 60 });
      expect(SLEEP_TIMER_PRESETS[5]).toEqual({ label: '2 hours', value: 120 * 60 });
    });
  });

  describe('callback updates', () => {
    it('updates callback ref when onTimerEnd changes', () => {
      const onTimerEnd1 = vi.fn();
      const onTimerEnd2 = vi.fn();
      
      const { result, rerender } = renderHook(
        ({ callback }) => useSleepTimer(callback),
        { initialProps: { callback: onTimerEnd1 } }
      );

      act(() => {
        result.current.startTimer(2);
      });

      // Change callback
      rerender({ callback: onTimerEnd2 });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(onTimerEnd1).not.toHaveBeenCalled();
      expect(onTimerEnd2).toHaveBeenCalledTimes(1);
    });
  });
});
