import { useState, useEffect, useCallback } from "react";
import {
  Play,
  Plus,
  X,
  Music,
  Upload,
  FileAudio,
  ListMusic,
} from "lucide-react";
import { isAudioFile, extractMetadata, formatDuration } from "../lib/audioMetadata";

interface QuickPlayOverlayProps {
  /** Whether the overlay is visible */
  isVisible: boolean;
  /** The dropped files to handle */
  droppedFiles: File[];
  /** Callback to play files directly without importing */
  onPlayFiles: (files: File[]) => Promise<void>;
  /** Callback to import files to library and play */
  onImportAndPlay: (files: File[]) => Promise<void>;
  /** Callback to dismiss the overlay */
  onDismiss: () => void;
}

interface FileInfo {
  file: File;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverArt?: string;
}

export function QuickPlayOverlay({
  isVisible,
  droppedFiles,
  onPlayFiles,
  onImportAndPlay,
  onDismiss,
}: QuickPlayOverlayProps) {
  const [filesInfo, setFilesInfo] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const audioFiles = droppedFiles.filter(isAudioFile);
  const isSingleFile = audioFiles.length === 1;

  // Extract metadata when files are dropped
  useEffect(() => {
    if (audioFiles.length > 0) {
      setIsLoading(true);
      
      // For single file, extract full metadata
      // For multiple files, just use filename to speed things up
      if (audioFiles.length === 1) {
        const file = audioFiles[0];
        extractMetadata(file)
          .then((metadata) => {
            setFilesInfo([{
              file,
              title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
              artist: metadata.artist || "Unknown Artist",
              album: metadata.album || "Unknown Album",
              duration: metadata.duration || 0,
              coverArt: metadata.coverArt,
            }]);
          })
          .catch(() => {
            setFilesInfo([{
              file,
              title: file.name.replace(/\.[^/.]+$/, ""),
              artist: "Unknown Artist",
              album: "Unknown Album",
              duration: 0,
            }]);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        // Quick metadata for multiple files
        setFilesInfo(audioFiles.map(file => ({
          file,
          title: file.name.replace(/\.[^/.]+$/, ""),
          artist: "Unknown Artist",
          album: "Unknown Album",
          duration: 0,
        })));
        setIsLoading(false);
      }
    } else {
      setFilesInfo([]);
      setIsLoading(false);
    }
  }, [droppedFiles]);

  const handlePlayDirectly = useCallback(async () => {
    if (audioFiles.length > 0) {
      await onPlayFiles(audioFiles);
      onDismiss();
    }
  }, [audioFiles, onPlayFiles, onDismiss]);

  const handleImportAndPlayAction = useCallback(async () => {
    if (audioFiles.length > 0) {
      await onImportAndPlay(audioFiles);
      onDismiss();
    }
  }, [audioFiles, onImportAndPlay, onDismiss]);

  if (!isVisible || droppedFiles.length === 0) {
    return null;
  }

  // Check if any file is supported
  if (audioFiles.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-vinyl-surface border border-vinyl-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-vinyl-text">
              Unsupported File{droppedFiles.length > 1 ? "s" : ""}
            </h2>
            <button
              onClick={onDismiss}
              className="p-2 hover:bg-vinyl-border rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-vinyl-text-muted" />
            </button>
          </div>
          <div className="text-center py-6">
            <FileAudio className="w-12 h-12 mx-auto mb-4 text-vinyl-text-muted" />
            <p className="text-vinyl-text mb-2">
              {droppedFiles.length > 1 
                ? "These files are not supported" 
                : "This file type is not supported"}
            </p>
            <p className="text-vinyl-text-muted text-sm">
              Please use MP3, WAV, OGG, FLAC, AAC, or M4A files
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="w-full py-3 bg-vinyl-border hover:bg-vinyl-border/80 rounded-lg transition-colors text-vinyl-text font-medium"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  const firstFile = filesInfo[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-vinyl-surface border border-vinyl-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-vinyl-text">
            {isSingleFile ? "Play Audio File" : `Play ${audioFiles.length} Files`}
          </h2>
          <button
            onClick={onDismiss}
            className="p-2 hover:bg-vinyl-border rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-vinyl-text-muted" />
          </button>
        </div>

        {/* File info */}
        {isSingleFile ? (
          <div className="flex items-center gap-4 p-4 bg-vinyl-border/30 rounded-xl mb-6">
            {isLoading ? (
              <div className="w-16 h-16 rounded-lg bg-vinyl-border flex items-center justify-center flex-shrink-0">
                <div className="w-6 h-6 border-2 border-vinyl-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-vinyl-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                {firstFile?.coverArt ? (
                  <img
                    src={firstFile.coverArt}
                    alt={firstFile.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music className="w-8 h-8 text-vinyl-text-muted" />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <>
                  <div className="h-5 bg-vinyl-border rounded w-3/4 mb-2 animate-pulse" />
                  <div className="h-4 bg-vinyl-border rounded w-1/2 animate-pulse" />
                </>
              ) : (
                <>
                  <p className="font-medium text-vinyl-text truncate">
                    {firstFile?.title}
                  </p>
                  <p className="text-sm text-vinyl-text-muted truncate">
                    {firstFile?.artist}
                  </p>
                  {firstFile?.duration ? (
                    <p className="text-xs text-vinyl-text-muted mt-1">
                      {formatDuration(firstFile.duration)}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-vinyl-border/30 rounded-xl mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-vinyl-accent/20 flex items-center justify-center flex-shrink-0">
                <ListMusic className="w-6 h-6 text-vinyl-accent" />
              </div>
              <div>
                <p className="font-medium text-vinyl-text">
                  {audioFiles.length} audio files
                </p>
                <p className="text-sm text-vinyl-text-muted">
                  Ready to play
                </p>
              </div>
            </div>
            <div className="max-h-32 overflow-auto space-y-1">
              {filesInfo.slice(0, 5).map((info, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm text-vinyl-text-muted"
                >
                  <Music className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{info.title}</span>
                </div>
              ))}
              {filesInfo.length > 5 && (
                <p className="text-xs text-vinyl-text-muted pl-6">
                  +{filesInfo.length - 5} more...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {/* Play directly button - primary action */}
          <button
            onClick={handlePlayDirectly}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 w-full py-3 bg-vinyl-accent text-vinyl-bg rounded-lg hover:bg-vinyl-accent-light transition-colors font-medium disabled:opacity-50"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            {isSingleFile ? "Play Now" : "Play All"}
          </button>

          {/* Add to library button - secondary action */}
          <button
            onClick={handleImportAndPlayAction}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 w-full py-3 bg-vinyl-border/50 hover:bg-vinyl-border rounded-lg transition-colors text-vinyl-text font-medium disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            {isSingleFile ? "Add to Library & Play" : "Add All to Library & Play"}
          </button>

          {/* Cancel */}
          <button
            onClick={onDismiss}
            className="w-full py-2 text-vinyl-text-muted hover:text-vinyl-text transition-colors text-sm"
          >
            Cancel
          </button>
        </div>

        {/* Info text */}
        <p className="text-xs text-vinyl-text-muted text-center mt-4">
          {isSingleFile 
            ? "\"Play Now\" plays the file without saving to your library"
            : "\"Play All\" creates a temporary playlist without saving to your library"}
        </p>
      </div>
    </div>
  );
}

// Drop zone overlay shown when dragging files over the app
interface DropZoneOverlayProps {
  isVisible: boolean;
}

export function DropZoneOverlay({ isVisible }: DropZoneOverlayProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-vinyl-bg/90 backdrop-blur-sm animate-fade-in pointer-events-none">
      <div className="text-center">
        <div className="w-24 h-24 rounded-full bg-vinyl-accent/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Upload className="w-12 h-12 text-vinyl-accent" />
        </div>
        <h2 className="text-2xl font-bold text-vinyl-text mb-2">
          Drop to Play
        </h2>
        <p className="text-vinyl-text-muted">
          Drop audio files here to play them instantly
        </p>
      </div>
    </div>
  );
}
