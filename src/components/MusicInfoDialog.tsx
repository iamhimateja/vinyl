import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Music, Clock, Disc, User, Folder, FileAudio, Calendar, Hash } from "lucide-react";
import type { Song } from "../types";

interface MusicInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
}

function formatDuration(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function MusicInfoDialog({
  isOpen,
  onClose,
  song,
}: MusicInfoDialogProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Use portal to render at document body level
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-vinyl-surface border border-vinyl-border rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-vinyl-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-vinyl-accent/20 rounded-xl flex items-center justify-center">
              <FileAudio className="w-5 h-5 text-vinyl-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-vinyl-text">
                Music Info
              </h2>
              <p className="text-xs text-vinyl-text-muted">
                Press{" "}
                <kbd className="px-1.5 py-0.5 bg-vinyl-border rounded text-[10px] font-mono">
                  I
                </kbd>{" "}
                to toggle
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-border/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {song ? (
          <div className="p-4">
            {/* Album Art */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-vinyl-border">
                {song.coverArt ? (
                  <img
                    src={song.coverArt}
                    alt={song.album}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-8 h-8 text-vinyl-text-muted" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-vinyl-text truncate text-lg">
                  {song.title}
                </h3>
                <p className="text-vinyl-text-muted truncate">
                  {song.artist}
                </p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="space-y-2">
              <InfoRow icon={<User className="w-4 h-4" />} label="Artist" value={song.artist} />
              <InfoRow icon={<Disc className="w-4 h-4" />} label="Album" value={song.album} />
              <InfoRow icon={<Clock className="w-4 h-4" />} label="Duration" value={formatDuration(song.duration)} />
              {song.fileName && (
                <InfoRow icon={<FileAudio className="w-4 h-4" />} label="File" value={song.fileName} />
              )}
              {song.fileSize && (
                <InfoRow icon={<Hash className="w-4 h-4" />} label="Size" value={formatFileSize(song.fileSize)} />
              )}
              {song.filePath && (
                <InfoRow icon={<Folder className="w-4 h-4" />} label="Path" value={song.filePath} truncate />
              )}
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Added" value={formatDate(song.addedAt)} />
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Music className="w-12 h-12 mx-auto mb-3 text-vinyl-text-muted" />
            <p className="text-vinyl-text-muted">No track selected</p>
            <p className="text-vinyl-text-muted text-sm mt-1">
              Play a song to see its information
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-vinyl-border bg-vinyl-border/20 rounded-b-2xl">
          <p className="text-xs text-vinyl-text-muted text-center">
            Track ID: {song?.id.slice(0, 8) || "—"}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function InfoRow({ 
  icon, 
  label, 
  value,
  truncate = false,
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-vinyl-border/30 transition-colors">
      <span className="text-vinyl-text-muted flex-shrink-0">{icon}</span>
      <span className="text-vinyl-text-muted text-sm min-w-[4rem]">{label}</span>
      <span className={`text-vinyl-text text-sm flex-1 text-right ${truncate ? 'truncate' : ''}`} title={value}>
        {value}
      </span>
    </div>
  );
}
