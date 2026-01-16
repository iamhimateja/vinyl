import { useState, useRef, useEffect } from "react";
import {
  getSharedAudioContext,
  resumeAudioContext,
  type SharedAudioData,
} from "../lib/audioContext";

export type VisualizerStyle = "bars" | "wave" | "areaWave";

interface UseAudioVisualizerOptions {
  fftSize?: number;
  smoothingTimeConstant?: number;
}

export function useAudioVisualizer(
  audioElement: HTMLAudioElement | null,
  enabled: boolean = false,
  options: UseAudioVisualizerOptions = {},
) {
  const { fftSize = 512, smoothingTimeConstant = 0.8 } = options;

  const [frequencyData, setFrequencyData] = useState<Uint8Array>(
    () => new Uint8Array(fftSize / 2),
  );
  const [waveformData, setWaveformData] = useState<Uint8Array>(
    () => new Uint8Array(fftSize / 2),
  );
  const [isConnected, setIsConnected] = useState(false);

  const animationFrameRef = useRef<number | null>(null);
  const sharedDataRef = useRef<SharedAudioData | null>(null);

  // Get shared audio context when enabled
  useEffect(() => {
    if (!enabled || !audioElement) return;

    const data = getSharedAudioContext(audioElement);
    if (data) {
      data.analyser.fftSize = fftSize;
      data.analyser.smoothingTimeConstant = smoothingTimeConstant;
      sharedDataRef.current = data;
      setIsConnected(true);
    }
  }, [enabled, audioElement, fftSize, smoothingTimeConstant]);

  // Resume on user interaction
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

  // Animation loop
  useEffect(() => {
    if (!enabled || !sharedDataRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const analyser = sharedDataRef.current.analyser;
    const bufferLength = analyser.frequencyBinCount;
    const freqArray = new Uint8Array(bufferLength);
    const waveArray = new Uint8Array(bufferLength);

    const loop = () => {
      analyser.getByteFrequencyData(freqArray);
      analyser.getByteTimeDomainData(waveArray);
      setFrequencyData(new Uint8Array(freqArray));
      setWaveformData(new Uint8Array(waveArray));
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [enabled, isConnected]);

  return {
    isConnected,
    frequencyData,
    waveformData,
    bufferLength: sharedDataRef.current?.analyser.frequencyBinCount || 0,
  };
}
