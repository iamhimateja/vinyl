import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useParams,
  Link,
  Navigate,
} from "react-router-dom";
import { VirtualizedSongList } from "./components/VirtualizedSongList";
import { ImportMusic } from "./components/ImportMusic";
import { PlaylistView } from "./components/PlaylistView";
import { Sidebar } from "./components/Sidebar";
import { MobileNav } from "./components/MobileNav";
import { AboutView } from "./components/AboutView";
import { SettingsView } from "./components/SettingsView";
import { PlayerOverlay } from "./components/PlayerOverlay";
import { TopNav } from "./components/TopNav";
import { MusicGeneratorView } from "./components/MusicGeneratorView";
import { QuickPlayOverlay, DropZoneOverlay } from "./components/QuickPlayOverlay";
import { MusicInfoDialog } from "./components/MusicInfoDialog";
import { CommandMenu } from "./components/CommandMenu";
import { KeyboardShortcutsDialog } from "./components/KeyboardShortcutsDialog";
import { useSongs, checkSongsAvailability } from "./hooks/useSongs";
import { usePlaylists } from "./hooks/usePlaylists";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { useEqualizer } from "./hooks/useEqualizer";
import { useSettings } from "./hooks/useSettings";
import { usePWA } from "./hooks/usePWA";
import { useSleepTimer } from "./hooks/useSleepTimer";
import { useAudioVisualizer } from "./hooks/useAudioVisualizer";
import { useLibrary } from "./hooks/useLibrary";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { clearAllData } from "./lib/db";
import {
  isDesktop as checkIsDesktop,
  clearStoredData,
  isFirstLaunch,
  completeSetup,
  updateTrayPlaybackState,
  onTrayPlayPause,
  onTrayNext,
  onTrayPrevious,
  onFileOpen,
  getPendingOpenFiles,
} from "./lib/platform";

import { FirstLaunchWizard } from "./components/FirstLaunchWizard";
import { ScrollArea } from "./components/ui";
import { toast } from "sonner";
import type { Playlist, Song } from "./types";
import {
  ArrowLeft,
  Library,
  Shuffle,
  Play,
  WifiOff,
  Check,
  X,
} from "lucide-react";

// PlaylistDetailPage as a separate component to use useParams
interface PlaylistDetailPageProps {
  playlists: Playlist[];
  currentPlaylistId: string | null;
  currentSongId: string | null;
  isPlaying: boolean;
  unavailableSongIds: Set<string>;
  favoriteSongIds: Set<string>;
  getPlaylistSongs: (playlist: Playlist) => Song[];
  handleShufflePlay: (songs: Song[], playlistId?: string | null) => void;
  handlePlayPlaylist: (playlist: Playlist) => void;
  playSong: (song: Song, playlistId?: string | null) => void;
  togglePlayPause: () => void;
  stop: () => void;
  updatePlaylist: (playlistId: string, updates: Partial<Playlist>) => void;
  handleDeleteSong: (songId: string) => void;
  toggleFavorite: (songId: string) => void;
  skipDeleteConfirmation: boolean;
  onSkipDeleteConfirmationChange: (skip: boolean) => void;
}

function PlaylistDetailPage({
  playlists,
  currentPlaylistId,
  currentSongId,
  isPlaying,
  unavailableSongIds,
  favoriteSongIds,
  getPlaylistSongs,
  handleShufflePlay,
  handlePlayPlaylist,
  playSong,
  togglePlayPause,
  stop,
  updatePlaylist,
  handleDeleteSong,
  toggleFavorite,
  skipDeleteConfirmation,
  onSkipDeleteConfirmationChange,
}: PlaylistDetailPageProps) {
  const { playlistId } = useParams<{ playlistId: string }>();
  const playlist = playlists.find((p) => p.id === playlistId);

  if (!playlist) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 pt-16 pb-24 md:pb-20">
        <p className="text-vinyl-text-muted">Playlist not found</p>
        <Link
          to="/playlists"
          className="mt-4 text-vinyl-accent hover:underline"
        >
          Back to Playlists
        </Link>
      </div>
    );
  }

  const playlistSongs = getPlaylistSongs(playlist);
  const isCurrentPlaylist = currentPlaylistId === playlist.id;

  return (
    <div className="flex-1 flex flex-col p-6 pt-16 pb-24 md:pb-20 h-full overflow-hidden">
      <Link
        to="/playlists"
        className="flex items-center gap-2 text-vinyl-text-muted hover:text-vinyl-text mb-4 transition-colors flex-shrink-0"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Playlists
      </Link>
      <div className="mb-6 flex items-center justify-between flex-shrink-0">
        <div>
          <h1
            className={`text-2xl font-bold ${isCurrentPlaylist ? "text-vinyl-accent" : "text-vinyl-text"}`}
          >
            {playlist.name}
          </h1>
          <p className="text-vinyl-text-muted">
            {playlistSongs.length} songs
            {isCurrentPlaylist && isPlaying && (
              <span className="ml-2 text-vinyl-accent">• Now Playing</span>
            )}
          </p>
        </div>
        {playlistSongs.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleShufflePlay(playlistSongs, playlist.id)}
              className="p-3 bg-vinyl-surface border border-vinyl-border rounded-full text-vinyl-text-muted hover:text-vinyl-accent hover:border-vinyl-accent transition-colors"
              data-tooltip-id="global-tooltip"
              data-tooltip-content="Shuffle Play"
            >
              <Shuffle className="w-5 h-5" />
            </button>
            <button
              onClick={() => handlePlayPlaylist(playlist)}
              className="p-3 bg-vinyl-accent rounded-full text-vinyl-bg hover:bg-vinyl-accent-light transition-colors"
              data-tooltip-id="global-tooltip"
              data-tooltip-content="Play Playlist"
            >
              <Play className="w-5 h-5" fill="currentColor" />
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <VirtualizedSongList
          songs={playlistSongs}
          currentSongId={currentSongId}
          isPlaying={isPlaying}
          onPlay={(song) => playSong(song, playlist.id)}
          onTogglePlayPause={togglePlayPause}
          onStop={stop}
          onDelete={(songId) => {
            updatePlaylist(playlist.id, {
              songIds: playlist.songIds.filter((id) => id !== songId),
            });
          }}
          unavailableSongIds={unavailableSongIds}
          onDeleteSong={handleDeleteSong}
          favoriteSongIds={favoriteSongIds}
          onToggleFavorite={toggleFavorite}
          skipDeleteConfirmation={skipDeleteConfirmation}
          onSkipDeleteConfirmationChange={onSkipDeleteConfirmationChange}
        />
      </div>
    </div>
  );
}

