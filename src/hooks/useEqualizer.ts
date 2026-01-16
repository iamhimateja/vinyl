import { useState, useRef, useEffect, useCallback } from "react";
import {
  getSharedAudioContext,
  resumeAudioContext,
  type SharedAudioData,
} from "../lib/audioContext";

export interface EqualizerBand {
  frequency: number;
  gain: number;
  label: string;
}

export interface EqualizerPreset {
  name: string;
  gains: number[];
}

// Default frequency bands for a 10-band equalizer
const DEFAULT_BANDS: EqualizerBand[] = [
  { frequency: 32, gain: 0, label: "32" },
  { frequency: 64, gain: 0, label: "64" },
  { frequency: 125, gain: 0, label: "125" },
  { frequency: 250, gain: 0, label: "250" },
  { frequency: 500, gain: 0, label: "500" },
  { frequency: 1000, gain: 0, label: "1K" },
  { frequency: 2000, gain: 0, label: "2K" },
  { frequency: 4000, gain: 0, label: "4K" },
  { frequency: 8000, gain: 0, label: "8K" },
  { frequency: 16000, gain: 0, label: "16K" },
];

export const EQUALIZER_PRESETS: EqualizerPreset[] = [
  { name: "Flat", gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: "Bass Boost", gains: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0] },
  { name: "Treble Boost", gains: [0, 0, 0, 0, 0, 0, 2, 4, 5, 6] },
  { name: "Rock", gains: [5, 4, 2, 0, -1, 0, 2, 3, 4, 4] },
  { name: "Pop", gains: [-1, -1, 0, 2, 4, 4, 2, 0, -1, -1] },
  { name: "Jazz", gains: [3, 2, 1, 2, -2, -2, 0, 2, 3, 4] },
  { name: "Classical", gains: [4, 3, 2, 1, -1, -1, 0, 2, 3, 4] },
  { name: "Electronic", gains: [4, 4, 1, 0, -2, 2, 1, 1, 4, 5] },
  { name: "Hip Hop", gains: [5, 4, 1, 3, -1, -1, 2, 0, 2, 3] },
  { name: "Vocal", gains: [-2, -3, -2, 1, 4, 4, 3, 1, 0, -1] },
  { name: "Loudness", gains: [6, 4, 0, 0, -2, 0, -1, -5, 5, 1] },
];

const STORAGE_KEY = "vinyl-equalizer-settings";

interface StoredSettings {
  bands: EqualizerBand[];
  enabled: boolean;
  currentPreset: string | null;
}

export function useEqualizer(audioElement: HTMLAudioElement | null) {
  const [bands, setBands] = useState<EqualizerBand[]>(DEFAULT_BANDS);
  const [enabled, setEnabled] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<string | null>("Flat");
  const [isConnected, setIsConnected] = useState(false);

  const sharedDataRef = useRef<SharedAudioData | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const filtersConnectedRef = useRef(false);

  // Load saved settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const settings: StoredSettings = JSON.parse(saved);
        setBands(settings.bands);
        setEnabled(settings.enabled);
        setCurrentPreset(settings.currentPreset);
      }
    } catch (error) {
      console.error("Failed to load equalizer settings:", error);
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    try {
      const settings: StoredSettings = {
        bands,
        enabled,
        currentPreset,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save equalizer settings:", error);
    }
  }, [bands, enabled, currentPreset]);

  // Initialize using shared audio context
  const initializeEqualizer = useCallback(() => {
    if (!audioElement || filtersConnectedRef.current) return;

    const sharedData = getSharedAudioContext(audioElement);
    if (!sharedData) return;

    sharedDataRef.current = sharedData;
    const { audioContext, preGainNode, postGainNode } = sharedData;

    console.log("[Equalizer] Creating filters...");

    // Create biquad filters for each frequency band
    filtersRef.current = bands.map((band) => {
      const filter = audioContext.createBiquadFilter();
      filter.type = "peaking";
      filter.frequency.value = band.frequency;
      filter.Q.value = 1.4;
      filter.gain.value = enabled ? band.gain : 0;
      return filter;
    });

    // Disconnect default connection and insert filters
    // Chain: source -> analyser -> preGain -> [FILTERS] -> postGain -> destination
    preGainNode.disconnect();

    let previousNode: AudioNode = preGainNode;
    filtersRef.current.forEach((filter) => {
      previousNode.connect(filter);
      previousNode = filter;
    });
    previousNode.connect(postGainNode);

    filtersConnectedRef.current = true;
    setIsConnected(true);
    console.log("[Equalizer] Filters connected");
  }, [audioElement, bands, enabled]);

  // Connect when enabled
  useEffect(() => {
    if (audioElement && enabled && !isConnected) {
      initializeEqualizer();
    }
  }, [audioElement, enabled, isConnected, initializeEqualizer]);

  // Resume AudioContext on user interaction
  useEffect(() => {
    if (!audioElement) return;
    const resume = () => resumeAudioContext(audioElement);
    window.addEventListener("click", resume, { once: true });
    window.addEventListener("touchstart", resume, { once: true });
    return () => {
      window.removeEventListener("click", resume);
      window.removeEventListener("touchstart", resume);
    };
  }, [audioElement]);

  // Update filter gains when bands change
  useEffect(() => {
    if (!filtersRef.current.length) return;

    filtersRef.current.forEach((filter, index) => {
      const targetGain = enabled ? bands[index].gain : 0;
      filter.gain.setTargetAtTime(
        targetGain,
        sharedDataRef.current?.audioContext.currentTime || 0,
        0.01,
      );
    });
  }, [bands, enabled]);

  // Set band gain
  const setBandGain = useCallback((index: number, gain: number) => {
    setBands((prev) => {
      const newBands = [...prev];
      newBands[index] = {
        ...newBands[index],
        gain: Math.max(-12, Math.min(12, gain)),
      };
      return newBands;
    });
    setCurrentPreset(null);
  }, []);

  // Apply preset
  const applyPreset = useCallback((preset: EqualizerPreset) => {
    setBands((prev) =>
      prev.map((band, index) => ({
        ...band,
        gain: preset.gains[index] ?? 0,
      })),
    );
    setCurrentPreset(preset.name);
  }, []);

  // Reset to flat
  const reset = useCallback(() => {
    applyPreset(EQUALIZER_PRESETS[0]);
  }, [applyPreset]);

  // Toggle enabled state
  const toggleEnabled = useCallback(() => {
    setEnabled((prev) => !prev);
  }, []);

  return {
    bands,
    enabled,
    currentPreset,
    isConnected,
    setBandGain,
    applyPreset,
    reset,
    toggleEnabled,
    setEnabled,
  };
}
