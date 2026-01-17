import { useState, useEffect, useCallback, useRef } from "react";
import type { Song } from "../types";
import {
  getAllSongs,
  addSong,
  deleteSong as dbDeleteSong,
  updateSong as dbUpdateSong,
} from "../lib/db";
import { extractMetadata, isAudioFile, generateId } from "../lib/audioMetadata";
import {
  isDesktop,
  fileExists,
  scanMusicFolder,
  openFolderPicker,
  getStoredFolderPath,
  saveStoredFolderPath,
  readFileData,
} from "../lib/platform";

// Concurrency limit for batch imports
const IMPORT_CONCURRENCY = 5;

// Normalize string for duplicate checking
const normalize = (str: string | undefined): string =>
  (str || "").toLowerCase().trim();

// Generate a lookup key for duplicate detection
function getSongLookupKey(title: string | undefined, artist: string | undefined, duration: number): string {
  // Round duration to nearest 2 seconds for tolerance
  const roundedDuration = Math.round((duration || 0) / 2) * 2;
  return `${normalize(title)}|${normalize(artist)}|${roundedDuration}`;
}

// Build a lookup Map for O(1) duplicate checking
function buildSongLookupMap(songs: Song[]): Map<string, Song> {
  const map = new Map<string, Song>();
  for (const song of songs) {
    const key = getSongLookupKey(song.title, song.artist, song.duration);
    map.set(key, song);
    // Also add by filePath for quick path-based lookups
    if (song.filePath) {
      map.set(`path:${song.filePath}`, song);
    }
  }
  return map;
}

// In-memory file cache for current session playback
const fileCache = new Map<string, File>();

// Get a file from cache
export function getCachedFile(songId: string): File | undefined {
  return fileCache.get(songId);
}

// Set a file in cache
export function setCachedFile(songId: string, file: File): void {
  fileCache.set(songId, file);
}

// Clear a file from cache
export function clearCachedFile(songId: string): void {
  fileCache.delete(songId);
}

// Check if a song is available for playback
// On desktop: always available if filePath exists (we'll verify on play)
// On web: available if in memory cache
export function isSongAvailable(song: Song): boolean {
  if (isDesktop() && song.filePath) {
    // On desktop, songs with file paths are considered available
    // Actual file existence is verified when playing
    return true;
  }
  return fileCache.has(song.id);
}

// Check availability of multiple songs, returns Set of unavailable song IDs
export function checkSongsAvailability(songs: Song[]): Set<string> {
  // On desktop, all songs with filePaths are considered available
  if (isDesktop()) {
    return new Set(
      songs
        .filter((song) => !song.filePath && !fileCache.has(song.id))
        .map((s) => s.id),
    );
  }
  return new Set(
    songs.filter((song) => !isSongAvailable(song)).map((s) => s.id),
  );
}

// Connect files to existing songs by matching metadata
export function connectFilesToSongs(
  files: File[],
  songs: Song[],
): { connected: number; songIdToFile: Map<string, File> } {
  const songIdToFile = new Map<string, File>();
  let connected = 0;

  // Create a lookup map for faster matching
  const songLookup = new Map<string, Song>();
  for (const song of songs) {
    // Create multiple keys for flexible matching
    const key1 = `${song.fileName?.toLowerCase()}`;
    const key2 = `${song.title?.toLowerCase()}-${song.artist?.toLowerCase()}`;
    const key3 = `${song.title?.toLowerCase()}-${song.fileSize}`;

    if (song.fileName) songLookup.set(key1, song);
    songLookup.set(key2, song);
    if (song.fileSize) songLookup.set(key3, song);
  }

  for (const file of files) {
    // Try to match by filename first
    const fileKey1 = file.name.toLowerCase();
    const matchedSong = songLookup.get(fileKey1);

    // If not found, the file might have been renamed - we can't match it easily
    // User would need to re-import it

    if (matchedSong && !songIdToFile.has(matchedSong.id)) {
      songIdToFile.set(matchedSong.id, file);
      fileCache.set(matchedSong.id, file);
      connected++;
    }
  }

  return { connected, songIdToFile };
}

