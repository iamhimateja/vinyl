import { useState, useEffect, useCallback, useRef } from "react";

export interface SleepTimerState {
  isActive: boolean;
  remainingTime: number; // in seconds
  totalTime: number; // in seconds
}

export const SLEEP_TIMER_PRESETS = [
  { label: "15 min", value: 15 * 60 },
  { label: "30 min", value: 30 * 60 },
  { label: "45 min", value: 45 * 60 },
  { label: "1 hour", value: 60 * 60 },
  { label: "1.5 hours", value: 90 * 60 },
  { label: "2 hours", value: 120 * 60 },
];

export function useSleepTimer(onTimerEnd: () => void) {
  const [state, setState] = useState<SleepTimerState>({
    isActive: false,
    remainingTime: 0,
    totalTime: 0,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimerEndRef = useRef(onTimerEnd);

  // Keep callback ref updated
  useEffect(() => {
    onTimerEndRef.current = onTimerEnd;
  }, [onTimerEnd]);

  // Timer countdown logic
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

        if (newRemaining <= 0) {
          // Timer ended
          onTimerEndRef.current();
          return {
            isActive: false,
            remainingTime: 0,
            totalTime: 0,
          };
        }

        return {
          ...prev,
          remainingTime: newRemaining,
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
    setState({
      isActive: true,
      remainingTime: durationSeconds,
      totalTime: durationSeconds,
    });
  }, []);

  // Stop/cancel timer
  const stopTimer = useCallback(() => {
    setState({
      isActive: false,
      remainingTime: 0,
      totalTime: 0,
    });
  }, []);

  // Add time to existing timer
  const addTime = useCallback((seconds: number) => {
    setState((prev) => ({
      ...prev,
      remainingTime: prev.remainingTime + seconds,
      totalTime: prev.totalTime + seconds,
    }));
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
