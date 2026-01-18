export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverArt?: string;
  sourceType: "local";
  addedAt: number;
  // Original filename for matching when reconnecting (web)
  fileName?: string;
  // File size in bytes for matching
  fileSize?: number;
  // Full file path for desktop apps (Tauri)
  // When present, we can load the file directly without user interaction
  filePath?: string;
}

export interface Playlist {
  id: string;
  name: string;
  songIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface PlayerState {
  currentSongId: string | null;
  position: number;
  volume: number;
  repeat: "none" | "one" | "all";
  shuffle: boolean;
  isPlaying: boolean;
  queue: string[];
  queueIndex: number;
  speed: number;
  currentPlaylistId: string | null;
}

export type PlaybackState =
  | "idle"
  | "playing"
  | "paused"
  | "buffering"
  | "ended";

export type Theme = "light" | "dark";

export type RepeatMode = "none" | "one" | "all";

export type QueueBehavior = "replace" | "append" | "ask";

export interface AppSettings {
  // Appearance
  theme: Theme;
  accentColor: string; // Hex color like "#d4a574"
  showAlbumArt: boolean;
  appTitle: string;
  appIcon: "disc" | "music" | "headphones" | "vinyl";

  // Playback
  autoPlay: boolean;
  gaplessPlayback: boolean;
  crossfadeDuration: number; // 0 = disabled, in seconds
  defaultVolume: number;
  rememberVolume: boolean;
  defaultShuffleMode: boolean;
  defaultRepeatMode: RepeatMode;

  // Queue behavior
  queueBehavior: QueueBehavior;
  clearQueueOnNewPlaylist: boolean;

  // Equalizer
  eqEnabled: boolean;
  eqPreset: string | null;

  // Now Playing Display
  displayMode: "vinyl" | "albumArt" | "generator";

  // Background Visualizer
  visualizerEnabled: boolean;
  visualizerStyle: "bars" | "wave" | "areaWave";

  // Confirmations
  skipDeleteConfirmation: boolean;
}
