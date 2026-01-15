import { useState, useEffect, useCallback } from "react";
import type { AppSettings, Theme, RepeatMode, QueueBehavior } from "../types";

const SETTINGS_KEY = "vinyl-app-settings";

const defaultSettings: AppSettings = {
  // Appearance
  theme: "dark",
  showAlbumArt: true,
  appTitle: "Vinyl",
  appIcon: "disc",

  // Playback
  autoPlay: true,
  gaplessPlayback: false,
  crossfadeDuration: 0,
  defaultVolume: 0.7,
  rememberVolume: true,
  defaultShuffleMode: false,
  defaultRepeatMode: "none",

  // Queue behavior
  queueBehavior: "replace",
  clearQueueOnNewPlaylist: true,

  // Equalizer
  eqEnabled: true,
  eqPreset: "Flat",
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle new settings
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save settings to localStorage whenever they change (debounced)
  useEffect(() => {
    if (!isLoaded) return;

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error("Failed to save settings:", error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [settings, isLoaded]);

  // Update a single setting
  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // Update multiple settings at once
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  // Reset all settings to defaults
  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  // Theme helpers
  const setTheme = useCallback(
    (theme: Theme) => {
      updateSetting("theme", theme);
    },
    [updateSetting],
  );

  const toggleTheme = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === "dark" ? "light" : "dark",
    }));
  }, []);

  // Volume helpers
  const setDefaultVolume = useCallback(
    (volume: number) => {
      updateSetting("defaultVolume", Math.max(0, Math.min(1, volume)));
    },
    [updateSetting],
  );

  // Playback helpers
  const setDefaultRepeatMode = useCallback(
    (mode: RepeatMode) => {
      updateSetting("defaultRepeatMode", mode);
    },
    [updateSetting],
  );

  const setDefaultShuffleMode = useCallback(
    (enabled: boolean) => {
      updateSetting("defaultShuffleMode", enabled);
    },
    [updateSetting],
  );

  const setQueueBehavior = useCallback(
    (behavior: QueueBehavior) => {
      updateSetting("queueBehavior", behavior);
    },
    [updateSetting],
  );

  return {
    settings,
    isLoaded,
    updateSetting,
    updateSettings,
    resetSettings,
    setTheme,
    toggleTheme,
    setDefaultVolume,
    setDefaultRepeatMode,
    setDefaultShuffleMode,
    setQueueBehavior,
  };
}

export type { AppSettings };
