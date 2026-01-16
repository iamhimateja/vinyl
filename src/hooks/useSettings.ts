import { useState, useEffect, useCallback } from "react";
import type { AppSettings, Theme, RepeatMode, QueueBehavior } from "../types";

const SETTINGS_KEY = "vinyl-app-settings";

// Helper to adjust color brightness
function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
}

const defaultSettings: AppSettings = {
  // Appearance
  theme: "dark",
  accentColor: "#d4a574", // Default warm gold
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

  // Now Playing Display
  displayMode: "vinyl",

  // Background Visualizer
  visualizerEnabled: false,
  visualizerStyle: "bars",

  // Confirmations
  skipDeleteConfirmation: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Valid preset colors
  const validAccentColors = [
    "#d4a574",
    "#8B5CF6",
    "#06B6D4",
    "#10B981",
    "#F43F5E",
    "#F97316",
    "#3B82F6",
    "#EC4899",
  ];

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate accent color - fall back to default if invalid
        if (
          parsed.accentColor &&
          !validAccentColors.includes(parsed.accentColor)
        ) {
          parsed.accentColor = defaultSettings.accentColor;
        }
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

  // Apply accent color to CSS variables
  useEffect(() => {
    if (!isLoaded) return;

    const root = document.documentElement;
    const accent = settings.accentColor;

    // Set the main accent color
    root.style.setProperty("--vinyl-accent", accent);

    // Generate a lighter version for hover states
    const lighterAccent = adjustColorBrightness(accent, 20);
    root.style.setProperty("--vinyl-accent-light", lighterAccent);
  }, [settings.accentColor, isLoaded]);

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
