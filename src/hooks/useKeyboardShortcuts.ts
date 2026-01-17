import { useEffect, useCallback, useRef } from "react";

interface KeyboardShortcutsOptions {
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onSeekForward: () => void;
  onSeekBackward: () => void;
  onCycleVisualizer?: () => void;
  onToggleVisualizerOff?: () => void;
  onToggleMusicInfo?: () => void;
  onToggleEqualizer?: () => void;
  onToggleFavorite?: () => void;
  onToggleQueue?: () => void;
  enabled?: boolean;
}

// Time window for double-press detection (in ms)
const DOUBLE_PRESS_THRESHOLD = 300;

export function useKeyboardShortcuts({
  onPlayPause,
  onNext,
  onPrevious,
  onVolumeUp,
  onVolumeDown,
  onMute,
  onToggleShuffle,
  onToggleRepeat,
  onSeekForward,
  onSeekBackward,
  onCycleVisualizer,
  onToggleVisualizerOff,
  onToggleMusicInfo,
  onToggleEqualizer,
  onToggleFavorite,
  onToggleQueue,
  enabled = true,
}: KeyboardShortcutsOptions) {
  // Track last key press time for double-press detection
  const lastKeyPressRef = useRef<{ key: string; time: number } | null>(null);
  const doublePressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Check for modifier keys - don't interfere with browser shortcuts
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();
      const now = Date.now();

      // Check for double-press on specific keys
      if (key === "v" && onToggleVisualizerOff && onCycleVisualizer) {
        event.preventDefault();
        
        const lastPress = lastKeyPressRef.current;
        if (lastPress && lastPress.key === "v" && (now - lastPress.time) < DOUBLE_PRESS_THRESHOLD) {
          // Double press detected - turn off visualizer
          if (doublePressTimeoutRef.current) {
            clearTimeout(doublePressTimeoutRef.current);
            doublePressTimeoutRef.current = null;
          }
          lastKeyPressRef.current = null;
          onToggleVisualizerOff();
        } else {
          // First press - wait to see if it's a double press
          lastKeyPressRef.current = { key: "v", time: now };
          
          // Clear any existing timeout
          if (doublePressTimeoutRef.current) {
            clearTimeout(doublePressTimeoutRef.current);
          }
          
          // Set timeout to trigger single press action
          doublePressTimeoutRef.current = setTimeout(() => {
            if (lastKeyPressRef.current?.key === "v") {
              onCycleVisualizer();
              lastKeyPressRef.current = null;
            }
          }, DOUBLE_PRESS_THRESHOLD);
        }
        return;
      }

      // Reset double-press tracking for other keys
      lastKeyPressRef.current = null;
      if (doublePressTimeoutRef.current) {
        clearTimeout(doublePressTimeoutRef.current);
        doublePressTimeoutRef.current = null;
      }

      switch (event.key) {
        case " ": // Space - Play/Pause
          event.preventDefault();
          onPlayPause();
          break;

        case "ArrowRight": // Right arrow - Seek forward 5s
          event.preventDefault();
          onSeekForward();
          break;

        case "ArrowLeft": // Left arrow - Seek backward 5s
          event.preventDefault();
          onSeekBackward();
          break;

        case "ArrowUp": // Up arrow - Volume up
          event.preventDefault();
          onVolumeUp();
          break;

        case "ArrowDown": // Down arrow - Volume down
          event.preventDefault();
          onVolumeDown();
          break;

        case "m":
        case "M": // M - Mute/Unmute
          event.preventDefault();
          onMute();
          break;

        case "n":
        case "N": // N - Next track
          event.preventDefault();
          onNext();
          break;

        case "p":
        case "P": // P - Previous track
          event.preventDefault();
          onPrevious();
          break;

        case "s":
        case "S": // S - Toggle shuffle
          event.preventDefault();
          onToggleShuffle();
          break;

        case "r":
        case "R": // R - Toggle repeat mode
          event.preventDefault();
          onToggleRepeat();
          break;

        case "i":
        case "I": // I - Toggle music info
          if (onToggleMusicInfo) {
            event.preventDefault();
            onToggleMusicInfo();
          }
          break;

        case "e":
        case "E": // E - Toggle equalizer
          if (onToggleEqualizer) {
            event.preventDefault();
            onToggleEqualizer();
          }
          break;

        case "f":
        case "F": // F - Toggle favorite
          if (onToggleFavorite) {
            event.preventDefault();
            onToggleFavorite();
          }
          break;

        case "q":
        case "Q": // Q - Toggle queue view
          if (onToggleQueue) {
            event.preventDefault();
            onToggleQueue();
          }
          break;
      }
    },
    [
      onPlayPause,
      onNext,
      onPrevious,
      onVolumeUp,
      onVolumeDown,
      onMute,
      onToggleShuffle,
      onToggleRepeat,
      onSeekForward,
      onSeekBackward,
      onCycleVisualizer,
      onToggleVisualizerOff,
      onToggleMusicInfo,
      onToggleEqualizer,
      onToggleFavorite,
      onToggleQueue,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Clean up timeout on unmount
      if (doublePressTimeoutRef.current) {
        clearTimeout(doublePressTimeoutRef.current);
      }
    };
  }, [handleKeyDown, enabled]);
}
