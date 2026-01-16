import { useState } from "react";
import { Music, Trash2, Play, Pause, Square, ListPlus } from "lucide-react";
import type { Song, Playlist } from "../types";
import { formatDuration } from "../lib/audioMetadata";
import { tooltipProps } from "./Tooltip";

interface SongListProps {
  songs: Song[];
  currentSongId: string | null;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
  onTogglePlayPause?: () => void;
  onStop?: () => void;
  onDelete: (songId: string) => void;
  compact?: boolean;
  playlists?: Playlist[];
  onAddToPlaylist?: (songId: string, playlistId: string) => void;
}

export function SongList({
  songs,
  currentSongId,
  isPlaying,
  onPlay,
  onTogglePlayPause,
  onStop,
  onDelete,
  compact = false,
  playlists = [],
  onAddToPlaylist,
}: SongListProps) {
  const [showPlaylistMenu, setShowPlaylistMenu] = useState<string | null>(null);
  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-vinyl-text-muted">
        <Music className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">No songs yet</p>
        <p className="text-sm">Import some music to get started</p>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-0.5" : "space-y-1"}>
      {songs.map((song) => {
        const isCurrentSong = song.id === currentSongId;
        const isCurrentlyPlaying = isCurrentSong && isPlaying;

        return (
          <div
            key={song.id}
            className={`group flex items-center gap-3 ${compact ? "p-2" : "p-3"} rounded-lg transition-colors cursor-pointer ${
              isCurrentSong
                ? "bg-vinyl-accent/20 text-vinyl-accent"
                : "hover:bg-vinyl-surface text-vinyl-text"
            }`}
            onClick={() => {
              if (!isCurrentSong) {
                onPlay(song);
              } else if (onTogglePlayPause) {
                onTogglePlayPause();
              }
            }}
          >
            {/* Album art or track number */}
            <div
              className={`${compact ? "w-8 h-8" : "w-10 h-10"} flex items-center justify-center flex-shrink-0 rounded overflow-hidden relative ${
                !song.coverArt ? "bg-vinyl-border" : ""
              }`}
            >
              {song.coverArt ? (
                <img
                  src={song.coverArt}
                  alt={song.album}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music
                  className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-vinyl-text-muted`}
                />
              )}

              {/* Playing indicator overlay */}
              {isCurrentlyPlaying && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="flex items-end gap-0.5 h-3">
                    <span
                      className="w-0.5 bg-vinyl-accent animate-bounce"
                      style={{ height: "60%", animationDelay: "0ms" }}
                    />
                    <span
                      className="w-0.5 bg-vinyl-accent animate-bounce"
                      style={{ height: "100%", animationDelay: "150ms" }}
                    />
                    <span
                      className="w-0.5 bg-vinyl-accent animate-bounce"
                      style={{ height: "40%", animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              )}

              {/* Paused indicator overlay */}
              {isCurrentSong && !isPlaying && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Pause
                    className={`${compact ? "w-3 h-3" : "w-4 h-4"} text-vinyl-accent`}
                  />
                </div>
              )}

              {/* Hover play indicator */}
              {!isCurrentSong && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play
                    className={`${compact ? "w-3 h-3" : "w-4 h-4"} text-white`}
                  />
                </div>
              )}
            </div>

            {/* Song info */}
            <div className="flex-1 min-w-0">
              <p
                className={`${compact ? "text-sm" : ""} font-medium truncate ${isCurrentSong ? "text-vinyl-accent" : ""}`}
              >
                {song.title}
              </p>
              {!compact && (
                <p className="text-sm text-vinyl-text-muted truncate">
                  {song.artist}{" "}
                  {song.album !== "Unknown Album" ? `• ${song.album}` : ""}
                </p>
              )}
              {compact && (
                <p className="text-xs text-vinyl-text-muted truncate">
                  {song.artist}
                </p>
              )}
            </div>

            {/* Duration */}
            <span
              className={`${compact ? "text-xs" : "text-sm"} text-vinyl-text-muted flex-shrink-0`}
            >
              {formatDuration(song.duration)}
            </span>

            {/* Action buttons - only show on non-compact mode */}
            {!compact && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Play/Pause button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isCurrentSong && onTogglePlayPause) {
                      onTogglePlayPause();
                    } else {
                      onPlay(song);
                    }
                  }}
                  className="p-1.5 rounded hover:bg-vinyl-border transition-colors text-vinyl-text-muted hover:text-vinyl-accent"
                  {...tooltipProps(isCurrentlyPlaying ? "Pause" : "Play")}
                >
                  {isCurrentlyPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>

                {/* Stop button - only show when this song is current */}
                {isCurrentSong && onStop && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStop();
                    }}
                    className="p-1.5 rounded hover:bg-vinyl-border transition-colors text-vinyl-text-muted hover:text-vinyl-accent"
                    {...tooltipProps("Stop")}
                  >
                    <Square className="w-4 h-4" />
                  </button>
                )}

                {/* Add to playlist button */}
                {onAddToPlaylist && playlists.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPlaylistMenu(
                          showPlaylistMenu === song.id ? null : song.id,
                        );
                      }}
                      className="p-1.5 rounded hover:bg-vinyl-border transition-colors text-vinyl-text-muted hover:text-vinyl-accent"
                      {...tooltipProps("Add to playlist")}
                    >
                      <ListPlus className="w-4 h-4" />
                    </button>

                    {/* Playlist dropdown menu */}
                    {showPlaylistMenu === song.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPlaylistMenu(null);
                          }}
                        />
                        <div className="absolute right-0 top-8 z-20 bg-vinyl-surface border border-vinyl-border rounded-lg shadow-xl py-1 min-w-[160px] max-h-48 overflow-y-auto">
                          <div className="px-3 py-1.5 text-xs text-vinyl-text-muted border-b border-vinyl-border">
                            Add to playlist
                          </div>
                          {playlists.map((playlist) => (
                            <button
                              key={playlist.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToPlaylist(song.id, playlist.id);
                                setShowPlaylistMenu(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-left text-vinyl-text hover:bg-vinyl-border/50 transition-colors text-sm"
                            >
                              {playlist.name}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(song.id);
                  }}
                  className="p-1.5 rounded hover:bg-vinyl-border transition-colors text-vinyl-text-muted hover:text-red-400"
                  {...tooltipProps("Delete")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
