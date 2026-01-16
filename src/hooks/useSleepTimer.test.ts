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

  it('initializes with inactive state', () => {
    const onTimerEnd = vi.fn();
    const { result } = renderHook(() => useSleepTimer(onTimerEnd));

    expect(result.current.isActive).toBe(false);
    expect(result.current.remainingTime).toBe(0);
    expect(result.current.totalTime).toBe(0);
  });

  it('starts timer with specified duration', () => {
    const onTimerEnd = vi.fn();
    const { result } = renderHook(() => useSleepTimer(onTimerEnd));

    act(() => {
      result.current.startTimer(60); // 60 seconds
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
      result.current.startTimer(3); // 3 seconds
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
