import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  const mockHandlers = {
    onPlayPause: vi.fn(),
    onNext: vi.fn(),
    onPrevious: vi.fn(),
    onVolumeUp: vi.fn(),
    onVolumeDown: vi.fn(),
    onMute: vi.fn(),
    onToggleShuffle: vi.fn(),
    onToggleRepeat: vi.fn(),
    onSeekForward: vi.fn(),
    onSeekBackward: vi.fn(),
    onCycleVisualizer: vi.fn(),
    onToggleVisualizerOff: vi.fn(),
    onToggleMusicInfo: vi.fn(),
    onToggleEqualizer: vi.fn(),
    onToggleFavorite: vi.fn(),
    onToggleQueue: vi.fn(),
  };

  const createKeyboardEvent = (
    key: string,
    options: Partial<KeyboardEventInit> = {}
  ) => {
    return new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      ...options,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('triggers onPlayPause on Space key', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    
    document.dispatchEvent(createKeyboardEvent(' '));
    expect(mockHandlers.onPlayPause).toHaveBeenCalledTimes(1);
  });

  it('triggers onSeekForward on ArrowRight key', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    
    document.dispatchEvent(createKeyboardEvent('ArrowRight'));
    expect(mockHandlers.onSeekForward).toHaveBeenCalledTimes(1);
  });

  it('triggers onSeekBackward on ArrowLeft key', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    
    document.dispatchEvent(createKeyboardEvent('ArrowLeft'));
    expect(mockHandlers.onSeekBackward).toHaveBeenCalledTimes(1);
  });

  it('triggers onVolumeUp on ArrowUp key', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    
    document.dispatchEvent(createKeyboardEvent('ArrowUp'));
    expect(mockHandlers.onVolumeUp).toHaveBeenCalledTimes(1);
  });

  it('triggers onVolumeDown on ArrowDown key', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    
    document.dispatchEvent(createKeyboardEvent('ArrowDown'));
    expect(mockHandlers.onVolumeDown).toHaveBeenCalledTimes(1);
  });

  it('triggers onMute on M key (lowercase)', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    
    document.dispatchEvent(createKeyboardEvent('m'));
    expect(mockHandlers.onMute).toHaveBeenCalledTimes(1);
  });

  it('triggers onMute on M key (uppercase)', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    
    document.dispatchEvent(createKeyboardEvent('M'));
    expect(mockHandlers.onMute).toHaveBeenCalledTimes(1);
  });

  it('triggers onNext on N key', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    
    document.dispatchEvent(createKeyboardEvent('n'));
    expect(mockHandlers.onNext).toHaveBeenCalledTimes(1);
  });

  it('triggers onPrevious on P key', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    
    document.dispatchEvent(createKeyboardEvent('p'));
    expect(mockHandlers.onPrevious).toHaveBeenCalledTimes(1);
  });

  it('triggers onToggleShuffle on S key', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    
    document.dispatchEvent(createKeyboardEvent('s'));
    expect(mockHandlers.onToggleShuffle).toHaveBeenCalledTimes(1);
  });

  it('triggers onToggleRepeat on R key', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    
    document.dispatchEvent(createKeyboardEvent('r'));
    expect(mockHandlers.onToggleRepeat).toHaveBeenCalledTimes(1);
  });

  it('triggers onToggleMusicInfo on I key', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    
    document.dispatchEvent(createKeyboardEvent('i'));
    expect(mockHandlers.onToggleMusicInfo).toHaveBeenCalledTimes(1);
  });

  it('triggers onToggleEqualizer on E key', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    
    document.dispatchEvent(createKeyboardEvent('e'));
    expect(mockHandlers.onToggleEqualizer).toHaveBeenCalledTimes(1);
  });

  it('triggers onToggleFavorite on F key', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    
    document.dispatchEvent(createKeyboardEvent('f'));
    expect(mockHandlers.onToggleFavorite).toHaveBeenCalledTimes(1);
  });

  it('triggers onToggleQueue on Q key', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    
    document.dispatchEvent(createKeyboardEvent('q'));
    expect(mockHandlers.onToggleQueue).toHaveBeenCalledTimes(1);
  });

  describe('visualizer shortcuts', () => {
    it('triggers onCycleVisualizer on single V key press after timeout', () => {
      renderHook(() => useKeyboardShortcuts(mockHandlers));
      
      document.dispatchEvent(createKeyboardEvent('v'));
      
      // Should not trigger immediately
      expect(mockHandlers.onCycleVisualizer).not.toHaveBeenCalled();
      
      // Fast-forward past the double-press threshold
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      expect(mockHandlers.onCycleVisualizer).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onToggleVisualizerOff).not.toHaveBeenCalled();
    });

    it('triggers onToggleVisualizerOff on double V key press', () => {
      renderHook(() => useKeyboardShortcuts(mockHandlers));
      
      // First press
      document.dispatchEvent(createKeyboardEvent('v'));
      
      // Second press within threshold (before timeout)
      act(() => {
        vi.advanceTimersByTime(100);
      });
      document.dispatchEvent(createKeyboardEvent('v'));
      
      expect(mockHandlers.onToggleVisualizerOff).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onCycleVisualizer).not.toHaveBeenCalled();
    });

    it('does not trigger double-press if second press is too late', () => {
      renderHook(() => useKeyboardShortcuts(mockHandlers));
      
      // First press
      document.dispatchEvent(createKeyboardEvent('v'));
      
      // Wait past the threshold
      act(() => {
        vi.advanceTimersByTime(350);
      });
      
      // First press should have triggered cycle
      expect(mockHandlers.onCycleVisualizer).toHaveBeenCalledTimes(1);
      
      // Second press (too late for double-press)
      document.dispatchEvent(createKeyboardEvent('v'));
      
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      // Should trigger another cycle, not toggle off
      expect(mockHandlers.onCycleVisualizer).toHaveBeenCalledTimes(2);
      expect(mockHandlers.onToggleVisualizerOff).not.toHaveBeenCalled();
    });
  });

  it('does not trigger when enabled is false', () => {
    renderHook(() =>
      useKeyboardShortcuts({ ...mockHandlers, enabled: false })
    );
    
    document.dispatchEvent(createKeyboardEvent(' '));
    expect(mockHandlers.onPlayPause).not.toHaveBeenCalled();
  });

  it('does not trigger when typing in an input', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    
    const input = document.createElement('input');
    document.body.appendChild(input);
    
    const event = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: input });
    
    document.dispatchEvent(event);
    expect(mockHandlers.onPlayPause).not.toHaveBeenCalled();
    
    document.body.removeChild(input);
  });

  it('does not trigger when typing in a textarea', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    
    const event = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: textarea });
    
    document.dispatchEvent(event);
    expect(mockHandlers.onPlayPause).not.toHaveBeenCalled();
    
    document.body.removeChild(textarea);
  });

  it('does not trigger with Ctrl modifier', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    
    document.dispatchEvent(createKeyboardEvent(' ', { ctrlKey: true }));
    expect(mockHandlers.onPlayPause).not.toHaveBeenCalled();
  });

  it('does not trigger with Meta modifier', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    
    document.dispatchEvent(createKeyboardEvent(' ', { metaKey: true }));
    expect(mockHandlers.onPlayPause).not.toHaveBeenCalled();
  });

  it('does not trigger with Alt modifier', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    
    document.dispatchEvent(createKeyboardEvent(' ', { altKey: true }));
    expect(mockHandlers.onPlayPause).not.toHaveBeenCalled();
  });

  it('removes event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    
    const { unmount } = renderHook(() => useKeyboardShortcuts(mockHandlers));
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );
  });

  it('ignores unknown keys', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    
    document.dispatchEvent(createKeyboardEvent('x'));
    
    expect(mockHandlers.onPlayPause).not.toHaveBeenCalled();
    expect(mockHandlers.onNext).not.toHaveBeenCalled();
    expect(mockHandlers.onPrevious).not.toHaveBeenCalled();
  });

  it('does not trigger optional handlers if not provided', () => {
    const minimalHandlers = {
      onPlayPause: vi.fn(),
      onNext: vi.fn(),
      onPrevious: vi.fn(),
      onVolumeUp: vi.fn(),
      onVolumeDown: vi.fn(),
      onMute: vi.fn(),
      onToggleShuffle: vi.fn(),
      onToggleRepeat: vi.fn(),
      onSeekForward: vi.fn(),
      onSeekBackward: vi.fn(),
    };
    
    renderHook(() => useKeyboardShortcuts(minimalHandlers));
    
    // These should not throw when handlers are not provided
    document.dispatchEvent(createKeyboardEvent('i'));
    document.dispatchEvent(createKeyboardEvent('e'));
    document.dispatchEvent(createKeyboardEvent('f'));
    document.dispatchEvent(createKeyboardEvent('q'));
    
    // Basic handlers should still work
    document.dispatchEvent(createKeyboardEvent(' '));
    expect(minimalHandlers.onPlayPause).toHaveBeenCalledTimes(1);
  });
});
