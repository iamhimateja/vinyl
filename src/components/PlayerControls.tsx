import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Repeat,
  Repeat1,
  Shuffle,
  Gauge,
} from "lucide-react";
import { formatDuration } from "../lib/audioMetadata";
import type { PlayerState } from "../types";
import { tooltipProps } from "./Tooltip";

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeat: PlayerState["repeat"];
  shuffle: boolean;
  speed: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleRepeat: () => void;
  onToggleShuffle: () => void;
  onSpeedChange: (speed: number) => void;
  disabled: boolean;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function PlayerControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  repeat,
  shuffle,
  speed,
  onTogglePlay,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onToggleRepeat,
  onToggleShuffle,
  onSpeedChange,
  disabled,
}: PlayerControlsProps) {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef<HTMLDivElement>(null);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (volumeRef.current && !volumeRef.current.contains(e.target as Node)) {
        setShowVolumeSlider(false);
      }
      if (speedRef.current && !speedRef.current.contains(e.target as Node)) {
        setShowSpeedMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = (parseFloat(e.target.value) / 100) * duration;
    onSeek(time);
  };

  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeekChange}
          disabled={disabled}
          className="w-full h-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed progress-slider"
          style={
            {
              "--progress": `${progress}%`,
            } as React.CSSProperties
          }
        />
        <div className="flex justify-between text-xs text-vinyl-text-muted">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Main controls */}
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {/* Volume control - expandable */}
        <div ref={volumeRef} className="relative flex items-center">
          <button
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            onDoubleClick={() => onVolumeChange(volume > 0 ? 0 : 0.7)}
            className={`p-2 rounded-full transition-colors ${
              volume === 0
                ? "text-vinyl-accent"
                : "text-vinyl-text-muted hover:text-vinyl-text"
            }`}
            {...tooltipProps(`Volume: ${Math.round(volume * 100)}%`)}
          >
            <VolumeIcon className="w-5 h-5" />
          </button>

          {/* Volume slider popup - vertical */}
          {showVolumeSlider && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-4 bg-vinyl-surface border border-vinyl-border rounded-lg shadow-xl animate-fade-in z-50 flex flex-col items-center">
              <div className="text-center text-xs text-vinyl-text-muted mb-2">
                {Math.round(volume * 100)}%
              </div>
              <div className="h-24 flex items-center justify-center">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={(e) =>
                    onVolumeChange(parseFloat(e.target.value) / 100)
                  }
                  className="volume-slider-vertical cursor-pointer"
                  style={
                    {
                      "--volume": `${volume * 100}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Shuffle */}
        <button
          onClick={onToggleShuffle}
          disabled={disabled}
          className={`p-2 rounded-full transition-colors ${
            shuffle
              ? "text-vinyl-accent"
              : "text-vinyl-text-muted hover:text-vinyl-text"
          } disabled:opacity-50`}
          {...tooltipProps(shuffle ? "Shuffle: On" : "Shuffle: Off")}
        >
          <Shuffle className="w-5 h-5" />
        </button>

        {/* Previous */}
        <button
          onClick={onPrevious}
          disabled={disabled}
          className="p-2 text-vinyl-text hover:text-vinyl-accent transition-colors disabled:opacity-50"
          {...tooltipProps("Previous")}
        >
          <SkipBack className="w-6 h-6" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={onTogglePlay}
          disabled={disabled}
          className="p-4 bg-vinyl-accent text-vinyl-bg rounded-full hover:bg-vinyl-accent-light transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none shadow-lg"
          {...tooltipProps(isPlaying ? "Pause" : "Play")}
        >
          {isPlaying ? (
            <Pause className="w-8 h-8" fill="currentColor" />
          ) : (
            <Play className="w-8 h-8" fill="currentColor" />
          )}
        </button>

        {/* Next */}
        <button
          onClick={onNext}
          disabled={disabled}
          className="p-2 text-vinyl-text hover:text-vinyl-accent transition-colors disabled:opacity-50"
          {...tooltipProps("Next")}
        >
          <SkipForward className="w-6 h-6" />
        </button>

        {/* Repeat */}
        <button
          onClick={onToggleRepeat}
          disabled={disabled}
          className={`p-2 rounded-full transition-colors ${
            repeat !== "none"
              ? "text-vinyl-accent"
              : "text-vinyl-text-muted hover:text-vinyl-text"
          } disabled:opacity-50`}
          {...tooltipProps(
            `Repeat: ${repeat === "none" ? "Off" : repeat === "one" ? "One" : "All"}`,
          )}
        >
          <RepeatIcon className="w-5 h-5" />
        </button>

        {/* Speed control - expandable */}
        <div ref={speedRef} className="relative flex items-center">
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            disabled={disabled}
            className={`p-2 rounded-full transition-colors ${
              speed !== 1
                ? "text-vinyl-accent"
                : "text-vinyl-text-muted hover:text-vinyl-text"
            } disabled:opacity-50`}
            {...tooltipProps(`Speed: ${speed}x`)}
          >
            <Gauge className="w-5 h-5" />
          </button>

          {/* Speed menu popup */}
          {showSpeedMenu && (
            <div className="absolute bottom-full right-0 mb-2 bg-vinyl-surface border border-vinyl-border rounded-lg shadow-xl overflow-hidden animate-fade-in z-50">
              <div className="px-3 py-2 text-xs text-vinyl-text-muted border-b border-vinyl-border">
                Playback Speed
              </div>
              {SPEED_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onSpeedChange(s);
                    setShowSpeedMenu(false);
                  }}
                  className={`block w-full px-4 py-2 text-sm text-left transition-colors whitespace-nowrap ${
                    speed === s
                      ? "bg-vinyl-accent text-vinyl-bg"
                      : "text-vinyl-text hover:bg-vinyl-border"
                  }`}
                >
                  {s}x {s === 1 && "(Normal)"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
