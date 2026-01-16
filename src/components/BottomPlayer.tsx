import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronUp,
  ChevronDown,
  Music,
  ListMusic,
  Heart,
} from "lucide-react";
import type { Song, Playlist } from "../types";
import { formatDuration } from "../lib/audioMetadata";
import { VirtualizedSongList } from "./VirtualizedSongList";
import { tooltipProps } from "./Tooltip";

interface BottomPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  songs: Song[];
  queueSongs: Song[];
  currentPlaylist?: Playlist | null;
  isFavorite?: boolean;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onPlayFromQueue: (song: Song) => void;
  onStop: () => void;
  onDeleteSong: (songId: string) => void;
  onToggleFavorite?: () => void;
}

export function BottomPlayer({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  songs,
  queueSongs,
  currentPlaylist,
  isFavorite = false,
  onTogglePlayPause,
  onNext,
  onPrevious,
  onSeek,
  onPlayFromQueue,
  onStop,
  onDeleteSong,
  onToggleFavorite,
}: BottomPlayerProps) {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Collapse on route change
  useEffect(() => {
    setIsExpanded(false);
  }, [location.pathname]);

  // Collapse on click outside
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    // Use setTimeout to avoid immediate collapse from the same click that expanded it
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  // Don't render if no songs in library
  if (songs.length === 0) {
    return null;
  }

  // Use queue songs if available, otherwise use all songs
  const displaySongs = queueSongs.length > 0 ? queueSongs : songs;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = (parseFloat(e.target.value) / 100) * duration;
    onSeek(time);
  };

  return (
    <div
      ref={containerRef}
      className={`fixed left-0 right-0 bottom-16 md:bottom-0 md:left-16 bg-vinyl-surface transition-all duration-300 z-40 ${
        isExpanded ? "h-80" : "h-16"
      }`}
    >
      {/* Progress bar at top border with glow effect */}
      <div
        className="top-progress-container absolute top-0 left-0 right-0 z-10"
        style={
          {
            "--progress": `${progress}%`,
          } as React.CSSProperties
        }
      >
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeekChange}
          disabled={!currentSong}
          className="top-progress-slider"
        />
      </div>

      {/* Main player bar */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-vinyl-border">
        {/* Song info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Album art / icon */}
          <div className="w-10 h-10 rounded-lg bg-vinyl-border flex items-center justify-center flex-shrink-0 overflow-hidden">
            {currentSong?.coverArt ? (
              <img
                src={currentSong.coverArt}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music className="w-5 h-5 text-vinyl-text-muted" />
            )}
          </div>

          {/* Title and artist */}
          <div className="min-w-0 flex-1">
            {currentSong ? (
              <>
                <p className="text-sm font-medium text-vinyl-text truncate">
                  {currentSong.title}
                </p>
                <p className="text-xs text-vinyl-text-muted truncate">
                  {currentSong.artist}
                  {currentPlaylist && (
                    <span className="ml-2 text-vinyl-accent">
                      • {currentPlaylist.name}
                    </span>
                  )}
                </p>
              </>
            ) : (
              <p className="text-sm text-vinyl-text-muted">No song playing</p>
            )}
          </div>
        </div>

        {/* Time display */}
        <div className="hidden sm:flex items-center gap-1 text-xs text-vinyl-text-muted">
          <span>{formatDuration(currentTime)}</span>
          <span>/</span>
          <span>{formatDuration(duration)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {/* Favorite button */}
          {onToggleFavorite && currentSong && (
            <button
              onClick={onToggleFavorite}
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
            onClick={onPrevious}
            disabled={!currentSong}
            className="p-2 rounded-full text-vinyl-text hover:text-vinyl-accent hover:bg-vinyl-border transition-colors disabled:opacity-50"
            {...tooltipProps("Previous")}
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={onTogglePlayPause}
            disabled={songs.length === 0}
            className="p-2 bg-vinyl-accent text-vinyl-bg rounded-full hover:bg-vinyl-accent-light transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none"
            {...tooltipProps(isPlaying ? "Pause" : "Play")}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" fill="currentColor" />
            ) : (
              <Play className="w-5 h-5" fill="currentColor" />
            )}
          </button>

          <button
            onClick={onNext}
            disabled={!currentSong}
            className="p-2 rounded-full text-vinyl-text hover:text-vinyl-accent hover:bg-vinyl-border transition-colors disabled:opacity-50"
            {...tooltipProps("Next")}
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Queue toggle button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 p-2 rounded-full text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-border transition-colors ml-2"
          {...tooltipProps(isExpanded ? "Collapse queue" : "Expand queue")}
        >
          <ListMusic className="w-4 h-4" />
          <span className="text-xs hidden sm:inline">
            {displaySongs.length} tracks
          </span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Expanded queue section */}
      {isExpanded && (
        <div className="h-[calc(100%-4rem)] px-2 py-2 animate-fade-in">
          <div className="flex items-center justify-between px-2 pb-2 border-b border-vinyl-border mb-2">
            <h3 className="text-sm font-medium text-vinyl-text">
              Queue ({displaySongs.length})
            </h3>
            {currentPlaylist && (
              <span className="text-xs text-vinyl-accent flex items-center gap-1">
                <ListMusic className="w-3 h-3" />
                {currentPlaylist.name}
              </span>
            )}
          </div>
          <div className="h-[calc(100%-2.5rem)]">
            <VirtualizedSongList
              songs={displaySongs}
              currentSongId={currentSong?.id || null}
              isPlaying={isPlaying}
              onPlay={onPlayFromQueue}
              onTogglePlayPause={onTogglePlayPause}
              onStop={onStop}
              onDelete={onDeleteSong}
              compact
            />
          </div>
        </div>
      )}
    </div>
  );
}
