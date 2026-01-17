import { useState, useRef, useEffect, useCallback } from "react";
import {
  getSharedAudioContext,
  resumeAudioContext,
  type SharedAudioData,
} from "../lib/audioContext";

export type VisualizerStyle = "bars" | "wave" | "areaWave";

interface UseAudioVisualizerOptions {
  fftSize?: number;
  smoothingTimeConstant?: number;
  /** Target frame rate for visualizer updates (default: 30fps for performance) */
  targetFps?: number;
}

export function useAudioVisualizer(
  audioElement: HTMLAudioElement | null,
  enabled: boolean = false,
  options: UseAudioVisualizerOptions = {},
) {
  const { fftSize = 512, smoothingTimeConstant = 0.8, targetFps = 30 } = options;

  // State for the data arrays - need new references to trigger React updates
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(() => new Uint8Array(fftSize / 2));
  const [waveformData, setWaveformData] = useState<Uint8Array>(() => new Uint8Array(fftSize / 2));
  const [isConnected, setIsConnected] = useState(false);

  const animationFrameRef = useRef<number | null>(null);
  const sharedDataRef = useRef<SharedAudioData | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const frameIntervalRef = useRef<number>(1000 / targetFps);

  // Update frame interval when targetFps changes
  useEffect(() => {
    frameIntervalRef.current = 1000 / targetFps;
  }, [targetFps]);

  // Get shared audio context when enabled
  useEffect(() => {
    if (!enabled || !audioElement) return;

    const data = getSharedAudioContext(audioElement);
    if (data) {
      data.analyser.fftSize = fftSize;
      data.analyser.smoothingTimeConstant = smoothingTimeConstant;
      sharedDataRef.current = data;
      
      // Initialize with correct buffer size
      const bufferLength = data.analyser.frequencyBinCount;
      setFrequencyData(new Uint8Array(bufferLength));
      setWaveformData(new Uint8Array(bufferLength));
      
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

  // Animation loop with frame rate limiting
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
    
    // Reusable buffers for reading data (avoid allocation in loop)
    const freqBuffer = new Uint8Array(bufferLength);
    const waveBuffer = new Uint8Array(bufferLength);

    const loop = (timestamp: number) => {
      // Frame rate limiting - only update at target FPS
      const elapsed = timestamp - lastUpdateTimeRef.current;
      
      if (elapsed >= frameIntervalRef.current) {
        // Read data into reusable buffers
        analyser.getByteFrequencyData(freqBuffer);
        analyser.getByteTimeDomainData(waveBuffer);
        
        // Create new array references to trigger React updates
        // This is necessary because React's memo uses shallow comparison
        setFrequencyData(new Uint8Array(freqBuffer));
        setWaveformData(new Uint8Array(waveBuffer));
        
        lastUpdateTimeRef.current = timestamp - (elapsed % frameIntervalRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [enabled, isConnected]);

  // Memoized getter functions
  const getFrequencyData = useCallback(() => frequencyData, [frequencyData]);
  const getWaveformData = useCallback(() => waveformData, [waveformData]);

  return {
    isConnected,
    frequencyData,
    waveformData,
    getFrequencyData,
    getWaveformData,
    bufferLength: sharedDataRef.current?.analyser.frequencyBinCount || 0,
  };
}
