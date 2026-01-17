import { useState, useEffect, useCallback } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Heart,
  ListMusic,
  Library,
  Settings,
  Info,

  Music,
  Sun,
  Moon,
  BarChart3,
  Disc3,

  Keyboard,
  Zap,
} from "lucide-react";
import type { Song } from "../types";

import "./CommandMenu.css";

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  // Songs
  songs: Song[];
  // Playback state
  isPlaying: boolean;
  currentSong: Song | null;
  shuffle: boolean;
  repeat: "none" | "one" | "all";
  volume: number;
  // Playback controls
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onMute: () => void;
  onPlaySong: (song: Song) => void;
  // Favorites
  favoriteSongIds: Set<string>;
  onToggleFavorite: (songId: string) => void;
  // Settings
  theme: "light" | "dark";
  onToggleTheme: () => void;
  visualizerEnabled: boolean;
  onToggleVisualizer: () => void;
  onCycleVisualizerStyle: () => void;
  // Dialogs
  onShowMusicInfo: () => void;
  onShowKeyboardShortcuts: () => void;
}

export function CommandMenu({
  isOpen,
  onClose,
  songs,
  isPlaying,
  currentSong,
  shuffle,
  repeat,
  volume,
  onPlayPause,
  onNext,
  onPrevious,
  onToggleShuffle,
  onToggleRepeat,
  onMute,
  onPlaySong,
  favoriteSongIds,
  onToggleFavorite,
  theme,
  onToggleTheme,
  visualizerEnabled,
  onToggleVisualizer,
  onCycleVisualizerStyle,
  onShowMusicInfo,
  onShowKeyboardShortcuts,
}: CommandMenuProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset search when opened
  useEffect(() => {
    if (isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  const runCommand = useCallback((command: () => void) => {
    command();
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  // Filter songs for search
  const filteredSongs = search.length > 0
    ? songs.filter(song =>
        song.title.toLowerCase().includes(search.toLowerCase()) ||
        song.artist.toLowerCase().includes(search.toLowerCase()) ||
        song.album.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 10) // Limit to 10 results
    : [];

  return (
    <div className="cmdk-overlay" onClick={onClose}>
      <div className="cmdk-container" onClick={(e) => e.stopPropagation()}>
        <Command
          label="Command Menu"
          shouldFilter={false}
        >
          <div className="cmdk-input-wrapper">
            <Search className="cmdk-input-icon" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search songs, commands..."
              className="cmdk-input"
              autoFocus
            />
            <kbd className="cmdk-kbd">ESC</kbd>
          </div>

          <Command.List className="cmdk-list">
            <Command.Empty className="cmdk-empty">
              No results found.
            </Command.Empty>

            {/* Song Search Results */}
            {filteredSongs.length > 0 && (
              <Command.Group heading="Songs" className="cmdk-group">
                {filteredSongs.map((song) => (
                  <Command.Item
                    key={song.id}
                    value={`song-${song.id}`}
                    onSelect={() => runCommand(() => onPlaySong(song))}
                    className="cmdk-item"
                  >
                    <div className="cmdk-item-icon">
                      {song.coverArt ? (
                        <img src={song.coverArt} alt="" className="cmdk-song-art" />
                      ) : (
                        <Music className="w-4 h-4" />
                      )}
                    </div>
                    <div className="cmdk-item-content">
                      <span className="cmdk-item-title">{song.title}</span>
                      <span className="cmdk-item-subtitle">{song.artist}</span>
                    </div>
                    {currentSong?.id === song.id && (
                      <span className="cmdk-item-badge">Playing</span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Playback Commands */}
            <Command.Group heading="Playback" className="cmdk-group">
              <Command.Item
                value="play-pause"
                onSelect={() => runCommand(onPlayPause)}
                className="cmdk-item"
              >
                <div className="cmdk-item-icon">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </div>
                <span>{isPlaying ? "Pause" : "Play"}</span>
                <kbd className="cmdk-shortcut">Space</kbd>
              </Command.Item>

              <Command.Item
                value="next-track"
                onSelect={() => runCommand(onNext)}
                className="cmdk-item"
              >
                <div className="cmdk-item-icon">
                  <SkipForward className="w-4 h-4" />
                </div>
                <span>Next Track</span>
                <kbd className="cmdk-shortcut">N</kbd>
              </Command.Item>

              <Command.Item
                value="previous-track"
                onSelect={() => runCommand(onPrevious)}
                className="cmdk-item"
              >
                <div className="cmdk-item-icon">
                  <SkipBack className="w-4 h-4" />
                </div>
                <span>Previous Track</span>
                <kbd className="cmdk-shortcut">P</kbd>
              </Command.Item>

              <Command.Item
                value="toggle-shuffle"
                onSelect={() => runCommand(onToggleShuffle)}
                className="cmdk-item"
              >
                <div className="cmdk-item-icon">
                  <Shuffle className="w-4 h-4" />
                </div>
                <span>Toggle Shuffle</span>
                <span className="cmdk-item-badge">{shuffle ? "On" : "Off"}</span>
                <kbd className="cmdk-shortcut">S</kbd>
              </Command.Item>

              <Command.Item
                value="toggle-repeat"
                onSelect={() => runCommand(onToggleRepeat)}
                className="cmdk-item"
              >
                <div className="cmdk-item-icon">
                  <Repeat className="w-4 h-4" />
                </div>
                <span>Cycle Repeat Mode</span>
                <span className="cmdk-item-badge">{repeat === "none" ? "Off" : repeat === "one" ? "One" : "All"}</span>
                <kbd className="cmdk-shortcut">R</kbd>
              </Command.Item>

              <Command.Item
                value="toggle-mute"
                onSelect={() => runCommand(onMute)}
                className="cmdk-item"
              >
                <div className="cmdk-item-icon">
                  {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </div>
                <span>{volume === 0 ? "Unmute" : "Mute"}</span>
                <kbd className="cmdk-shortcut">M</kbd>
              </Command.Item>

              {currentSong && (
                <Command.Item
                  value="toggle-favorite"
                  onSelect={() => runCommand(() => onToggleFavorite(currentSong.id))}
                  className="cmdk-item"
                >
                  <div className="cmdk-item-icon">
                    <Heart className="w-4 h-4" fill={favoriteSongIds.has(currentSong.id) ? "currentColor" : "none"} />
                  </div>
                  <span>{favoriteSongIds.has(currentSong.id) ? "Remove from Favorites" : "Add to Favorites"}</span>
                  <kbd className="cmdk-shortcut">F</kbd>
                </Command.Item>
              )}
            </Command.Group>

            {/* Visualizer Commands */}
            <Command.Group heading="Visualizer" className="cmdk-group">
              <Command.Item
                value="toggle-visualizer"
                onSelect={() => runCommand(onToggleVisualizer)}
                className="cmdk-item"
              >
                <div className="cmdk-item-icon">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span>{visualizerEnabled ? "Turn Off Visualizer" : "Turn On Visualizer"}</span>
                <kbd className="cmdk-shortcut">V V</kbd>
              </Command.Item>

              <Command.Item
                value="cycle-visualizer-style"
                onSelect={() => runCommand(onCycleVisualizerStyle)}
                className="cmdk-item"
              >
                <div className="cmdk-item-icon">
                  <Zap className="w-4 h-4" />
                </div>
                <span>Cycle Visualizer Style</span>
                <kbd className="cmdk-shortcut">V</kbd>
              </Command.Item>
            </Command.Group>

            {/* Navigation */}
            <Command.Group heading="Navigation" className="cmdk-group">
              <Command.Item
                value="go-library"
                onSelect={() => runCommand(() => navigate("/library"))}
                className="cmdk-item"
              >
                <div className="cmdk-item-icon">
                  <Library className="w-4 h-4" />
                </div>
                <span>Go to Library</span>
              </Command.Item>

              <Command.Item
                value="go-playlists"
                onSelect={() => runCommand(() => navigate("/playlists"))}
                className="cmdk-item"
              >
                <div className="cmdk-item-icon">
                  <ListMusic className="w-4 h-4" />
                </div>
                <span>Go to Playlists</span>
              </Command.Item>

              <Command.Item
                value="go-generator"
                onSelect={() => runCommand(() => navigate("/generator"))}
                className="cmdk-item"
              >
                <div className="cmdk-item-icon">
                  <Disc3 className="w-4 h-4" />
                </div>
                <span>Go to Music Generator</span>
              </Command.Item>

              <Command.Item
                value="go-settings"
                onSelect={() => runCommand(() => navigate("/settings"))}
                className="cmdk-item"
              >
                <div className="cmdk-item-icon">
                  <Settings className="w-4 h-4" />
                </div>
                <span>Go to Settings</span>
              </Command.Item>
            </Command.Group>

            {/* View Commands */}
            <Command.Group heading="View" className="cmdk-group">
              <Command.Item
                value="toggle-theme"
                onSelect={() => runCommand(onToggleTheme)}
                className="cmdk-item"
              >
                <div className="cmdk-item-icon">
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </div>
                <span>{theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
              </Command.Item>

              <Command.Item
                value="show-music-info"
                onSelect={() => runCommand(onShowMusicInfo)}
                className="cmdk-item"
              >
                <div className="cmdk-item-icon">
                  <Info className="w-4 h-4" />
                </div>
                <span>Show Music Info</span>
                <kbd className="cmdk-shortcut">I</kbd>
              </Command.Item>

              <Command.Item
                value="show-keyboard-shortcuts"
                onSelect={() => runCommand(onShowKeyboardShortcuts)}
                className="cmdk-item"
              >
                <div className="cmdk-item-icon">
                  <Keyboard className="w-4 h-4" />
                </div>
                <span>Show Keyboard Shortcuts</span>
                <kbd className="cmdk-shortcut">?</kbd>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
