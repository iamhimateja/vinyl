import { useRef, useState, useEffect, memo, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Music,
  Trash2,
  Play,
  Pause,
  Square,
  ListPlus,
  AlertTriangle,
  Heart,
} from "lucide-react";
import type { Song, Playlist } from "../types";
import { formatDuration } from "../lib/audioMetadata";
import { ConfirmDialog } from "./ConfirmDialog";
import { tooltipProps } from "./Tooltip";

interface VirtualizedSongListProps {
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
  unavailableSongIds?: Set<string>;
  onDeleteSong?: (songId: string) => void;
  favoriteSongIds?: Set<string>;
  onToggleFavorite?: (songId: string) => void;
  /** Skip delete confirmation dialog */
  skipDeleteConfirmation?: boolean;
  /** Callback when user chooses to skip confirmation */
  onSkipDeleteConfirmationChange?: (skip: boolean) => void;
}

// Props for the memoized song row component
interface SongRowProps {
  song: Song;
  isCurrentSong: boolean;
  isPlaying: boolean;
  isUnavailable: boolean;
  isFavorite: boolean;
  compact: boolean;
  playlists: Playlist[];
  showPlaylistMenu: boolean;
  onPlay: (song: Song) => void;
  onTogglePlayPause?: () => void;
  onStop?: () => void;
  onAddToPlaylist?: (songId: string, playlistId: string) => void;
  onTogglePlaylistMenu: (songId: string | null) => void;
  onToggleFavorite?: (songId: string) => void;
  onShowDeleteDialog: (songId: string) => void;
}

