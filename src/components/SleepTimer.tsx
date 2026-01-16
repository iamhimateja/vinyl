import { useState, useEffect, useRef } from "react";
import { Moon, X, Plus } from "lucide-react";
import { tooltipProps } from "./Tooltip";

interface SleepTimerProps {
  isActive: boolean;
  remainingTime: string;
  progress: number;
  onStart: (seconds: number) => void;
  onStop: () => void;
  onAddTime: (seconds: number) => void;
}

export function SleepTimer({
  isActive,
  remainingTime,
  progress,
  onStart,
  onStop,
  onAddTime,
}: SleepTimerProps) {
  const [showControls, setShowControls] = useState(false);
  const [sliderValue, setSliderValue] = useState(15); // Default 15 minutes
  const [customMinutes, setCustomMinutes] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle slider change - starts timer immediately
  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    if (value > 0) {
      onStart(value * 60);
    }
  };

  // Handle custom input with debounce
  const handleCustomChange = (value: string) => {
    setCustomMinutes(value);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the timer start
    debounceRef.current = setTimeout(() => {
      const minutes = parseInt(value);
      if (minutes > 0) {
        onStart(minutes * 60);
        setSliderValue(Math.min(minutes, 30)); // Sync slider if within range
      }
    }, 800);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Format slider value for display
  const formatSliderLabel = (mins: number) => {
    if (mins === 0) return "Off";
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowControls(!showControls)}
        className={`p-2 rounded-full transition-colors ${
          isActive
            ? "text-vinyl-accent bg-vinyl-accent/20"
            : "text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-border/50"
        }`}
        {...tooltipProps(isActive ? `Sleep: ${remainingTime}` : "Sleep Timer")}
      >
        <Moon className="w-5 h-5" />
        {isActive && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-vinyl-accent rounded-full animate-pulse" />
        )}
      </button>

      {showControls && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setShowControls(false)}
          />

          {/* Controls panel */}
          <div className="absolute top-full right-0 mt-2 z-[101] bg-vinyl-surface border border-vinyl-border rounded-xl shadow-2xl p-4 w-72">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-vinyl-text font-medium">
                <Moon className="w-4 h-4 text-vinyl-accent" />
                Sleep Timer
              </div>
              <button
                onClick={() => setShowControls(false)}
                className="p-1 rounded-full text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-border/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isActive ? (
              /* Active timer display */
              <div>
                <div className="text-center mb-4">
                  <div className="text-3xl font-mono text-vinyl-accent">
                    {remainingTime}
                  </div>
                  <div className="text-xs text-vinyl-text-muted mt-1">
                    remaining
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-vinyl-border rounded-full mb-4 overflow-hidden">
                  <div
                    className="h-full bg-vinyl-accent transition-all duration-1000"
                    style={{ width: `${100 - progress}%` }}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onAddTime(5 * 60)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm bg-vinyl-border/50 hover:bg-vinyl-border rounded-lg transition-colors text-vinyl-text"
                  >
                    <Plus className="w-4 h-4" />5 min
                  </button>
                  <button
                    onClick={() => {
                      onStop();
                      setSliderValue(15);
                      setCustomMinutes("");
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors text-red-400"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Timer setup */
              <div>
                {/* Slider value display */}
                <div className="text-center mb-3">
                  <span className="text-2xl font-mono text-vinyl-accent">
                    {formatSliderLabel(sliderValue)}
                  </span>
                </div>

                {/* Slider */}
                <div className="mb-4">
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="5"
                    value={sliderValue}
                    onChange={(e) =>
                      handleSliderChange(parseInt(e.target.value))
                    }
                    className="w-full h-2 bg-vinyl-border rounded-full appearance-none cursor-pointer accent-vinyl-accent
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-5
                      [&::-webkit-slider-thumb]:h-5
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-vinyl-accent
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-webkit-slider-thumb]:shadow-lg
                      [&::-moz-range-thumb]:w-5
                      [&::-moz-range-thumb]:h-5
                      [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:bg-vinyl-accent
                      [&::-moz-range-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:border-0"
                  />
                  <div className="flex justify-between text-[10px] text-vinyl-text-muted mt-1">
                    <span>Off</span>
                    <span>15m</span>
                    <span>30m</span>
                  </div>
                </div>

                {/* Custom input for longer times */}
                <div className="border-t border-vinyl-border pt-3">
                  <label className="text-xs text-vinyl-text-muted block mb-2">
                    Need more time?
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={customMinutes}
                      onChange={(e) => handleCustomChange(e.target.value)}
                      placeholder="Custom minutes"
                      min="1"
                      max="480"
                      className="flex-1 px-3 py-2 text-sm bg-vinyl-bg border border-vinyl-border rounded-lg text-vinyl-text placeholder:text-vinyl-text-muted focus:outline-none focus:border-vinyl-accent"
                    />
                    <span className="text-sm text-vinyl-text-muted">min</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
