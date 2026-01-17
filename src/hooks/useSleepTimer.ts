import { useState, useEffect, useCallback, useRef } from "react";

export interface SleepTimerState {
  isActive: boolean;
  remainingTime: number; // in seconds
  totalTime: number; // in seconds
  isFadingOut: boolean;
}

export interface SleepTimerOptions {
  onTimerEnd: () => void;
  onVolumeChange?: (volume: number) => void;
  getCurrentVolume?: () => number;
  fadeOutDuration?: number; // in seconds, default 30
}

export const SLEEP_TIMER_PRESETS = [
  { label: "15 min", value: 15 * 60 },
  { label: "30 min", value: 30 * 60 },
  { label: "45 min", value: 45 * 60 },
  { label: "1 hour", value: 60 * 60 },
  { label: "1.5 hours", value: 90 * 60 },
  { label: "2 hours", value: 120 * 60 },
];

// Default fade-out duration in seconds
const DEFAULT_FADE_DURATION = 30;

export function useSleepTimer(
  onTimerEndOrOptions: (() => void) | SleepTimerOptions
) {
  // Parse options - support both old API (just callback) and new API (options object)
  const options: SleepTimerOptions = typeof onTimerEndOrOptions === 'function'
    ? { onTimerEnd: onTimerEndOrOptions }
    : onTimerEndOrOptions;

  const {
    onTimerEnd,
    onVolumeChange,
    getCurrentVolume,
    fadeOutDuration = DEFAULT_FADE_DURATION,
  } = options;

  const [state, setState] = useState<SleepTimerState>({
    isActive: false,
    remainingTime: 0,
    totalTime: 0,
    isFadingOut: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimerEndRef = useRef(onTimerEnd);
  const onVolumeChangeRef = useRef(onVolumeChange);
  const getCurrentVolumeRef = useRef(getCurrentVolume);
  const originalVolumeRef = useRef<number | null>(null);
  const fadeOutDurationRef = useRef(fadeOutDuration);

  // Keep callback refs updated
  useEffect(() => {
    onTimerEndRef.current = onTimerEnd;
  }, [onTimerEnd]);

  useEffect(() => {
    onVolumeChangeRef.current = onVolumeChange;
  }, [onVolumeChange]);

  useEffect(() => {
    getCurrentVolumeRef.current = getCurrentVolume;
  }, [getCurrentVolume]);

  useEffect(() => {
    fadeOutDurationRef.current = fadeOutDuration;
  }, [fadeOutDuration]);

  // Timer countdown logic with fade-out support
  useEffect(() => {
    if (!state.isActive || state.remainingTime <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        const newRemaining = prev.remainingTime - 1;
        const fadeDuration = fadeOutDurationRef.current;
        const shouldFade = onVolumeChangeRef.current !== undefined;

        // Check if we should start fading
        const isFadingOut = shouldFade && newRemaining <= fadeDuration && newRemaining > 0;

        // Handle fade-out volume adjustment
        if (isFadingOut && onVolumeChangeRef.current) {
          // Store original volume when fade starts
          if (!prev.isFadingOut && getCurrentVolumeRef.current) {
            originalVolumeRef.current = getCurrentVolumeRef.current();
          }

          // Calculate faded volume (linear fade)
          const originalVolume = originalVolumeRef.current ?? 1;
          const fadeProgress = newRemaining / fadeDuration; // 1 -> 0
          const fadedVolume = originalVolume * fadeProgress;
          onVolumeChangeRef.current(Math.max(0, fadedVolume));
        }

        if (newRemaining <= 0) {
          // Timer ended - set volume to 0 and stop
          if (onVolumeChangeRef.current) {
            onVolumeChangeRef.current(0);
          }
          onTimerEndRef.current();
          originalVolumeRef.current = null;
          return {
            isActive: false,
            remainingTime: 0,
            totalTime: 0,
            isFadingOut: false,
          };
        }

        return {
          ...prev,
          remainingTime: newRemaining,
          isFadingOut,
        };
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isActive, state.remainingTime]);

  // Start timer
  const startTimer = useCallback((durationSeconds: number) => {
    // Store original volume when starting timer
    if (getCurrentVolumeRef.current) {
      originalVolumeRef.current = getCurrentVolumeRef.current();
    }
    
    setState({
      isActive: true,
      remainingTime: durationSeconds,
      totalTime: durationSeconds,
      isFadingOut: false,
    });
  }, []);

  // Stop/cancel timer and restore volume
  const stopTimer = useCallback(() => {
    // Restore original volume if we were fading
    if (originalVolumeRef.current !== null && onVolumeChangeRef.current) {
      onVolumeChangeRef.current(originalVolumeRef.current);
    }
    originalVolumeRef.current = null;
    
    setState({
      isActive: false,
      remainingTime: 0,
      totalTime: 0,
      isFadingOut: false,
    });
  }, []);

  // Add time to existing timer
  const addTime = useCallback((seconds: number) => {
    setState((prev) => {
      const newRemaining = prev.remainingTime + seconds;
      const fadeDuration = fadeOutDurationRef.current;
      
      // If adding time takes us out of the fade zone, restore volume
      if (prev.isFadingOut && newRemaining > fadeDuration && originalVolumeRef.current !== null && onVolumeChangeRef.current) {
        onVolumeChangeRef.current(originalVolumeRef.current);
      }
      
      return {
        ...prev,
        remainingTime: newRemaining,
        totalTime: prev.totalTime + seconds,
        isFadingOut: newRemaining <= fadeDuration,
      };
    });
  }, []);

  // Format remaining time for display
  const formatRemainingTime = useCallback(() => {
    const hours = Math.floor(state.remainingTime / 3600);
    const minutes = Math.floor((state.remainingTime % 3600) / 60);
    const seconds = state.remainingTime % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [state.remainingTime]);

  // Get progress percentage
  const getProgress = useCallback(() => {
    if (state.totalTime === 0) return 0;
    return ((state.totalTime - state.remainingTime) / state.totalTime) * 100;
  }, [state.remainingTime, state.totalTime]);

  return {
    ...state,
    startTimer,
    stopTimer,
    addTime,
    formatRemainingTime,
    getProgress,
  };
}
