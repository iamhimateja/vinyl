import { useState, useRef, useEffect, useCallback } from "react";
import type {
  Song,
  PlayerState,
  PlaybackState,
  Playlist,
  AppSettings,
} from "../types";
import { savePlayerState, getPlayerState } from "../lib/db";
import { getCachedFile } from "./useSongs";
import { isTauri, getAssetUrl, fileExists } from "../lib/platform";

const defaultPlayerState: PlayerState = {
  currentSongId: null,
  position: 0,
  volume: 0.7,
  repeat: "none",
  shuffle: false,
  isPlaying: false,
  queue: [],
  queueIndex: -1,
  speed: 1,
  currentPlaylistId: null,
};

export function useAudioPlayer(songs: Song[], settings?: AppSettings) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playerState, setPlayerState] =
    useState<PlayerState>(defaultPlayerState);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const objectUrlRef = useRef<string | null>(null);
  const hasRestoredSong = useRef(false);
  const savedPositionRef = useRef<number>(0);
  const isLoadingRef = useRef(false); // Prevent concurrent loads

  // Use refs for values needed in event handlers to avoid stale closures
  const playerStateRef = useRef(playerState);
  const songsRef = useRef(songs);
  const settingsRef = useRef(settings);

  // Keep refs in sync
  useEffect(() => {
    playerStateRef.current = playerState;
  }, [playerState]);

  useEffect(() => {
    songsRef.current = songs;
  }, [songs]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Play song at index - defined early so it can be used by handleSongEnd
  const playSongAtIndex = useCallback(async (index: number) => {
    const state = playerStateRef.current;
    const allSongs = songsRef.current;
    const songId = state.queue[index];
    const song = allSongs.find((s) => s.id === songId);

    if (!song || !audioRef.current) return;

    // Revoke previous object URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setPlayerState((prev) => ({
      ...prev,
      currentSongId: song.id,
      isPlaying: true,
      queueIndex: index,
    }));

    setPlaybackState("buffering");

    // Try to get audio source
    let audioUrl: string | null = null;

    console.log("[AudioPlayer] Playing song:", song.title);
    console.log("[AudioPlayer] isTauri:", isTauri());
    console.log("[AudioPlayer] song.filePath:", song.filePath);

    // On desktop with file path, use asset protocol
    if (isTauri() && song.filePath) {
      // Verify file still exists
      const exists = await fileExists(song.filePath);
      console.log("[AudioPlayer] fileExists:", exists);

      if (exists) {
        audioUrl = await getAssetUrl(song.filePath);
        console.log("[AudioPlayer] Asset URL:", audioUrl);
        // Store for cleanup (getAssetUrl creates blob URLs that need revoking)
        if (audioUrl) {
          objectUrlRef.current = audioUrl;
        }
      }
    }

    // Fall back to memory cache (web or desktop without filePath)
    if (!audioUrl) {
      const cachedFile = getCachedFile(song.id);
      console.log(
        "[AudioPlayer] Cached file:",
        cachedFile ? "found" : "not found",
      );
      if (cachedFile) {
        objectUrlRef.current = URL.createObjectURL(cachedFile);
        audioUrl = objectUrlRef.current;
      }
    }

    if (!audioUrl) {
      // No audio source available - file needs to be reconnected
      console.error(
        "No audio source available for song:",
        song.title,
        "- connect your music folder",
      );
      console.error("[AudioPlayer] Debug info:", {
        isTauri: isTauri(),
        filePath: song.filePath,
        songId: song.id,
      });
      setPlaybackState("idle");
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
      return;
    }

    audioRef.current.src = audioUrl;

    // Apply current playback speed
    audioRef.current.playbackRate = state.speed;

    // Setup Media Session
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: song.album,
        artwork: song.coverArt ? [{ src: song.coverArt }] : [],
      });
    }

    try {
      await audioRef.current.play();
      setPlaybackState("playing");
    } catch (error) {
      console.error("Playback failed:", error);
      setPlaybackState("idle");
    }
  }, []);

  // Get next song index based on shuffle and repeat settings
  const getNextIndex = useCallback((state: PlayerState): number | null => {
    if (state.queue.length === 0) return null;

    if (state.shuffle) {
      // Shuffle: pick a random song from queue (excluding current if possible)
      if (state.queue.length === 1) {
        // Only one song
        return state.repeat === "all" ? 0 : null;
      }

      // Get all indices except current
      const availableIndices: number[] = [];
      for (let i = 0; i < state.queue.length; i++) {
        if (i !== state.queueIndex) {
          availableIndices.push(i);
        }
      }

      if (availableIndices.length === 0) {
        return state.repeat === "all" ? 0 : null;
      }

      // Pick random index
      return availableIndices[
        Math.floor(Math.random() * availableIndices.length)
      ];
    } else {
      // Sequential: play next in order
      const nextIndex = state.queueIndex + 1;

      if (nextIndex < state.queue.length) {
        return nextIndex;
      } else if (state.repeat === "all") {
        return 0; // Loop back to start
      }
      return null; // End of queue
    }
  }, []);

  // Handle song end - using refs to always have current values
  const handleSongEnd = useCallback(() => {
    const state = playerStateRef.current;
    const autoPlay = settingsRef.current?.autoPlay !== false; // Default to true

    setPlaybackState("ended");

    // Repeat one: loop current song
    if (state.repeat === "one") {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        setPlaybackState("playing");
      }
      return;
    }

    // Auto-play disabled
    if (!autoPlay) {
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
      return;
    }

    // Get next song to play
    const nextIndex = getNextIndex(state);

    if (nextIndex !== null) {
      playSongAtIndex(nextIndex);
    } else {
      // No more songs to play
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, [playSongAtIndex, getNextIndex]);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = settings?.defaultVolume ?? playerState.volume;

    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => handleSongEnd();
    const handleWaiting = () => setPlaybackState("buffering");
    const handleCanPlay = () => {
      if (playerStateRef.current.isPlaying) setPlaybackState("playing");
    };
    const handleError = (e: Event) => {
      console.error("Audio error:", e);
      setPlaybackState("idle");
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    // Load saved state
    loadSavedState();

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audio.pause();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, [handleSongEnd]);

  // Load saved player state
  const loadSavedState = async () => {
    const saved = await getPlayerState();
    const appSettings = settingsRef.current;

    if (saved) {
      const volume = appSettings?.rememberVolume
        ? saved.volume
        : (appSettings?.defaultVolume ?? saved.volume);

      // Store position to restore later when songs are loaded
      savedPositionRef.current = saved.position ?? 0;

      setPlayerState((prev) => ({
        ...prev,
        currentSongId: saved.currentSongId,
        volume,
        repeat: saved.repeat || appSettings?.defaultRepeatMode || "none",
        shuffle: saved.shuffle ?? appSettings?.defaultShuffleMode ?? false,
        queue: saved.queue || [],
        queueIndex: saved.queueIndex ?? -1,
        speed: saved.speed ?? 1,
        currentPlaylistId: saved.currentPlaylistId,
        isPlaying: false, // Don't auto-play on load
      }));

      if (audioRef.current) {
        audioRef.current.volume = volume;
      }
    } else if (appSettings) {
      // No saved state, use defaults from settings
      setPlayerState((prev) => ({
        ...prev,
        volume: appSettings.defaultVolume,
        shuffle: appSettings.defaultShuffleMode,
        repeat: appSettings.defaultRepeatMode,
      }));
      if (audioRef.current) {
        audioRef.current.volume = appSettings.defaultVolume;
      }
    }
  };

  // Save state periodically and on page unload
  useEffect(() => {
    const saveState = () => {
      savePlayerState({
        ...playerState,
        position: currentTime,
      });
    };

    const saveInterval = setInterval(saveState, 5000);

    // Also save on page unload/refresh
    const handleBeforeUnload = () => {
      saveState();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(saveInterval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [playerState, currentTime]);

  // Load a song (prepare for playback)
  // If startPosition is provided, seeks to that position once loaded
  const loadSong = useCallback(
    async (
      song: Song,
      startPosition?: number,
      isUserInitiated?: boolean,
    ): Promise<boolean> => {
      if (!audioRef.current) return false;

      // If a user-initiated load, always proceed (and mark as loading)
      // If not user-initiated (like restore), skip if already loading
      if (isUserInitiated) {
        isLoadingRef.current = true;
      } else if (isLoadingRef.current) {
        console.log(
          "[AudioPlayer:loadSong] Skipping non-user load - already loading",
        );
        return false;
      }

      // Revoke previous object URL
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      setPlaybackState("buffering");

      let audioUrl: string | null = null;

      // Very visible debug output
      const debugInfo = {
        title: song.title,
        isTauri: isTauri(),
        filePath: song.filePath,
        hasFilePath: !!song.filePath,
        songId: song.id,
      };
      console.log("[AudioPlayer:loadSong] ========== LOADING SONG ==========");
      console.log(
        "[AudioPlayer:loadSong] Debug:",
        JSON.stringify(debugInfo, null, 2),
      );

      // Temporary alert for debugging - remove after fix
      // alert(`Loading: ${song.title}\nisTauri: ${isTauri()}\nfilePath: ${song.filePath || 'NONE'}`);

      // On desktop with file path, use asset protocol
      if (isTauri() && song.filePath) {
        // Verify file still exists
        const exists = await fileExists(song.filePath);
        console.log("[AudioPlayer:loadSong] fileExists:", exists);

        if (exists) {
          audioUrl = await getAssetUrl(song.filePath);
          console.log("[AudioPlayer:loadSong] Asset URL:", audioUrl);
          // Store for cleanup (getAssetUrl creates blob URLs that need revoking)
          if (audioUrl) {
            objectUrlRef.current = audioUrl;
          }
        }
      }

      // Fall back to memory cache (web or desktop without filePath)
      if (!audioUrl) {
        const cachedFile = getCachedFile(song.id);
        console.log(
          "[AudioPlayer:loadSong] Cached file:",
          cachedFile ? "found" : "not found",
        );
        if (cachedFile) {
          objectUrlRef.current = URL.createObjectURL(cachedFile);
          audioUrl = objectUrlRef.current;
        }
      }

      if (!audioUrl) {
        // No audio source available - file needs to be reconnected
        console.error(
          "No audio source available for song:",
          song.title,
          "- connect your music folder",
        );
        console.error("[AudioPlayer:loadSong] Debug info:", {
          isTauri: isTauri(),
          filePath: song.filePath,
          songId: song.id,
        });
        setPlaybackState("idle");
        isLoadingRef.current = false; // Reset loading flag on failure
        return false;
      }

      audioRef.current.src = audioUrl;

      // Setup Media Session
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: song.title,
          artist: song.artist,
          album: song.album,
          artwork: song.coverArt ? [{ src: song.coverArt }] : [],
        });
      }

      // If a start position is provided, wait for audio to be ready and seek
      if (
        startPosition !== undefined &&
        startPosition > 0 &&
        audioRef.current
      ) {
        const audio = audioRef.current;
        await new Promise<void>((resolve) => {
          const handleCanPlay = () => {
            audio.currentTime = startPosition;
            setCurrentTime(startPosition);
            audio.removeEventListener("canplay", handleCanPlay);
            resolve();
          };
          audio.addEventListener("canplay", handleCanPlay);

          // Also handle case where audio is already ready
          if (audio.readyState >= 3) {
            audio.removeEventListener("canplay", handleCanPlay);
            audio.currentTime = startPosition;
            setCurrentTime(startPosition);
            resolve();
          }
        });
      }

      // Clear loading flag after a short delay to prevent immediate re-triggers
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);

      return true;
    },
    [],
  );

  // Restore song when songs become available (after page refresh)
  useEffect(() => {
    const restoreSong = async () => {
      // Only run once, when songs are loaded and we have a saved currentSongId
      if (
        hasRestoredSong.current ||
        songs.length === 0 ||
        !playerState.currentSongId
      ) {
        return;
      }

      const song = songs.find((s) => s.id === playerState.currentSongId);
      if (!song) {
        // Song no longer exists, clear the state
        setPlayerState((prev) => ({
          ...prev,
          currentSongId: null,
          queueIndex: -1,
        }));
        return;
      }

      hasRestoredSong.current = true;

      // Load the song with the saved position
      const loaded = await loadSong(song, savedPositionRef.current);

      if (loaded && audioRef.current) {
        // Apply saved playback speed
        audioRef.current.playbackRate = playerState.speed;
        setPlaybackState("paused");
      }
    };

    restoreSong();
  }, [songs, playerState.currentSongId, playerState.speed, loadSong]);

  // Play a specific song
  const playSong = async (song: Song, playlistId?: string | null) => {
    // Debug: log the song being played
    console.log("[AudioPlayer:playSong] Called with song:", {
      id: song.id,
      title: song.title,
      filePath: song.filePath,
      hasFilePath: !!song.filePath,
    });

    // Also check if this song exists in our songs array with filePath
    const songInArray = songs.find((s) => s.id === song.id);
    console.log(
      "[AudioPlayer:playSong] Song in songs array:",
      songInArray
        ? {
            id: songInArray.id,
            title: songInArray.title,
            filePath: songInArray.filePath,
            hasFilePath: !!songInArray.filePath,
          }
        : "NOT FOUND",
    );

    // Use the song from our array if it has more complete data
    const songToPlay = songInArray?.filePath ? songInArray : song;
    console.log(
      "[AudioPlayer:playSong] Using song:",
      songToPlay.filePath ? "from array" : "from param",
    );

    const queue = playerState.shuffle
      ? shuffleArray(songs.map((s) => s.id))
      : songs.map((s) => s.id);

    const queueIndex = queue.indexOf(songToPlay.id);

    setPlayerState((prev) => ({
      ...prev,
      currentSongId: songToPlay.id,
      isPlaying: true,
      queue,
      queueIndex: queueIndex >= 0 ? queueIndex : 0,
      currentPlaylistId:
        playlistId !== undefined ? playlistId : prev.currentPlaylistId,
    }));

    // Mark hasRestoredSong to prevent restore effect from interfering
    hasRestoredSong.current = true;

    const loaded = await loadSong(songToPlay, undefined, true); // User-initiated

    if (!loaded) {
      // Audio source not available - reset state
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
      return;
    }

    if (audioRef.current) {
      // Apply current playback speed
      audioRef.current.playbackRate = playerState.speed;

      try {
        await audioRef.current.play();
        setPlaybackState("playing");
      } catch (error) {
        console.error("Playback failed:", error);
        setPlaybackState("idle");
      }
    }
  };

  // Play a playlist
  const playPlaylist = async (playlist: Playlist, playlistSongs: Song[]) => {
    if (playlistSongs.length === 0) return;

    const appSettings = settingsRef.current;
    const shouldClearQueue = appSettings?.clearQueueOnNewPlaylist !== false;

    // Build the new queue from playlist songs only
    const playlistQueue = playerState.shuffle
      ? shuffleArray(playlistSongs.map((s) => s.id))
      : playlistSongs.map((s) => s.id);

    const firstSong = playlistSongs.find((s) => s.id === playlistQueue[0]);
    if (!firstSong) return;

    setPlayerState((prev) => ({
      ...prev,
      currentSongId: firstSong.id,
      isPlaying: true,
      // Use only playlist songs in queue when clearQueueOnNewPlaylist is true
      queue: shouldClearQueue
        ? playlistQueue
        : [...prev.queue, ...playlistQueue],
      queueIndex: shouldClearQueue ? 0 : prev.queue.length,
      currentPlaylistId: playlist.id,
    }));

    // Mark hasRestoredSong to prevent restore effect from interfering
    hasRestoredSong.current = true;

    await loadSong(firstSong, undefined, true); // User-initiated

    if (audioRef.current) {
      // Apply current playback speed
      audioRef.current.playbackRate = playerState.speed;

      try {
        await audioRef.current.play();
        setPlaybackState("playing");
      } catch (error) {
        console.error("Playback failed:", error);
        setPlaybackState("idle");
      }
    }
  };

  // Play a song from the current queue (doesn't rebuild queue)
  const playFromQueue = async (song: Song) => {
    const queueIndex = playerState.queue.indexOf(song.id);

    if (queueIndex >= 0) {
      // Song is in the current queue, just play it at that index
      await playSongAtIndex(queueIndex);
    } else {
      // Song not in queue, fall back to playSong
      await playSong(song, playerState.currentPlaylistId);
    }
  };

  // Toggle play/pause
  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    if (playerState.isPlaying) {
      audioRef.current.pause();
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
      setPlaybackState("paused");
    } else {
      if (!playerState.currentSongId && songs.length > 0) {
        await playSong(songs[0]);
      } else {
        try {
          await audioRef.current.play();
          setPlayerState((prev) => ({ ...prev, isPlaying: true }));
          setPlaybackState("playing");
        } catch (error) {
          console.error("Playback failed:", error);
        }
      }
    }
  };

  // Stop playback completely
  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayerState((prev) => ({
      ...prev,
      isPlaying: false,
      currentPlaylistId: null,
    }));
    setPlaybackState("idle");
    setCurrentTime(0);
  };

  // Play next track
  const playNext = useCallback(() => {
    const state = playerStateRef.current;

    if (state.queue.length === 0) return;

    const nextIndex = getNextIndex(state);

    if (nextIndex !== null) {
      playSongAtIndex(nextIndex);
    }
  }, [playSongAtIndex, getNextIndex]);

  // Play previous track
  const playPrevious = useCallback(() => {
    const state = playerStateRef.current;

    // If more than 3 seconds in, restart current song
    if (currentTime > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
      return;
    }

    if (state.queue.length === 0) return;

    if (state.shuffle) {
      // Shuffle: pick a random song (same as next)
      const nextIndex = getNextIndex(state);
      if (nextIndex !== null) {
        playSongAtIndex(nextIndex);
      }
    } else {
      // Sequential: go to previous
      let prevIndex = state.queueIndex - 1;

      if (prevIndex < 0) {
        if (state.repeat === "all") {
          prevIndex = state.queue.length - 1;
        } else {
          if (audioRef.current) audioRef.current.currentTime = 0;
          return;
        }
      }

      playSongAtIndex(prevIndex);
    }
  }, [currentTime, playSongAtIndex, getNextIndex]);

  // Seek to position
  const seek = (time: number) => {
    if (audioRef.current) {
      // Preserve the playing state during seek
      const wasPlaying = playerState.isPlaying;
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      // Ensure playback state remains correct
      if (wasPlaying) {
        setPlaybackState("playing");
      }
    }
  };

  // Set volume
  const setVolume = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    setPlayerState((prev) => ({ ...prev, volume }));
  };

  // Toggle repeat mode
  const toggleRepeat = () => {
    setPlayerState((prev) => {
      const modes: PlayerState["repeat"][] = ["none", "all", "one"];
      const currentIndex = modes.indexOf(prev.repeat);
      const nextMode = modes[(currentIndex + 1) % modes.length];
      return { ...prev, repeat: nextMode };
    });
  };

  // Toggle shuffle - just toggles the flag
  // Actual random selection happens in playNext/handleSongEnd
  const toggleShuffle = () => {
    setPlayerState((prev) => ({
      ...prev,
      shuffle: !prev.shuffle,
    }));
  };

  // Set playback speed
  const setSpeed = (speed: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    setPlayerState((prev) => ({ ...prev, speed }));
  };

  // Remove a song from the queue and handle if it's currently playing
  const removeSongFromQueue = useCallback((songId: string) => {
    const state = playerStateRef.current;

    // Check if this song is currently playing
    if (state.currentSongId === songId) {
      // Stop playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Clear the object URL
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      setPlaybackState("idle");
      setCurrentTime(0);
      setDuration(0);

      // Remove from queue and reset
      const newQueue = state.queue.filter((id) => id !== songId);
      setPlayerState((prev) => ({
        ...prev,
        currentSongId: null,
        isPlaying: false,
        queue: newQueue,
        queueIndex: -1,
        currentPlaylistId: null,
      }));
    } else {
      // Just remove from queue
      const songIndex = state.queue.indexOf(songId);
      const newQueue = state.queue.filter((id) => id !== songId);

      // Adjust queue index if necessary
      let newQueueIndex = state.queueIndex;
      if (songIndex !== -1 && songIndex < state.queueIndex) {
        newQueueIndex = state.queueIndex - 1;
      }

      setPlayerState((prev) => ({
        ...prev,
        queue: newQueue,
        queueIndex: newQueueIndex,
      }));
    }
  }, []);

  // Setup Media Session handlers
  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => togglePlayPause());
      navigator.mediaSession.setActionHandler("pause", () => togglePlayPause());
      navigator.mediaSession.setActionHandler("previoustrack", () =>
        playPrevious(),
      );
      navigator.mediaSession.setActionHandler("nexttrack", () => playNext());
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined) seek(details.seekTime);
      });
    }
  }, [playerState.isPlaying, playerState.queueIndex]);

  // Get current song
  const currentSong = songs.find((s) => s.id === playerState.currentSongId);

  // Get queue songs (actual Song objects from queue IDs)
  const queueSongs = playerState.queue
    .map((id) => songs.find((s) => s.id === id))
    .filter((s): s is Song => s !== undefined);

  return {
    currentSong,
    isPlaying: playerState.isPlaying,
    playbackState,
    currentTime,
    duration,
    volume: playerState.volume,
    repeat: playerState.repeat,
    shuffle: playerState.shuffle,
    speed: playerState.speed,
    queue: playerState.queue,
    queueSongs,
    queueIndex: playerState.queueIndex,
    currentPlaylistId: playerState.currentPlaylistId,
    audioElement: audioRef.current,
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
  };
}

// Utility function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
