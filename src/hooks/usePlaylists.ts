import { useState, useEffect, useCallback, useMemo } from "react";
import type { Playlist } from "../types";
import {
  getAllPlaylists,
  addPlaylist as dbAddPlaylist,
  deletePlaylist as dbDeletePlaylist,
  updatePlaylist as dbUpdatePlaylist,
  getPlaylist,
} from "../lib/db";
import { generateId } from "../lib/audioMetadata";

export const FAVORITES_PLAYLIST_NAME = "Favorites";

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load playlists on mount
  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      let allPlaylists = await getAllPlaylists();

      // Ensure Favorites playlist always exists
      const hasFavorites = allPlaylists.some(
        (p) => p.name === FAVORITES_PLAYLIST_NAME,
      );
      if (!hasFavorites) {
        const favoritesPlaylist: Playlist = {
          id: generateId(),
          name: FAVORITES_PLAYLIST_NAME,
          songIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await dbAddPlaylist(favoritesPlaylist);
        allPlaylists = [favoritesPlaylist, ...allPlaylists];
      }

      setPlaylists(allPlaylists.reverse());
    } catch (error) {
      console.error("Failed to load playlists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get or create the Favorites playlist
  const favoritesPlaylist = useMemo(() => {
    return playlists.find((p) => p.name === FAVORITES_PLAYLIST_NAME);
  }, [playlists]);

  // Favorite song IDs as a Set for quick lookup
  const favoriteSongIds = useMemo(() => {
    return new Set(favoritesPlaylist?.songIds || []);
  }, [favoritesPlaylist]);

  // Create new playlist
  const createPlaylist = useCallback(
    async (name: string, songIds: string[] = []): Promise<string> => {
      const playlist: Playlist = {
        id: generateId(),
        name,
        songIds,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await dbAddPlaylist(playlist);
      setPlaylists((prev) => [playlist, ...prev]);
      return playlist.id;
    },
    [],
  );

  // Delete playlist
  const deletePlaylist = useCallback(async (playlistId: string) => {
    await dbDeletePlaylist(playlistId);
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
  }, []);

  // Update playlist
  const updatePlaylist = useCallback(
    async (playlistId: string, updates: Partial<Playlist>) => {
      const playlist = await getPlaylist(playlistId);
      if (!playlist) return;

      const updated = { ...playlist, ...updates, updatedAt: Date.now() };
      await dbUpdatePlaylist(updated);
      setPlaylists((prev) =>
        prev.map((p) => (p.id === playlistId ? updated : p)),
      );
    },
    [],
  );

  // Add song to playlist
  const addSongToPlaylist = useCallback(
    async (playlistId: string, songId: string) => {
      const playlist = await getPlaylist(playlistId);
      if (!playlist) return;

      if (!playlist.songIds.includes(songId)) {
        const updated = {
          ...playlist,
          songIds: [...playlist.songIds, songId],
          updatedAt: Date.now(),
        };
        await dbUpdatePlaylist(updated);
        setPlaylists((prev) =>
          prev.map((p) => (p.id === playlistId ? updated : p)),
        );
      }
    },
    [],
  );

  // Remove song from playlist
  const removeSongFromPlaylist = useCallback(
    async (playlistId: string, songId: string) => {
      const playlist = await getPlaylist(playlistId);
      if (!playlist) return;

      const updated = {
        ...playlist,
        songIds: playlist.songIds.filter((id) => id !== songId),
        updatedAt: Date.now(),
      };
      await dbUpdatePlaylist(updated);
      setPlaylists((prev) =>
        prev.map((p) => (p.id === playlistId ? updated : p)),
      );
    },
    [],
  );

  // Add multiple songs to playlist
  const addSongsToPlaylist = useCallback(
    async (playlistId: string, songIds: string[]) => {
      const playlist = await getPlaylist(playlistId);
      if (!playlist) return;

      const newSongIds = songIds.filter((id) => !playlist.songIds.includes(id));
      if (newSongIds.length === 0) return;

      const updated = {
        ...playlist,
        songIds: [...playlist.songIds, ...newSongIds],
        updatedAt: Date.now(),
      };
      await dbUpdatePlaylist(updated);
      setPlaylists((prev) =>
        prev.map((p) => (p.id === playlistId ? updated : p)),
      );
    },
    [],
  );

  // Remove a song from ALL playlists
  const removeSongFromAllPlaylists = useCallback(
    async (songId: string) => {
      const updatedPlaylists: Playlist[] = [];

      for (const playlist of playlists) {
        if (playlist.songIds.includes(songId)) {
          const updated = {
            ...playlist,
            songIds: playlist.songIds.filter((id) => id !== songId),
            updatedAt: Date.now(),
          };
          await dbUpdatePlaylist(updated);
          updatedPlaylists.push(updated);
        }
      }

      if (updatedPlaylists.length > 0) {
        setPlaylists((prev) =>
          prev.map((p) => {
            const updated = updatedPlaylists.find((u) => u.id === p.id);
            return updated || p;
          }),
        );
      }
    },
    [playlists],
  );

  // Toggle favorite status for a song
  const toggleFavorite = useCallback(
    async (songId: string) => {
      const favorites = favoritesPlaylist;

      // Create Favorites playlist if it doesn't exist
      if (!favorites) {
        const newPlaylist: Playlist = {
          id: generateId(),
          name: FAVORITES_PLAYLIST_NAME,
          songIds: [songId],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await dbAddPlaylist(newPlaylist);
        setPlaylists((prev) => [newPlaylist, ...prev]);
        return;
      }

      // Toggle the song in favorites
      const isFavorite = favorites.songIds.includes(songId);
      const updated = {
        ...favorites,
        songIds: isFavorite
          ? favorites.songIds.filter((id) => id !== songId)
          : [...favorites.songIds, songId],
        updatedAt: Date.now(),
      };
      await dbUpdatePlaylist(updated);
      setPlaylists((prev) =>
        prev.map((p) => (p.id === favorites!.id ? updated : p)),
      );
    },
    [favoritesPlaylist],
  );

  return {
    playlists,
    isLoading,
    favoriteSongIds,
    createPlaylist,
    deletePlaylist,
    updatePlaylist,
    addSongToPlaylist,
    addSongsToPlaylist,
    removeSongFromPlaylist,
    removeSongFromAllPlaylists,
    toggleFavorite,
    refreshPlaylists: loadPlaylists,
  };
}
