import { useState, useRef, useEffect } from "react";
import {
  FolderOpen,
  FileAudio,
  Upload,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Link2,
  Unlink2,
  Info,
  Lightbulb,
} from "lucide-react";
import { isDesktop as checkIsDesktop } from "../lib/platform";

interface ImportMusicProps {
  onImport: (
    files: FileList,
    folderName?: string,
  ) => Promise<{ imported: number; skipped: number }>;
  onConnectFolder?: (files: FileList) => {
    connected: number;
    newFiles: File[];
  };
  // Tauri-specific: import from folder picker
  onPickAndImportFolder?: () => Promise<{
    imported: number;
    skipped: number;
    folderSongs: Map<string, string[]>;
  } | null>;
  // Callback to create playlists from folder structure
  onCreatePlaylistsFromFolders?: (
    folderSongs: Map<string, string[]>,
  ) => Promise<number>;
  isImporting: boolean;
  importProgress: { current: number; total: number; skipped?: number } | null;
  connectedCount?: number;
  totalCount?: number;
  isDesktop?: boolean;
}

interface ImportResult {
  imported: number;
  skipped: number;
  total: number;
}

export function ImportMusic({
  onImport,
  onConnectFolder,
  onPickAndImportFolder,
  onCreatePlaylistsFromFolders,
  isImporting,
  importProgress,
  connectedCount = 0,
  totalCount = 0,
  isDesktop = false,
}: ImportMusicProps) {
  const isRunningInDesktop = isDesktop || checkIsDesktop();
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [connectResult, setConnectResult] = useState<{
    connected: number;
    total: number;
  } | null>(null);
  const [showReconnectDialog, setShowReconnectDialog] = useState(false);
  const [reconnectDismissed, setReconnectDismissed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const reconnectInputRef = useRef<HTMLInputElement>(null);

  const hasDisconnectedSongs = totalCount > 0 && connectedCount < totalCount;
  const allConnected = totalCount > 0 && connectedCount === totalCount;
  const disconnectedCount = totalCount - connectedCount;

  // Show reconnect dialog automatically when songs need reconnection (web only)
  // On desktop, songs with file paths don't need reconnection
  useEffect(() => {
    if (
      !isRunningInDesktop &&
      hasDisconnectedSongs &&
      !reconnectDismissed &&
      !showReconnectDialog &&
      !isOpen
    ) {
      // Small delay to avoid showing immediately on page load
      const timer = setTimeout(() => {
        setShowReconnectDialog(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    isRunningInDesktop,
    hasDisconnectedSongs,
    reconnectDismissed,
    showReconnectDialog,
    isOpen,
  ]);

  // Reset dismissed state when all songs are connected
  useEffect(() => {
    if (allConnected) {
      setReconnectDismissed(false);
    }
  }, [allConnected]);

  // Reset results when dialog opens
  useEffect(() => {
    if (isOpen) {
      setImportResult(null);
      setConnectResult(null);
    }
  }, [isOpen]);

  // Handle reconnecting folder
  const handleReconnect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && onConnectFolder) {
      const result = onConnectFolder(files);
      setConnectResult({
        connected: result.connected,
        total: files.length,
      });

      // Close the reconnect prompt dialog
      setShowReconnectDialog(false);

      // If there are new files, auto-import them
      if (result.newFiles.length > 0) {
        const fileList = new DataTransfer();
        result.newFiles.forEach((f) => fileList.items.add(f));
        onImport(fileList.files).then((importRes) => {
          setImportResult({
            imported: importRes.imported,
            skipped: importRes.skipped,
            total: result.newFiles.length,
          });
        });
      }
    }
    e.target.value = "";
  };

  const handleDismissReconnect = () => {
    setShowReconnectDialog(false);
    setReconnectDismissed(true);
  };

  const handleCloseSuccessDialog = () => {
    setConnectResult(null);
    setImportResult(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Check if this is a folder import by looking at webkitRelativePath
      let folderName: string | undefined;
      if (files[0]?.webkitRelativePath) {
        // Extract folder name from path like "FolderName/file.mp3"
        const pathParts = files[0].webkitRelativePath.split("/");
        if (pathParts.length > 1) {
          folderName = pathParts[0];
        }
      }
      const result = await onImport(files, folderName);

      // Show result summary
      setImportResult({
        imported: result.imported,
        skipped: result.skipped,
        total: files.length,
      });

      // Auto-close only if no duplicates were skipped
      if (result.skipped === 0) {
        setIsOpen(false);
      }
    }
    // Reset input
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // First try to reconnect existing songs
      if (onConnectFolder && hasDisconnectedSongs) {
        const connectRes = onConnectFolder(files);
        if (connectRes.connected > 0) {
          setConnectResult({
            connected: connectRes.connected,
            total: files.length,
          });
        }

        // Import any truly new files
        if (connectRes.newFiles.length > 0) {
          const fileList = new DataTransfer();
          connectRes.newFiles.forEach((f) => fileList.items.add(f));
          const result = await onImport(fileList.files);
          setImportResult({
            imported: result.imported,
            skipped: result.skipped,
            total: connectRes.newFiles.length,
          });
        }
        return;
      }

      // Normal import
      const result = await onImport(files);

      // Show result summary
      setImportResult({
        imported: result.imported,
        skipped: result.skipped,
        total: files.length,
      });

      // Auto-close only if no duplicates were skipped
      if (result.skipped === 0) {
        setIsOpen(false);
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setImportResult(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Reconnect Dialog - shown when songs need reconnection
  const reconnectDialog = showReconnectDialog && hasDisconnectedSongs && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-vinyl-surface border border-vinyl-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* Header with icon */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Unlink2 className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-vinyl-text">
              Reconnect Your Music
            </h2>
            <p className="text-vinyl-text-muted text-sm mt-1">
              {disconnectedCount} of {totalCount} song
              {disconnectedCount !== 1 ? "s" : ""} need
              {disconnectedCount === 1 ? "s" : ""} to be reconnected
            </p>
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-vinyl-border/30 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-vinyl-accent flex-shrink-0 mt-0.5" />
            <div className="text-sm text-vinyl-text-muted">
              <p className="mb-2">
                For your privacy and security, browsers don't allow apps to
                access your files automatically after you close or refresh the
                page.
              </p>
              <p>
                To play your music, simply select your music folder again. Your
                library, playlists, and preferences are all saved.
              </p>
            </div>
          </div>
        </div>

        {/* Best Practice Tip */}
        <div className="bg-vinyl-accent/10 border border-vinyl-accent/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-vinyl-accent flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-vinyl-accent font-medium mb-1">Pro Tip</p>
              <p className="text-vinyl-text-muted">
                Keep all your music in a single folder for a faster and seamless
                experience. You'll only need to select one folder to reconnect
                your entire library.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => reconnectInputRef.current?.click()}
            className="flex items-center justify-center gap-2 w-full py-3 bg-vinyl-accent text-vinyl-bg rounded-lg hover:bg-vinyl-accent-light transition-colors font-medium"
          >
            <FolderOpen className="w-5 h-5" />
            Select Music Folder
          </button>
          <button
            onClick={handleDismissReconnect}
            className="w-full py-2 text-vinyl-text-muted hover:text-vinyl-text transition-colors text-sm"
          >
            I'll do this later
          </button>
        </div>

        {/* Hidden input for folder selection */}
        <input
          ref={reconnectInputRef}
          type="file"
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleReconnect}
          className="hidden"
        />
      </div>
    </div>
  );

  // Success Dialog - shown after reconnection
  const successDialog = connectResult && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-vinyl-surface border border-vinyl-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="text-center py-4">
          <div
            className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
              allConnected ? "bg-green-500/20" : "bg-amber-500/20"
            }`}
          >
            {allConnected ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <Link2 className="w-8 h-8 text-amber-400" />
            )}
          </div>

          <h2 className="text-xl font-semibold text-vinyl-text mb-2">
            {allConnected ? "All Songs Connected!" : "Songs Reconnected"}
          </h2>

          <p className="text-vinyl-text-muted mb-2">
            {connectResult.connected} song
            {connectResult.connected !== 1 ? "s" : ""} reconnected
          </p>

          <p className="text-vinyl-text-muted text-sm mb-2">
            {connectedCount} of {totalCount} songs are now playable
          </p>

          {importResult && importResult.imported > 0 && (
            <p className="text-vinyl-accent text-sm mb-4">
              + {importResult.imported} new song
              {importResult.imported !== 1 ? "s" : ""} added to your library
            </p>
          )}

          {!allConnected && disconnectedCount > 0 && (
            <p className="text-vinyl-text-muted text-xs mb-4">
              {disconnectedCount} song{disconnectedCount !== 1 ? "s" : ""}{" "}
              couldn't be found. They may have been moved or renamed.
            </p>
          )}

          <button
            onClick={handleCloseSuccessDialog}
            className="px-8 py-2 bg-vinyl-accent text-vinyl-bg rounded-lg hover:bg-vinyl-accent-light transition-colors font-medium"
          >
            {allConnected ? "Great!" : "Got it"}
          </button>
        </div>
      </div>
    </div>
  );

  if (!isOpen) {
    return (
      <>
        {/* Reconnect Dialog - shown when songs need reconnection */}
        {reconnectDialog}

        {/* Success Dialog - shown after successful reconnection */}
        {successDialog}

        {/* Add Music button */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-vinyl-accent text-vinyl-bg rounded-lg hover:bg-vinyl-accent-light transition-colors font-medium"
        >
          <Upload className="w-5 h-5" />
          Add Music
        </button>
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-vinyl-surface border border-vinyl-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-vinyl-text">
            {importResult ? "Import Complete" : "Import Music"}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-vinyl-border rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-vinyl-text-muted" />
          </button>
        </div>

        {isImporting && importProgress ? (
          <div className="py-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-vinyl-accent animate-spin" />
            <p className="text-vinyl-text mb-2">Importing music...</p>
            <p className="text-vinyl-text-muted text-sm">
              {importProgress.current} of {importProgress.total} files
              {importProgress.skipped && importProgress.skipped > 0 && (
                <span className="text-vinyl-accent ml-2">
                  ({importProgress.skipped} duplicates skipped)
                </span>
              )}
            </p>
            <div className="mt-4 h-2 bg-vinyl-border rounded-full overflow-hidden">
              <div
                className="h-full bg-vinyl-accent transition-all duration-300"
                style={{
                  width: `${(importProgress.current / importProgress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        ) : connectResult ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />

            <p className="text-vinyl-text text-lg mb-2">
              {connectResult.connected} song
              {connectResult.connected !== 1 ? "s" : ""} reconnected
            </p>

            {importResult && importResult.imported > 0 && (
              <p className="text-vinyl-text-muted text-sm mb-4">
                + {importResult.imported} new song
                {importResult.imported !== 1 ? "s" : ""} imported
              </p>
            )}

            <p className="text-vinyl-text-muted text-sm mb-4">
              {connectedCount} of {totalCount} songs now playable
            </p>

            <button
              onClick={handleClose}
              className="px-6 py-2 bg-vinyl-accent text-vinyl-bg rounded-lg hover:bg-vinyl-accent-light transition-colors font-medium"
            >
              Done
            </button>
          </div>
        ) : importResult ? (
          <div className="py-8 text-center">
            {importResult.skipped > 0 ? (
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            ) : (
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            )}

            <p className="text-vinyl-text text-lg mb-4">
              {importResult.imported > 0
                ? `${importResult.imported} song${importResult.imported !== 1 ? "s" : ""} imported`
                : "No new songs imported"}
            </p>

            {importResult.skipped > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                <p className="text-yellow-500 text-sm">
                  {importResult.skipped} duplicate
                  {importResult.skipped !== 1 ? "s" : ""} skipped
                </p>
                <p className="text-vinyl-text-muted text-xs mt-1">
                  Songs with the same title, artist, and duration already exist
                  in your library
                </p>
              </div>
            )}

            <button
              onClick={handleClose}
              className="px-6 py-2 bg-vinyl-accent text-vinyl-bg rounded-lg hover:bg-vinyl-accent-light transition-colors font-medium"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging
                  ? "border-vinyl-accent bg-vinyl-accent/10"
                  : "border-vinyl-border hover:border-vinyl-text-muted"
              }`}
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-vinyl-text-muted" />
              <p className="text-vinyl-text mb-1">
                Drag and drop audio files here
              </p>
              <p className="text-vinyl-text-muted text-sm">
                or use the buttons below
              </p>
            </div>

            {/* Import buttons */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-3 bg-vinyl-border/50 hover:bg-vinyl-border rounded-lg transition-colors"
              >
                <FileAudio className="w-5 h-5 text-vinyl-accent" />
                <span className="text-vinyl-text text-sm">Select Files</span>
              </button>

              <button
                onClick={async () => {
                  if (isRunningInDesktop && onPickAndImportFolder) {
                    // Use native folder picker
                    const result = await onPickAndImportFolder();
                    if (result) {
                      // Create playlists from folder structure
                      let playlistsCreated = 0;
                      if (
                        onCreatePlaylistsFromFolders &&
                        result.folderSongs.size > 0
                      ) {
                        playlistsCreated = await onCreatePlaylistsFromFolders(
                          result.folderSongs,
                        );
                        console.log(
                          "[Import] Created playlists from folders:",
                          playlistsCreated,
                        );
                      }

                      setImportResult({
                        imported: result.imported,
                        skipped: result.skipped,
                        total: result.imported + result.skipped,
                      });
                      if (result.skipped === 0 && result.imported > 0) {
                        setIsOpen(false);
                      }
                    }
                  } else {
                    // Use web folder picker
                    folderInputRef.current?.click();
                  }
                }}
                className="flex items-center justify-center gap-2 p-3 bg-vinyl-border/50 hover:bg-vinyl-border rounded-lg transition-colors"
              >
                <FolderOpen className="w-5 h-5 text-vinyl-accent" />
                <span className="text-vinyl-text text-sm">Select Folder</span>
              </button>
            </div>

            {/* Hidden inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={folderInputRef}
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Supported formats */}
            <p className="mt-4 text-center text-xs text-vinyl-text-muted">
              Supported formats: MP3, WAV, OGG, FLAC, AAC, M4A
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// Add TypeScript declaration for webkitdirectory and directory attributes
declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}