function App() {
  const navigate = useNavigate();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [unavailableSongIds, setUnavailableSongIds] = useState<Set<string>>(
    new Set(),
  );
  const [showFirstLaunchWizard, setShowFirstLaunchWizard] = useState(false);
  const [checkingFirstLaunch, setCheckingFirstLaunch] = useState(true);

  // Quick play state for drag-and-drop files
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [showQuickPlayOverlay, setShowQuickPlayOverlay] = useState(false);
  const [showMusicInfoDialog, setShowMusicInfoDialog] = useState(false);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [autoExpandPlayer, setAutoExpandPlayer] = useState(false);
  const dragCounterRef = useRef(0);

  const { settings, updateSetting, resetSettings } = useSettings();
  const {
    canInstall,
    isUpdateAvailable,
    isOnline,
    isOfflineReady,
    promptInstall,
    updateApp,
    dismissOfflineReady,
  } = usePWA();

  // Apply theme from settings
  useEffect(() => {
    document.documentElement.classList.toggle(
      "light",
      settings.theme === "light",
    );
  }, [settings.theme]);

  // Apply electron class for desktop-specific styles (e.g., disable text selection)
  useEffect(() => {
    if (checkIsDesktop()) {
      document.documentElement.classList.add("electron");
    }
    return () => {
      document.documentElement.classList.remove("electron");
    };
  }, []);

  const {
    songs,
    isLoading,
    importProgress,
    importFiles,
    deleteSong,
    connectFolder,
    connectedCount,
    totalCount,
    // Desktop-specific
    isDesktop,
    pickAndImportFolder,
    autoLoadStoredFolder,
    importFromMusicFileInfos,
  } = useSongs();

  // Music library management (desktop only)
  const library = useLibrary();
  const {
    playlists,
    favoriteSongIds,
    createPlaylist,
    deletePlaylist,
    updatePlaylist,
    addSongToPlaylist,
    addSongsToPlaylist,
    removeSongFromAllPlaylists,
    toggleFavorite,
  } = usePlaylists();

  const {
    currentSong,
    isPlaying,
    playbackState,
    currentTime,
    duration,
    volume,
    repeat,
    shuffle,
    speed,
    currentPlaylistId,
    queueSongs,
    audioElement,
    playSong,
    playFromQueue,
    playPlaylist,
    playFile,
    playFiles,
    playFilePath,
    togglePlayPause,
    stop,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleRepeat,
    toggleShuffle,
    setSpeed,
    removeSongFromQueue,
    reorderQueue,
  } = useAudioPlayer(songs, settings);

  // Initialize equalizer with audio element
  const {
    bands: eqBands,
    enabled: eqEnabled,
    currentPreset: eqPreset,
    isConnected: eqConnected,
    setBandGain,
    applyPreset,
    reset: resetEqualizer,
    toggleEnabled: toggleEqualizer,
  } = useEqualizer(audioElement);

  // Sleep timer - stops playback with fade-out effect when timer ends
  const sleepTimer = useSleepTimer({
    onTimerEnd: stop,
    onVolumeChange: setVolume,
    getCurrentVolume: () => volume,
    fadeOutDuration: 30, // 30 second fade-out
  });

  // Audio visualizer - only active when visualizer is enabled
  const { frequencyData, waveformData } = useAudioVisualizer(
    audioElement,
    settings.visualizerEnabled && isPlaying,
  );

  // Track previous volume for mute toggle
  const previousVolumeRef = useRef(volume);

  // Visualizer style cycling
  const visualizerStyles: Array<"bars" | "wave" | "areaWave"> = ["bars", "wave", "areaWave"];

  // Keyboard shortcuts for playback control
  useKeyboardShortcuts({
    onPlayPause: togglePlayPause,
    onNext: playNext,
    onPrevious: playPrevious,
    onVolumeUp: () => {
      setVolume(Math.min(1, volume + 0.1));
      toast.success(`Volume: ${Math.round(Math.min(1, volume + 0.1) * 100)}%`, { duration: 1500 });
    },
    onVolumeDown: () => {
      setVolume(Math.max(0, volume - 0.1));
      toast.success(`Volume: ${Math.round(Math.max(0, volume - 0.1) * 100)}%`, { duration: 1500 });
    },
    onMute: () => {
      if (volume > 0) {
        previousVolumeRef.current = volume;
        setVolume(0);
        toast.success("Muted", { duration: 1500 });
      } else {
        setVolume(previousVolumeRef.current || 0.5);
        toast.success("Unmuted", { duration: 1500 });
      }
    },
    onToggleShuffle: () => {
      toggleShuffle();
      toast.success(shuffle ? "Shuffle off" : "Shuffle on", { duration: 1500 });
    },
    onToggleRepeat: () => {
      toggleRepeat();
      const nextRepeat = repeat === "none" ? "all" : repeat === "all" ? "one" : "none";
      const messages = { none: "Repeat off", all: "Repeat all", one: "Repeat one" };
      toast.success(messages[nextRepeat], { duration: 1500 });
    },
    onSeekForward: () => seek(Math.min(duration, currentTime + 5)),
    onSeekBackward: () => seek(Math.max(0, currentTime - 5)),
    onCycleVisualizer: () => {
      const currentIndex = visualizerStyles.indexOf(settings.visualizerStyle);
      const nextIndex = (currentIndex + 1) % visualizerStyles.length;
      const nextStyle = visualizerStyles[nextIndex];
      if (!settings.visualizerEnabled) updateSetting("visualizerEnabled", true);
      updateSetting("visualizerStyle", nextStyle);
      const styleNames = { bars: "Bars", wave: "Wave", areaWave: "Area Wave" };
      toast.success(`Visualizer: ${styleNames[nextStyle]}`, { duration: 1500 });
    },
    onToggleVisualizerOff: () => {
      if (settings.visualizerEnabled) {
        updateSetting("visualizerEnabled", false);
        toast.success("Visualizer off", { duration: 1500 });
      }
    },
    onToggleMusicInfo: () => setShowMusicInfoDialog(prev => !prev),
    onToggleEqualizer: () => {
      toggleEqualizer();
      toast.success(eqEnabled ? "Equalizer off" : "Equalizer on", { duration: 1500 });
    },
    onToggleFavorite: currentSong ? () => {
      const isFavorite = favoriteSongIds.has(currentSong.id);
      toggleFavorite(currentSong.id);
      toast.success(isFavorite ? "Removed from favorites" : "Added to favorites", { duration: 1500 });
    } : undefined,
    enabled: !showFirstLaunchWizard && !showCommandMenu,
  });

  // Command menu keyboard shortcut (Cmd/Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open command menu
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandMenu(prev => !prev);
      }
      // ? to open keyboard shortcuts (when not in input)
      if (e.key === "?" && !showCommandMenu) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA" && !target.isContentEditable) {
          e.preventDefault();
          setShowKeyboardShortcuts(prev => !prev);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showCommandMenu]);

  // System tray integration (Desktop only)
  // Update tray when playback state changes
  useEffect(() => {
    if (!checkIsDesktop()) return;
    
    updateTrayPlaybackState({
      isPlaying,
      song: currentSong ? {
        title: currentSong.title,
        artist: currentSong.artist,
        album: currentSong.album,
      } : null,
    });
  }, [currentSong, isPlaying]);

  // Listen for tray control events
  useEffect(() => {
    if (!checkIsDesktop()) return;
    
    const unsubPlayPause = onTrayPlayPause(() => {
      togglePlayPause();
    });
    
    const unsubNext = onTrayNext(() => {
      playNext();
    });
    
    const unsubPrevious = onTrayPrevious(() => {
      playPrevious();
    });
    
    return () => {
      unsubPlayPause();
      unsubNext();
      unsubPrevious();
    };
  }, [togglePlayPause, playNext, playPrevious]);

  // Listen for files opened via "Open With" from Finder/Explorer
  useEffect(() => {
    if (!checkIsDesktop()) return;

    // Handle any files that were opened before the app was ready
    const handlePendingFiles = async () => {
      try {
        const pendingFiles = await getPendingOpenFiles();
        if (pendingFiles.length > 0) {
          console.log("[App] Playing pending files:", pendingFiles);
          // Play the first file
          const firstFile = pendingFiles[0];
          await playFilePath(firstFile);
          // Auto-expand to Now Playing view
          setAutoExpandPlayer(true);
        }
      } catch (error) {
        console.error("[App] Failed to handle pending files:", error);
      }
    };

    // Small delay to ensure player is ready
    const timeoutId = setTimeout(handlePendingFiles, 500);

    // Listen for new files being opened while the app is running
    const unsubFileOpen = onFileOpen(async (filePath: string) => {
      console.log("[App] File opened:", filePath);
      try {
        await playFilePath(filePath);
        // Auto-expand to Now Playing view
        setAutoExpandPlayer(true);
      } catch (error) {
        console.error("[App] Failed to play opened file:", error);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubFileOpen();
    };
  }, [playFilePath]);

  // Get current playlist object
  const currentPlaylist =
    playlists.find((p) => p.id === currentPlaylistId) || null;

  // Mark as initialized once loading is complete
  useEffect(() => {
    if (!isLoading && !hasInitialized) {
      setHasInitialized(true);
    }
  }, [isLoading, hasInitialized]);

  // Check if this is first launch (desktop only)
  useEffect(() => {
    const checkFirstLaunch = async () => {
      // Only show wizard on desktop
      if (!checkIsDesktop()) {
        setCheckingFirstLaunch(false);
        return;
      }

      const firstLaunch = await isFirstLaunch();
      setShowFirstLaunchWizard(firstLaunch);
      setCheckingFirstLaunch(false);
    };

    checkFirstLaunch();
  }, []);

  // Tauri: Auto-load stored folder on startup
  useEffect(() => {
    if (isDesktop && hasInitialized && autoLoadStoredFolder) {
      autoLoadStoredFolder();
    }
  }, [isDesktop, hasInitialized, autoLoadStoredFolder]);

  // Check for unavailable songs (files not in memory) after songs load or connection changes
  useEffect(() => {
    if (!isLoading && songs.length > 0) {
      const unavailable = checkSongsAvailability(songs);
      setUnavailableSongIds(unavailable);
    }
  }, [songs, isLoading, connectedCount]);

  const handleImport = async (
    files: FileList,
    _folderName?: string,
  ): Promise<{ imported: number; skipped: number }> => {
    const fileArray = Array.from(files);

    // Check if this is a folder import (files have webkitRelativePath with folder structure)
    const firstFile = fileArray[0];
    const isFromFolder =
      firstFile &&
      firstFile.webkitRelativePath &&
      firstFile.webkitRelativePath.includes("/");

    if (!isFromFolder) {
      // Regular file import - no playlists created
      const result = await importFiles(files);
      return { imported: result.imported, skipped: result.skipped };
    }

    // Group files by their direct parent folder (the folder containing the audio file)
    const filesByFolder = new Map<string, File[]>();

    for (const file of fileArray) {
      const path = file.webkitRelativePath;
      if (!path) continue;

      const parts = path.split("/");
      // Parent folder path is everything except the filename
      const folderPath = parts.slice(0, -1).join("/");

      if (folderPath) {
        if (!filesByFolder.has(folderPath)) {
          filesByFolder.set(folderPath, []);
        }
        filesByFolder.get(folderPath)!.push(file);
      }
    }

    // Determine smart playlist names with conflict resolution
    const playlistNames = new Map<string, string>();
    const folderNameCount = new Map<string, string[]>();

    // Count how many folders share each name
    for (const folderPath of filesByFolder.keys()) {
      const parts = folderPath.split("/");
      const folderName = parts[parts.length - 1];

      if (!folderNameCount.has(folderName)) {
        folderNameCount.set(folderName, []);
      }
      folderNameCount.get(folderName)!.push(folderPath);
    }

    // Assign playlist names - prepend parent folder name for conflicts
    for (const folderPath of filesByFolder.keys()) {
      const parts = folderPath.split("/");
      const folderName = parts[parts.length - 1];
      const conflictingPaths = folderNameCount.get(folderName) || [];

      if (conflictingPaths.length > 1 && parts.length > 1) {
        // Name conflict exists - use "Parent - FolderName" format
        const parentName = parts[parts.length - 2];
        playlistNames.set(folderPath, `${parentName} - ${folderName}`);
      } else {
        playlistNames.set(folderPath, folderName);
      }
    }

    // Import each folder's files and create/update playlists
    let totalImported = 0;
    let totalSkipped = 0;

    for (const [folderPath, folderFiles] of filesByFolder) {
      const result = await importFiles(folderFiles);
      totalImported += result.imported;
      totalSkipped += result.skipped;

      // Create or update playlist only if songs were actually imported from this folder
      if (result.songs.length > 0) {
        const playlistName = playlistNames.get(folderPath) || folderPath;
        const songIds = result.songs.map((song) => song.id);

        // Check if a playlist with this name already exists
        const existingPlaylist = playlists.find(
          (p) => p.name.toLowerCase() === playlistName.toLowerCase(),
        );

        if (existingPlaylist) {
          // Add songs to existing playlist (duplicates are filtered automatically)
          await addSongsToPlaylist(existingPlaylist.id, songIds);
        } else {
          // Create new playlist
          await createPlaylist(playlistName, songIds);
        }
      }
    }

    return { imported: totalImported, skipped: totalSkipped };
  };

  // Create playlists from folder structure (used by Tauri imports)
  const handleCreatePlaylistsFromFolders = async (
    folderSongs: Map<string, string[]>,
  ): Promise<number> => {
    let playlistsCreated = 0;

    // Get folder names with conflict resolution
    const playlistNames = new Map<string, string>();
    const folderNameCount = new Map<string, string[]>();

    // Count how many folders share each base name
    for (const folderPath of folderSongs.keys()) {
      const parts = folderPath.split(/[/\\]/); // Support both Unix and Windows paths
      const folderName = parts[parts.length - 1] || folderPath;

      if (!folderNameCount.has(folderName)) {
        folderNameCount.set(folderName, []);
      }
      folderNameCount.get(folderName)!.push(folderPath);
    }

    // Assign playlist names - prepend parent folder name for conflicts
    for (const folderPath of folderSongs.keys()) {
      const parts = folderPath.split(/[/\\]/);
      const folderName = parts[parts.length - 1] || folderPath;
      const conflictingPaths = folderNameCount.get(folderName) || [];

      if (conflictingPaths.length > 1 && parts.length > 1) {
        // Name conflict exists - use "Parent - FolderName" format
        const parentName = parts[parts.length - 2];
        playlistNames.set(folderPath, `${parentName} - ${folderName}`);
      } else {
        playlistNames.set(folderPath, folderName);
      }
    }

    // Create playlists for each folder
    for (const [folderPath, songIds] of folderSongs) {
      if (songIds.length === 0) continue;

      const playlistName = playlistNames.get(folderPath) || folderPath;

      // Check if a playlist with this name already exists
      const existingPlaylist = playlists.find(
        (p) => p.name.toLowerCase() === playlistName.toLowerCase(),
      );

      if (existingPlaylist) {
        // Add songs to existing playlist (duplicates are filtered automatically)
        await addSongsToPlaylist(existingPlaylist.id, songIds);
      } else {
        // Create new playlist
        await createPlaylist(playlistName, songIds);
        playlistsCreated++;
      }
    }

    return playlistsCreated;
  };

  // Handle song deletion - stops playback if needed, removes from queue and all playlists
  const handleDeleteSong = async (songId: string) => {
    // Remove from queue (this also stops playback if it's the current song)
    removeSongFromQueue(songId);

    // Remove from all playlists
    await removeSongFromAllPlaylists(songId);

    // Delete from library
    await deleteSong(songId);
  };

  // Reset entire player - clears all data and reloads
  const handleResetPlayer = async () => {
    // Stop any playing audio
    stop();

    // Clear all IndexedDB data
    await clearAllData();

    // Clear localStorage
    localStorage.clear();

    // Clear electron-store data on desktop
    if (checkIsDesktop()) {
      await clearStoredData();
    }

    // Reload the page to reset all state
    window.location.reload();
  };

  // Set up library file watcher callbacks for auto-import
  useEffect(() => {
    if (!library.isDesktop) return;

    // Handle new files detected by watcher
    library.setOnFileAdded(async (file) => {
      console.log("[App] Auto-importing new file:", file.path);
      try {
        await importFromMusicFileInfos([file]);
      } catch (error) {
        console.error("[App] Failed to auto-import file:", error);
      }
    });

    // Handle removed files detected by watcher
    library.setOnFileRemoved((filePath) => {
      console.log("[App] File removed:", filePath);
      // Find and remove the song with this file path
      const songToRemove = songs.find((s) => s.filePath === filePath);
      if (songToRemove) {
        handleDeleteSong(songToRemove.id);
      }
    });

    return () => {
      library.setOnFileAdded(null);
      library.setOnFileRemoved(null);
    };
  }, [
    library.isDesktop,
    library.setOnFileAdded,
    library.setOnFileRemoved,
    importFromMusicFileInfos,
    songs,
  ]);

  // Handle first launch wizard completion
  const handleWizardComplete = useCallback(async () => {
    await completeSetup();
    setShowFirstLaunchWizard(false);
  }, []);

  // Handle first launch wizard skip
  const handleWizardSkip = useCallback(async () => {
    await completeSetup();
    setShowFirstLaunchWizard(false);
  }, []);

  // Handle skip delete confirmation change
  const handleSkipDeleteConfirmationChange = useCallback(
    (skip: boolean) => {
      updateSetting("skipDeleteConfirmation", skip);
    },
    [updateSetting],
  );

  // ========== Action handlers with toast notifications ==========
  
  // Shuffle toggle with toast
  const handleToggleShuffle = useCallback(() => {
    toggleShuffle();
    // Check current state (before toggle) to show correct message
    toast.success(shuffle ? "Shuffle off" : "Shuffle on", {
      duration: 2000,
    });
  }, [toggleShuffle, shuffle]);

  // Repeat toggle with toast
  const handleToggleRepeat = useCallback(() => {
    toggleRepeat();
    // Show next state after toggle
    const nextRepeat = repeat === "none" ? "all" : repeat === "all" ? "one" : "none";
    const messages = {
      none: "Repeat off",
      all: "Repeat all",
      one: "Repeat one",
    };
    toast.success(messages[nextRepeat], { duration: 2000 });
  }, [toggleRepeat, repeat]);

  // Mute toggle with toast
  const handleToggleMute = useCallback(() => {
    if (volume > 0) {
      previousVolumeRef.current = volume;
      setVolume(0);
      toast.success("Muted", { duration: 2000 });
    } else {
      setVolume(previousVolumeRef.current || 0.5);
      toast.success("Unmuted", { duration: 2000 });
    }
  }, [volume, setVolume]);

  // Equalizer toggle with toast
  const handleToggleEqualizer = useCallback(() => {
    toggleEqualizer();
    toast.success(eqEnabled ? "Equalizer off" : "Equalizer on", {
      duration: 2000,
    });
  }, [toggleEqualizer, eqEnabled]);

  // Favorite toggle with toast
  const handleToggleFavoriteWithToast = useCallback(
    (songId: string) => {
      const song = songs.find((s) => s.id === songId);
      const isFavorite = favoriteSongIds.has(songId);
      toggleFavorite(songId);
      if (song) {
        toast.success(
          isFavorite ? `Removed "${song.title}" from favorites` : `Added "${song.title}" to favorites`,
          { duration: 2000 }
        );
      }
    },
    [toggleFavorite, songs, favoriteSongIds]
  );

  // Visualizer cycle with toast
  const handleCycleVisualizer = useCallback(() => {
    const currentIndex = visualizerStyles.indexOf(settings.visualizerStyle);
    const nextIndex = (currentIndex + 1) % visualizerStyles.length;
    const nextStyle = visualizerStyles[nextIndex];
    
    if (!settings.visualizerEnabled) {
      updateSetting("visualizerEnabled", true);
    }
    updateSetting("visualizerStyle", nextStyle);
    
    const styleNames = { bars: "Bars", wave: "Wave", areaWave: "Area Wave" };
    toast.success(`Visualizer: ${styleNames[nextStyle]}`, { duration: 2000 });
  }, [settings.visualizerStyle, settings.visualizerEnabled, updateSetting]);

  // Create playlist with toast
  const handleCreatePlaylistWithToast = useCallback(
    async (name: string): Promise<string> => {
      const id = await createPlaylist(name);
      toast.success(`Created playlist "${name}"`, { duration: 2000 });
      return id;
    },
    [createPlaylist]
  );

  // Add song to playlist with toast
  const handleAddSongToPlaylist = useCallback(
    (playlistId: string, songId: string) => {
      const playlist = playlists.find((p) => p.id === playlistId);
      const song = songs.find((s) => s.id === songId);
      addSongToPlaylist(playlistId, songId);
      if (playlist && song) {
        toast.success(`Added "${song.title}" to "${playlist.name}"`, {
          duration: 2000,
        });
      }
    },
    [addSongToPlaylist, playlists, songs]
  );

  // Delete song with toast
  const handleDeleteSongWithToast = useCallback(
    (songId: string) => {
      const song = songs.find((s) => s.id === songId);
      handleDeleteSong(songId);
      if (song) {
        toast.success(`Deleted "${song.title}"`, { duration: 2000 });
      }
    },
    [handleDeleteSong, songs]
  );



  // Speed change with toast
  const handleSpeedChange = useCallback(
    (newSpeed: number) => {
      setSpeed(newSpeed);
      toast.success(`Playback speed: ${newSpeed}x`, { duration: 2000 });
    },
    [setSpeed]
  );

  // ========== End of action handlers with toasts ==========

  // Global drag and drop handlers for quick play
  const handleGlobalDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    
    // Check if dragging files
    if (e.dataTransfer?.types.includes("Files")) {
      setIsDraggingFile(true);
    }
  }, []);

  const handleGlobalDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    
    if (dragCounterRef.current === 0) {
      setIsDraggingFile(false);
    }
  }, []);

  const handleGlobalDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
  }, []);

  const handleGlobalDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDraggingFile(false);
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      // Get all files (we'll filter audio files in the overlay)
      setDroppedFiles(Array.from(files));
      setShowQuickPlayOverlay(true);
    }
  }, []);

  // Set up global drag and drop listeners
  useEffect(() => {
    document.addEventListener("dragenter", handleGlobalDragEnter);
    document.addEventListener("dragleave", handleGlobalDragLeave);
    document.addEventListener("dragover", handleGlobalDragOver);
    document.addEventListener("drop", handleGlobalDrop);

    return () => {
      document.removeEventListener("dragenter", handleGlobalDragEnter);
      document.removeEventListener("dragleave", handleGlobalDragLeave);
      document.removeEventListener("dragover", handleGlobalDragOver);
      document.removeEventListener("drop", handleGlobalDrop);
    };
  }, [handleGlobalDragEnter, handleGlobalDragLeave, handleGlobalDragOver, handleGlobalDrop]);

  // Handle quick play - play files directly without adding to library
  const handleQuickPlayFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    if (files.length === 1) {
      // Single file - use simpler playFile
      await playFile(files[0]);
    } else {
      // Multiple files - use playFiles to create a temporary queue
      await playFiles(files);
    }
  }, [playFile, playFiles]);

  // Handle import and play - add to library and play
  const handleImportAndPlayFiles = useCallback(async (files: File[]) => {
    const result = await importFiles(files);
    if (result.songs.length > 0) {
      playSong(result.songs[0], null);
    }
  }, [importFiles, playSong]);

  // Dismiss quick play overlay
  const handleDismissQuickPlay = useCallback(() => {
    setShowQuickPlayOverlay(false);
    setDroppedFiles([]);
  }, []);

  const handleSelectPlaylist = (playlist: Playlist) => {
    navigate(`/playlists/${playlist.id}`);
  };

  const getPlaylistSongs = (playlist: Playlist): Song[] => {
    return playlist.songIds
      .map((id) => songs.find((s) => s.id === id))
      .filter((s): s is Song => s !== undefined);
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    const playlistSongs = getPlaylistSongs(playlist);
    if (playlistSongs.length > 0) {
      playPlaylist(playlist, playlistSongs);
    }
  };

  // Shuffle and play - shuffles songs and plays the first one
  const handleShufflePlay = (
    songsToShuffle: Song[],
    playlistId?: string | null,
  ) => {
    if (songsToShuffle.length === 0) return;

    // Get a random song to start with
    const randomIndex = Math.floor(Math.random() * songsToShuffle.length);
    const firstSong = songsToShuffle[randomIndex];

    // Play the song (shuffle mode will be enabled)
    playSong(firstSong, playlistId ?? null);

    // Enable shuffle if not already enabled
    if (!shuffle) {
      toggleShuffle();
    }
  };

  // Memoized page elements to prevent re-mounting on every render
  const libraryPage = useMemo(
    () => (
      <div className="flex-1 flex flex-col p-6 pt-16 pb-24 md:pb-20 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-vinyl-text">Library</h1>
            <p className="text-vinyl-text-muted">{songs.length} songs</p>
          </div>
          <div className="flex items-center gap-2">
            {songs.length > 0 && (
              <>
                <button
                  onClick={() => handleShufflePlay(songs, null)}
                  className="p-3 bg-vinyl-surface border border-vinyl-border rounded-full text-vinyl-text-muted hover:text-vinyl-accent hover:border-vinyl-accent transition-colors"
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content="Shuffle Play"
                >
                  <Shuffle className="w-5 h-5" />
                </button>
                <button
                  onClick={() => songs.length > 0 && playSong(songs[0], null)}
                  className="p-3 bg-vinyl-accent rounded-full text-vinyl-bg hover:bg-vinyl-accent-light transition-colors"
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content="Play All"
                >
                  <Play className="w-5 h-5" fill="currentColor" />
                </button>
              </>
            )}
            <ImportMusic
              onImport={handleImport}
              onConnectFolder={connectFolder}
              onPickAndImportFolder={pickAndImportFolder}
              onCreatePlaylistsFromFolders={handleCreatePlaylistsFromFolders}
              isImporting={!!importProgress}
              importProgress={importProgress}
              connectedCount={connectedCount}
              totalCount={totalCount}
              isDesktop={isDesktop}
            />
          </div>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-vinyl-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-16">
            <Library className="w-16 h-16 mx-auto mb-4 text-vinyl-text-muted" />
            <h2 className="text-xl font-semibold text-vinyl-text mb-2">
              Your library is empty
            </h2>
            <p className="text-vinyl-text-muted mb-4">
              Add some music to get started
            </p>
            <p className="text-vinyl-text-muted text-sm">
              You can also <span className="text-vinyl-accent">drag and drop</span> audio files anywhere to play them instantly
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden">
            <VirtualizedSongList
              songs={songs}
              currentSongId={currentSong?.id || null}
              isPlaying={isPlaying}
              onPlay={(song) => playSong(song, null)}
              onTogglePlayPause={togglePlayPause}
              onStop={stop}
              onDelete={handleDeleteSong}
              playlists={playlists}
              onAddToPlaylist={handleAddSongToPlaylist}
              onCreatePlaylist={handleCreatePlaylistWithToast}
              unavailableSongIds={unavailableSongIds}
              onDeleteSong={handleDeleteSongWithToast}
              favoriteSongIds={favoriteSongIds}
              onToggleFavorite={handleToggleFavoriteWithToast}
              skipDeleteConfirmation={settings.skipDeleteConfirmation}
              onSkipDeleteConfirmationChange={
                handleSkipDeleteConfirmationChange
              }
            />
          </div>
        )}
      </div>
    ),
    [
      songs,
      currentSong?.id,
      isPlaying,
      isLoading,
      importProgress,
      playlists,
      unavailableSongIds,
      handleImport,
      handleShufflePlay,
      playSong,
      togglePlayPause,
      stop,
      handleDeleteSongWithToast,
      handleAddSongToPlaylist,
      handleCreatePlaylistWithToast,
      favoriteSongIds,
      handleToggleFavoriteWithToast,
      settings.skipDeleteConfirmation,
      handleSkipDeleteConfirmationChange,
    ],
  );

  const playlistsPage = useMemo(
    () => (
      <div className="flex-1 flex flex-col p-6 pt-16 pb-24 md:pb-20 h-full overflow-hidden">
        <ScrollArea className="flex-1">
          <PlaylistView
            playlists={playlists}
            songs={songs}
            currentPlaylistId={currentPlaylistId}
            isPlaying={isPlaying}
            onCreatePlaylist={async (name) => {
              await handleCreatePlaylistWithToast(name);
            }}
            onDeletePlaylist={deletePlaylist}
            onUpdatePlaylist={updatePlaylist}
            onSelectPlaylist={handleSelectPlaylist}
            onPlayPlaylist={handlePlayPlaylist}
            onShufflePlaylist={(playlist) => {
              const playlistSongs = getPlaylistSongs(playlist);
              handleShufflePlay(playlistSongs, playlist.id);
            }}
            onStopPlaylist={stop}
          />
        </ScrollArea>
      </div>
    ),
    [
      playlists,
      songs,
      currentPlaylistId,
      isPlaying,
      createPlaylist,
      deletePlaylist,
      updatePlaylist,
      handleSelectPlaylist,
      handlePlayPlaylist,
      getPlaylistSongs,
      handleShufflePlay,
      stop,
    ],
  );

  // Reference to stop the generator from outside
  const stopGeneratorRef = useRef<(() => void) | null>(null);

  const handleGeneratorPlay = useCallback(() => {
    // Stop main audio player when generator starts
    if (isPlaying) {
      stop();
    }
  }, [isPlaying, stop]);

  const handleRegisterGeneratorStop = useCallback((stopFn: () => void) => {
    stopGeneratorRef.current = stopFn;
  }, []);

  // Stop generator when main player starts playing
  useEffect(() => {
    if (isPlaying && stopGeneratorRef.current) {
      stopGeneratorRef.current();
    }
  }, [isPlaying]);

  const generatorPage = useMemo(
    () => (
      <ScrollArea className="flex-1 pt-16 pb-24 md:pb-20">
        <MusicGeneratorView
          onGeneratorPlay={handleGeneratorPlay}
          onRegisterStop={handleRegisterGeneratorStop}
        />
      </ScrollArea>
    ),
    [handleGeneratorPlay, handleRegisterGeneratorStop],
  );

  // Handle library import - wrapper to convert MusicFileInfo to the import format
  const handleLibraryImport = useCallback(
    async (
      files: {
        path: string;
        name: string;
        extension: string;
        folder: string | null;
      }[],
    ) => {
      await importFromMusicFileInfos(files);
    },
    [importFromMusicFileInfos],
  );

  const settingsPage = useMemo(
    () => (
      <ScrollArea className="flex-1 pt-16 pb-24 md:pb-20">
        <SettingsView
          settings={settings}
          onUpdateSetting={updateSetting}
          onResetSettings={resetSettings}
          onResetPlayer={handleResetPlayer}
          eqBands={eqBands}
          eqEnabled={eqEnabled}
          eqPreset={eqPreset}
          eqConnected={eqConnected}
          onEqBandChange={setBandGain}
          onEqPresetChange={applyPreset}
          onEqReset={resetEqualizer}
          onEqToggleEnabled={toggleEqualizer}
          // Library props
          libraryFolders={library.folders}
          libraryIsScanning={library.isScanning}
          libraryScanProgress={library.scanProgress}
          libraryLastScanResult={library.lastScanResult}
          libraryError={library.error}
          libraryIsDesktop={library.isDesktop}
          libraryIsWatching={library.isWatching}
          totalSongsInLibrary={songs.length}
          onLibraryAddFolder={library.addFolder}
          onLibraryRemoveFolder={library.removeFolder}
          onLibraryScanFolder={library.scanFolder}
          onLibraryScanAllFolders={library.scanAllFolders}
          onLibraryImportFiles={handleLibraryImport}
          onLibraryClearError={library.clearError}
        />
      </ScrollArea>
    ),
    [
      settings,
      updateSetting,
      resetSettings,
      eqBands,
      eqEnabled,
      eqPreset,
      eqConnected,
      setBandGain,
      applyPreset,
      resetEqualizer,
      toggleEqualizer,
      library.folders,
      library.isScanning,
      library.scanProgress,
      library.lastScanResult,
      library.error,
      library.isDesktop,
      library.isWatching,
      songs.length,
      library.addFolder,
      library.removeFolder,
      library.scanFolder,
      library.scanAllFolders,
      handleLibraryImport,
      library.clearError,
    ],
  );

  const aboutPage = useMemo(
    () => (
      <ScrollArea className="flex-1 pt-16 pb-24 md:pb-20">
        <AboutView />
      </ScrollArea>
    ),
    [],
  );

  // Show loading state while checking first launch
  if (checkingFirstLaunch) {
    return (
      <div className="h-screen bg-vinyl-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-vinyl-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show first launch wizard
  if (showFirstLaunchWizard) {
    return (
      <FirstLaunchWizard
        onAddFolder={library.addFolder}
        onScanFolder={library.scanFolder}
        onImportFiles={handleLibraryImport}
        onComplete={handleWizardComplete}
        onSkip={handleWizardSkip}
      />
    );
  }

  return (
    <div className="h-screen bg-vinyl-bg flex overflow-hidden">
      {/* Desktop sidebar - Minimal icon-only sidebar */}
      <div className="hidden md:block">
        <Sidebar
          canInstall={canInstall}
          onInstall={promptInstall}
          isUpdateAvailable={isUpdateAvailable}
          onUpdate={updateApp}
          appTitle={settings.appTitle}
          appIcon={settings.appIcon}
          theme={settings.theme}
          onToggleTheme={() =>
            updateSetting("theme", settings.theme === "dark" ? "light" : "dark")
          }
        />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative md:ml-16">
        {/* Top navigation bar - now minimal */}
        <TopNav />

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Navigate to="/library" replace />} />
          <Route path="/library" element={libraryPage} />
          <Route path="/playlists" element={playlistsPage} />
          <Route
            path="/playlists/:playlistId"
            element={
              <PlaylistDetailPage
                playlists={playlists}
                currentPlaylistId={currentPlaylistId}
                currentSongId={currentSong?.id || null}
                isPlaying={isPlaying}
                unavailableSongIds={unavailableSongIds}
                favoriteSongIds={favoriteSongIds}
                getPlaylistSongs={getPlaylistSongs}
                handleShufflePlay={handleShufflePlay}
                handlePlayPlaylist={handlePlayPlaylist}
                playSong={playSong}
                togglePlayPause={togglePlayPause}
                stop={stop}
                updatePlaylist={updatePlaylist}
                handleDeleteSong={handleDeleteSong}
                toggleFavorite={toggleFavorite}
                skipDeleteConfirmation={settings.skipDeleteConfirmation}
                onSkipDeleteConfirmationChange={
                  handleSkipDeleteConfirmationChange
                }
              />
            }
          />
          <Route path="/generator" element={generatorPage} />
          <Route path="/settings" element={settingsPage} />
          <Route path="/about" element={aboutPage} />
        </Routes>
      </main>

      {/* Player Overlay - Mini player and expandable Now Playing */}
      <PlayerOverlay
        currentSong={currentSong || null}
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
        showAlbumArt={settings.showAlbumArt}
        isFavorite={currentSong ? favoriteSongIds.has(currentSong.id) : false}
        eqBands={eqBands}
        eqEnabled={eqEnabled}
        eqPreset={eqPreset}
        eqConnected={eqConnected}
        onEqBandChange={setBandGain}
        onEqPresetChange={applyPreset}
        onEqReset={resetEqualizer}
        onEqToggleEnabled={handleToggleEqualizer}
        // Sleep timer props
        sleepTimerActive={sleepTimer.isActive}
        sleepTimerRemainingTime={sleepTimer.formatRemainingTime()}
        sleepTimerProgress={sleepTimer.getProgress()}
        onSleepTimerStart={(minutes: number) => {
          sleepTimer.startTimer(minutes);
          toast.success(`Sleep timer: ${minutes} minutes`, { duration: 2000 });
        }}
        onSleepTimerStop={() => {
          sleepTimer.stopTimer();
          toast.success("Sleep timer cancelled", { duration: 2000 });
        }}
        onSleepTimerAddTime={(minutes: number) => {
          sleepTimer.addTime(minutes);
          toast.success(`Added ${minutes} minutes`, { duration: 2000 });
        }}
        // Display mode
        displayMode={settings.displayMode}
        onDisplayModeChange={(mode) => {
          updateSetting("displayMode", mode);
          const modeNames: Record<string, string> = { vinyl: "Vinyl Player", albumArt: "Album Art" };
          toast.success(`Display: ${modeNames[mode]}`, { duration: 1500 });
        }}
        // Generator props (for Now Playing generator mode)
        onGeneratorPlay={handleGeneratorPlay}
        onRegisterGeneratorStop={handleRegisterGeneratorStop}
        // Visualizer props
        visualizerEnabled={settings.visualizerEnabled}
        visualizerStyle={settings.visualizerStyle}
        frequencyData={frequencyData}
        waveformData={waveformData}
        onVisualizerToggle={() => {
          updateSetting("visualizerEnabled", !settings.visualizerEnabled);
          toast.success(settings.visualizerEnabled ? "Visualizer off" : "Visualizer on", { duration: 1500 });
        }}
        onVisualizerStyleChange={(style) =>
          updateSetting("visualizerStyle", style)
        }
        onTogglePlayPause={togglePlayPause}
        onNext={playNext}
        onPrevious={playPrevious}
        onSeek={seek}
        onVolumeChange={setVolume}
        onToggleRepeat={handleToggleRepeat}
        onToggleShuffle={handleToggleShuffle}
        onSpeedChange={handleSpeedChange}
        onPlayFromQueue={playFromQueue}
        onStop={stop}
        onDeleteFromQueue={removeSongFromQueue}
        onReorderQueue={reorderQueue}
        onToggleFavorite={
          currentSong ? () => handleToggleFavoriteWithToast(currentSong.id) : undefined
        }
        autoExpand={autoExpandPlayer}
        onAutoExpandHandled={() => setAutoExpandPlayer(false)}
      />

      {/* Mobile navigation */}
      <MobileNav />

      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4" />
          <span>You're offline - music stored locally will still play</span>
        </div>
      )}

      {/* Offline ready notification */}
      {isOfflineReady && (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-vinyl-surface border border-vinyl-border rounded-lg shadow-xl p-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-vinyl-text">Ready for offline</p>
              <p className="text-sm text-vinyl-text-muted">
                App is cached and will work without internet
              </p>
            </div>
            <button
              onClick={dismissOfflineReady}
              className="p-1 rounded-full hover:bg-vinyl-border transition-colors text-vinyl-text-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Drop zone overlay - shown when dragging files */}
      <DropZoneOverlay isVisible={isDraggingFile} />

      {/* Quick play overlay - shown when file is dropped */}
      <QuickPlayOverlay
        isVisible={showQuickPlayOverlay}
        droppedFiles={droppedFiles}
        onPlayFiles={handleQuickPlayFiles}
        onImportAndPlay={handleImportAndPlayFiles}
        onDismiss={handleDismissQuickPlay}
      />

      {/* Music Info Dialog - shows detailed track information */}
      <MusicInfoDialog
        isOpen={showMusicInfoDialog}
        onClose={() => setShowMusicInfoDialog(false)}
        song={currentSong || null}
      />

      {/* Command Menu (Cmd/Ctrl+K) */}
      <CommandMenu
        isOpen={showCommandMenu}
        onClose={() => setShowCommandMenu(false)}
        songs={songs}
        isPlaying={isPlaying}
        currentSong={currentSong || null}
        shuffle={shuffle}
        repeat={repeat}
        volume={volume}
        onPlayPause={togglePlayPause}
        onNext={playNext}
        onPrevious={playPrevious}
        onToggleShuffle={handleToggleShuffle}
        onToggleRepeat={handleToggleRepeat}
        onMute={handleToggleMute}
        onPlaySong={(song) => playSong(song, null)}
        favoriteSongIds={favoriteSongIds}
        onToggleFavorite={handleToggleFavoriteWithToast}
        theme={settings.theme}
        onToggleTheme={() => {
          const newTheme = settings.theme === "dark" ? "light" : "dark";
          updateSetting("theme", newTheme);
          toast.success(`Theme: ${newTheme === "dark" ? "Dark" : "Light"}`, { duration: 1500 });
        }}
        visualizerEnabled={settings.visualizerEnabled}
        onToggleVisualizer={() => {
          updateSetting("visualizerEnabled", !settings.visualizerEnabled);
          toast.success(settings.visualizerEnabled ? "Visualizer off" : "Visualizer on", { duration: 1500 });
        }}
        onCycleVisualizerStyle={handleCycleVisualizer}
        onShowMusicInfo={() => setShowMusicInfoDialog(true)}
        onShowKeyboardShortcuts={() => setShowKeyboardShortcuts(true)}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />
    </div>
  );
}

export default App;
