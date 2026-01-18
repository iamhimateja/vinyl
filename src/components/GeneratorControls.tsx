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
import { AudioVisualizer } from "./AudioVisualizer";
import type { VisualizerStyle } from "../hooks/useAudioVisualizer";

interface GeneratorControlsProps {
  onGeneratorPlay?: () => void;
  onRegisterStop?: (stopFn: () => void) => void;
  visualizerStyle?: VisualizerStyle;
  
}

export function GeneratorControls({
  onGeneratorPlay,
  onRegisterStop,
  visualizerStyle = "bars",
  
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
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(128));
  const [waveformData, setWaveformData] = useState<Uint8Array>(new Uint8Array(256));
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

  // Animation loop for visualizer data
  useEffect(() => {
    if (!isPlaying) {
      setFrequencyData(new Uint8Array(128));
      setWaveformData(new Uint8Array(256));
      return;
    }

    const updateVisualizerData = () => {
      if (generatorRef.current && isPlaying) {
        setFrequencyData(generatorRef.current.getFrequencyData());
        setWaveformData(generatorRef.current.getWaveformData());
        animationRef.current = requestAnimationFrame(updateVisualizerData);
      }
    };

    animationRef.current = requestAnimationFrame(updateVisualizerData);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  const handleGenreChange = useCallback((genre: Genre) => {
    if (generatorRef.current) {
      generatorRef.current.setGenre(genre);
      setCurrentGenre(genre);
      setTempo(generatorRef.current.getTempo());
      setTempoRange(generatorRef.current.getTempoRange());
    }
    setShowGenreMenu(false);
  }, []);

  const handleTempoChange = useCallback((newTempo: number) => {
    if (generatorRef.current) {
      generatorRef.current.setTempo(newTempo);
      setTempo(newTempo);
    }
  }, []);

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
      lofi: <Music2 className="w-4 h-4" />,
      techno: <Zap className="w-4 h-4" />,
      "80s-synth": <Waves className="w-4 h-4" />,
      ambient: <Cloud className="w-4 h-4" />,
      house: <Radio className="w-4 h-4" />,
      dnb: <Drumstick className="w-4 h-4" />,
      trap: <AudioLines className="w-4 h-4" />,
    };
    return icons[genre] || <Music2 className="w-4 h-4" />;
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
    <div className="flex flex-col h-full">
      {/* Visualizer */}
      <div className="flex-1 min-h-[200px] relative">
        <AudioVisualizer
          frequencyData={frequencyData}
          waveformData={waveformData}
          style={visualizerStyle}
          isPlaying={isPlaying}
          height={300}
          className="w-full h-full opacity-80"
        />
        
        {/* Step indicator overlay */}
        {isPlaying && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-75 ${
                  currentStep === i
                    ? `${getGenreColor(currentGenre).replace("text-", "bg-")} shadow-lg`
                    : i % 4 === 0
                      ? "bg-vinyl-text-muted/30"
                      : "bg-vinyl-border/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4">
        {/* Genre & Tempo Row */}
        <div className="flex items-center gap-3">
          {/* Genre Selector */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowGenreMenu(!showGenreMenu)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                showGenreMenu
                  ? "border-vinyl-accent bg-vinyl-accent/10"
                  : "border-vinyl-border bg-vinyl-surface hover:border-vinyl-accent/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={getGenreColor(currentGenre)}>
                  {getGenreIcon(currentGenre)}
                </span>
                <span className="text-sm font-medium text-vinyl-text">
                  {currentGenreInfo?.name}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-vinyl-text-muted transition-transform ${
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
                <div className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-vinyl-surface border border-vinyl-border rounded-lg shadow-xl overflow-hidden">
                  {GENRES.map((genre) => (
                    <button
                      key={genre.id}
                      onClick={() => handleGenreChange(genre.id)}
                      className={`flex items-center gap-2 w-full px-3 py-2.5 text-left transition-colors ${
                        currentGenre === genre.id
                          ? "bg-vinyl-accent/20 text-vinyl-accent"
                          : "text-vinyl-text hover:bg-vinyl-border/50"
                      }`}
                    >
                      <span className={currentGenre === genre.id ? getGenreColor(genre.id) : "text-vinyl-text-muted"}>
                        {getGenreIcon(genre.id)}
                      </span>
                      <span className="text-sm">{genre.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Tempo */}
          <div className="flex items-center gap-2 px-3 py-2 bg-vinyl-surface border border-vinyl-border rounded-lg">
            <span className="text-xs text-vinyl-text-muted">BPM</span>
            <input
              type="number"
              min={tempoRange.min}
              max={tempoRange.max}
              value={tempo}
              onChange={(e) => handleTempoChange(parseInt(e.target.value) || tempo)}
              className="w-12 bg-transparent text-vinyl-accent font-mono text-sm text-center focus:outline-none"
            />
          </div>
        </div>

        {/* Effects */}
        <div className="flex gap-2">
          <button
            onClick={() => handleToggleEffect("reverb")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-xs transition-all ${
              effects.reverb
                ? "bg-vinyl-accent/20 border-vinyl-accent text-vinyl-accent"
                : "border-vinyl-border text-vinyl-text-muted hover:border-vinyl-accent/50"
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Reverb</span>
          </button>
          <button
            onClick={() => handleToggleEffect("delay")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-xs transition-all ${
              effects.delay
                ? "bg-vinyl-accent/20 border-vinyl-accent text-vinyl-accent"
                : "border-vinyl-border text-vinyl-text-muted hover:border-vinyl-accent/50"
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Delay</span>
          </button>
          <button
            onClick={() => handleToggleEffect("filter")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-xs transition-all ${
              effects.filter
                ? "bg-vinyl-accent/20 border-vinyl-accent text-vinyl-accent"
                : "border-vinyl-border text-vinyl-text-muted hover:border-vinyl-accent/50"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
          {currentGenre === "lofi" && (
            <button
              onClick={() => handleToggleEffect("vinyl")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-xs transition-all ${
                effects.vinyl
                  ? "bg-vinyl-accent/20 border-vinyl-accent text-vinyl-accent"
                  : "border-vinyl-border text-vinyl-text-muted hover:border-vinyl-accent/50"
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              <span>Vinyl</span>
            </button>
          )}
        </div>

        {/* Play/Stop */}
        <div className="flex justify-center">
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 px-8 py-3 bg-vinyl-accent text-vinyl-bg rounded-full font-medium hover:bg-vinyl-accent-light transition-all transform hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5" fill="currentColor" />
              Generate
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-8 py-3 bg-red-500/20 text-red-400 border-2 border-red-500 rounded-full font-medium hover:bg-red-500/30 transition-all"
            >
              <Square className="w-5 h-5" fill="currentColor" />
              Stop
            </button>
          )}
        </div>

        {/* Info */}
        <p className="text-center text-xs text-vinyl-text-muted">
          {isPlaying ? `Playing ${currentGenreInfo?.name} • Bar ${currentBar + 1}` : "Tap Generate to start"}
        </p>
      </div>
    </div>
  );
}
