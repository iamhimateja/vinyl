import { useState } from "react";
import {
  Sun,
  Moon,
  Play,
  Volume2,
  ListMusic,
  SlidersHorizontal,
  Disc3,
  Music,
  Headphones,
  RotateCcw,
  Save,
  Type,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import type { AppSettings, RepeatMode, QueueBehavior } from "../types";
import type { EqualizerBand, EqualizerPreset } from "../hooks/useEqualizer";
import { EQUALIZER_PRESETS } from "../hooks/useEqualizer";
import { tooltipProps } from "./Tooltip";
import { ConfirmDialog } from "./ConfirmDialog";

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => void;
  onResetSettings: () => void;
  /** Reset entire player - clears all data */
  onResetPlayer: () => Promise<void>;
  // Equalizer props
  eqBands: EqualizerBand[];
  eqEnabled: boolean;
  eqPreset: string | null;
  eqConnected: boolean;
  onEqBandChange: (index: number, gain: number) => void;
  onEqPresetChange: (preset: EqualizerPreset) => void;
  onEqReset: () => void;
  onEqToggleEnabled: () => void;
}

const APP_ICONS = [
  { id: "disc", icon: Disc3, label: "Disc" },
  { id: "music", icon: Music, label: "Music Note" },
  { id: "headphones", icon: Headphones, label: "Headphones" },
  { id: "vinyl", icon: Disc3, label: "Vinyl" },
] as const;

