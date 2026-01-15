import { useState } from "react";
import {
  ListMusic,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Play,
  Pause,
  Square,
  Shuffle,
  Heart,
} from "lucide-react";
import type { Playlist, Song } from "../types";
import { ConfirmDialog } from "./ConfirmDialog";
import { tooltipProps } from "./Tooltip";
import { FAVORITES_PLAYLIST_NAME } from "../hooks/usePlaylists";

interface PlaylistViewProps {
  playlists: Playlist[];
  songs: Song[];
  currentPlaylistId?: string | null;
  isPlaying?: boolean;
  onCreatePlaylist: (name: string) => Promise<void>;
  onDeletePlaylist: (id: string) => Promise<void>;
  onUpdatePlaylist: (id: string, updates: Partial<Playlist>) => Promise<void>;
  onSelectPlaylist: (playlist: Playlist) => void;
  onPlayPlaylist?: (playlist: Playlist) => void;
  onShufflePlaylist?: (playlist: Playlist) => void;
  onStopPlaylist?: () => void;
}

export function PlaylistView({
  playlists,
  songs,
  currentPlaylistId,
  isPlaying = false,
  onCreatePlaylist,
  onDeletePlaylist,
  onUpdatePlaylist,
  onSelectPlaylist,
  onPlayPlaylist,
  onShufflePlaylist,
  onStopPlaylist,
}: PlaylistViewProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deletePlaylistId, setDeletePlaylistId] = useState<string | null>(null);

  const playlistToDelete = deletePlaylistId
    ? playlists.find((p) => p.id === deletePlaylistId)
    : null;

  const handleCreate = async () => {
    if (newName.trim()) {
      await onCreatePlaylist(newName.trim());
      setNewName("");
      setIsCreating(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (editName.trim()) {
      await onUpdatePlaylist(id, { name: editName.trim() });
      setEditingId(null);
      setEditName("");
    }
  };

  const getSongCount = (playlist: Playlist) => {
    return playlist.songIds.filter((id) => songs.find((s) => s.id === id))
      .length;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-vinyl-text">Playlists</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-vinyl-border/50 hover:bg-vinyl-border rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New
        </button>
      </div>

      {/* Create playlist input */}
      {isCreating && (
        <div className="flex items-center gap-2 p-3 bg-vinyl-surface rounded-lg animate-fade-in">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Playlist name"
            className="flex-1 bg-transparent border-none outline-none text-vinyl-text placeholder-vinyl-text-muted"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setIsCreating(false);
            }}
          />
          <button
            onClick={handleCreate}
            className="p-2 text-green-400 hover:bg-vinyl-border rounded-full transition-colors"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCreating(false)}
            className="p-2 text-vinyl-text-muted hover:bg-vinyl-border rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Playlist items */}
      {playlists.length === 0 && !isCreating ? (
        <div className="flex flex-col items-center py-8 text-vinyl-text-muted">
          <ListMusic className="w-12 h-12 mb-2 opacity-50" />
          <p>No playlists yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {playlists.map((playlist) => {
            const isEditing = editingId === playlist.id;
            const isCurrentPlaylist = currentPlaylistId === playlist.id;
            const isCurrentlyPlaying = isCurrentPlaylist && isPlaying;
            const isFavoritesPlaylist =
              playlist.name === FAVORITES_PLAYLIST_NAME;

            return (
              <div
                key={playlist.id}
                className={`group flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                  isCurrentPlaylist
                    ? "bg-vinyl-accent/20"
                    : "hover:bg-vinyl-surface"
                }`}
                onClick={() => !isEditing && onSelectPlaylist(playlist)}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isCurrentPlaylist ? "bg-vinyl-accent/30" : "bg-vinyl-border"
                  }`}
                >
                  {isCurrentlyPlaying ? (
                    <div className="flex items-end gap-0.5 h-4">
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
                  ) : isFavoritesPlaylist ? (
                    <Heart
                      className={`w-5 h-5 ${isCurrentPlaylist ? "text-red-500" : "text-red-500"} fill-current`}
                    />
                  ) : (
                    <ListMusic
                      className={`w-5 h-5 ${isCurrentPlaylist ? "text-vinyl-accent" : "text-vinyl-accent"}`}
                    />
                  )}
                </div>

                {isEditing ? (
                  <div
                    className="flex-1 flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none text-vinyl-text"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEdit(playlist.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <button
                      onClick={() => handleEdit(playlist.id)}
                      className="p-2 text-green-400 hover:bg-vinyl-border rounded-full transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 text-vinyl-text-muted hover:bg-vinyl-border rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium truncate ${isCurrentPlaylist ? "text-vinyl-accent" : "text-vinyl-text"}`}
                      >
                        {playlist.name}
                      </p>
                      <p className="text-sm text-vinyl-text-muted">
                        {getSongCount(playlist)} songs
                      </p>
                    </div>

                    {/* Action icons - all visible by default */}
                    <div className="flex items-center gap-1">
                      {/* Shuffle button */}
                      {onShufflePlaylist && getSongCount(playlist) > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onShufflePlaylist(playlist);
                          }}
                          className="p-2 rounded-full hover:bg-vinyl-border transition-colors text-vinyl-text-muted hover:text-vinyl-accent"
                          {...tooltipProps("Shuffle playlist")}
                        >
                          <Shuffle className="w-4 h-4" />
                        </button>
                      )}

                      {/* Play/Pause button */}
                      {onPlayPlaylist && getSongCount(playlist) > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isCurrentlyPlaying && onStopPlaylist) {
                              // If currently playing, toggle to pause behavior
                              onStopPlaylist();
                            } else {
                              onPlayPlaylist(playlist);
                            }
                          }}
                          className={`p-2 rounded-full hover:bg-vinyl-border transition-colors ${
                            isCurrentlyPlaying
                              ? "text-vinyl-accent"
                              : "text-vinyl-text-muted hover:text-vinyl-accent"
                          }`}
                          {...tooltipProps(
                            isCurrentlyPlaying ? "Pause" : "Play playlist",
                          )}
                        >
                          {isCurrentlyPlaying ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      {/* Stop button - only show when this playlist is current */}
                      {isCurrentPlaylist && onStopPlaylist && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStopPlaylist();
                          }}
                          className="p-2 rounded-full hover:bg-vinyl-border transition-colors text-vinyl-text-muted hover:text-vinyl-accent"
                          {...tooltipProps("Stop")}
                        >
                          <Square className="w-4 h-4" />
                        </button>
                      )}

                      {/* Rename button - hidden for Favorites */}
                      {!isFavoritesPlaylist && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(playlist.id);
                            setEditName(playlist.name);
                          }}
                          className="p-2 rounded-full hover:bg-vinyl-border transition-colors text-vinyl-text-muted hover:text-vinyl-text"
                          {...tooltipProps("Rename")}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Delete button - hidden for Favorites */}
                      {!isFavoritesPlaylist && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletePlaylistId(playlist.id);
                          }}
                          className="p-2 rounded-full hover:bg-vinyl-border transition-colors text-vinyl-text-muted hover:text-red-400"
                          {...tooltipProps("Delete")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deletePlaylistId}
        title="Delete Playlist"
        message={`Are you sure you want to delete "${playlistToDelete?.name || "this playlist"}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (deletePlaylistId) {
            onDeletePlaylist(deletePlaylistId);
            setDeletePlaylistId(null);
          }
        }}
        onCancel={() => setDeletePlaylistId(null)}
      />
    </div>
  );
}
