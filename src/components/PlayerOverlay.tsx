import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import type { Song, Playlist, PlaybackState } from "../types";
import type { EqualizerBand, EqualizerPreset } from "../hooks/useEqualizer";
import { VinylPlayer } from "./VinylPlayer";
import { NowPlaying } from "./NowPlaying";
import { PlayerControls } from "./PlayerControls";
import { VirtualizedSongList } from "./VirtualizedSongList";
import { Equalizer } from "./Equalizer";
import { tooltipProps } from "./Tooltip";

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
  // Equalizer props
  eqBands: EqualizerBand[];
  eqEnabled: boolean;
  eqPreset: string | null;
  eqConnected: boolean;
  onEqBandChange: (index: number, gain: number) => void;
  onEqPresetChange: (preset: EqualizerPreset) => void;
  onEqReset: () => void;
  onEqToggleEnabled: () => void;
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
      className={`fixed left-0 right-0 bottom-16 md:bottom-0 md:left-64 z-40 transition-transform duration-300 ease-out ${
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
}: {
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
}) {
  const startY = useRef<number | null>(null);

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
      className="fixed inset-0 z-50 bg-vinyl-bg flex flex-col transition-transform duration-300 ease-out"
      style={{ animation: "slideUp 0.3s ease-out forwards" }}
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
          <button
            onClick={onToggleEqualizer}
            className={`p-2 rounded-full transition-colors ${
              showEqualizer
                ? "text-vinyl-accent bg-vinyl-accent/20"
                : "text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-surface/50"
            }`}
            {...tooltipProps("Equalizer")}
          >
            <SlidersHorizontal className="w-6 h-6" />
          </button>
          <button
            onClick={onToggleQueue}
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
      <div className="relative z-10 flex-1 flex flex-col px-6 pb-6 overflow-auto min-h-0">
        {/* Vinyl player */}
        <div className="flex-1 flex items-center justify-center min-h-[250px]">
          <VinylPlayer
            currentSong={currentSong}
            isPlaying={isPlaying}
            playbackState={playbackState}
            speed={speed}
            showAlbumArt={showAlbumArt}
          />
        </div>

        {/* Song info and controls */}
        <div className="w-full max-w-2xl mx-auto space-y-4 flex-shrink-0">
          <NowPlaying song={currentSong} />
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
        </div>
      </div>

      {/* Drawer Backdrop */}
      {(showQueue || showEqualizer) && (
        <div
          className="fixed inset-0 bg-black/40 z-50"
          onClick={() => {
            onCloseQueue();
            onCloseEqualizer();
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

        {/* Queue list */}
        <div className="h-[calc(100%-4.5rem)] p-2">
          <VirtualizedSongList
            songs={queueSongs}
            currentSongId={currentSong.id}
            isPlaying={isPlaying}
            onPlay={onPlayFromQueue}
            onTogglePlayPause={onTogglePlayPause}
            onStop={onStop}
            onDelete={onDeleteFromQueue}
            compact
          />
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
        <div className="p-4 overflow-auto h-[calc(100%-4.5rem)]">
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
        </div>
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
  onToggleFavorite,
}: PlayerOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Show/hide the mini player based on whether there's a current song
  useEffect(() => {
    if (currentSong) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setIsExpanded(false);
      setShowQueue(false);
      setShowEqualizer(false);
    }
  }, [currentSong]);

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    setShowQueue(false);
    setShowEqualizer(false);
    setIsExpanded(false);
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
        />
      )}
    </>
  );
}
