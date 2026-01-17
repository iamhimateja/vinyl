import { openDB } from "idb";
import type { DBSchema, IDBPDatabase } from "idb";
import type { Song, Playlist, PlayerState } from "../types";

interface VinylDB extends DBSchema {
  songs: {
    key: string;
    value: Song;
    indexes: {
      "by-title": string;
      "by-artist": string;
      "by-album": string;
      "by-addedAt": number;
    };
  };
  playlists: {
    key: string;
    value: Playlist;
    indexes: {
      "by-name": string;
      "by-createdAt": number;
    };
  };
  playerState: {
    key: string;
    value: PlayerState;
  };
}

const DB_NAME = "vinyl-music-player";
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<VinylDB>> | null = null;

export async function getDB(): Promise<IDBPDatabase<VinylDB>> {
  if (!dbPromise) {
    dbPromise = openDB<VinylDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Songs store
        if (!db.objectStoreNames.contains("songs")) {
          const songStore = db.createObjectStore("songs", { keyPath: "id" });
          songStore.createIndex("by-title", "title");
          songStore.createIndex("by-artist", "artist");
          songStore.createIndex("by-album", "album");
          songStore.createIndex("by-addedAt", "addedAt");
        }

        // Playlists store
        if (!db.objectStoreNames.contains("playlists")) {
          const playlistStore = db.createObjectStore("playlists", {
            keyPath: "id",
          });
          playlistStore.createIndex("by-name", "name");
          playlistStore.createIndex("by-createdAt", "createdAt");
        }

        // Player state store
        if (!db.objectStoreNames.contains("playerState")) {
          db.createObjectStore("playerState", { keyPath: "id" });
        }

        // Clean up old audioBlobs store if it exists (no longer needed)
        // Using type assertion because audioBlobs is no longer in our schema
        if (db.objectStoreNames.contains("audioBlobs" as never)) {
          db.deleteObjectStore("audioBlobs" as never);
        }
      },
    });
  }
  return dbPromise;
}

// Song operations
export async function addSong(song: Song): Promise<void> {
  const db = await getDB();
  await db.put("songs", song);
}

// Batch add multiple songs in a single transaction (more efficient for imports)
export async function addSongs(songs: Song[]): Promise<void> {
  if (songs.length === 0) return;
  
  const db = await getDB();
  const tx = db.transaction("songs", "readwrite");
  
  await Promise.all([
    ...songs.map(song => tx.store.put(song)),
    tx.done
  ]);
}

export async function getSong(id: string): Promise<Song | undefined> {
  const db = await getDB();
  return db.get("songs", id);
}

export async function getAllSongs(): Promise<Song[]> {
  const db = await getDB();
  return db.getAllFromIndex("songs", "by-addedAt");
}

export async function deleteSong(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("songs", id);
}

// Update song metadata
export async function updateSong(song: Song): Promise<void> {
  const db = await getDB();
  await db.put("songs", song);
}

// Playlist operations
export async function addPlaylist(playlist: Playlist): Promise<void> {
  const db = await getDB();
  await db.put("playlists", playlist);
}

export async function getPlaylist(id: string): Promise<Playlist | undefined> {
  const db = await getDB();
  return db.get("playlists", id);
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  const db = await getDB();
  return db.getAllFromIndex("playlists", "by-createdAt");
}

export async function deletePlaylist(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("playlists", id);
}

export async function updatePlaylist(playlist: Playlist): Promise<void> {
  const db = await getDB();
  playlist.updatedAt = Date.now();
  await db.put("playlists", playlist);
}

// Player state operations
const PLAYER_STATE_KEY = "current";

export async function savePlayerState(state: PlayerState): Promise<void> {
  const db = await getDB();
  await db.put("playerState", {
    ...state,
    id: PLAYER_STATE_KEY,
  } as PlayerState & { id: string });
}

export async function getPlayerState(): Promise<PlayerState | undefined> {
  const db = await getDB();
  const state = await db.get("playerState", PLAYER_STATE_KEY);
  if (state) {
    const { ...playerState } = state as PlayerState & { id?: string };
    return playerState;
  }
  return undefined;
}

// Storage quota check
export async function checkStorageQuota(): Promise<{
  used: number;
  quota: number;
  percent: number;
}> {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage || 0;
    const quota = estimate.quota || 0;
    return {
      used,
      quota,
      percent: quota > 0 ? (used / quota) * 100 : 0,
    };
  }
  return { used: 0, quota: 0, percent: 0 };
}

// Clear all data from the database (for reset)
export async function clearAllData(): Promise<void> {
  const db = await getDB();

  // Clear all object stores
  const tx = db.transaction(["songs", "playlists", "playerState"], "readwrite");

  await Promise.all([
    tx.objectStore("songs").clear(),
    tx.objectStore("playlists").clear(),
    tx.objectStore("playerState").clear(),
  ]);

  await tx.done;
}

// Delete the entire database (nuclear option)
export async function deleteDatabase(): Promise<void> {
  // Close existing connection
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }

  // Delete the database
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      console.warn("Database deletion blocked - closing connections");
      resolve();
    };
  });
}
