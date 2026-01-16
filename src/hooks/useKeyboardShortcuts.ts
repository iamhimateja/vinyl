import { useEffect, useCallback } from "react";

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
  enabled?: boolean;
}

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
  enabled = true,
}: KeyboardShortcutsOptions) {
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
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}
