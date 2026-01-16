import { useState } from "react";
import { BarChart3, Activity, AreaChart, X, Sparkles } from "lucide-react";
import { tooltipProps } from "./Tooltip";
import type { VisualizerStyle } from "../hooks/useAudioVisualizer";

interface VisualizerToggleProps {
  enabled: boolean;
  currentStyle: VisualizerStyle;
  onToggle: () => void;
  onStyleChange: (style: VisualizerStyle) => void;
}

const styles: {
  value: VisualizerStyle;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "bars", label: "Bars", icon: <BarChart3 className="w-5 h-5" /> },
  { value: "wave", label: "Wave", icon: <Activity className="w-5 h-5" /> },
  { value: "areaWave", label: "Area", icon: <AreaChart className="w-5 h-5" /> },
];

export function VisualizerToggle({
  enabled,
  currentStyle,
  onToggle,
  onStyleChange,
}: VisualizerToggleProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`p-2 rounded-full transition-colors ${
          enabled
            ? "text-vinyl-accent bg-vinyl-accent/20"
            : "text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-surface/50"
        }`}
        {...tooltipProps(enabled ? "Visualizer On" : "Visualizer Off")}
      >
        <Sparkles className="w-5 h-5" />
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute top-full right-0 mt-2 z-[101] bg-vinyl-surface border border-vinyl-border rounded-xl shadow-2xl p-3 w-52">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-vinyl-border">
              <span className="text-sm font-medium text-vinyl-text flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-vinyl-accent" />
                Visualizer
              </span>
              <button
                onClick={() => setShowMenu(false)}
                className="p-1 rounded-full text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-border/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-vinyl-border">
              <span className="text-sm text-vinyl-text-muted">
                Show visualizer
              </span>
              <button
                onClick={onToggle}
                className={`w-10 h-6 rounded-full transition-colors ${
                  enabled ? "bg-vinyl-accent" : "bg-vinyl-border"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${
                    enabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Style options - only show if enabled */}
            {enabled && (
              <div className="space-y-1">
                <span className="text-xs text-vinyl-text-muted uppercase tracking-wider">
                  Style
                </span>
                {styles.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => {
                      onStyleChange(style.value);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      currentStyle === style.value
                        ? "bg-vinyl-accent/20 text-vinyl-accent"
                        : "text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-border/50"
                    }`}
                  >
                    {style.icon}
                    <span className="text-sm">{style.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
