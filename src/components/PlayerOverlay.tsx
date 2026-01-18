import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronDown,
  Music,
  ListMusic,
  SlidersHorizontal,
  X,
  Heart,
  Disc3,
  Image,
  Info,
  FolderOpen,
  Wand2,
} from "lucide-react";
import { formatDuration } from "../lib/audioMetadata";
import type { Song, Playlist, PlaybackState } from "../types";
import type { EqualizerBand, EqualizerPreset } from "../hooks/useEqualizer";
import type { VisualizerStyle } from "../hooks/useAudioVisualizer";
import { VinylPlayer } from "./VinylPlayer";
import { NowPlaying } from "./NowPlaying";
import { PlayerControls } from "./PlayerControls";
import { DraggableQueueList } from "./DraggableQueueList";
import { Equalizer } from "./Equalizer";
import { SleepTimer } from "./SleepTimer";
import { VisualizerToggle } from "./VisualizerStylePicker";
import { AudioVisualizer } from "./AudioVisualizer";
import { tooltipProps } from "./Tooltip";
import { ScrollArea } from "./ui";
import { GeneratorControls } from "./GeneratorControls";

interface PlayerOverlayProps {
  currentSong: Song | null;
  isPlaying: boolean;
  playbackState: PlaybackState;
  currentTime: number;
  duration: number;
  volume: number;
  repeat: "none" | "one" | "all";
  shuffle: boolean;
  speed: number;
  queueSongs: Song[];
  currentPlaylist: Playlist | null;
  showAlbumArt: boolean;
  isFavorite?: boolean;
  // Auto-expand to Now Playing view (e.g., when file opened from Finder)
  autoExpand?: boolean;
  onAutoExpandHandled?: () => void;
  // Equalizer props
  eqBands: EqualizerBand[];
  eqEnabled: boolean;
  eqPreset: string | null;
  eqConnected: boolean;
  onEqBandChange: (index: number, gain: number) => void;
  onEqPresetChange: (preset: EqualizerPreset) => void;
  onEqReset: () => void;
  onEqToggleEnabled: () => void;
  // Sleep timer props
  sleepTimerActive: boolean;
  sleepTimerRemainingTime: string;
  sleepTimerProgress: number;
  onSleepTimerStart: (seconds: number) => void;
  onSleepTimerStop: () => void;
  onSleepTimerAddTime: (seconds: number) => void;
  // Display mode
  displayMode: "vinyl" | "albumArt";
  onDisplayModeChange: (mode: "vinyl" | "albumArt") => void;
  // Generator callbacks (for when display mode is generator)
  onGeneratorPlay?: () => void;
  onRegisterGeneratorStop?: (stopFn: () => void) => void;
  // Visualizer props
  visualizerEnabled: boolean;
  visualizerStyle: VisualizerStyle;
  frequencyData: Uint8Array;
  waveformData: Uint8Array;
  onVisualizerToggle: () => void;
  onVisualizerStyleChange: (style: VisualizerStyle) => void;
  // Player callbacks
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleRepeat: () => void;
  onToggleShuffle: () => void;
  onSpeedChange: (speed: number) => void;
  onPlayFromQueue: (song: Song) => void;
  onStop: () => void;
  onDeleteFromQueue: (songId: string) => void;
  onReorderQueue: (fromIndex: number, toIndex: number) => void;
  onToggleFavorite?: () => void;
}