// Memoized song row component to prevent unnecessary re-renders
const SongRow = memo(function SongRow({
  song,
  isCurrentSong,
  isPlaying,
  isUnavailable,
  isFavorite,
  compact,
  playlists,
  showPlaylistMenu,
  onPlay,
  onTogglePlayPause,
  onStop,
  onAddToPlaylist,
  onTogglePlaylistMenu,
  onToggleFavorite,
  onShowDeleteDialog,
}: SongRowProps) {
  const isCurrentlyPlaying = isCurrentSong && isPlaying;

  // Unavailable song - show warning UI
  if (isUnavailable) {
    return (
      <div
        className={`group flex items-center gap-3 ${compact ? "p-2" : "p-3"} rounded-lg h-full bg-red-500/10 border border-red-500/30`}
      >
        {/* Warning icon */}
        <div
          className={`${compact ? "w-8 h-8" : "w-10 h-10"} flex items-center justify-center flex-shrink-0 rounded bg-red-500/20`}
        >
          <AlertTriangle
            className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-red-400`}
          />
        </div>

        {/* Song info */}
        <div className="flex-1 min-w-0">
          <p
            className={`${compact ? "text-sm" : ""} font-medium truncate text-red-400`}
          >
            {song.title}
          </p>
          <p className="text-xs text-red-400/70 truncate">
            Audio unavailable - re-import or delete
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowDeleteDialog(song.id);
            }}
            className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors text-red-400 text-sm font-medium"
            {...tooltipProps("Delete this track")}
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center gap-3 ${compact ? "p-2" : "p-3"} rounded-lg transition-colors cursor-pointer h-full ${
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
            loading="lazy"
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
            <Play className={`${compact ? "w-3 h-3" : "w-4 h-4"} text-white`} />
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

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {/* Favorite button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(song.id);
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
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
          </button>
        )}

        {/* Play/Pause button */}
        {!compact && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isCurrentSong && onTogglePlayPause) {
                onTogglePlayPause();
              } else {
                onPlay(song);
              }
            }}
            className="p-2 rounded-full hover:bg-vinyl-border transition-colors text-vinyl-text-muted hover:text-vinyl-accent"
            {...tooltipProps(isCurrentlyPlaying ? "Pause" : "Play")}
          >
            {isCurrentlyPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Stop button - only show when this song is current */}
        {!compact && isCurrentSong && onStop && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStop();
            }}
            className="p-2 rounded-full hover:bg-vinyl-border transition-colors text-vinyl-text-muted hover:text-vinyl-accent"
            {...tooltipProps("Stop")}
          >
            <Square className="w-4 h-4" />
          </button>
        )}

        {/* Add to playlist button */}
        {!compact && onAddToPlaylist && playlists.length > 0 && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePlaylistMenu(showPlaylistMenu ? null : song.id);
              }}
              className="p-2 rounded-full hover:bg-vinyl-border transition-colors text-vinyl-text-muted hover:text-vinyl-accent"
              {...tooltipProps("Add to playlist")}
            >
              <ListPlus className="w-4 h-4" />
            </button>

            {/* Playlist dropdown menu */}
            {showPlaylistMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePlaylistMenu(null);
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
                        onTogglePlaylistMenu(null);
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
        {!compact && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowDeleteDialog(song.id);
            }}
            className="p-2 rounded-full hover:bg-vinyl-border transition-colors text-vinyl-text-muted hover:text-red-400"
            {...tooltipProps("Delete")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Duration - at the end */}
      <span
        className={`${compact ? "text-xs" : "text-sm"} text-vinyl-text-muted flex-shrink-0 ml-2`}
      >
        {formatDuration(song.duration)}
      </span>
    </div>
  );
});

export function VirtualizedSongList({
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
  unavailableSongIds = new Set(),
  onDeleteSong,
  favoriteSongIds = new Set(),
  onToggleFavorite,
  skipDeleteConfirmation = false,
  onSkipDeleteConfirmationChange,
}: VirtualizedSongListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState<string | null>(null);
  const [deleteDialogSongId, setDeleteDialogSongId] = useState<string | null>(
    null,
  );
  const hasScrolledToCurrentRef = useRef(false);

  const songToDelete = deleteDialogSongId
    ? songs.find((s) => s.id === deleteDialogSongId)
    : null;

  const rowHeight = compact ? 48 : 64;

  const virtualizer = useVirtualizer({
    count: songs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  // Scroll to the current song on initial mount only
  useEffect(() => {
    if (hasScrolledToCurrentRef.current) return;

    if (currentSongId && songs.length > 0) {
      const currentIndex = songs.findIndex((s) => s.id === currentSongId);
      if (currentIndex >= 0) {
        hasScrolledToCurrentRef.current = true;
        // Small delay to ensure virtualizer is ready
        setTimeout(() => {
          virtualizer.scrollToIndex(currentIndex, { align: "center" });
        }, 100);
      }
    }
  }, [currentSongId, songs, virtualizer]);

  // Memoized callback for toggling playlist menu
  const handleTogglePlaylistMenu = useCallback((songId: string | null) => {
    setShowPlaylistMenu(songId);
  }, []);

  const handleShowDeleteDialog = useCallback(
    (songId: string) => {
      // If skip confirmation is enabled, delete immediately
      if (skipDeleteConfirmation) {
        if (onDeleteSong) {
          onDeleteSong(songId);
        } else {
          onDelete(songId);
        }
      } else {
        setDeleteDialogSongId(songId);
      }
    },
    [skipDeleteConfirmation, onDeleteSong, onDelete],
  );

  const handleConfirmDelete = useCallback(
    (dontAskAgain?: boolean) => {
      if (deleteDialogSongId) {
        // If user checked "don't ask again", save the preference
        if (dontAskAgain && onSkipDeleteConfirmationChange) {
          onSkipDeleteConfirmationChange(true);
        }

        if (onDeleteSong) {
          onDeleteSong(deleteDialogSongId);
        } else {
          onDelete(deleteDialogSongId);
        }
        setDeleteDialogSongId(null);
      }
    },
    [
      deleteDialogSongId,
      onDelete,
      onDeleteSong,
      onSkipDeleteConfirmationChange,
    ],
  );

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
    <>
      <div ref={parentRef} className="h-full overflow-auto">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const song = songs[virtualRow.index];
            const isCurrentSong = song.id === currentSongId;
            const isUnavailable = unavailableSongIds.has(song.id);
            const isFavorite = favoriteSongIds.has(song.id);

            return (
              <div
                key={song.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <SongRow
                  song={song}
                  isCurrentSong={isCurrentSong}
                  isPlaying={isPlaying}
                  isUnavailable={isUnavailable}
                  isFavorite={isFavorite}
                  compact={compact}
                  playlists={playlists}
                  showPlaylistMenu={showPlaylistMenu === song.id}
                  onPlay={onPlay}
                  onTogglePlayPause={onTogglePlayPause}
                  onStop={onStop}
                  onAddToPlaylist={onAddToPlaylist}
                  onTogglePlaylistMenu={handleTogglePlaylistMenu}
                  onToggleFavorite={onToggleFavorite}
                  onShowDeleteDialog={handleShowDeleteDialog}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deleteDialogSongId}
        title="Delete Song"
        message={`Are you sure you want to delete "${songToDelete?.title || "this song"}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        showDontAskAgain={!!onSkipDeleteConfirmationChange}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogSongId(null)}
      />
    </>
  );
}
