import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Square,
  Zap,
  Music2,
  Waves,
  Volume2,
  Timer,
  Disc,
  Sparkles,
  Radio,
  Drumstick,
  Cloud,
  AudioLines,
} from "lucide-react";
import { MusicGenerator, GENRES } from "../lib/musicGenerator";
import type { Genre, EffectsState } from "../lib/musicGenerator";
import { tooltipProps } from "./Tooltip";

interface MusicGeneratorViewProps {
  onGeneratorPlay?: () => void; // Called when generator starts playing
  onRegisterStop?: (stopFn: () => void) => void; // Register stop function for external control
}

export function MusicGeneratorView({
  onGeneratorPlay,
  onRegisterStop,
}: MusicGeneratorViewProps) {
  const generatorRef = useRef<MusicGenerator | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentGenre, setCurrentGenre] = useState<Genre>("lofi");
  const [tempo, setTempo] = useState(75);
  const [tempoRange, setTempoRange] = useState({ min: 60, max: 90 });
  const [currentStep, setCurrentStep] = useState(0);
  const [currentBar, setCurrentBar] = useState(0);
  const [effects, setEffects] = useState<EffectsState>({
    reverb: false,
    delay: false,
    filter: false,
    vinyl: false,
  });

  // Initialize generator
  useEffect(() => {
    generatorRef.current = new MusicGenerator();

    generatorRef.current.onStepChange = (step, bar) => {
      setCurrentStep(step);
      setCurrentBar(bar);
    };

    setEffects(generatorRef.current.getEffects());

    return () => {
      if (generatorRef.current) {
        generatorRef.current.dispose();
      }
    };
  }, []);

  // Update tempo range when genre changes
  useEffect(() => {
    if (generatorRef.current) {
      const range = generatorRef.current.getTempoRange();
      setTempoRange(range);
      setTempo(generatorRef.current.getTempo());
    }
  }, [currentGenre]);

  const handleGenreChange = useCallback((genre: Genre) => {
    if (generatorRef.current) {
      generatorRef.current.setGenre(genre);
      setCurrentGenre(genre);
      setTempo(generatorRef.current.getTempo());
      setTempoRange(generatorRef.current.getTempoRange());
    }
  }, []);

  const handleTempoChange = useCallback((newTempo: number) => {
    if (generatorRef.current) {
      generatorRef.current.setTempo(newTempo);
      setTempo(newTempo);
    }
  }, []);

  const handlePlay = useCallback(() => {
    if (generatorRef.current) {
      // Stop main audio player when generator starts
      onGeneratorPlay?.();
      generatorRef.current.play();
      setIsPlaying(true);
    }
  }, [onGeneratorPlay]);

  const handleStop = useCallback(() => {
    if (generatorRef.current) {
      generatorRef.current.stop();
      setIsPlaying(false);
      setCurrentStep(0);
      setCurrentBar(0);
    }
  }, []);

  // Register the stop function for external control
  useEffect(() => {
    onRegisterStop?.(handleStop);
  }, [handleStop, onRegisterStop]);

  const handleToggleEffect = useCallback((effect: keyof EffectsState) => {
    if (generatorRef.current) {
      generatorRef.current.toggleEffect(effect);
      setEffects(generatorRef.current.getEffects());
    }
  }, []);

  const getGenreIcon = (genre: Genre) => {
    switch (genre) {
      case "lofi":
        return <Music2 className="w-5 h-5" />;
      case "techno":
        return <Zap className="w-5 h-5" />;
      case "80s-synth":
        return <Waves className="w-5 h-5" />;
      case "ambient":
        return <Cloud className="w-5 h-5" />;
      case "house":
        return <Radio className="w-5 h-5" />;
      case "dnb":
        return <Drumstick className="w-5 h-5" />;
      case "trap":
        return <AudioLines className="w-5 h-5" />;
      default:
        return <Music2 className="w-5 h-5" />;
    }
  };

  const getGenreColors = (genre: Genre, isActive: boolean) => {
    if (!isActive) {
      return "bg-vinyl-surface border-vinyl-border text-vinyl-text-muted hover:border-vinyl-accent hover:text-vinyl-text";
    }
    switch (genre) {
      case "lofi":
        return "bg-amber-500/20 border-amber-500 text-amber-400";
      case "techno":
        return "bg-cyan-500/20 border-cyan-500 text-cyan-400";
      case "80s-synth":
        return "bg-pink-500/20 border-pink-500 text-pink-400";
      case "ambient":
        return "bg-indigo-500/20 border-indigo-500 text-indigo-400";
      case "house":
        return "bg-orange-500/20 border-orange-500 text-orange-400";
      case "dnb":
        return "bg-green-500/20 border-green-500 text-green-400";
      case "trap":
        return "bg-red-500/20 border-red-500 text-red-400";
      default:
        return "bg-vinyl-accent/20 border-vinyl-accent text-vinyl-accent";
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 pt-16 pb-24 md:pb-6">
      <div className="max-w-2xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-vinyl-text mb-2">
            Music Generator
          </h1>
          <p className="text-vinyl-text-muted">
            Generate endless instrumental music locally in your browser
          </p>
        </div>

        {/* Genre Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-vinyl-text-muted">
            Select Genre
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {GENRES.map((genre) => (
              <button
                key={genre.id}
                onClick={() => handleGenreChange(genre.id)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${getGenreColors(
                  genre.id,
                  currentGenre === genre.id,
                )}`}
              >
                <div className="flex flex-col items-center gap-1 text-center">
                  {getGenreIcon(genre.id)}
                  <div className="font-medium text-sm">{genre.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tempo Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-vinyl-text-muted">
              Tempo
            </label>
            <span className="text-sm font-mono text-vinyl-accent">
              {tempo} BPM
            </span>
          </div>
          <div className="relative">
            <input
              type="range"
              min={tempoRange.min}
              max={tempoRange.max}
              value={tempo}
              onChange={(e) => handleTempoChange(parseInt(e.target.value))}
              className="w-full h-2 bg-vinyl-border rounded-lg appearance-none cursor-pointer accent-vinyl-accent"
              style={
                {
                  background: `linear-gradient(to right, var(--vinyl-accent) ${
                    ((tempo - tempoRange.min) /
                      (tempoRange.max - tempoRange.min)) *
                    100
                  }%, var(--vinyl-border) ${
                    ((tempo - tempoRange.min) /
                      (tempoRange.max - tempoRange.min)) *
                    100
                  }%)`,
                } as React.CSSProperties
              }
            />
            <div className="flex justify-between mt-1 text-xs text-vinyl-text-muted">
              <span>{tempoRange.min} BPM</span>
              <span>{tempoRange.max} BPM</span>
            </div>
          </div>
        </div>

        {/* Effects Toggles */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-vinyl-text-muted">
            Effects
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleToggleEffect("reverb")}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                effects.reverb
                  ? "bg-vinyl-accent/20 border-vinyl-accent text-vinyl-accent"
                  : "bg-vinyl-surface border-vinyl-border text-vinyl-text-muted hover:border-vinyl-accent/50"
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span className="text-sm font-medium">Reverb</span>
            </button>
            <button
              onClick={() => handleToggleEffect("delay")}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                effects.delay
                  ? "bg-vinyl-accent/20 border-vinyl-accent text-vinyl-accent"
                  : "bg-vinyl-surface border-vinyl-border text-vinyl-text-muted hover:border-vinyl-accent/50"
              }`}
            >
              <Timer className="w-4 h-4" />
              <span className="text-sm font-medium">Delay</span>
            </button>
            <button
              onClick={() => handleToggleEffect("filter")}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                effects.filter
                  ? "bg-vinyl-accent/20 border-vinyl-accent text-vinyl-accent"
                  : "bg-vinyl-surface border-vinyl-border text-vinyl-text-muted hover:border-vinyl-accent/50"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Filter</span>
            </button>
            <button
              onClick={() => handleToggleEffect("vinyl")}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                effects.vinyl
                  ? "bg-vinyl-accent/20 border-vinyl-accent text-vinyl-accent"
                  : "bg-vinyl-surface border-vinyl-border text-vinyl-text-muted hover:border-vinyl-accent/50"
              } ${currentGenre !== "lofi" ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={currentGenre !== "lofi"}
              {...(currentGenre !== "lofi"
                ? tooltipProps("Only available for Lofi genre")
                : {})}
            >
              <Disc className="w-4 h-4" />
              <span className="text-sm font-medium">Vinyl</span>
            </button>
          </div>
        </div>

        {/* Visualizer */}
        <div className="bg-vinyl-surface rounded-xl p-6 border border-vinyl-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-vinyl-text-muted">
              {isPlaying ? `Bar ${currentBar + 1}` : "Ready"}
            </span>
            <span className="text-sm font-mono text-vinyl-accent">
              {GENRES.find((g) => g.id === currentGenre)?.name}
            </span>
          </div>

          {/* Step visualizer */}
          <div className="grid grid-cols-16 gap-1 mb-6">
            {Array.from({ length: 16 }).map((_, i) => {
              const activeColor =
                {
                  lofi: "bg-amber-500 shadow-lg shadow-amber-500/50",
                  techno: "bg-cyan-500 shadow-lg shadow-cyan-500/50",
                  "80s-synth": "bg-pink-500 shadow-lg shadow-pink-500/50",
                  ambient: "bg-indigo-500 shadow-lg shadow-indigo-500/50",
                  house: "bg-orange-500 shadow-lg shadow-orange-500/50",
                  dnb: "bg-green-500 shadow-lg shadow-green-500/50",
                  trap: "bg-red-500 shadow-lg shadow-red-500/50",
                }[currentGenre] ||
                "bg-vinyl-accent shadow-lg shadow-vinyl-accent/50";

              return (
                <div
                  key={i}
                  className={`h-6 rounded transition-all duration-75 ${
                    isPlaying && currentStep === i
                      ? activeColor
                      : i % 4 === 0
                        ? "bg-vinyl-border"
                        : "bg-vinyl-border/50"
                  }`}
                />
              );
            })}
          </div>

          {/* Play/Stop Controls */}
          <div className="flex justify-center gap-4">
            {!isPlaying ? (
              <button
                onClick={handlePlay}
                className="flex items-center gap-2 px-8 py-4 bg-vinyl-accent text-vinyl-bg rounded-full font-medium hover:bg-vinyl-accent-light transition-all transform hover:scale-105 active:scale-95"
              >
                <Play className="w-6 h-6" fill="currentColor" />
                Play
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-8 py-4 bg-red-500/20 text-red-400 border-2 border-red-500 rounded-full font-medium hover:bg-red-500/30 transition-all"
              >
                <Square className="w-6 h-6" fill="currentColor" />
                Stop
              </button>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-vinyl-text-muted space-y-1">
          <p>Music is generated locally using probabilistic algorithms.</p>
          <p>No internet connection required. Works completely offline.</p>
        </div>
      </div>
    </div>
  );
}