export function SettingsView({
  settings,
  onUpdateSetting,
  onResetSettings,
  onResetPlayer,
  eqBands,
  eqEnabled,
  eqPreset,
  eqConnected,
  onEqBandChange,
  onEqPresetChange,
  onEqReset,
  onEqToggleEnabled,
}: SettingsViewProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(settings.appTitle);
  const [showResetPlayerDialog, setShowResetPlayerDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleTitleSave = () => {
    onUpdateSetting("appTitle", tempTitle.trim() || "Vinyl");
    setEditingTitle(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-vinyl-text">Settings</h1>
          <p className="text-vinyl-text-muted">Customize your music player</p>
        </div>
        <button
          onClick={onResetSettings}
          className="flex items-center gap-2 px-3 py-2 text-sm text-vinyl-text-muted hover:text-vinyl-text bg-vinyl-surface border border-vinyl-border rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset All
        </button>
      </div>

      {/* Appearance Section */}
      <section className="bg-vinyl-surface border border-vinyl-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-vinyl-border bg-vinyl-border/20">
          <h2 className="font-semibold text-vinyl-text flex items-center gap-2">
            <Sun className="w-5 h-5 text-vinyl-accent" />
            Appearance
          </h2>
        </div>
        <div className="p-4 space-y-4">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-vinyl-text font-medium">Theme</h3>
              <p className="text-sm text-vinyl-text-muted">
                Choose light or dark mode
              </p>
            </div>
            <div className="flex bg-vinyl-border rounded-lg p-1">
              <button
                onClick={() => onUpdateSetting("theme", "light")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                  settings.theme === "light"
                    ? "bg-vinyl-accent text-vinyl-bg"
                    : "text-vinyl-text-muted hover:text-vinyl-text"
                }`}
              >
                <Sun className="w-4 h-4" />
                Light
              </button>
              <button
                onClick={() => onUpdateSetting("theme", "dark")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                  settings.theme === "dark"
                    ? "bg-vinyl-accent text-vinyl-bg"
                    : "text-vinyl-text-muted hover:text-vinyl-text"
                }`}
              >
                <Moon className="w-4 h-4" />
                Dark
              </button>
            </div>
          </div>

          {/* Show Album Art */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-vinyl-text font-medium">Show Album Art</h3>
              <p className="text-sm text-vinyl-text-muted">
                Display album artwork in player
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.showAlbumArt}
              onChange={(v) => onUpdateSetting("showAlbumArt", v)}
            />
          </div>

          {/* App Title */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-vinyl-text font-medium">App Title</h3>
              <p className="text-sm text-vinyl-text-muted">
                Customize the player name
              </p>
            </div>
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="px-3 py-1.5 bg-vinyl-bg border border-vinyl-border rounded text-vinyl-text text-sm w-32"
                  placeholder="Vinyl"
                  maxLength={20}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTitleSave();
                    if (e.key === "Escape") {
                      setTempTitle(settings.appTitle);
                      setEditingTitle(false);
                    }
                  }}
                />
                <button
                  onClick={handleTitleSave}
                  className="p-2 bg-vinyl-accent text-vinyl-bg rounded-full"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-vinyl-border text-vinyl-text rounded text-sm hover:bg-vinyl-border/70 transition-colors"
              >
                <Type className="w-4 h-4" />
                {settings.appTitle}
              </button>
            )}
          </div>

          {/* App Icon */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-vinyl-text font-medium">App Icon</h3>
              <p className="text-sm text-vinyl-text-muted">
                Choose sidebar icon
              </p>
            </div>
            <div className="flex gap-1">
              {APP_ICONS.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() =>
                    onUpdateSetting("appIcon", id as AppSettings["appIcon"])
                  }
                  className={`p-2 rounded transition-colors ${
                    settings.appIcon === id
                      ? "bg-vinyl-accent text-vinyl-bg"
                      : "bg-vinyl-border text-vinyl-text-muted hover:text-vinyl-text"
                  }`}
                  {...tooltipProps(label)}
                >
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Playback Section */}
      <section className="bg-vinyl-surface border border-vinyl-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-vinyl-border bg-vinyl-border/20">
          <h2 className="font-semibold text-vinyl-text flex items-center gap-2">
            <Play className="w-5 h-5 text-vinyl-accent" />
            Playback
          </h2>
        </div>
        <div className="p-4 space-y-4">
          {/* Auto Play */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-vinyl-text font-medium">Auto Play Next</h3>
              <p className="text-sm text-vinyl-text-muted">
                Automatically play next song when current ends
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.autoPlay}
              onChange={(v) => onUpdateSetting("autoPlay", v)}
            />
          </div>

          {/* Gapless Playback */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-vinyl-text font-medium">Gapless Playback</h3>
              <p className="text-sm text-vinyl-text-muted">
                Remove silence between tracks
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.gaplessPlayback}
              onChange={(v) => onUpdateSetting("gaplessPlayback", v)}
            />
          </div>

          {/* Crossfade */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-vinyl-text font-medium">
                Crossfade Duration
              </h3>
              <p className="text-sm text-vinyl-text-muted">
                Blend between tracks (0 = off)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={settings.crossfadeDuration}
                onChange={(e) =>
                  onUpdateSetting("crossfadeDuration", parseInt(e.target.value))
                }
                className="w-24 accent-vinyl-accent"
              />
              <span className="text-sm text-vinyl-text w-8 text-right">
                {settings.crossfadeDuration}s
              </span>
            </div>
          </div>

          {/* Default Shuffle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-vinyl-text font-medium">Default Shuffle</h3>
              <p className="text-sm text-vinyl-text-muted">
                Start with shuffle enabled
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.defaultShuffleMode}
              onChange={(v) => onUpdateSetting("defaultShuffleMode", v)}
            />
          </div>

          {/* Default Repeat */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-vinyl-text font-medium">Default Repeat</h3>
              <p className="text-sm text-vinyl-text-muted">
                Default repeat mode on startup
              </p>
            </div>
            <div className="flex bg-vinyl-border rounded-lg p-1">
              {(["none", "all", "one"] as RepeatMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onUpdateSetting("defaultRepeatMode", mode)}
                  className={`px-3 py-1.5 rounded text-sm transition-colors capitalize ${
                    settings.defaultRepeatMode === mode
                      ? "bg-vinyl-accent text-vinyl-bg"
                      : "text-vinyl-text-muted hover:text-vinyl-text"
                  }`}
                >
                  {mode === "one" ? "One" : mode === "all" ? "All" : "Off"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Volume Section */}
      <section className="bg-vinyl-surface border border-vinyl-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-vinyl-border bg-vinyl-border/20">
          <h2 className="font-semibold text-vinyl-text flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-vinyl-accent" />
            Volume
          </h2>
        </div>
        <div className="p-4 space-y-4">
          {/* Remember Volume */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-vinyl-text font-medium">Remember Volume</h3>
              <p className="text-sm text-vinyl-text-muted">
                Save volume level between sessions
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.rememberVolume}
              onChange={(v) => onUpdateSetting("rememberVolume", v)}
            />
          </div>

          {/* Default Volume */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-vinyl-text font-medium">Default Volume</h3>
              <p className="text-sm text-vinyl-text-muted">
                Initial volume level
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={settings.defaultVolume * 100}
                onChange={(e) =>
                  onUpdateSetting(
                    "defaultVolume",
                    parseInt(e.target.value) / 100,
                  )
                }
                className="w-24 accent-vinyl-accent"
              />
              <span className="text-sm text-vinyl-text w-10 text-right">
                {Math.round(settings.defaultVolume * 100)}%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Queue Section */}
      <section className="bg-vinyl-surface border border-vinyl-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-vinyl-border bg-vinyl-border/20">
          <h2 className="font-semibold text-vinyl-text flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-vinyl-accent" />
            Queue & Playlists
          </h2>
        </div>
        <div className="p-4 space-y-4">
          {/* Queue Behavior */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-vinyl-text font-medium">Queue Behavior</h3>
              <p className="text-sm text-vinyl-text-muted">
                When playing a new song
              </p>
            </div>
            <select
              value={settings.queueBehavior}
              onChange={(e) =>
                onUpdateSetting(
                  "queueBehavior",
                  e.target.value as QueueBehavior,
                )
              }
              className="px-3 py-1.5 bg-vinyl-border text-vinyl-text rounded text-sm border-0 cursor-pointer"
            >
              <option value="replace">Replace queue</option>
              <option value="append">Add to queue</option>
              <option value="ask">Ask each time</option>
            </select>
          </div>

          {/* Clear Queue on New Playlist */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-vinyl-text font-medium">
                Clear Queue on Playlist
              </h3>
              <p className="text-sm text-vinyl-text-muted">
                Clear queue when playing a playlist
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.clearQueueOnNewPlaylist}
              onChange={(v) => onUpdateSetting("clearQueueOnNewPlaylist", v)}
            />
          </div>
        </div>
      </section>

      {/* Equalizer Section */}
      <section className="bg-vinyl-surface border border-vinyl-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-vinyl-border bg-vinyl-border/20">
          <h2 className="font-semibold text-vinyl-text flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-vinyl-accent" />
            Equalizer
          </h2>
        </div>
        <div className="p-4 space-y-4">
          {/* EQ Enable */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-vinyl-text font-medium">Enable Equalizer</h3>
              <p className="text-sm text-vinyl-text-muted">
                {eqConnected ? "Equalizer active" : "Play a song to activate"}
              </p>
            </div>
            <ToggleSwitch enabled={eqEnabled} onChange={onEqToggleEnabled} />
          </div>

          {/* EQ Preset */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-vinyl-text font-medium">Preset</h3>
              <p className="text-sm text-vinyl-text-muted">
                Quick equalizer settings
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={eqPreset || ""}
                onChange={(e) => {
                  const preset = EQUALIZER_PRESETS.find(
                    (p) => p.name === e.target.value,
                  );
                  if (preset) onEqPresetChange(preset);
                }}
                className="px-3 py-1.5 bg-vinyl-border text-vinyl-text rounded text-sm border-0 cursor-pointer"
              >
                {EQUALIZER_PRESETS.map((preset) => (
                  <option key={preset.name} value={preset.name}>
                    {preset.name}
                  </option>
                ))}
              </select>
              <button
                onClick={onEqReset}
                className="p-2 text-vinyl-text-muted hover:text-vinyl-text rounded-full hover:bg-vinyl-border transition-colors"
                {...tooltipProps("Reset to Flat")}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* EQ Sliders */}
          {eqEnabled && (
            <div className="pt-4 border-t border-vinyl-border">
              <div className="flex justify-between items-end gap-2">
                {eqBands.map((band, index) => (
                  <div
                    key={band.frequency}
                    className="flex flex-col items-center gap-1 flex-1"
                  >
                    <span className="text-[10px] text-vinyl-text-muted text-center">
                      {band.gain > 0 ? "+" : ""}
                      {band.gain}
                    </span>
                    <div className="h-20 flex items-center justify-center">
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={band.gain}
                        onChange={(e) =>
                          onEqBandChange(index, parseFloat(e.target.value))
                        }
                        className="eq-slider-vertical-small"
                        style={
                          {
                            "--eq-value": `${((band.gain + 12) / 24) * 100}%`,
                          } as React.CSSProperties
                        }
                      />
                    </div>
                    <span className="text-[10px] text-vinyl-text-muted">
                      {band.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-vinyl-text-muted mt-2 px-1">
                <span>-12dB</span>
                <span>0dB</span>
                <span>+12dB</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Confirmations Section */}
      <section className="bg-vinyl-surface border border-vinyl-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-vinyl-border bg-vinyl-border/20">
          <h2 className="font-semibold text-vinyl-text flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-vinyl-accent" />
            Confirmations
          </h2>
        </div>
        <div className="p-4 space-y-4">
          {/* Skip Delete Confirmation */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-vinyl-text font-medium">
                Skip Delete Confirmation
              </p>
              <p className="text-vinyl-text-muted text-sm">
                Delete songs immediately without confirmation dialog
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.skipDeleteConfirmation}
              onChange={(enabled) =>
                onUpdateSetting("skipDeleteConfirmation", enabled)
              }
            />
          </div>
        </div>
      </section>

      {/* Danger Zone Section */}
      <section className="bg-red-500/5 border border-red-500/20 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-red-500/20 bg-red-500/10">
          <h2 className="font-semibold text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </h2>
        </div>
        <div className="p-4 space-y-4">
          {/* Reset Player */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-vinyl-text font-medium">Reset Player</p>
              <p className="text-vinyl-text-muted text-sm">
                Clear all music, playlists, settings, and start fresh
              </p>
            </div>
            <button
              onClick={() => setShowResetPlayerDialog(true)}
              disabled={isResetting}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isResetting ? "Resetting..." : "Reset Everything"}
            </button>
          </div>
        </div>
      </section>

      {/* Reset Player Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResetPlayerDialog}
        title="Reset Player?"
        message="This will permanently delete all your music, playlists, favorites, and settings. The app will restart in its original state."
        warningText="⚠️ This action cannot be undone! All your imported music and playlists will be lost forever."
        confirmLabel={isResetting ? "Resetting..." : "Yes, Reset Everything"}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={async () => {
          setIsResetting(true);
          try {
            await onResetPlayer();
          } finally {
            setIsResetting(false);
            setShowResetPlayerDialog(false);
          }
        }}
        onCancel={() => setShowResetPlayerDialog(false)}
      />
    </div>
  );
}

// Toggle Switch Component
function ToggleSwitch({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? "bg-vinyl-accent" : "bg-vinyl-border"
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
