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

  // Use refs for the data buffers to avoid creating new arrays every frame
  const frequencyDataRef = useRef<Uint8Array>(new Uint8Array(fftSize / 2));
  const waveformDataRef = useRef<Uint8Array>(new Uint8Array(fftSize / 2));
  
  // State to trigger re-renders at controlled rate
  const [updateTick, setUpdateTick] = useState(0);
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
      
      // Resize buffers if fftSize changed
      const bufferLength = data.analyser.frequencyBinCount;
      if (frequencyDataRef.current.length !== bufferLength) {
        frequencyDataRef.current = new Uint8Array(bufferLength);
        waveformDataRef.current = new Uint8Array(bufferLength);
      }
      
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

    const loop = (timestamp: number) => {
      // Frame rate limiting - only update at target FPS
      const elapsed = timestamp - lastUpdateTimeRef.current;
      
      if (elapsed >= frameIntervalRef.current) {
        // Update data in-place (no new array allocation)
        // Use type assertion to handle ArrayBuffer/ArrayBufferLike mismatch
        analyser.getByteFrequencyData(frequencyDataRef.current as Uint8Array<ArrayBuffer>);
        analyser.getByteTimeDomainData(waveformDataRef.current as Uint8Array<ArrayBuffer>);
        
        // Trigger re-render by incrementing tick
        setUpdateTick(t => t + 1);
        
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

  // Memoized getter to return current buffer data
  // Components should use these refs directly for rendering
  const getFrequencyData = useCallback(() => frequencyDataRef.current, []);
  const getWaveformData = useCallback(() => waveformDataRef.current, []);

  return {
    isConnected,
    // Return refs for direct access (avoids copying)
    frequencyData: frequencyDataRef.current,
    waveformData: waveformDataRef.current,
    // Utility getters
    getFrequencyData,
    getWaveformData,
    bufferLength: sharedDataRef.current?.analyser.frequencyBinCount || 0,
    // Tick for dependency tracking in consuming components
    updateTick,
  };
}
