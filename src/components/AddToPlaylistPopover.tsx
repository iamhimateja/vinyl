import { useState, useRef, useEffect } from "react";
import { ListPlus, Plus, Check, Music, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scrollarea";
import type { Playlist } from "../types";
import { tooltipProps } from "./Tooltip";

interface AddToPlaylistPopoverProps {
  songId: string;
  playlists: Playlist[];
  onAddToPlaylist: (playlistId: string, songId: string) => void;
  onCreatePlaylist?: (name: string) => Promise<string | void>;
  trigger?: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
}

export function AddToPlaylistPopover({
  songId,
  playlists,
  onAddToPlaylist,
  onCreatePlaylist,
  trigger,
  align = "end",
  side = "bottom",
}: AddToPlaylistPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter out Favorites and filter by search query
  const availablePlaylists = playlists
    .filter((p) => p.name !== "Favorites")
    .filter((p) =>
      searchQuery
        ? p.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    );

  // Focus input when entering create mode
  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  // Focus search when opening with playlists
  useEffect(() => {
    if (isOpen && !isCreating && availablePlaylists.length > 3 && searchInputRef.current) {
      // Small delay to ensure popover is rendered
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, isCreating, availablePlaylists.length]);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setIsCreating(false);
      setNewPlaylistName("");
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || !onCreatePlaylist) return;

    setIsSubmitting(true);
    try {
      const result = await onCreatePlaylist(newPlaylistName.trim());
      // If the create function returns a playlist ID, add the song to it
      if (typeof result === "string") {
        onAddToPlaylist(result, songId);
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create playlist:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToPlaylist = (playlistId: string) => {
    onAddToPlaylist(playlistId, songId);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting) {
      handleCreatePlaylist();
    } else if (e.key === "Escape") {
      if (isCreating) {
        setIsCreating(false);
        setNewPlaylistName("");
      } else {
        setIsOpen(false);
      }
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <button
            className="p-1.5 rounded hover:bg-vinyl-border transition-colors text-vinyl-text-muted hover:text-vinyl-text"
            {...tooltipProps("Add to playlist")}
          >
            <ListPlus className="w-4 h-4" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        className="w-72 p-0 overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-vinyl-border bg-vinyl-border/20">
          <div className="flex items-center gap-2">
            <ListPlus className="w-4 h-4 text-vinyl-accent" />
            <span className="font-medium text-vinyl-text text-sm">
              {isCreating ? "New Playlist" : "Add to Playlist"}
            </span>
          </div>
        </div>

        {isCreating ? (
          /* Create new playlist form */
          <div className="p-4 space-y-3">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter playlist name..."
                className="w-full px-3 py-2.5 bg-vinyl-bg border border-vinyl-border rounded-lg text-vinyl-text text-sm placeholder:text-vinyl-text-muted focus:outline-none focus:ring-2 focus:ring-vinyl-accent focus:border-transparent"
                disabled={isSubmitting}
                autoComplete="off"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCreating(false);
                  setNewPlaylistName("");
                }}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim() || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-vinyl-bg/30 border-t-vinyl-bg rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create & Add
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Playlist selection */
          <div className="flex flex-col">
            {/* Search - only show if more than 3 playlists */}
            {availablePlaylists.length > 3 && (
              <div className="px-3 pt-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vinyl-text-muted" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search playlists..."
                    className="w-full pl-9 pr-8 py-2 bg-vinyl-bg border border-vinyl-border rounded-lg text-vinyl-text text-sm placeholder:text-vinyl-text-muted focus:outline-none focus:ring-2 focus:ring-vinyl-accent focus:border-transparent"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-vinyl-text-muted hover:text-vinyl-text"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Playlist list */}
            <ScrollArea className="max-h-64">
              <div className="p-2">
                {availablePlaylists.length === 0 ? (
                  <div className="py-6 text-center">
                    {searchQuery ? (
                      <>
                        <Search className="w-8 h-8 text-vinyl-text-muted mx-auto mb-2 opacity-50" />
                        <p className="text-sm text-vinyl-text-muted">
                          No playlists found
                        </p>
                      </>
                    ) : (
                      <>
                        <Music className="w-8 h-8 text-vinyl-text-muted mx-auto mb-2 opacity-50" />
                        <p className="text-sm text-vinyl-text-muted mb-1">
                          No playlists yet
                        </p>
                        <p className="text-xs text-vinyl-text-muted">
                          Create one to get started
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {availablePlaylists.map((playlist) => {
                      const isAlreadyAdded = playlist.songIds.includes(songId);
                      return (
                        <button
                          key={playlist.id}
                          onClick={() => handleAddToPlaylist(playlist.id)}
                          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors ${
                            isAlreadyAdded
                              ? "bg-vinyl-accent/10 text-vinyl-accent"
                              : "text-vinyl-text hover:bg-vinyl-border/50"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                              isAlreadyAdded
                                ? "bg-vinyl-accent/20"
                                : "bg-vinyl-border"
                            }`}
                          >
                            {isAlreadyAdded ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Music className="w-4 h-4 text-vinyl-text-muted" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {playlist.name}
                            </p>
                            <p className="text-xs text-vinyl-text-muted">
                              {playlist.songIds.length}{" "}
                              {playlist.songIds.length === 1 ? "song" : "songs"}
                              {isAlreadyAdded && " · Already added"}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Create new playlist button */}
            {onCreatePlaylist && (
              <div className="p-2 border-t border-vinyl-border">
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left text-vinyl-text hover:bg-vinyl-accent/10 hover:text-vinyl-accent transition-colors"
                >
                  <div className="w-8 h-8 rounded-md bg-vinyl-accent/20 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-4 h-4 text-vinyl-accent" />
                  </div>
                  <span className="text-sm font-medium">
                    Create new playlist
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
