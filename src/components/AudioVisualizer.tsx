import { useRef, useEffect, memo } from "react";
import type { VisualizerStyle } from "../hooks/useAudioVisualizer";

// Helper to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Get accent color from CSS variable
function getAccentColor(): string {
  if (typeof document !== "undefined") {
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue("--vinyl-accent")
        .trim() || "#d4a574"
    );
  }
  return "#d4a574";
}

interface AudioVisualizerProps {
  frequencyData: Uint8Array;
  waveformData: Uint8Array;
  style: VisualizerStyle;
  isPlaying: boolean;
  className?: string;
  barColor?: string;
  height?: number;
}

// Color palettes for different visualizers
const COLORS = {
  // Bars: Neon Cyber theme
  bars: {
    primary: ["#00FFFF", "#FF00FF", "#8B5CF6", "#06B6D4", "#D946EF"],
    getColor: (i: number, total: number, time: number) => {
      const hue = ((i / total) * 180 + 180 + time * 50) % 360; // Cyan to Magenta range, animated
      return `hsl(${hue}, 100%, 60%)`;
    },
  },
  // Wave: Ocean theme
  wave: {
    colors: ["#0EA5E9", "#06B6D4", "#14B8A6", "#10B981", "#0EA5E9"],
  },
  // Area Wave: Sunset/Fire theme
  areaWave: {
    colors: ["#F97316", "#EF4444", "#EC4899", "#8B5CF6", "#6366F1"],
  },
};

export const AudioVisualizer = memo(function AudioVisualizer({
  frequencyData,
  waveformData,
  style,
  isPlaying,
  className = "",
  barColor = "#d4a574",
  height = 64,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationTimeRef = useRef(0);
  const lastTimeRef = useRef(Date.now());

  // Store last data to keep visualization frozen when paused
  const lastFrequencyDataRef = useRef<Uint8Array | null>(null);
  const lastWaveformDataRef = useRef<Uint8Array | null>(null);
  const hasEverPlayedRef = useRef(false);

  const canvasWidth = 1200;
  const canvasHeight = height;

  // Update stored data when playing
  useEffect(() => {
    if (isPlaying && frequencyData.length > 0) {
      const hasData = frequencyData.some((v) => v > 0);
      if (hasData) {
        lastFrequencyDataRef.current = new Uint8Array(frequencyData);
        lastWaveformDataRef.current = new Uint8Array(waveformData);
        hasEverPlayedRef.current = true;
      }
    }
  }, [frequencyData, waveformData, isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Update animation time
    const now = Date.now();
    const delta = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;
    if (isPlaying) {
      animationTimeRef.current += delta;
    }
    const time = animationTimeRef.current;

    const width = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, width, h);

    const freqData = isPlaying
      ? frequencyData
      : lastFrequencyDataRef.current || frequencyData;
    const waveData = isPlaying
      ? waveformData
      : lastWaveformDataRef.current || waveformData;

    const hasValidData = freqData.length > 0 && freqData.some((v) => v > 0);

    if (!hasValidData && !hasEverPlayedRef.current) {
      drawIdleState(ctx, style, width, h, barColor, time);
      return;
    }

    switch (style) {
      case "bars":
        drawBars(ctx, freqData, width, h, time);
        break;
      case "wave":
        drawWave(ctx, waveData, width, h, time);
        break;
      case "areaWave":
        drawAreaWave(ctx, waveData, width, h, time, getAccentColor());
        break;
    }
  }, [frequencyData, waveformData, style, isPlaying, barColor, height]);

  const canvasStyle = { width: "100%", height: "100%" };

  return (
    <div
      className={`w-full h-full flex items-center justify-center ${className}`}
    >
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={canvasStyle}
      />
    </div>
  );
});

