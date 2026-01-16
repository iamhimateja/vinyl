import { useState, useRef, useEffect, useMemo } from "react";
import { RotateCcw, Power, ChevronDown, AudioWaveform } from "lucide-react";
import type { EqualizerBand, EqualizerPreset } from "../hooks/useEqualizer";
import { EQUALIZER_PRESETS } from "../hooks/useEqualizer";
import { tooltipProps } from "./Tooltip";

interface EqualizerProps {
  bands: EqualizerBand[];
  enabled: boolean;
  currentPreset: string | null;
  isConnected: boolean;
  onBandChange: (index: number, gain: number) => void;
  onPresetChange: (preset: EqualizerPreset) => void;
  onReset: () => void;
  onToggleEnabled: () => void;
}

function FrequencyResponseCurve({
  bands,
  enabled,
}: {
  bands: EqualizerBand[];
  enabled: boolean;
}) {
  const svgPath = useMemo(() => {
    const width = 100;
    const height = 100;
    const padding = 10;

    const points = bands.map((band, index) => {
      const x = padding + (index / (bands.length - 1)) * (width - 2 * padding);
      const normalizedGain = enabled ? (band.gain + 12) / 24 : 0.5;
      const y = height - padding - normalizedGain * (height - 2 * padding);
      return { x, y };
    });

    if (points.length < 2) return "";

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const tension = 0.5;
      const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
      const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
      const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
      const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  }, [bands, enabled]);

  return (
    <div className="relative h-20 bg-vinyl-border/20 rounded-lg overflow-hidden">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <line
          x1="10"
          y1="50"
          x2="90"
          y2="50"
          stroke="var(--vinyl-border)"
          strokeWidth="0.5"
          strokeDasharray="2 2"
        />
        <path
          d={svgPath}
          fill="none"
          stroke={enabled ? "var(--vinyl-accent)" : "var(--vinyl-text-muted)"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-200"
        />
        {bands.map((band, index) => {
          const x = 10 + (index / (bands.length - 1)) * 80;
          const normalizedGain = enabled ? (band.gain + 12) / 24 : 0.5;
          const y = 90 - normalizedGain * 80;
          return (
            <circle
              key={band.frequency}
              cx={x}
              cy={y}
              r="2.5"
              fill={enabled ? "var(--vinyl-accent)" : "var(--vinyl-text-muted)"}
              className="transition-all duration-200"
            />
          );
        })}
      </svg>
      <div className="absolute bottom-1 left-0 right-0 flex justify-between px-3 text-[9px] text-vinyl-text-muted">
        <span>32Hz</span>
        <span>16kHz</span>
      </div>
    </div>
  );
}

export function Equalizer({
  bands,
  enabled,
  currentPreset,
  isConnected,
  onBandChange,
  onPresetChange,
  onReset,
  onToggleEnabled,
}: EqualizerProps) {
  const [showPresets, setShowPresets] = useState(false);
  const [showCurve, setShowCurve] = useState(true);
  const presetsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        presetsRef.current &&
        !presetsRef.current.contains(e.target as Node)
      ) {
        setShowPresets(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      {/* Status message */}
      {!isConnected && (
        <div className="text-xs text-vinyl-text-muted text-center py-3 bg-vinyl-border/30 rounded-lg">
          Play a song to activate the equalizer
        </div>
      )}

      {/* Controls row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Enable/Disable toggle */}
          <button
            onClick={onToggleEnabled}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              enabled
                ? "bg-vinyl-accent text-vinyl-bg"
                : "bg-vinyl-border text-vinyl-text-muted"
            }`}
            {...tooltipProps(
              enabled ? "Disable Equalizer" : "Enable Equalizer",
            )}
          >
            <Power className="w-4 h-4" />
            {enabled ? "On" : "Off"}
          </button>

          {/* Reset button */}
          <button
            onClick={onReset}
            className="p-2 rounded-full text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-border transition-colors"
            {...tooltipProps("Reset to Flat")}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Presets dropdown */}
        <div ref={presetsRef} className="relative">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-vinyl-border text-vinyl-text hover:bg-vinyl-border/70 transition-colors"
          >
            <span>{currentPreset || "Presets"}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                showPresets ? "rotate-180" : ""
              }`}
            />
          </button>

          {showPresets && (
            <div className="absolute right-0 top-full mt-1 bg-vinyl-surface border border-vinyl-border rounded-lg shadow-xl overflow-hidden z-50 min-w-[140px] max-h-[250px] overflow-y-auto">
              {EQUALIZER_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    onPresetChange(preset);
                    setShowPresets(false);
                  }}
                  className={`block w-full px-4 py-2.5 text-sm text-left transition-colors ${
                    currentPreset === preset.name
                      ? "bg-vinyl-accent text-vinyl-bg"
                      : "text-vinyl-text hover:bg-vinyl-border"
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Frequency response curve toggle */}
      <button
        onClick={() => setShowCurve(!showCurve)}
        className={`flex items-center gap-2 text-xs transition-colors ${
          showCurve
            ? "text-vinyl-accent"
            : "text-vinyl-text-muted hover:text-vinyl-text"
        }`}
      >
        <AudioWaveform className="w-4 h-4" />
        <span>Response Curve</span>
      </button>

      {/* Frequency response visualization */}
      {showCurve && <FrequencyResponseCurve bands={bands} enabled={enabled} />}

      {/* Frequency bands */}
      <div className="flex justify-between items-end gap-1">
        {bands.map((band, index) => (
          <div
            key={band.frequency}
            className="flex flex-col items-center gap-1 flex-1"
          >
            {/* Gain value */}
            <span className="text-[10px] text-vinyl-text-muted text-center">
              {band.gain > 0 ? "+" : ""}
              {band.gain}
            </span>

            {/* Vertical slider */}
            <div className="h-28 flex items-center justify-center">
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={band.gain}
                onChange={(e) =>
                  onBandChange(index, parseFloat(e.target.value))
                }
                disabled={!enabled}
                className="eq-slider-vertical-small"
                style={
                  {
                    "--eq-value": `${((band.gain + 12) / 24) * 100}%`,
                  } as React.CSSProperties
                }
                {...tooltipProps(`${band.frequency}Hz: ${band.gain}dB`)}
              />
            </div>

            {/* Frequency label */}
            <span className="text-[10px] text-vinyl-text-muted">
              {band.label}
            </span>
          </div>
        ))}
      </div>

      {/* dB scale reference */}
      <div className="flex justify-between text-[10px] text-vinyl-text-muted px-1">
        <span>-12dB</span>
        <span>0dB</span>
        <span>+12dB</span>
      </div>
    </div>
  );
}
