import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
});
