import { useState, useRef, useEffect, useCallback } from "react";
import type {
  Song,
  PlayerState,
  PlaybackState,
  Playlist,
  AppSettings,
} from "../types";
import { savePlayerState, getPlayerState } from "../lib/db";
import { getCachedFile, setCachedFile } from "./useSongs";
import { isDesktop, getAssetUrl, fileExists } from "../lib/platform";
import { extractMetadata, isAudioFile, generateId } from "../lib/audioMetadata";

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
  const nextAudioRef = useRef<HTMLAudioElement | null>(null); // For crossfade
  const [playerState, setPlayerState] =
    useState<PlayerState>(defaultPlayerState);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const objectUrlRef = useRef<string | null>(null);
  const nextObjectUrlRef = useRef<string | null>(null); // For crossfade
  const hasRestoredSong = useRef(false);
  const savedPositionRef = useRef<number>(0);
  const isLoadingRef = useRef(false); // Prevent concurrent loads
  const crossfadeInProgressRef = useRef(false); // Track if crossfade is happening
  const crossfadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

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

    const audio = audioRef.current;

    // Stop and reset current audio before loading new source
    audio.pause();
    audio.currentTime = 0;

    // Revoke previous blob URL to free memory
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    // Clear source only if it was previously set (avoid triggering error)
    if (
      audio.src &&
      audio.src !== "" &&
      !audio.src.startsWith(window.location.origin)
    ) {
      audio.src = "";
      audio.removeAttribute("src");
      audio.load();
    }

    setPlayerState((prev) => ({
      ...prev,
      currentSongId: song.id,
      isPlaying: true,
      queueIndex: index,
    }));

    setPlaybackState("buffering");

    try {
      // Try to get audio source
      let audioUrl: string | null = null;

      // On desktop with file path, read file and create blob URL
      if (isDesktop() && song.filePath) {
        const exists = await fileExists(song.filePath);
        if (exists) {
          audioUrl = await getAssetUrl(song.filePath);
          // getAssetUrl now returns blob URLs that need cleanup
          if (audioUrl) {
            objectUrlRef.current = audioUrl;
          }
        }
      }

      // Fall back to memory cache (web or desktop without filePath)
      if (!audioUrl) {
        const cachedFile = getCachedFile(song.id);
        if (cachedFile) {
          audioUrl = URL.createObjectURL(cachedFile);
          objectUrlRef.current = audioUrl;
        }
      }

      if (!audioUrl) {
        console.warn("No audio source for:", song.title);
        setPlaybackState("idle");
        setPlayerState((prev) => ({ ...prev, isPlaying: false }));
        return;
      }

      // Small delay to let the audio element reset
      await new Promise((resolve) => setTimeout(resolve, 50));

      audio.src = audioUrl;
      audio.playbackRate = state.speed;

      // Setup Media Session (skip artwork to avoid potential issues with large images)
      if ("mediaSession" in navigator) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: song.title,
            artist: song.artist,
            album: song.album,
          });
        } catch {
          // Ignore Media Session errors
        }
      }

      // Wait for canplay event before playing
      await new Promise<void>((resolve, reject) => {
        const onCanPlay = () => {
          audio.removeEventListener("canplay", onCanPlay);
          audio.removeEventListener("error", onError);
          resolve();
        };
        const onError = () => {
          audio.removeEventListener("canplay", onCanPlay);
          audio.removeEventListener("error", onError);
          reject(new Error("Audio load error"));
        };
        audio.addEventListener("canplay", onCanPlay);
        audio.addEventListener("error", onError);

        // Timeout after 10 seconds
        setTimeout(() => {
          audio.removeEventListener("canplay", onCanPlay);
          audio.removeEventListener("error", onError);
          resolve(); // Try to play anyway
        }, 10000);
      });

      await audio.play();
      setPlaybackState("playing");
    } catch (error) {
      console.error("Playback failed:", error);
      setPlaybackState("idle");
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
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

  // Helper to get audio URL for a song
  const getAudioUrl = useCallback(
    async (song: Song): Promise<string | null> => {
      // On desktop with file path, read file and create blob URL
      if (isDesktop() && song.filePath) {
        const exists = await fileExists(song.filePath);
        if (exists) {
          return await getAssetUrl(song.filePath);
        }
      }

      // Fall back to memory cache (web or desktop without filePath)
      const cachedFile = getCachedFile(song.id);
      if (cachedFile) {
        return URL.createObjectURL(cachedFile);
      }

      return null;
    },
    [],
  );

  // Perform crossfade from current audio to next
  const performCrossfade = useCallback(
    async (nextIndex: number) => {
      if (crossfadeInProgressRef.current) return;

      const state = playerStateRef.current;
      const allSongs = songsRef.current;
      const crossfadeDuration = settingsRef.current?.crossfadeDuration || 0;

      if (crossfadeDuration <= 0) return; // Crossfade disabled

      const nextSongId = state.queue[nextIndex];
      const nextSong = allSongs.find((s) => s.id === nextSongId);

      if (!nextSong || !audioRef.current) return;

      crossfadeInProgressRef.current = true;

      // Create next audio element if needed
      if (!nextAudioRef.current) {
        nextAudioRef.current = new Audio();
      }

      const currentAudio = audioRef.current;
      const nextAudio = nextAudioRef.current;

      // Clean up previous next object URL
      if (nextObjectUrlRef.current) {
        URL.revokeObjectURL(nextObjectUrlRef.current);
        nextObjectUrlRef.current = null;
      }

      try {
        // Get audio URL for next song
        const audioUrl = await getAudioUrl(nextSong);
        if (!audioUrl) {
          crossfadeInProgressRef.current = false;
          return;
        }

        nextObjectUrlRef.current = audioUrl;
        nextAudio.src = audioUrl;
        nextAudio.volume = 0; // Start silent
        nextAudio.playbackRate = state.speed;

        // Wait for next audio to be ready
        await new Promise<void>((resolve, reject) => {
          const onCanPlay = () => {
            nextAudio.removeEventListener("canplay", onCanPlay);
            nextAudio.removeEventListener("error", onError);
            resolve();
          };
          const onError = () => {
            nextAudio.removeEventListener("canplay", onCanPlay);
            nextAudio.removeEventListener("error", onError);
            reject(new Error("Next audio load error"));
          };
          nextAudio.addEventListener("canplay", onCanPlay);
          nextAudio.addEventListener("error", onError);
          setTimeout(() => {
            nextAudio.removeEventListener("canplay", onCanPlay);
            nextAudio.removeEventListener("error", onError);
            resolve();
          }, 5000);
        });

        // Start playing next audio (muted)
        await nextAudio.play();

        // Perform the crossfade
        const startVolume = currentAudio.volume;
        const fadeSteps = 20;
        const fadeInterval = (crossfadeDuration * 1000) / fadeSteps;
        let step = 0;

        crossfadeIntervalRef.current = setInterval(() => {
          step++;
          const progress = step / fadeSteps;

          // Fade out current, fade in next
          currentAudio.volume = Math.max(0, startVolume * (1 - progress));
          nextAudio.volume = Math.min(startVolume, startVolume * progress);

          if (step >= fadeSteps) {
            // Crossfade complete
            if (crossfadeIntervalRef.current) {
              clearInterval(crossfadeIntervalRef.current);
              crossfadeIntervalRef.current = null;
            }

            // Detach listeners from old audio
            const oldHandlers = audioEventHandlersRef.current;
            if (oldHandlers && currentAudio) {
              currentAudio.removeEventListener(
                "timeupdate",
                oldHandlers.timeUpdate,
              );
              currentAudio.removeEventListener(
                "durationchange",
                oldHandlers.durationChange,
              );
              currentAudio.removeEventListener("ended", oldHandlers.ended);
              currentAudio.removeEventListener("waiting", oldHandlers.waiting);
              currentAudio.removeEventListener("canplay", oldHandlers.canPlay);
              currentAudio.removeEventListener("error", oldHandlers.error);
            }

            // Stop current audio
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio.src = "";

            // Swap audio elements
            const tempUrl = objectUrlRef.current;
            objectUrlRef.current = nextObjectUrlRef.current;
            nextObjectUrlRef.current = tempUrl;

            // Clean up old URL
            if (nextObjectUrlRef.current) {
              URL.revokeObjectURL(nextObjectUrlRef.current);
              nextObjectUrlRef.current = null;
            }

            // Swap refs
            const tempAudio = audioRef.current;
            audioRef.current = nextAudioRef.current;
            nextAudioRef.current = tempAudio;

            // Attach listeners to new audio
            if (audioRef.current) {
              // Create new handlers for this audio element
              const newAudio = audioRef.current;
              const handlers = {
                timeUpdate: () => {
                  setCurrentTime(newAudio.currentTime);
                  // Check crossfade
                  const state = playerStateRef.current;
                  const crossfadeDur =
                    settingsRef.current?.crossfadeDuration || 0;
                  if (
                    crossfadeDur > 0 &&
                    !crossfadeInProgressRef.current &&
                    state.repeat !== "one" &&
                    state.isPlaying &&
                    newAudio.duration > 0
                  ) {
                    const timeRemaining =
                      newAudio.duration - newAudio.currentTime;
                    if (
                      timeRemaining > 0 &&
                      timeRemaining <= crossfadeDur &&
                      newAudio.duration > crossfadeDur * 2
                    ) {
                      const nextIdx = getNextIndex(state);
                      if (nextIdx !== null) {
                        performCrossfade(nextIdx);
                      }
                    }
                  }
                },
                durationChange: () => setDuration(newAudio.duration),
                ended: () => {
                  if (crossfadeInProgressRef.current) return;
                  const state = playerStateRef.current;
                  const autoPlay = settingsRef.current?.autoPlay !== false;
                  setPlaybackState("ended");
                  if (state.repeat === "one") {
                    newAudio.currentTime = 0;
                    newAudio.play();
                    setPlaybackState("playing");
                    return;
                  }
                  if (!autoPlay) {
                    setPlayerState((prev) => ({ ...prev, isPlaying: false }));
                    return;
                  }
                  const nextIdx = getNextIndex(state);
                  if (nextIdx !== null) {
                    playSongAtIndex(nextIdx);
                  } else {
                    setPlayerState((prev) => ({ ...prev, isPlaying: false }));
                  }
                },
                waiting: () => setPlaybackState("buffering"),
                canPlay: () => {
                  if (playerStateRef.current.isPlaying)
                    setPlaybackState("playing");
                },
                error: (e: Event) => {
                  const targetAudio = e.target as HTMLAudioElement;
                  const src = targetAudio.src || "";
                  if (src && !src.startsWith(window.location.origin)) {
                    console.error("Audio error:", e);
                  }
                  setPlaybackState("idle");
                },
              };

              newAudio.addEventListener("timeupdate", handlers.timeUpdate);
              newAudio.addEventListener(
                "durationchange",
                handlers.durationChange,
              );
              newAudio.addEventListener("ended", handlers.ended);
              newAudio.addEventListener("waiting", handlers.waiting);
              newAudio.addEventListener("canplay", handlers.canPlay);
              newAudio.addEventListener("error", handlers.error);
              audioEventHandlersRef.current = handlers;

              // Ensure volume is correct
              newAudio.volume = startVolume;

              // Update duration immediately
              setDuration(newAudio.duration || 0);
            }

            // Update state
            setPlayerState((prev) => ({
              ...prev,
              currentSongId: nextSong.id,
              queueIndex: nextIndex,
            }));

            // Update Media Session
            if ("mediaSession" in navigator) {
              try {
                navigator.mediaSession.metadata = new MediaMetadata({
                  title: nextSong.title,
                  artist: nextSong.artist,
                  album: nextSong.album,
                });
              } catch {
                // Ignore
              }
            }

            crossfadeInProgressRef.current = false;
          }
        }, fadeInterval);
      } catch (error) {
        console.error("Crossfade failed:", error);
        crossfadeInProgressRef.current = false;
      }
    },
    [getAudioUrl, getNextIndex, playSongAtIndex],
  );

  // Store event handlers in refs so they can be reattached after crossfade
  const audioEventHandlersRef = useRef<{
    timeUpdate: () => void;
    durationChange: () => void;
    ended: () => void;
    waiting: () => void;
    canPlay: () => void;
    error: (e: Event) => void;
  } | null>(null);

  // Function to attach event listeners to an audio element
  const attachAudioListeners = useCallback(
    (audio: HTMLAudioElement) => {
      // Create handlers that always read from refs (not closed over)
      const handlers = {
        timeUpdate: () => {
          setCurrentTime(audio.currentTime);
          // Check crossfade from the handler using the always-current audio
          const state = playerStateRef.current;
          const crossfadeDuration = settingsRef.current?.crossfadeDuration || 0;

          if (
            crossfadeDuration > 0 &&
            !crossfadeInProgressRef.current &&
            state.repeat !== "one" &&
            state.isPlaying &&
            audio.duration > 0
          ) {
            const timeRemaining = audio.duration - audio.currentTime;
            if (
              timeRemaining > 0 &&
              timeRemaining <= crossfadeDuration &&
              audio.duration > crossfadeDuration * 2
            ) {
              const nextIndex = getNextIndex(state);
              if (nextIndex !== null) {
                performCrossfade(nextIndex);
              }
            }
          }
        },
        durationChange: () => setDuration(audio.duration),
        ended: () => {
          // If crossfade already handled the transition, skip
          if (crossfadeInProgressRef.current) return;

          const state = playerStateRef.current;
          const autoPlay = settingsRef.current?.autoPlay !== false;

          setPlaybackState("ended");

          if (state.repeat === "one") {
            audio.currentTime = 0;
            audio.play();
            setPlaybackState("playing");
            return;
          }

          if (!autoPlay) {
            setPlayerState((prev) => ({ ...prev, isPlaying: false }));
            return;
          }

          const nextIndex = getNextIndex(state);
          if (nextIndex !== null) {
            playSongAtIndex(nextIndex);
          } else {
            setPlayerState((prev) => ({ ...prev, isPlaying: false }));
          }
        },
        waiting: () => setPlaybackState("buffering"),
        canPlay: () => {
          if (playerStateRef.current.isPlaying) setPlaybackState("playing");
        },
        error: (e: Event) => {
          const targetAudio = e.target as HTMLAudioElement;
          const src = targetAudio.src || "";
          const isValidSource =
            src !== "" &&
            !src.startsWith(
              window.location.origin + window.location.pathname,
            ) &&
            src !== window.location.href &&
            src !== "about:blank";

          if (isValidSource) {
            console.error("Audio error:", e);
          }
          setPlaybackState("idle");
        },
      };

      audio.addEventListener("timeupdate", handlers.timeUpdate);
      audio.addEventListener("durationchange", handlers.durationChange);
      audio.addEventListener("ended", handlers.ended);
      audio.addEventListener("waiting", handlers.waiting);
      audio.addEventListener("canplay", handlers.canPlay);
      audio.addEventListener("error", handlers.error);

      audioEventHandlersRef.current = handlers;

      return handlers;
    },
    [getNextIndex, performCrossfade, playSongAtIndex],
  );

  // Function to detach event listeners
  const detachAudioListeners = useCallback((audio: HTMLAudioElement) => {
    const handlers = audioEventHandlersRef.current;
    if (handlers) {
      audio.removeEventListener("timeupdate", handlers.timeUpdate);
      audio.removeEventListener("durationchange", handlers.durationChange);
      audio.removeEventListener("ended", handlers.ended);
      audio.removeEventListener("waiting", handlers.waiting);
      audio.removeEventListener("canplay", handlers.canPlay);
      audio.removeEventListener("error", handlers.error);
    }
  }, []);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = settings?.defaultVolume ?? playerState.volume;

    const audio = audioRef.current;
    attachAudioListeners(audio);

    // Load saved state
    loadSavedState();

    return () => {
      detachAudioListeners(audio);
      audio.pause();
      // Only revoke blob URLs
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      // Clean up crossfade interval
      if (crossfadeIntervalRef.current) {
        clearInterval(crossfadeIntervalRef.current);
      }
      // Clean up next audio
      if (nextAudioRef.current) {
        nextAudioRef.current.pause();
      }
      if (nextObjectUrlRef.current) {
        URL.revokeObjectURL(nextObjectUrlRef.current);
      }
    };
  }, [attachAudioListeners, detachAudioListeners]);

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

      const audio = audioRef.current;

      // If a user-initiated load, always proceed (and mark as loading)
      // If not user-initiated (like restore), skip if already loading
      if (isUserInitiated) {
        isLoadingRef.current = true;
      } else if (isLoadingRef.current) {
        return false;
      }

      // Stop and reset current audio before loading new source
      audio.pause();
      audio.currentTime = 0;

      // Revoke previous blob URL (only blob: URLs need revoking)
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      // Clear source only if it was previously set (avoid triggering error for empty src)
      if (
        audio.src &&
        audio.src !== "" &&
        !audio.src.startsWith(window.location.origin)
      ) {
        audio.src = "";
        audio.removeAttribute("src");
        audio.load(); // Reset internal state
      }

      setPlaybackState("buffering");

      let audioUrl: string | null = null;

      try {
        // On desktop with file path, read file and create blob URL
        if (isDesktop() && song.filePath) {
          const exists = await fileExists(song.filePath);

          if (exists) {
            audioUrl = await getAssetUrl(song.filePath);
            // getAssetUrl now returns blob URLs that need cleanup
            if (audioUrl) {
              objectUrlRef.current = audioUrl;
            }
          }
        }

        // Fall back to memory cache (web or desktop without filePath)
        if (!audioUrl) {
          const cachedFile = getCachedFile(song.id);
          if (cachedFile) {
            audioUrl = URL.createObjectURL(cachedFile);
            objectUrlRef.current = audioUrl;
          }
        }

        if (!audioUrl) {
          // No audio source available - file needs to be reconnected
          console.warn("No audio source for:", song.title);
          setPlaybackState("idle");
          isLoadingRef.current = false;
          return false;
        }

        // Small delay to let audio element reset
        await new Promise((resolve) => setTimeout(resolve, 50));

        audio.src = audioUrl;

        // Setup Media Session (skip artwork to avoid potential issues with large images)
        if ("mediaSession" in navigator) {
          try {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: song.title,
              artist: song.artist,
              album: song.album,
            });
          } catch {
            // Ignore Media Session errors
          }
        }

        // If a start position is provided, wait for audio to be ready and seek
        if (
          startPosition !== undefined &&
          startPosition > 0 &&
          audioRef.current
        ) {
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

            // Timeout to prevent hanging
            setTimeout(() => {
              audio.removeEventListener("canplay", handleCanPlay);
              resolve();
            }, 5000);
          });
        }

        // Clear loading flag after a short delay to prevent immediate re-triggers
        setTimeout(() => {
          isLoadingRef.current = false;
        }, 100);

        return true;
      } catch (error) {
        console.error("Error loading song:", error);
        setPlaybackState("idle");
        isLoadingRef.current = false;
        return false;
      }
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
    try {
      // Use the song from our array if it has more complete data (e.g., filePath)
      const songInArray = songs.find((s) => s.id === song.id);
      const songToPlay = songInArray?.filePath ? songInArray : song;

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

        await audioRef.current.play();
        setPlaybackState("playing");
      }
    } catch (error) {
      console.error("playSong failed:", error);
      setPlaybackState("idle");
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
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

      // Clear the object URL (only revoke blob: URLs)
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      objectUrlRef.current = null;

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

  // Reorder the queue (for drag-and-drop)
  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setPlayerState((prev) => {
      const newQueue = [...prev.queue];
      const [removed] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, removed);

      // Update queue index if the currently playing song was moved
      let newQueueIndex = prev.queueIndex;
      if (fromIndex === prev.queueIndex) {
        // The currently playing song was moved
        newQueueIndex = toIndex;
      } else if (fromIndex < prev.queueIndex && toIndex >= prev.queueIndex) {
        // Item moved from before current to after
        newQueueIndex = prev.queueIndex - 1;
      } else if (fromIndex > prev.queueIndex && toIndex <= prev.queueIndex) {
        // Item moved from after current to before
        newQueueIndex = prev.queueIndex + 1;
      }

      return {
        ...prev,
        queue: newQueue,
        queueIndex: newQueueIndex,
      };
    });
  }, []);

  // Track quick-play songs separately (not persisted to library)
  const quickPlaySongsRef = useRef<Map<string, Song>>(new Map());

  // Play a file directly without adding to library
  // Returns the temporary song object for display purposes
  const playFile = useCallback(async (file: File): Promise<Song | null> => {
    if (!isAudioFile(file)) {
      console.warn("Not an audio file:", file.name);
      return null;
    }

    if (!audioRef.current) return null;

    const audio = audioRef.current;

    // Stop and reset current audio
    audio.pause();
    audio.currentTime = 0;

    // Revoke previous blob URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setPlaybackState("buffering");

    try {
      // Extract metadata from file
      const metadata = await extractMetadata(file);
      
      // Create a temporary song object (not saved to DB)
      const tempSong: Song = {
        id: `quick-play-${generateId()}`,
        title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
        artist: metadata.artist || "Unknown Artist",
        album: metadata.album || "Unknown Album",
        duration: metadata.duration || 0,
        coverArt: metadata.coverArt,
        sourceType: "local",
        addedAt: Date.now(),
        fileName: file.name,
        fileSize: file.size,
      };

      // Cache the file for playback
      setCachedFile(tempSong.id, file);
      quickPlaySongsRef.current.set(tempSong.id, tempSong);

      // Create blob URL for playback
      const audioUrl = URL.createObjectURL(file);
      objectUrlRef.current = audioUrl;

      // Set up player state - single song queue
      setPlayerState((prev) => ({
        ...prev,
        currentSongId: tempSong.id,
        isPlaying: true,
        queue: [tempSong.id],
        queueIndex: 0,
        currentPlaylistId: null, // Not part of any playlist
      }));

      hasRestoredSong.current = true;

      // Small delay to let the audio element reset
      await new Promise((resolve) => setTimeout(resolve, 50));

      audio.src = audioUrl;
      audio.playbackRate = playerState.speed;

      // Setup Media Session
      if ("mediaSession" in navigator) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: tempSong.title,
            artist: tempSong.artist,
            album: tempSong.album,
          });
        } catch {
          // Ignore Media Session errors
        }
      }

      // Wait for canplay event
      await new Promise<void>((resolve, reject) => {
        const onCanPlay = () => {
          audio.removeEventListener("canplay", onCanPlay);
          audio.removeEventListener("error", onError);
          resolve();
        };
        const onError = () => {
          audio.removeEventListener("canplay", onCanPlay);
          audio.removeEventListener("error", onError);
          reject(new Error("Audio load error"));
        };
        audio.addEventListener("canplay", onCanPlay);
        audio.addEventListener("error", onError);

        setTimeout(() => {
          audio.removeEventListener("canplay", onCanPlay);
          audio.removeEventListener("error", onError);
          resolve();
        }, 10000);
      });

      await audio.play();
      setPlaybackState("playing");

      return tempSong;
    } catch (error) {
      console.error("Quick play failed:", error);
      setPlaybackState("idle");
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
      return null;
    }
  }, [playerState.speed]);

  // Play multiple files directly without adding to library
  // Creates a temporary queue from the files
  const playFiles = useCallback(async (files: File[]): Promise<Song[]> => {
    const audioFiles = files.filter(isAudioFile);
    if (audioFiles.length === 0) return [];

    if (!audioRef.current) return [];

    const audio = audioRef.current;

    // Stop and reset current audio
    audio.pause();
    audio.currentTime = 0;

    // Revoke previous blob URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setPlaybackState("buffering");

    try {
      // Process all files and create temporary songs
      const tempSongs: Song[] = [];
      
      for (const file of audioFiles) {
        // Extract metadata (for first file do full extraction, others quick)
        const metadata = await extractMetadata(file);
        
        const tempSong: Song = {
          id: `quick-play-${generateId()}`,
          title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
          artist: metadata.artist || "Unknown Artist",
          album: metadata.album || "Unknown Album",
          duration: metadata.duration || 0,
          coverArt: metadata.coverArt,
          sourceType: "local",
          addedAt: Date.now(),
          fileName: file.name,
          fileSize: file.size,
        };

        // Cache the file for playback
        setCachedFile(tempSong.id, file);
        quickPlaySongsRef.current.set(tempSong.id, tempSong);
        tempSongs.push(tempSong);
      }

      if (tempSongs.length === 0) return [];

      const firstSong = tempSongs[0];

      // Create blob URL for first file
      const audioUrl = URL.createObjectURL(audioFiles[0]);
      objectUrlRef.current = audioUrl;

      // Set up player state with all songs in queue
      setPlayerState((prev) => ({
        ...prev,
        currentSongId: firstSong.id,
        isPlaying: true,
        queue: tempSongs.map(s => s.id),
        queueIndex: 0,
        currentPlaylistId: null,
      }));

      hasRestoredSong.current = true;

      // Small delay to let the audio element reset
      await new Promise((resolve) => setTimeout(resolve, 50));

      audio.src = audioUrl;
      audio.playbackRate = playerState.speed;

      // Setup Media Session
      if ("mediaSession" in navigator) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: firstSong.title,
            artist: firstSong.artist,
            album: firstSong.album,
          });
        } catch {
          // Ignore Media Session errors
        }
      }

      // Wait for canplay event
      await new Promise<void>((resolve, reject) => {
        const onCanPlay = () => {
          audio.removeEventListener("canplay", onCanPlay);
          audio.removeEventListener("error", onError);
          resolve();
        };
        const onError = () => {
          audio.removeEventListener("canplay", onCanPlay);
          audio.removeEventListener("error", onError);
          reject(new Error("Audio load error"));
        };
        audio.addEventListener("canplay", onCanPlay);
        audio.addEventListener("error", onError);

        setTimeout(() => {
          audio.removeEventListener("canplay", onCanPlay);
          audio.removeEventListener("error", onError);
          resolve();
        }, 10000);
      });

      await audio.play();
      setPlaybackState("playing");

      return tempSongs;
    } catch (error) {
      console.error("Quick play files failed:", error);
      setPlaybackState("idle");
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
      return [];
    }
  }, [playerState.speed]);

  // Play a file from a file path (for desktop "Open With" from Finder/Explorer)
  const playFilePath = useCallback(async (filePath: string): Promise<Song | null> => {
    if (!isDesktop()) {
      console.warn("playFilePath is only supported on desktop");
      return null;
    }

    if (!audioRef.current) return null;

    const audio = audioRef.current;

    // Stop and reset current audio
    audio.pause();
    audio.currentTime = 0;

    // Revoke previous blob URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setPlaybackState("buffering");

    try {
      // Check if file exists
      const exists = await fileExists(filePath);
      if (!exists) {
        console.error("File does not exist:", filePath);
        setPlaybackState("idle");
        return null;
      }

      // Get the audio URL (reads file and creates blob URL)
      const audioUrl = await getAssetUrl(filePath);
      if (!audioUrl) {
        console.error("Failed to load audio file:", filePath);
        setPlaybackState("idle");
        return null;
      }

      objectUrlRef.current = audioUrl;

      // Extract metadata to create a Song object
      const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'Unknown';
      
      // Try to extract metadata
      let songMetadata: Partial<Song> = {};
      try {
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: blob.type });
        songMetadata = await extractMetadata(file);
      } catch (metadataError) {
        console.warn("Could not extract metadata:", metadataError);
      }

      // Create a song object
      const song: Song = {
        id: generateId(),
        title: songMetadata.title || fileName.replace(/\.[^/.]+$/, ""),
        artist: songMetadata.artist || "Unknown Artist",
        album: songMetadata.album || "Unknown Album",
        duration: songMetadata.duration || 0,
        filePath: filePath,
        coverArt: songMetadata.coverArt,
        sourceType: "local",
        addedAt: Date.now(),
        fileName: fileName,
      };

      // Store in quick play songs
      quickPlaySongsRef.current.set(song.id, song);

      // Set up audio source
      audio.src = audioUrl;
      audio.playbackRate = playerState.speed;

      // Update state
      setPlayerState((prev) => ({
        ...prev,
        currentSongId: song.id,
        isPlaying: true,
        queue: [song.id],
        queueIndex: 0,
        currentPlaylistId: null,
      }));

      // Wait for audio to be loaded
      await new Promise<void>((resolve, reject) => {
        const onCanPlay = () => {
          audio.removeEventListener("canplay", onCanPlay);
          audio.removeEventListener("error", onError);
          resolve();
        };
        const onError = () => {
          audio.removeEventListener("canplay", onCanPlay);
          audio.removeEventListener("error", onError);
          reject(new Error("Audio failed to load"));
        };
        audio.addEventListener("canplay", onCanPlay);
        audio.addEventListener("error", onError);
        audio.load();
      });

      // Start playing
      await audio.play();
      setPlaybackState("playing");

      console.log("[PlayFilePath] Now playing:", song.title);
      return song;
    } catch (error) {
      console.error("playFilePath failed:", error);
      setPlaybackState("idle");
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
      return null;
    }
  }, [playerState.speed]);

  // Get current song - check quick play songs first, then library songs
  const currentSong = playerState.currentSongId
    ? (quickPlaySongsRef.current.get(playerState.currentSongId) || 
       songs.find((s) => s.id === playerState.currentSongId))
    : undefined;

  // Get queue songs (actual Song objects from queue IDs)
  // Include quick play songs if they're in the queue
  const queueSongs = playerState.queue
    .map((id) => {
      // Check quick play songs first
      const quickPlaySong = quickPlaySongsRef.current.get(id);
      if (quickPlaySong) return quickPlaySong;
      return songs.find((s) => s.id === id);
    })
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
