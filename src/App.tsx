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
import { useSongs, checkSongsAvailability } from "./hooks/useSongs";
import { usePlaylists } from "./hooks/usePlaylists";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { useEqualizer } from "./hooks/useEqualizer";
import { useSettings } from "./hooks/useSettings";
import { usePWA } from "./hooks/usePWA";
import { clearAllData } from "./lib/db";
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

  const {
    songs,
    isLoading,
    importProgress,
    importFiles,
    deleteSong,
    connectFolder,
    connectedCount,
    totalCount,
    // Tauri-specific
    isDesktop,
    pickAndImportFolder,
    autoLoadStoredFolder,
  } = useSongs();
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

  // Get current playlist object
  const currentPlaylist =
    playlists.find((p) => p.id === currentPlaylistId) || null;

  // Mark as initialized once loading is complete
  useEffect(() => {
    if (!isLoading && !hasInitialized) {
      setHasInitialized(true);
    }
  }, [isLoading, hasInitialized]);

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

    // Reload the page to reset all state
    window.location.reload();
  };

  // Handle skip delete confirmation change
  const handleSkipDeleteConfirmationChange = useCallback(
    (skip: boolean) => {
      updateSetting("skipDeleteConfirmation", skip);
    },
    [updateSetting],
  );

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
            <p className="text-vinyl-text-muted mb-6">
              Add some music to get started
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
              onAddToPlaylist={addSongToPlaylist}
              unavailableSongIds={unavailableSongIds}
              onDeleteSong={handleDeleteSong}
              favoriteSongIds={favoriteSongIds}
              onToggleFavorite={toggleFavorite}
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
      handleDeleteSong,
      addSongToPlaylist,
    ],
  );

  const playlistsPage = useMemo(
    () => (
      <div className="flex-1 flex flex-col p-6 pt-16 pb-24 md:pb-20 h-full overflow-hidden">
        <div className="flex-1 overflow-auto">
          <PlaylistView
            playlists={playlists}
            songs={songs}
            currentPlaylistId={currentPlaylistId}
            isPlaying={isPlaying}
            onCreatePlaylist={async (name) => {
              await createPlaylist(name);
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
        </div>
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
      <div className="flex-1 overflow-auto pt-16 pb-24 md:pb-20">
        <MusicGeneratorView
          onGeneratorPlay={handleGeneratorPlay}
          onRegisterStop={handleRegisterGeneratorStop}
        />
      </div>
    ),
    [handleGeneratorPlay, handleRegisterGeneratorStop],
  );

  const settingsPage = useMemo(
    () => (
      <div className="flex-1 overflow-auto pt-16 pb-24 md:pb-20">
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
        />
      </div>
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
    ],
  );

  const aboutPage = useMemo(
    () => (
      <div className="flex-1 overflow-auto pt-16 pb-24 md:pb-20">
        <AboutView />
      </div>
    ),
    [],
  );

  return (
    <div className="h-screen bg-vinyl-bg flex overflow-hidden">
      {/* Desktop sidebar - Fixed height, doesn't scroll with content */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar
          songCount={songs.length}
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
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
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
        onEqToggleEnabled={toggleEqualizer}
        onTogglePlayPause={togglePlayPause}
        onNext={playNext}
        onPrevious={playPrevious}
        onSeek={seek}
        onVolumeChange={setVolume}
        onToggleRepeat={toggleRepeat}
        onToggleShuffle={toggleShuffle}
        onSpeedChange={setSpeed}
        onPlayFromQueue={playFromQueue}
        onStop={stop}
        onDeleteFromQueue={removeSongFromQueue}
        onToggleFavorite={
          currentSong ? () => toggleFavorite(currentSong.id) : undefined
        }
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
    </div>
  );
}

export default App;