export function useSongs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    skipped?: number;
  } | null>(null);

  // Use ref to track songs during import to avoid stale state
  const songsRef = useRef<Song[]>([]);
  
  // Lookup map for O(1) duplicate checking
  const songLookupMapRef = useRef<Map<string, Song>>(new Map());

  // Load songs on mount
  useEffect(() => {
    loadSongs();
  }, []);

  // Keep ref and lookup map in sync with state
  useEffect(() => {
    songsRef.current = songs;
    songLookupMapRef.current = buildSongLookupMap(songs);
  }, [songs]);

  const loadSongs = async () => {
    try {
      const allSongs = await getAllSongs();
      const sortedSongs = allSongs.reverse(); // Most recent first
      setSongs(sortedSongs);
      songsRef.current = sortedSongs;
      songLookupMapRef.current = buildSongLookupMap(sortedSongs);
    } catch (error) {
      console.error("Failed to load songs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if a song already exists in the library - O(1) lookup
  const checkDuplicate = useCallback((metadata: Partial<Song>): Song | null => {
    const key = getSongLookupKey(metadata.title, metadata.artist, metadata.duration || 0);
    return songLookupMapRef.current.get(key) || null;
  }, []);
  
  // Check if a song exists by file path - O(1) lookup
  const checkDuplicateByPath = useCallback((filePath: string): Song | null => {
    return songLookupMapRef.current.get(`path:${filePath}`) || null;
  }, []);

  // Import single file
  // Stores only metadata in IndexedDB, keeps file in memory for playback
  const importFile = useCallback(
    async (
      file: File,
      options: { skipDuplicateCheck?: boolean } = {},
    ): Promise<{ song: Song | null; skipped: boolean }> => {
      const { skipDuplicateCheck = false } = options;

      if (!isAudioFile(file)) {
        console.warn("Not an audio file:", file.name);
        return { song: null, skipped: false };
      }

      try {
        const metadata = await extractMetadata(file);

        // Check for duplicates unless explicitly skipped
        if (!skipDuplicateCheck) {
          const duplicate = checkDuplicate(metadata);
          if (duplicate) {
            // Even if duplicate, cache the file for playback
            fileCache.set(duplicate.id, file);
            return { song: null, skipped: true };
          }
        }

        const song: Song = {
          id: generateId(),
          title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
          artist: metadata.artist || "Unknown Artist",
          album: metadata.album || "Unknown Album",
          duration: metadata.duration || 0,
          coverArt: metadata.coverArt,
          sourceType: "local",
          addedAt: Date.now(),
          // Store filename and size for reconnecting later
          fileName: file.name,
          fileSize: file.size,
        };

        // Store only metadata in IndexedDB
        await addSong(song);

        // Keep file in memory cache for playback during this session
        fileCache.set(song.id, file);

        setSongs((prev) => {
          const newSongs = [song, ...prev];
          songsRef.current = newSongs;
          return newSongs;
        });
        return { song, skipped: false };
      } catch (error) {
        console.error("Failed to import file:", file.name, error);
        return { song: null, skipped: false };
      }
    },
    [checkDuplicate],
  );

  // Import multiple files with concurrency control
  // Stores metadata in IndexedDB, keeps files in memory for playback
  const importFiles = useCallback(
    async (
      files: FileList | File[],
    ): Promise<{ songs: Song[]; imported: number; skipped: number }> => {
      const fileArray = Array.from(files);
      const audioFiles = fileArray.filter(isAudioFile);

      if (audioFiles.length === 0) {
        return { songs: [], imported: 0, skipped: 0 };
      }

      setImportProgress({ current: 0, total: audioFiles.length, skipped: 0 });
      const importedSongs: Song[] = [];
      let skippedCount = 0;
      let processedCount = 0;

      // Process files in batches with concurrency control
      for (let i = 0; i < audioFiles.length; i += IMPORT_CONCURRENCY) {
        const batch = audioFiles.slice(i, i + IMPORT_CONCURRENCY);
        
        // Process batch concurrently
        const results = await Promise.all(
          batch.map(file => importFile(file))
        );
        
        // Collect results
        for (const result of results) {
          processedCount++;
          if (result.song) {
            importedSongs.push(result.song);
          }
          if (result.skipped) {
            skippedCount++;
          }
        }
        
        setImportProgress({
          current: processedCount,
          total: audioFiles.length,
          skipped: skippedCount,
        });
      }

      setImportProgress(null);
      return {
        songs: importedSongs,
        imported: importedSongs.length,
        skipped: skippedCount,
      };
    },
    [importFile],
  );

  // Delete a song
  const deleteSong = useCallback(async (songId: string) => {
    try {
      // Clear from memory cache
      clearCachedFile(songId);

      // Remove from IndexedDB (metadata only now)
      await dbDeleteSong(songId);

      setSongs((prev) => prev.filter((s) => s.id !== songId));
    } catch (error) {
      console.error("Failed to delete song:", error);
    }
  }, []);

  // Update a song's metadata
  const updateSong = useCallback(
    async (songId: string, updates: Partial<Song>) => {
      const song = songsRef.current.find((s) => s.id === songId);
      if (!song) return;

      const updatedSong = { ...song, ...updates };
      await dbUpdateSong(updatedSong);

      setSongs((prev) => prev.map((s) => (s.id === songId ? updatedSong : s)));
    },
    [],
  );

  // Connect a folder of files to existing songs in the library
  const connectFolder = useCallback(
    (files: FileList | File[]): { connected: number; newFiles: File[] } => {
      const fileArray = Array.from(files).filter(isAudioFile);
      const currentSongs = songsRef.current;

      const { connected, songIdToFile } = connectFilesToSongs(
        fileArray,
        currentSongs,
      );

      // Find files that weren't matched to existing songs
      const matchedFiles = new Set(songIdToFile.values());
      const newFiles = fileArray.filter((f) => !matchedFiles.has(f));

      return { connected, newFiles };
    },
    [],
  );

  // Desktop: Import from a folder path (scans folder and imports all audio files)
  // Returns imported count, skipped count, and folder-to-songIds map for playlist creation
  const importFromFolderPath = useCallback(
    async (
      folderPath: string,
    ): Promise<{
      imported: number;
      skipped: number;
      folderSongs: Map<string, string[]>;
    }> => {
      if (!isDesktop()) {
        return { imported: 0, skipped: 0, folderSongs: new Map() };
      }

      const files = await scanMusicFolder(folderPath);

      if (files.length === 0) {
        return { imported: 0, skipped: 0, folderSongs: new Map() };
      }

      setImportProgress({ current: 0, total: files.length, skipped: 0 });
      let imported = 0;
      let skipped = 0;

      // Track songs per folder for playlist creation
      // Use folder path basename as key for root folder songs
      const folderSongs = new Map<string, string[]>();
      const rootFolderName = folderPath.split(/[/\\]/).pop() || "Music";

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check if already exists by path - O(1) lookup
        const existingByPath = checkDuplicateByPath(file.path);
        if (existingByPath) {
          // Track folder for existing songs (use root folder name if no subfolder)
          const folderKey = file.folder || rootFolderName;
          const existing = folderSongs.get(folderKey) || [];
          existing.push(existingByPath.id);
          folderSongs.set(folderKey, existing);
          skipped++;
          setImportProgress({ current: i + 1, total: files.length, skipped });
          continue;
        }

        try {
          // Read the file to extract metadata
          const data = await readFileData(file.path);
          const blob = new Blob([new Uint8Array(data)]);
          const fileObj = new File([blob], file.name, { type: "audio/mpeg" });

          const metadata = await extractMetadata(fileObj);

          // Check for duplicates by title/artist/duration - O(1) lookup
          const duplicate = checkDuplicate({
            title: metadata.title || file.name,
            artist: metadata.artist || "Unknown Artist",
            duration: metadata.duration || 0,
          });

          if (duplicate) {
            // Update existing song with file path if it doesn't have one
            if (!duplicate.filePath) {
              const updatedSong = { ...duplicate, filePath: file.path };
              await dbUpdateSong(updatedSong);
              setSongs((prev) =>
                prev.map((s) => (s.id === duplicate.id ? updatedSong : s)),
              );
            }
            // Track folder for duplicate (use root folder name if no subfolder)
            const folderKey = file.folder || rootFolderName;
            const existing = folderSongs.get(folderKey) || [];
            existing.push(duplicate.id);
            folderSongs.set(folderKey, existing);
            skipped++;
            setImportProgress({ current: i + 1, total: files.length, skipped });
            continue;
          }

          const song: Song = {
            id: generateId(),
            title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
            artist: metadata.artist || "Unknown Artist",
            album: metadata.album || "Unknown Album",
            duration: metadata.duration || 0,
            coverArt: metadata.coverArt,
            sourceType: "local",
            addedAt: Date.now(),
            fileName: file.name,
            fileSize: data.length,
            filePath: file.path, // Store full path for desktop
          };

          await addSong(song);
          setSongs((prev) => {
            const newSongs = [song, ...prev];
            songsRef.current = newSongs;
            return newSongs;
          });

          // Track folder for new song (use root folder name if no subfolder)
          const folderKey = file.folder || rootFolderName;
          const existingInFolder = folderSongs.get(folderKey) || [];
          existingInFolder.push(song.id);
          folderSongs.set(folderKey, existingInFolder);

          imported++;
        } catch (error) {
          console.error("Failed to import:", file.name, error);
        }

        setImportProgress({ current: i + 1, total: files.length, skipped });
      }

      // Save the folder path for future auto-loading
      await saveStoredFolderPath(folderPath);
      setImportProgress(null);

      return { imported, skipped, folderSongs };
    },
    [],
  );

  // Desktop: Show folder picker and import
  const pickAndImportFolder = useCallback(async (): Promise<{
    imported: number;
    skipped: number;
    folderSongs: Map<string, string[]>;
  } | null> => {
    if (!isDesktop()) {
      return null;
    }

    const folderPath = await openFolderPicker();
    if (!folderPath) {
      return null;
    }

    return importFromFolderPath(folderPath);
  }, [importFromFolderPath]);

  // Desktop: Auto-load from stored folder path on startup
  const autoLoadStoredFolder = useCallback(async (): Promise<boolean> => {
    if (!isDesktop()) {
      return false;
    }

    const storedPath = await getStoredFolderPath();
    if (!storedPath) {
      return false;
    }

    // Verify folder still exists
    const exists = await fileExists(storedPath);
    if (!exists) {
      return false;
    }

    // Scan and update any songs that need file path updates
    const files = await scanMusicFolder(storedPath);
    const currentSongs = songsRef.current;

    for (const file of files) {
      // Find songs that match by filename but don't have a filePath
      const matchingSong = currentSongs.find(
        (s) =>
          s.fileName?.toLowerCase() === file.name.toLowerCase() && !s.filePath,
      );

      if (matchingSong) {
        const updatedSong = { ...matchingSong, filePath: file.path };
        await dbUpdateSong(updatedSong);
        setSongs((prev) =>
          prev.map((s) => (s.id === matchingSong.id ? updatedSong : s)),
        );
      }
    }

    return true;
  }, []);

  // Desktop: Import from an array of MusicFileInfo (returned by library scanner)
  // This is more efficient than importFromFolderPath for batch imports from multiple folders
  const importFromMusicFileInfos = useCallback(
    async (
      files: {
        path: string;
        name: string;
        extension: string;
        folder: string | null;
      }[],
    ): Promise<{
      imported: number;
      skipped: number;
    }> => {
      if (!isDesktop() || files.length === 0) {
        return { imported: 0, skipped: 0 };
      }

      setImportProgress({ current: 0, total: files.length, skipped: 0 });
      let imported = 0;
      let skipped = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check if already exists by path - O(1) lookup
        const existingByPath = checkDuplicateByPath(file.path);
        if (existingByPath) {
          skipped++;
          setImportProgress({ current: i + 1, total: files.length, skipped });
          continue;
        }

        try {
          // Read the file to extract metadata
          const data = await readFileData(file.path);
          const blob = new Blob([new Uint8Array(data)]);
          const fileObj = new File([blob], file.name, { type: "audio/mpeg" });

          const metadata = await extractMetadata(fileObj);

          // Check for duplicates by title/artist/duration - O(1) lookup
          const duplicate = checkDuplicate({
            title: metadata.title || file.name,
            artist: metadata.artist || "Unknown Artist",
            duration: metadata.duration || 0,
          });

          if (duplicate) {
            // Update existing song with file path if it doesn't have one
            if (!duplicate.filePath) {
              const updatedSong = { ...duplicate, filePath: file.path };
              await dbUpdateSong(updatedSong);
              setSongs((prev) =>
                prev.map((s) => (s.id === duplicate.id ? updatedSong : s)),
              );
            }
            skipped++;
            setImportProgress({ current: i + 1, total: files.length, skipped });
            continue;
          }

          const song: Song = {
            id: generateId(),
            title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
            artist: metadata.artist || "Unknown Artist",
            album: metadata.album || "Unknown Album",
            duration: metadata.duration || 0,
            coverArt: metadata.coverArt,
            sourceType: "local",
            addedAt: Date.now(),
            fileName: file.name,
            fileSize: data.length,
            filePath: file.path,
          };

          await addSong(song);
          setSongs((prev) => {
            const newSongs = [song, ...prev];
            songsRef.current = newSongs;
            return newSongs;
          });

          imported++;
        } catch (error) {
          console.error("Failed to import:", file.name, error);
        }

        setImportProgress({ current: i + 1, total: files.length, skipped });
      }

      setImportProgress(null);
      return { imported, skipped };
    },
    [],
  );

  // Get count of connected (playable) songs
  // On desktop: songs with filePath are always connected
  // On web: songs in memory cache are connected
  const connectedCount = songs.filter((s) => {
    if (isDesktop() && s.filePath) {
      return true;
    }
    return fileCache.has(s.id);
  }).length;

  return {
    songs,
    isLoading,
    importProgress,
    importFile,
    importFiles,
    deleteSong,
    updateSong,
    connectFolder,
    connectedCount,
    totalCount: songs.length,
    refreshSongs: loadSongs,
    // Desktop-specific exports
    isDesktop: isDesktop(),
    importFromFolderPath,
    importFromMusicFileInfos,
    pickAndImportFolder,
    autoLoadStoredFolder,
  };
}
