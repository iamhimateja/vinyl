import { useState } from "react";
import {
  FolderOpen,
  FolderPlus,
  Trash2,
  RefreshCw,
  HardDrive,
  Music,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { tooltipProps } from "./Tooltip";
import { ConfirmDialog } from "./ConfirmDialog";
import type { MusicFileInfo } from "../lib/platform";

interface LibrarySettingsProps {
  folders: string[];
  isScanning: boolean;
  scanProgress: {
    current: number;
    total: number;
    currentFolder: string;
  } | null;
  lastScanResult: {
    files: MusicFileInfo[];
    totalCount: number;
    folderStats?: {
      path: string;
      count: number;
      exists: boolean;
    }[];
    error?: string;
  } | null;
  error: string | null;
  isDesktop: boolean;
  isWatching: boolean;
  totalSongsInLibrary: number;
  onAddFolder: () => Promise<string | null>;
  onRemoveFolder: (folderPath: string) => Promise<boolean>;
  onScanFolder: (folderPath: string) => Promise<MusicFileInfo[]>;
  onScanAllFolders: () => Promise<MusicFileInfo[]>;
  onImportFiles: (files: MusicFileInfo[]) => Promise<void>;
  onClearError: () => void;
}

export function LibrarySettings({
  folders,
  isScanning,
  scanProgress,
  lastScanResult,
  error,
  isDesktop,
  isWatching,
  totalSongsInLibrary,
  onAddFolder,
  onRemoveFolder,
  onScanFolder,
  onScanAllFolders,
  onImportFiles,
  onClearError,
}: LibrarySettingsProps) {
  const [removingFolder, setRemovingFolder] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Handle adding a folder
  const handleAddFolder = async () => {
    const folderPath = await onAddFolder();
    if (folderPath) {
      // Optionally auto-scan the newly added folder
      const files = await onScanFolder(folderPath);
      if (files.length > 0) {
        setIsImporting(true);
        await onImportFiles(files);
        setImportedCount(files.length);
        setIsImporting(false);
        // Clear message after 3 seconds
        setTimeout(() => setImportedCount(null), 3000);
      }
    }
  };

  // Handle removing a folder
  const handleRemoveFolder = async (folderPath: string) => {
    await onRemoveFolder(folderPath);
    setRemovingFolder(null);
  };

  // Handle scanning all folders and importing
  const handleScanAndImport = async () => {
    const files = await onScanAllFolders();
    if (files.length > 0) {
      setIsImporting(true);
      await onImportFiles(files);
      setImportedCount(files.length);
      setIsImporting(false);
      // Clear message after 3 seconds
      setTimeout(() => setImportedCount(null), 3000);
    }
  };

  // Get folder name from path
  const getFolderName = (folderPath: string) => {
    const parts = folderPath.split(/[/\\]/);
    return parts[parts.length - 1] || folderPath;
  };

  // Non-desktop info
  if (!isDesktop) {
    return (
      <section className="bg-vinyl-surface border border-vinyl-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-vinyl-border bg-vinyl-border/20">
          <h2 className="font-semibold text-vinyl-text flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-vinyl-accent" />
            Music Library
          </h2>
        </div>
        <div className="p-4">
          <div className="flex items-start gap-3 p-3 bg-vinyl-border/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-vinyl-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-vinyl-text font-medium">
                Desktop Only Feature
              </p>
              <p className="text-sm text-vinyl-text-muted mt-1">
                Automatic library scanning is only available in the desktop app.
                In the web version, use the import button to add music files
                manually.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-vinyl-surface border border-vinyl-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-vinyl-border bg-vinyl-border/20">
        <h2 className="font-semibold text-vinyl-text flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-vinyl-accent" />
          Music Library
        </h2>
      </div>
      <div className="p-4 space-y-4">
        {/* Library Stats */}
        <div className="flex items-center justify-between p-3 bg-vinyl-border/30 rounded-lg">
          <div className="flex items-center gap-3">
            <Music className="w-5 h-5 text-vinyl-accent" />
            <div>
              <p className="text-vinyl-text font-medium">
                {totalSongsInLibrary} songs in library
              </p>
              <div className="flex items-center gap-2 text-sm text-vinyl-text-muted">
                <span>
                  {folders.length} folder{folders.length !== 1 ? "s" : ""}
                </span>
                {folders.length > 0 && (
                  <span
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${
                      isWatching
                        ? "bg-green-500/20 text-green-400"
                        : "bg-vinyl-border text-vinyl-text-muted"
                    }`}
                    {...tooltipProps(
                      isWatching
                        ? "Watching for new files"
                        : "File watching inactive",
                    )}
                  >
                    {isWatching ? (
                      <>
                        <Eye className="w-3 h-3" />
                        Auto-sync
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
                        Paused
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleScanAndImport}
            disabled={isScanning || folders.length === 0 || isImporting}
            className="flex items-center gap-2 px-3 py-2 bg-vinyl-accent text-vinyl-bg rounded-lg hover:bg-vinyl-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            {...tooltipProps("Scan all folders for new music")}
          >
            {isScanning || isImporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isScanning
              ? "Scanning..."
              : isImporting
                ? "Importing..."
                : "Rescan All"}
          </button>
        </div>

        {/* Success Message */}
        {importedCount !== null && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p>Successfully imported {importedCount} songs!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
            <button
              onClick={onClearError}
              className="p-1 hover:bg-red-500/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scan Progress */}
        {isScanning && scanProgress && (
          <div className="p-3 bg-vinyl-border/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="w-4 h-4 animate-spin text-vinyl-accent" />
              <span className="text-sm text-vinyl-text">
                Scanning: {scanProgress.currentFolder}
              </span>
            </div>
            <div className="h-2 bg-vinyl-border rounded-full overflow-hidden">
              <div
                className="h-full bg-vinyl-accent transition-all duration-300"
                style={{
                  width: `${(scanProgress.current / scanProgress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Watched Folders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-vinyl-text font-medium">Watched Folders</h3>
            <button
              onClick={handleAddFolder}
              disabled={isScanning}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-vinyl-border text-vinyl-text rounded-lg hover:bg-vinyl-border/70 transition-colors disabled:opacity-50"
              {...tooltipProps("Add a music folder")}
            >
              <FolderPlus className="w-4 h-4" />
              Add Folder
            </button>
          </div>

          {folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-vinyl-border rounded-lg">
              <FolderOpen className="w-12 h-12 text-vinyl-text-muted mb-3" />
              <p className="text-vinyl-text-muted text-center">
                No folders added yet
              </p>
              <p className="text-sm text-vinyl-text-muted text-center mt-1">
                Add a folder to start scanning for music
              </p>
              <button
                onClick={handleAddFolder}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-vinyl-accent text-vinyl-bg rounded-lg hover:bg-vinyl-accent-light transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
                Add Your First Folder
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {folders.map((folderPath) => {
                const folderStat = lastScanResult?.folderStats?.find(
                  (s) => s.path === folderPath,
                );
                const folderExists = folderStat?.exists !== false;

                return (
                  <div
                    key={folderPath}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      folderExists
                        ? "bg-vinyl-border/30"
                        : "bg-red-500/10 border border-red-500/30"
                    }`}
                  >
                    <FolderOpen
                      className={`w-5 h-5 flex-shrink-0 ${
                        folderExists ? "text-vinyl-accent" : "text-red-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium truncate ${
                          folderExists ? "text-vinyl-text" : "text-red-400"
                        }`}
                        title={folderPath}
                      >
                        {getFolderName(folderPath)}
                      </p>
                      <p className="text-xs text-vinyl-text-muted truncate">
                        {folderPath}
                      </p>
                      {folderStat && folderExists && (
                        <p className="text-xs text-vinyl-text-muted">
                          {folderStat.count} songs found
                        </p>
                      )}
                      {!folderExists && (
                        <p className="text-xs text-red-400">
                          Folder not found - may have been moved or deleted
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setRemovingFolder(folderPath)}
                      disabled={isScanning}
                      className="p-2 text-vinyl-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      {...tooltipProps("Remove folder")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Last Scan Info */}
        {lastScanResult && !isScanning && (
          <div className="text-xs text-vinyl-text-muted p-2 bg-vinyl-border/20 rounded">
            Last scan found {lastScanResult.totalCount} total songs across{" "}
            {lastScanResult.folderStats?.length || 0} folders
          </div>
        )}
      </div>

      {/* Remove Folder Confirmation */}
      <ConfirmDialog
        isOpen={removingFolder !== null}
        title="Remove Folder?"
        message={`Are you sure you want to remove "${removingFolder ? getFolderName(removingFolder) : ""}" from your library?`}
        warningText="This will only remove the folder from the watch list. Your music files and imported songs will not be deleted."
        confirmLabel="Remove Folder"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => removingFolder && handleRemoveFolder(removingFolder)}
        onCancel={() => setRemovingFolder(null)}
      />
    </section>
  );
}