function drawIdleState(
  ctx: CanvasRenderingContext2D,
  style: VisualizerStyle,
  width: number,
  h: number,
  _barColor: string,
  time: number,
) {
  if (style === "bars") {
    const barCount = 48;
    const gap = 3;
    const barWidth = (width - gap * (barCount - 1)) / barCount;
    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + gap);
      ctx.fillStyle = COLORS.bars.getColor(i, barCount, time);
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.roundRect(x, h - 6, barWidth, 4, 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (style === "areaWave") {
    const accent = getAccentColor();
    const rgb = hexToRgb(accent);
    const r = rgb?.r ?? 139;
    const g = rgb?.g ?? 92;
    const b = rgb?.b ?? 246;
    const gradient = ctx.createLinearGradient(0, h, 0, h * 0.85);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.4)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, h * 0.85, width, h * 0.15);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    COLORS.wave.colors.forEach((c, i) => gradient.addColorStop(i / 4, c));
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(width, h / 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// BARS: Neon Cyber theme with animated colors
function drawBars(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  width: number,
  height: number,
  time: number,
) {
  const barCount = 64;
  const gap = 2;
  const barWidth = (width - gap * (barCount - 1)) / barCount;

  // Only use the first 70% of frequency data (where most audio content is)
  const usableDataLength = Math.floor(data.length * 0.7);

  for (let i = 0; i < barCount; i++) {
    // Use logarithmic scaling to give more bars to bass frequencies
    const logIndex = Math.pow(i / barCount, 1.5) * usableDataLength;
    const dataIndex = Math.min(Math.floor(logIndex), usableDataLength - 1);

    // Average a few neighboring frequencies for smoother visualization
    let value = data[dataIndex];
    if (dataIndex > 0) {
      value =
        (data[dataIndex - 1] +
          data[dataIndex] +
          (data[dataIndex + 1] || data[dataIndex])) /
        3;
    }

    const barHeight = Math.max((value / 255) * height * 0.9, 4);
    const x = i * (barWidth + gap);
    const y = height - barHeight;

    const color = COLORS.bars.getColor(i, barCount, time);

    // Create gradient for each bar
    const gradient = ctx.createLinearGradient(x, height, x, y);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(
      1,
      `hsla(${((i / barCount) * 180 + 180 + time * 50) % 360}, 100%, 80%, 0.8)`,
    );

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, 2);
    ctx.fill();

    // Glow for loud bars
    if (value > 120) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.globalAlpha = 0.4;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
  }
}

// WAVE: Ocean theme with flowing gradient
function drawWave(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  width: number,
  height: number,
  time: number,
) {
  // Animated ocean gradient
  const offset = (time * 0.1) % 1;
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  const colors = COLORS.wave.colors;
  for (let i = 0; i < colors.length; i++) {
    const pos = (i / (colors.length - 1) + offset) % 1;
    gradient.addColorStop(pos, colors[i]);
  }

  ctx.strokeStyle = gradient;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();

  const sliceWidth = width / data.length;
  let x = 0;

  for (let i = 0; i < data.length; i++) {
    const v = data[i] / 128.0;
    const y = (v * height) / 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    x += sliceWidth;
  }

  ctx.lineTo(width, height / 2);
  ctx.stroke();

  // Glow
  ctx.shadowColor = "#06B6D4";
  ctx.shadowBlur = 15;
  ctx.globalAlpha = 0.6;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

// AREA WAVE: Simple white and accent color
function drawAreaWave(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  width: number,
  height: number,
  _time: number,
  accentColor: string = "#8B5CF6",
) {
  // Parse accent color to RGB for gradients
  const rgb = hexToRgb(accentColor);
  const r = rgb?.r ?? 139;
  const g = rgb?.g ?? 92;
  const b = rgb?.b ?? 246;

  // Simple gradient: accent at bottom fading to white/transparent at top
  const gradient = ctx.createLinearGradient(0, height, 0, 0);
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`);
  gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.5)`);
  gradient.addColorStop(1, "rgba(255, 255, 255, 0.2)");

  // Build wave path
  ctx.beginPath();
  ctx.moveTo(0, height);

  const sliceWidth = width / data.length;
  let x = 0;

  for (let i = 0; i < data.length; i++) {
    const v = data[i] / 128.0;
    const y = height - v * height * 0.48 - height * 0.02;

    if (i === 0) {
      ctx.lineTo(x, y);
    } else {
      const prevX = (i - 1) * sliceWidth;
      const prevV = data[i - 1] / 128.0;
      const prevY = height - prevV * height * 0.48 - height * 0.02;
      const cpX = (prevX + x) / 2;
      ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
    }
    x += sliceWidth;
  }

  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
}
