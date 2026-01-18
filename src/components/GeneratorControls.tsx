import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Square,
  Music2,
  Zap,
  Waves,
  Volume2,
  Timer,
  Disc,
  Sparkles,
  Radio,
  Drumstick,
  Cloud,
  AudioLines,
  ChevronDown,
} from "lucide-react";
import { MusicGenerator, GENRES } from "../lib/musicGenerator";
import type { Genre, EffectsState } from "../lib/musicGenerator";

interface GeneratorControlsProps {
  onGeneratorPlay?: () => void;
  onRegisterStop?: (stopFn: () => void) => void;
  // Callback to provide visualizer data to parent (reuses existing visualizer)
  onVisualizerData?: (frequencyData: Uint8Array, waveformData: Uint8Array) => void;
  // Callback when playing state changes
  onPlayingChange?: (isPlaying: boolean) => void;
  // Callback when tempo changes
  onTempoChange?: (tempo: number) => void;
}

export function GeneratorControls({
  onGeneratorPlay,
  onRegisterStop,
  onVisualizerData,
  onPlayingChange,
  onTempoChange,
}: GeneratorControlsProps) {
  const generatorRef = useRef<MusicGenerator | null>(null);
  const animationRef = useRef<number | null>(null);
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
  const [showGenreMenu, setShowGenreMenu] = useState(false);

  // Initialize generator
  useEffect(() => {
    generatorRef.current = new MusicGenerator();

    generatorRef.current.onStepChange = (step, bar) => {
      setCurrentStep(step);
      setCurrentBar(bar);
    };

    setEffects(generatorRef.current.getEffects());

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
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

  // Animation loop for visualizer data - sends to parent
  useEffect(() => {
    if (!isPlaying || !onVisualizerData) {
      return;
    }

    const updateVisualizerData = () => {
      if (generatorRef.current && isPlaying) {
        const freqData = generatorRef.current.getFrequencyData();
        const waveData = generatorRef.current.getWaveformData();
        onVisualizerData(freqData, waveData);
        animationRef.current = requestAnimationFrame(updateVisualizerData);
      }
    };

    animationRef.current = requestAnimationFrame(updateVisualizerData);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, onVisualizerData]);

  // Notify parent of playing state changes
  useEffect(() => {
    onPlayingChange?.(isPlaying);
  }, [isPlaying, onPlayingChange]);

  const handleGenreChange = useCallback((genre: Genre) => {
    if (generatorRef.current) {
      generatorRef.current.setGenre(genre);
      setCurrentGenre(genre);
      const newTempo = generatorRef.current.getTempo();
      setTempo(newTempo);
      setTempoRange(generatorRef.current.getTempoRange());
      onTempoChange?.(newTempo);
    }
    setShowGenreMenu(false);
  }, [onTempoChange]);

  const handleTempoChange = useCallback((newTempo: number) => {
    if (generatorRef.current) {
      generatorRef.current.setTempo(newTempo);
      setTempo(newTempo);
      onTempoChange?.(newTempo);
    }
  }, [onTempoChange]);

  const handlePlay = useCallback(() => {
    if (generatorRef.current) {
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
    const icons: Record<Genre, React.ReactNode> = {
      lofi: <Music2 className="w-3.5 h-3.5" />,
      techno: <Zap className="w-3.5 h-3.5" />,
      "80s-synth": <Waves className="w-3.5 h-3.5" />,
      ambient: <Cloud className="w-3.5 h-3.5" />,
      house: <Radio className="w-3.5 h-3.5" />,
      dnb: <Drumstick className="w-3.5 h-3.5" />,
      trap: <AudioLines className="w-3.5 h-3.5" />,
    };
    return icons[genre] || <Music2 className="w-3.5 h-3.5" />;
  };

  const getGenreColor = (genre: Genre) => {
    const colors: Record<Genre, string> = {
      lofi: "text-amber-400",
      techno: "text-cyan-400",
      "80s-synth": "text-pink-400",
      ambient: "text-indigo-400",
      house: "text-orange-400",
      dnb: "text-green-400",
      trap: "text-red-400",
    };
    return colors[genre] || "text-vinyl-accent";
  };

  const currentGenreInfo = GENRES.find((g) => g.id === currentGenre);

  return (
    <div className="space-y-3">
      {/* Step indicator - compact horizontal */}
      {isPlaying && (
        <div className="flex justify-center gap-0.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-75 ${
                currentStep === i
                  ? `${getGenreColor(currentGenre).replace("text-", "bg-")} shadow-sm`
                  : i % 4 === 0
                    ? "bg-vinyl-text-muted/40"
                    : "bg-vinyl-border/60"
              }`}
            />
          ))}
        </div>
      )}

      {/* Genre & Tempo Row */}
      <div className="flex items-center gap-2">
        {/* Genre Selector */}
        <div className="relative flex-1">
          <button
            onClick={() => setShowGenreMenu(!showGenreMenu)}
            className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border transition-all ${
              showGenreMenu
                ? "border-vinyl-accent bg-vinyl-accent/10"
                : "border-vinyl-border bg-vinyl-surface/80 hover:border-vinyl-accent/50"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className={getGenreColor(currentGenre)}>
                {getGenreIcon(currentGenre)}
              </span>
              <span className="text-xs font-medium text-vinyl-text">
                {currentGenreInfo?.name}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-vinyl-text-muted transition-transform ${
                showGenreMenu ? "rotate-180" : ""
              }`}
            />
          </button>

          {showGenreMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowGenreMenu(false)}
              />
              <div className="absolute bottom-full left-0 right-0 mb-1 z-50 bg-vinyl-surface border border-vinyl-border rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                {GENRES.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => handleGenreChange(genre.id)}
                    className={`flex items-center gap-2 w-full px-2.5 py-2 text-left transition-colors ${
                      currentGenre === genre.id
                        ? "bg-vinyl-accent/20 text-vinyl-accent"
                        : "text-vinyl-text hover:bg-vinyl-border/50"
                    }`}
                  >
                    <span className={currentGenre === genre.id ? getGenreColor(genre.id) : "text-vinyl-text-muted"}>
                      {getGenreIcon(genre.id)}
                    </span>
                    <span className="text-xs">{genre.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Tempo */}
        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-vinyl-surface/80 border border-vinyl-border rounded-lg">
          <span className="text-[10px] text-vinyl-text-muted">BPM</span>
          <input
            type="number"
            min={tempoRange.min}
            max={tempoRange.max}
            value={tempo}
            onChange={(e) => handleTempoChange(parseInt(e.target.value) || tempo)}
            className="w-10 bg-transparent text-vinyl-accent font-mono text-xs text-center focus:outline-none"
          />
        </div>

        {/* Play/Stop Button */}
        {!isPlaying ? (
          <button
            onClick={handlePlay}
            className="flex items-center gap-1.5 px-4 py-2 bg-vinyl-accent text-vinyl-bg rounded-full text-xs font-medium hover:bg-vinyl-accent-light transition-all"
          >
            <Play className="w-3.5 h-3.5" fill="currentColor" />
            Play
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-full text-xs font-medium hover:bg-red-500/30 transition-all"
          >
            <Square className="w-3.5 h-3.5" fill="currentColor" />
            Stop
          </button>
        )}
      </div>

      {/* Effects - compact */}
      <div className="flex gap-1.5">
        <button
          onClick={() => handleToggleEffect("reverb")}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border text-[10px] transition-all ${
            effects.reverb
              ? "bg-vinyl-accent/20 border-vinyl-accent text-vinyl-accent"
              : "border-vinyl-border text-vinyl-text-muted hover:border-vinyl-accent/50"
          }`}
        >
          <Volume2 className="w-3 h-3" />
          <span>Reverb</span>
        </button>
        <button
          onClick={() => handleToggleEffect("delay")}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border text-[10px] transition-all ${
            effects.delay
              ? "bg-vinyl-accent/20 border-vinyl-accent text-vinyl-accent"
              : "border-vinyl-border text-vinyl-text-muted hover:border-vinyl-accent/50"
          }`}
        >
          <Timer className="w-3 h-3" />
          <span>Delay</span>
        </button>
        <button
          onClick={() => handleToggleEffect("filter")}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border text-[10px] transition-all ${
            effects.filter
              ? "bg-vinyl-accent/20 border-vinyl-accent text-vinyl-accent"
              : "border-vinyl-border text-vinyl-text-muted hover:border-vinyl-accent/50"
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Filter</span>
        </button>
        {currentGenre === "lofi" && (
          <button
            onClick={() => handleToggleEffect("vinyl")}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border text-[10px] transition-all ${
              effects.vinyl
                ? "bg-vinyl-accent/20 border-vinyl-accent text-vinyl-accent"
                : "border-vinyl-border text-vinyl-text-muted hover:border-vinyl-accent/50"
            }`}
          >
            <Disc className="w-3 h-3" />
            <span>Vinyl</span>
          </button>
        )}
      </div>

      {/* Status */}
      <p className="text-center text-[10px] text-vinyl-text-muted">
        {isPlaying ? `${currentGenreInfo?.name} • Bar ${currentBar + 1}` : "Generate instrumental music"}
      </p>
    </div>
  );
}