// Mini Player Component
function MiniPlayer({
  currentSong,
  isPlaying,
  progress,
  isVisible,
  speed,
  isFavorite,
  onExpand,
  onTogglePlayPause,
  onNext,
  onPrevious,
  onToggleFavorite,
}: {
  currentSong: Song;
  isPlaying: boolean;
  progress: number;
  isVisible: boolean;
  speed: number;
  isFavorite: boolean;
  onExpand: () => void;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleFavorite?: () => void;
}) {
  return (
    <div
      className={`fixed left-0 right-0 bottom-16 md:bottom-0 md:left-16 z-40 transition-transform duration-300 ease-out ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-vinyl-surface border-t border-vinyl-border shadow-lg">
        {/* Progress bar at top */}
        <div className="h-1 bg-vinyl-border">
          <div
            className="h-full bg-vinyl-accent transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Mini player content */}
        <div className="h-16 flex items-center gap-3 px-4">
          {/* Clickable area for expanding */}
          <div
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            onClick={onExpand}
          >
            {/* Album art */}
            <div className="w-10 h-10 rounded-lg bg-vinyl-border flex items-center justify-center flex-shrink-0 overflow-hidden">
              {currentSong.coverArt ? (
                <img
                  src={currentSong.coverArt}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music className="w-5 h-5 text-vinyl-text-muted" />
              )}
            </div>

            {/* Song info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-vinyl-text truncate">
                  {currentSong.title}
                </p>
                {/* Speed indicator - only show if not 1x */}
                {speed !== 1 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-vinyl-accent/20 text-vinyl-accent rounded font-medium flex-shrink-0">
                    {speed}x
                  </span>
                )}
              </div>
              <p className="text-xs text-vinyl-text-muted truncate">
                {currentSong.artist}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Favorite button */}
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className={`p-2 rounded-full transition-colors ${
                  isFavorite
                    ? "text-red-500 hover:text-red-400"
                    : "text-vinyl-text-muted hover:text-red-500"
                }`}
                {...tooltipProps(
                  isFavorite ? "Remove from favorites" : "Add to favorites",
                )}
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`}
                />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrevious();
              }}
              className="p-2 rounded-full text-vinyl-text hover:text-vinyl-accent hover:bg-vinyl-border/50 transition-colors"
              {...tooltipProps("Previous")}
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePlayPause();
              }}
              className="p-2.5 bg-vinyl-accent text-vinyl-bg rounded-full hover:bg-vinyl-accent-light transition-all"
              {...tooltipProps(isPlaying ? "Pause" : "Play")}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" fill="currentColor" />
              ) : (
                <Play className="w-5 h-5" fill="currentColor" />
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="p-2 rounded-full text-vinyl-text hover:text-vinyl-accent hover:bg-vinyl-border/50 transition-colors"
              {...tooltipProps("Next")}
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Expanded Now Playing Component
function ExpandedPlayer({
  isClosing,
  currentSong,
  isPlaying,
  playbackState,
  currentTime,
  duration,
  volume,
  repeat,
  shuffle,
  speed,
  queueSongs,
  currentPlaylist,
  showAlbumArt,
  showQueue,
  showEqualizer,
  isFavorite,
  eqBands,
  eqEnabled,
  eqPreset,
  eqConnected,
  // Sleep timer
  sleepTimerActive,
  sleepTimerRemainingTime,
  sleepTimerProgress,
  onSleepTimerStart,
  onSleepTimerStop,
  onSleepTimerAddTime,
  // Display mode
  displayMode,
  onDisplayModeChange,
  // Generator
  onGeneratorPlay,
  onRegisterGeneratorStop,
  // Visualizer
  visualizerEnabled,
  visualizerStyle,
  frequencyData,
  waveformData,
  onVisualizerToggle,
  onVisualizerStyleChange,
  onCollapse,
  onToggleQueue,
  onCloseQueue,
  onToggleEqualizer,
  onCloseEqualizer,
  onToggleFavorite,
  onEqBandChange,
  onEqPresetChange,
  onEqReset,
  onEqToggleEnabled,
  onTogglePlayPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onToggleRepeat,
  onToggleShuffle,
  onSpeedChange,
  onPlayFromQueue,
  onStop,
  onDeleteFromQueue,
  onReorderQueue,
}: {
  isClosing: boolean;
  currentSong: Song;
  isPlaying: boolean;
  playbackState: PlaybackState;
  currentTime: number;
  duration: number;
  volume: number;
  repeat: "none" | "one" | "all";
  shuffle: boolean;
  speed: number;
  queueSongs: Song[];
  currentPlaylist: Playlist | null;
  showAlbumArt: boolean;
  showQueue: boolean;
  showEqualizer: boolean;
  isFavorite: boolean;
  eqBands: EqualizerBand[];
  eqEnabled: boolean;
  eqPreset: string | null;
  eqConnected: boolean;
  // Sleep timer
  sleepTimerActive: boolean;
  sleepTimerRemainingTime: string;
  sleepTimerProgress: number;
  onSleepTimerStart: (seconds: number) => void;
  onSleepTimerStop: () => void;
  onSleepTimerAddTime: (seconds: number) => void;
  // Display mode
  displayMode: "vinyl" | "albumArt";
  onDisplayModeChange: (mode: "vinyl" | "albumArt") => void;
  // Generator
  onGeneratorPlay?: () => void;
  onRegisterGeneratorStop?: (stopFn: () => void) => void;
  // Visualizer
  visualizerEnabled: boolean;
  visualizerStyle: VisualizerStyle;
  frequencyData: Uint8Array;
  waveformData: Uint8Array;
  onVisualizerToggle: () => void;
  onVisualizerStyleChange: (style: VisualizerStyle) => void;
  onCollapse: () => void;
  onToggleQueue: () => void;
  onCloseQueue: () => void;
  onToggleEqualizer: () => void;
  onCloseEqualizer: () => void;
  onToggleFavorite?: () => void;
  onEqBandChange: (index: number, gain: number) => void;
  onEqPresetChange: (preset: EqualizerPreset) => void;
  onEqReset: () => void;
  onEqToggleEnabled: () => void;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleRepeat: () => void;
  onToggleShuffle: () => void;
  onSpeedChange: (speed: number) => void;
  onPlayFromQueue: (song: Song) => void;
  onStop: () => void;
  onDeleteFromQueue: (songId: string) => void;
  onReorderQueue: (fromIndex: number, toIndex: number) => void;
}) {
  const [showInfo, setShowInfo] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorPlaying, setGeneratorPlaying] = useState(false);
  const [generatorTempo, setGeneratorTempo] = useState(75);
  const [generatorFreqData, setGeneratorFreqData] = useState<Uint8Array>(new Uint8Array(128));
  const [generatorWaveData, setGeneratorWaveData] = useState<Uint8Array>(new Uint8Array(256));
  const startY = useRef<number | null>(null);
  
  // Callbacks for generator controls
  const handleGeneratorVisualizerData = (freqData: Uint8Array, waveData: Uint8Array) => {
    setGeneratorFreqData(freqData);
    setGeneratorWaveData(waveData);
  };
  
  const handleGeneratorPlayingChange = (playing: boolean) => {
    setGeneratorPlaying(playing);
  };
  
  const handleGeneratorTempoChange = (tempo: number) => {
    setGeneratorTempo(tempo);
  };
  
  // Use generator data for visualizer when generator is playing
  const activeFrequencyData = generatorPlaying ? generatorFreqData : frequencyData;
  const activeWaveformData = generatorPlaying ? generatorWaveData : waveformData;
  const visualizerActive = isPlaying || generatorPlaying;
  
  // Calculate speed for vinyl based on generator tempo (100 BPM = 1x speed)
  // This gives: 60 BPM = 0.6x, 100 BPM = 1x, 140 BPM = 1.4x, 180 BPM = 1.8x
  const effectiveSpeed = generatorPlaying ? generatorTempo / 100 : speed;
  const effectivePlaybackState = generatorPlaying ? "playing" : playbackState;
  
  // Hide generator controls and reset generator state when music starts playing from library/queue
  useEffect(() => {
    if (isPlaying && showGenerator) {
      setShowGenerator(false);
      setGeneratorPlaying(false);
    }
  }, [isPlaying]);
  
  // Also reset generator playing state when generator panel is hidden
  useEffect(() => {
    if (!showGenerator && generatorPlaying) {
      setGeneratorPlaying(false);
    }
  }, [showGenerator, generatorPlaying]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const diff = endY - startY.current;

    if (diff > 100) {
      onCollapse();
    }
    startY.current = null;
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 right-0 md:left-16 z-50 bg-vinyl-bg flex flex-col transition-transform duration-300 ease-out ${
        isClosing ? "animate-slideDown" : "animate-slideUp"
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background blur effect */}
      {currentSong.coverArt && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${currentSong.coverArt})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(60px) saturate(1.2)",
            transform: "scale(1.2)",
            opacity: 0.4,
          }}
        />
      )}
      <div className="absolute inset-0 z-0 bg-vinyl-bg/60" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 flex-shrink-0">
        <button
          onClick={onCollapse}
          className="p-2 rounded-full text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-surface/50 transition-colors"
          {...tooltipProps("Minimize")}
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center">
          <p className="text-xs text-vinyl-text-muted uppercase tracking-wider">
            Now Playing
          </p>
          {currentPlaylist && (
            <p className="text-xs text-vinyl-accent">{currentPlaylist.name}</p>
          )}
          {/* Speed indicator in header */}
          {speed !== 1 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-vinyl-accent/20 text-vinyl-accent rounded font-medium mt-1 inline-block">
              {speed}x speed
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Favorite button */}
          {onToggleFavorite && (
            <button
              onClick={onToggleFavorite}
              className={`p-2 rounded-full transition-colors ${
                isFavorite
                  ? "text-red-500 bg-red-500/20"
                  : "text-vinyl-text-muted hover:text-red-500 hover:bg-vinyl-surface/50"
              }`}
              {...tooltipProps(
                isFavorite ? "Remove from favorites" : "Add to favorites",
              )}
            >
              <Heart
                className={`w-6 h-6 ${isFavorite ? "fill-current" : ""}`}
              />
            </button>
          )}
          {/* Song Info */}
          <button
            onClick={() => {
              onCloseQueue();
              onCloseEqualizer();
              setShowInfo(!showInfo);
            }}
            className={`p-2 rounded-full transition-colors ${
              showInfo
                ? "text-vinyl-accent bg-vinyl-accent/20"
                : "text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-surface/50"
            }`}
            {...tooltipProps("Song Info")}
          >
            <Info className="w-5 h-5" />
          </button>
          {/* Display Mode Toggle */}
          <button
            onClick={() => {
              onDisplayModeChange(displayMode === "vinyl" ? "albumArt" : "vinyl");
            }}
            className="p-2 rounded-full transition-colors text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-surface/50"
            {...tooltipProps(displayMode === "vinyl" ? "Switch to Album Art" : "Switch to Vinyl")}
          >
            {displayMode === "vinyl" ? (
              <Image className="w-5 h-5" />
            ) : (
              <Disc3 className="w-5 h-5" />
            )}
          </button>
          {/* Generator Toggle */}
          <button
            onClick={() => setShowGenerator(!showGenerator)}
            className={`p-2 rounded-full transition-colors ${
              showGenerator
                ? "text-vinyl-accent bg-vinyl-accent/20"
                : "text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-surface/50"
            }`}
            {...tooltipProps(showGenerator ? "Hide Generator" : "Show Music Generator")}
          >
            <Wand2 className="w-5 h-5" />
          </button>
          {/* Sleep Timer */}
          <SleepTimer
            isActive={sleepTimerActive}
            remainingTime={sleepTimerRemainingTime}
            progress={sleepTimerProgress}
            onStart={onSleepTimerStart}
            onStop={onSleepTimerStop}
            onAddTime={onSleepTimerAddTime}
          />
          {/* Visualizer Toggle */}
          <VisualizerToggle
            enabled={visualizerEnabled}
            currentStyle={visualizerStyle}
            onToggle={onVisualizerToggle}
            onStyleChange={onVisualizerStyleChange}
          />
          <button
            onClick={() => {
              if (!showGenerator) {
                setShowInfo(false);
                onToggleEqualizer();
              }
            }}
            disabled={showGenerator}
            className={`p-2 rounded-full transition-colors ${
              showGenerator
                ? "text-vinyl-text-muted/30 cursor-not-allowed"
                : showEqualizer
                  ? "text-vinyl-accent bg-vinyl-accent/20"
                  : "text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-surface/50"
            }`}
            {...tooltipProps(showGenerator ? "Equalizer (disabled for generator)" : "Equalizer")}
          >
            <SlidersHorizontal className="w-6 h-6" />
          </button>
          <button
            onClick={() => {
              setShowInfo(false);
              onToggleQueue();
            }}
            className={`p-2 rounded-full transition-colors ${
              showQueue
                ? "text-vinyl-accent bg-vinyl-accent/20"
                : "text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-surface/50"
            }`}
            {...tooltipProps("Queue")}
          >
            <ListMusic className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative flex-1 flex flex-col overflow-auto min-h-0">
        {/* Background Visualizer - full screen behind content with gooey effect */}
        {visualizerEnabled && (
          <>
            <div
              className="absolute inset-0 z-0"
              style={{ filter: "contrast(3) brightness(1.1)" }}
            >
              <div className="w-full h-full" style={{ filter: "blur(18px)" }}>
                <AudioVisualizer
                  frequencyData={activeFrequencyData}
                  waveformData={activeWaveformData}
                  style={visualizerStyle}
                  isPlaying={visualizerActive}
                  height={800}
                  className="w-full h-full opacity-70"
                />
              </div>
            </div>
            {/* Tint overlay */}
            <div className="absolute inset-0 z-[1] bg-vinyl-bg/30" />
          </>
        )}

        {/* Main display area - Vinyl or Album Art with optional Generator */}
        <div className="relative z-[2] flex-1 flex flex-col items-center justify-center min-h-[250px] px-6">
          {/* Vinyl Player */}
          {displayMode === "vinyl" && (
            <VinylPlayer
              currentSong={currentSong}
              isPlaying={isPlaying || generatorPlaying}
              playbackState={effectivePlaybackState}
              speed={effectiveSpeed}
              showAlbumArt={showAlbumArt}
            />
          )}

          {/* Album Art Only */}
          {displayMode === "albumArt" && (
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-2xl bg-vinyl-surface">
              {currentSong.coverArt && !showGenerator ? (
                <img
                  src={currentSong.coverArt}
                  alt={currentSong.title}
                  className={`w-full h-full object-cover transition-transform duration-500 ${
                    (isPlaying || generatorPlaying) ? "scale-105" : "scale-100"
                  }`}
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center bg-vinyl-border ${generatorPlaying ? "animate-pulse" : ""}`}>
                  {showGenerator ? (
                    <Wand2 className="w-24 h-24 text-vinyl-accent" />
                  ) : (
                    <Music className="w-24 h-24 text-vinyl-text-muted" />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Song info and controls */}
        <div className="relative z-[2] w-full max-w-2xl mx-auto space-y-4 flex-shrink-0 px-6 pb-6">
          {/* Show song info only when generator is not playing */}
          {!showGenerator && <NowPlaying song={currentSong} />}
          
          {/* Generator Controls - shown when toggle is on */}
          {showGenerator && (
            <div className="bg-vinyl-surface/50 backdrop-blur-sm rounded-xl p-4 border border-vinyl-border">
              <GeneratorControls
                onGeneratorPlay={onGeneratorPlay}
                onRegisterStop={onRegisterGeneratorStop}
                onVisualizerData={handleGeneratorVisualizerData}
                onPlayingChange={handleGeneratorPlayingChange}
                onTempoChange={handleGeneratorTempoChange}
              />
            </div>
          )}
          
          {/* Show player controls only when generator is not playing */}
          {!showGenerator && (
            <PlayerControls
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              repeat={repeat}
              shuffle={shuffle}
              speed={speed}
              onTogglePlay={onTogglePlayPause}
              onNext={onNext}
              onPrevious={onPrevious}
              onSeek={onSeek}
              onVolumeChange={onVolumeChange}
              onToggleRepeat={onToggleRepeat}
              onToggleShuffle={onToggleShuffle}
              onSpeedChange={onSpeedChange}
              disabled={false}
            />
          )}
        </div>
      </div>

      {/* Drawer Backdrop */}
      {(showQueue || showEqualizer || showInfo) && (
        <div
          className="fixed inset-0 bg-black/40 z-50"
          onClick={() => {
            onCloseQueue();
            onCloseEqualizer();
            setShowInfo(false);
          }}
        />
      )}

      {/* Queue Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-vinyl-surface border-l border-vinyl-border z-50 transition-transform duration-300 ease-out shadow-2xl ${
          showQueue ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between p-4 border-b border-vinyl-border">
          <div>
            <h2 className="text-lg font-semibold text-vinyl-text">Queue</h2>
            <p className="text-xs text-vinyl-text-muted">
              {queueSongs.length} tracks
            </p>
          </div>
          <button
            onClick={onCloseQueue}
            className="p-2 rounded-full text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Queue list - draggable - only render when visible to avoid dnd-kit DOM issues */}
        <div className="h-[calc(100%-4.5rem)]">
          {showQueue && (
            <DraggableQueueList
              songs={queueSongs}
              currentSongId={currentSong.id}
              isPlaying={isPlaying}
              onPlay={onPlayFromQueue}
              onTogglePlayPause={onTogglePlayPause}
              onStop={onStop}
              onDelete={onDeleteFromQueue}
              onReorder={onReorderQueue}
            />
          )}
        </div>
      </div>

      {/* Equalizer Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-vinyl-surface border-l border-vinyl-border z-50 transition-transform duration-300 ease-out shadow-2xl ${
          showEqualizer ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between p-4 border-b border-vinyl-border">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-vinyl-accent" />
            <h2 className="text-lg font-semibold text-vinyl-text">Equalizer</h2>
          </div>
          <button
            onClick={onCloseEqualizer}
            className="p-2 rounded-full text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Equalizer content */}
        <ScrollArea className="p-4 h-[calc(100%-4.5rem)]">
          <Equalizer
            bands={eqBands}
            enabled={eqEnabled}
            currentPreset={eqPreset}
            isConnected={eqConnected}
            onBandChange={onEqBandChange}
            onPresetChange={onEqPresetChange}
            onReset={onEqReset}
            onToggleEnabled={onEqToggleEnabled}
          />
        </ScrollArea>
      </div>

      {/* Song Info Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-vinyl-surface border-l border-vinyl-border z-50 transition-transform duration-300 ease-out shadow-2xl ${
          showInfo ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between p-4 border-b border-vinyl-border">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-vinyl-accent" />
            <h2 className="text-lg font-semibold text-vinyl-text">Song Info</h2>
          </div>
          <button
            onClick={() => setShowInfo(false)}
            className="p-2 rounded-full text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Song Info content */}
        <ScrollArea className="p-4 h-[calc(100%-4.5rem)]">
          {/* Album Art */}
          <div className="flex justify-center mb-6">
            <div className="w-48 h-48 rounded-xl overflow-hidden shadow-lg bg-vinyl-border">
              {currentSong.coverArt ? (
                <img
                  src={currentSong.coverArt}
                  alt={currentSong.album}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-16 h-16 text-vinyl-text-muted" />
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-xs text-vinyl-text-muted uppercase tracking-wider">
                Title
              </label>
              <p className="text-vinyl-text font-medium mt-1">
                {currentSong.title}
              </p>
            </div>

            {/* Artist */}
            <div>
              <label className="text-xs text-vinyl-text-muted uppercase tracking-wider">
                Artist
              </label>
              <p className="text-vinyl-text mt-1">{currentSong.artist}</p>
            </div>

            {/* Album */}
            <div>
              <label className="text-xs text-vinyl-text-muted uppercase tracking-wider">
                Album
              </label>
              <p className="text-vinyl-text mt-1">{currentSong.album}</p>
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs text-vinyl-text-muted uppercase tracking-wider">
                Duration
              </label>
              <p className="text-vinyl-text mt-1">
                {formatDuration(currentSong.duration)}
              </p>
            </div>

            {/* File Name */}
            {currentSong.fileName && (
              <div>
                <label className="text-xs text-vinyl-text-muted uppercase tracking-wider">
                  File Name
                </label>
                <p className="text-vinyl-text mt-1 text-sm break-all">
                  {currentSong.fileName}
                </p>
              </div>
            )}

            {/* File Size */}
            {currentSong.fileSize && (
              <div>
                <label className="text-xs text-vinyl-text-muted uppercase tracking-wider">
                  File Size
                </label>
                <p className="text-vinyl-text mt-1">
                  {(currentSong.fileSize / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            )}

            {/* File Path */}
            {currentSong.filePath && (
              <div>
                <label className="text-xs text-vinyl-text-muted uppercase tracking-wider">
                  File Path
                </label>
                <p className="text-vinyl-text mt-1 text-sm break-all">
                  {currentSong.filePath}
                </p>
              </div>
            )}

            {/* Added Date */}
            <div>
              <label className="text-xs text-vinyl-text-muted uppercase tracking-wider">
                Added
              </label>
              <p className="text-vinyl-text mt-1">
                {new Date(currentSong.addedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Open in Finder button - only show if file path exists */}
            {currentSong.filePath && (
              <div className="pt-4 border-t border-vinyl-border">
                <button
                  onClick={() => {
                    // Use Electron API to open in file manager
                    if (window.electron?.showItemInFolder) {
                      window.electron.showItemInFolder(currentSong.filePath!);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-vinyl-border hover:bg-vinyl-border/70 text-vinyl-text rounded-lg transition-colors"
                >
                  <FolderOpen className="w-5 h-5" />
                  <span>Show in File Manager</span>
                </button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export function PlayerOverlay({
  currentSong,
  isPlaying,
  playbackState,
  currentTime,
  duration,
  volume,
  repeat,
  shuffle,
  speed,
  queueSongs,
  currentPlaylist,
  showAlbumArt,
  isFavorite = false,
  eqBands,
  eqEnabled,
  eqPreset,
  eqConnected,
  onEqBandChange,
  onEqPresetChange,
  onEqReset,
  onEqToggleEnabled,
  // Sleep timer
  sleepTimerActive,
  sleepTimerRemainingTime,
  sleepTimerProgress,
  onSleepTimerStart,
  onSleepTimerStop,
  onSleepTimerAddTime,
  // Display mode
  displayMode,
  onDisplayModeChange,
  // Generator
  onGeneratorPlay,
  onRegisterGeneratorStop,
  // Visualizer
  visualizerEnabled,
  visualizerStyle,
  frequencyData,
  waveformData,
  onVisualizerToggle,
  onVisualizerStyleChange,
  onTogglePlayPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onToggleRepeat,
  onToggleShuffle,
  onSpeedChange,
  onPlayFromQueue,
  onStop,
  onDeleteFromQueue,
  onReorderQueue,
  onToggleFavorite,
  autoExpand,
  onAutoExpandHandled,
}: PlayerOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Auto-expand when file is opened from Finder/Explorer
  useEffect(() => {
    if (autoExpand && currentSong && !isExpanded) {
      setIsClosing(false);
      setIsExpanded(true);
      // Notify parent that we handled the auto-expand
      onAutoExpandHandled?.();
    }
  }, [autoExpand, currentSong, isExpanded, onAutoExpandHandled]);

  // Collapse expanded player when route changes
  useEffect(() => {
    if (isExpanded && !isClosing) {
      handleCollapse();
    }
  }, [location.pathname]);

  // Show/hide the mini player based on whether there's a current song
  useEffect(() => {
    if (currentSong) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setIsExpanded(false);
      setIsClosing(false);
      setShowQueue(false);
      setShowEqualizer(false);
    }
  }, [currentSong]);

  const handleExpand = () => {
    setIsClosing(false);
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    setShowQueue(false);
    setShowEqualizer(false);
    setIsClosing(true);
    // Wait for animation to complete before hiding
    setTimeout(() => {
      setIsExpanded(false);
      setIsClosing(false);
    }, 280);
  };

  // Don't render anything if no song
  if (!currentSong) {
    return null;
  }

  return (
    <>
      {/* Mini Player - only show when not expanded */}
      {!isExpanded && (
        <MiniPlayer
          currentSong={currentSong}
          isPlaying={isPlaying}
          progress={progress}
          isVisible={isVisible}
          speed={speed}
          isFavorite={isFavorite}
          onExpand={handleExpand}
          onTogglePlayPause={onTogglePlayPause}
          onNext={onNext}
          onPrevious={onPrevious}
          onToggleFavorite={onToggleFavorite}
        />
      )}

      {/* Expanded Now Playing View */}
      {isExpanded && (
        <ExpandedPlayer
          isClosing={isClosing}
          currentSong={currentSong}
          isPlaying={isPlaying}
          playbackState={playbackState}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          repeat={repeat}
          shuffle={shuffle}
          speed={speed}
          queueSongs={queueSongs}
          currentPlaylist={currentPlaylist}
          showAlbumArt={showAlbumArt}
          showQueue={showQueue}
          showEqualizer={showEqualizer}
          isFavorite={isFavorite}
          eqBands={eqBands}
          eqEnabled={eqEnabled}
          eqPreset={eqPreset}
          eqConnected={eqConnected}
          sleepTimerActive={sleepTimerActive}
          sleepTimerRemainingTime={sleepTimerRemainingTime}
          sleepTimerProgress={sleepTimerProgress}
          onSleepTimerStart={onSleepTimerStart}
          onSleepTimerStop={onSleepTimerStop}
          onSleepTimerAddTime={onSleepTimerAddTime}
          displayMode={displayMode}
          onGeneratorPlay={onGeneratorPlay}
          onRegisterGeneratorStop={onRegisterGeneratorStop}
          onDisplayModeChange={onDisplayModeChange}
          visualizerEnabled={visualizerEnabled}
          visualizerStyle={visualizerStyle}
          frequencyData={frequencyData}
          waveformData={waveformData}
          onVisualizerToggle={onVisualizerToggle}
          onVisualizerStyleChange={onVisualizerStyleChange}
          onCollapse={handleCollapse}
          onToggleQueue={() => {
            setShowEqualizer(false);
            setShowQueue(!showQueue);
          }}
          onCloseQueue={() => setShowQueue(false)}
          onToggleEqualizer={() => {
            setShowQueue(false);
            setShowEqualizer(!showEqualizer);
          }}
          onCloseEqualizer={() => setShowEqualizer(false)}
          onToggleFavorite={onToggleFavorite}
          onEqBandChange={onEqBandChange}
          onEqPresetChange={onEqPresetChange}
          onEqReset={onEqReset}
          onEqToggleEnabled={onEqToggleEnabled}
          onTogglePlayPause={onTogglePlayPause}
          onNext={onNext}
          onPrevious={onPrevious}
          onSeek={onSeek}
          onVolumeChange={onVolumeChange}
          onToggleRepeat={onToggleRepeat}
          onToggleShuffle={onToggleShuffle}
          onSpeedChange={onSpeedChange}
          onPlayFromQueue={onPlayFromQueue}
          onStop={onStop}
          onDeleteFromQueue={onDeleteFromQueue}
          onReorderQueue={onReorderQueue}
        />
      )}
    </>
  );
}
