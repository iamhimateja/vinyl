import { useState, useEffect, useCallback, useRef } from "react";
import {
  isElectron,
  getLibraryFolders,
  addLibraryFolder,
  removeLibraryFolder,
  scanLibraryFolder,
  scanAllLibraryFolders,
  openFolderPicker,
  startLibraryWatcher,
  stopLibraryWatcher,
  getLibraryWatcherStatus,
  onLibraryFileChange,
  type MusicFileInfo,
  type LibraryScanResult,
  type FileChangeEvent,
} from "../lib/platform";

export interface LibraryState {
  folders: string[];
  isScanning: boolean;
  scanProgress: {
    current: number;
    total: number;
    currentFolder: string;
  } | null;
  lastScanResult: LibraryScanResult | null;
  error: string | null;
  isWatching: boolean;
}

export interface UseLibraryReturn {
  // State
  folders: string[];
  isScanning: boolean;
  scanProgress: LibraryState["scanProgress"];
  lastScanResult: LibraryScanResult | null;
  error: string | null;
  isDesktop: boolean;
  isWatching: boolean;

  // Actions
  addFolder: () => Promise<string | null>;
  removeFolder: (folderPath: string) => Promise<boolean>;
  scanFolder: (folderPath: string) => Promise<MusicFileInfo[]>;
  scanAllFolders: () => Promise<MusicFileInfo[]>;
  refreshFolders: () => Promise<void>;
  clearError: () => void;
  startWatching: () => Promise<boolean>;
  stopWatching: () => Promise<boolean>;

  // Event callback setters
  setOnFileAdded: (callback: ((file: MusicFileInfo) => void) | null) => void;
  setOnFileRemoved: (callback: ((filePath: string) => void) | null) => void;
}

export function useLibrary(): UseLibraryReturn {
  const [state, setState] = useState<LibraryState>({
    folders: [],
    isScanning: false,
    scanProgress: null,
    lastScanResult: null,
    error: null,
    isWatching: false,
  });

  const isDesktop = isElectron();

  // Callbacks for file change events
  const onFileAddedCallback = useRef<((file: MusicFileInfo) => void) | null>(
    null,
  );
  const onFileRemovedCallback = useRef<((filePath: string) => void) | null>(
    null,
  );

  // Refresh folder list from electron store
  const refreshFolders = useCallback(async () => {
    if (!isDesktop) return;

    try {
      const folders = await getLibraryFolders();
      setState((prev) => ({ ...prev, folders, error: null }));
    } catch (error) {
      console.error("Failed to refresh folders:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to load library folders",
      }));
    }
  }, [isDesktop]);

  // Start watching folders
  const startWatching = useCallback(async (): Promise<boolean> => {
    if (!isDesktop) return false;

    try {
      const result = await startLibraryWatcher();
      if (result.success) {
        setState((prev) => ({ ...prev, isWatching: true }));
        console.log("[Library] Started watching", result.watching, "folders");
        return true;
      }
      if (result.error) {
        setState((prev) => ({ ...prev, error: result.error || null }));
      }
      return false;
    } catch (error) {
      console.error("Failed to start watcher:", error);
      return false;
    }
  }, [isDesktop]);

  // Stop watching folders
  const stopWatching = useCallback(async (): Promise<boolean> => {
    if (!isDesktop) return false;

    try {
      const result = await stopLibraryWatcher();
      if (result.success) {
        setState((prev) => ({ ...prev, isWatching: false }));
        console.log("[Library] Stopped watching");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to stop watcher:", error);
      return false;
    }
  }, [isDesktop]);

  // Load folders and start watcher on mount
  useEffect(() => {
    if (!isDesktop) return;

    const init = async () => {
      await refreshFolders();

      // Check watcher status and start if not already watching
      const status = await getLibraryWatcherStatus();
      setState((prev) => ({ ...prev, isWatching: status.watching }));

      // Auto-start watcher if folders exist and not already watching
      if (!status.watching && status.folders.length > 0) {
        await startWatching();
      }
    };

    init();
  }, [isDesktop, refreshFolders, startWatching]);

  // Subscribe to file change events
  useEffect(() => {
    if (!isDesktop) return;

    const unsubscribe = onLibraryFileChange((event: FileChangeEvent) => {
      console.log("[Library] File change event:", event.type, event.file.path);

      if (event.type === "add" && onFileAddedCallback.current) {
        onFileAddedCallback.current(event.file);
      } else if (event.type === "remove" && onFileRemovedCallback.current) {
        onFileRemovedCallback.current(event.file.path);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isDesktop]);

  // Cleanup watcher on unmount
  useEffect(() => {
    return () => {
      // Note: We don't stop the watcher on unmount since it should keep running
      // The main process handles cleanup on app quit
    };
  }, []);

  // Add a new folder via folder picker
  const addFolder = useCallback(async (): Promise<string | null> => {
    if (!isDesktop) return null;

    try {
      const folderPath = await openFolderPicker();
      if (!folderPath) return null;

      const result = await addLibraryFolder(folderPath);

      if (result.error) {
        setState((prev) => ({ ...prev, error: result.error || null }));
        return null;
      }

      if (result.folders) {
        setState((prev) => ({
          ...prev,
          folders: result.folders!,
          error: null,
        }));
        // Restart watcher to include new folder
        await startWatching();
      }

      return folderPath;
    } catch (error) {
      console.error("Failed to add folder:", error);
      setState((prev) => ({ ...prev, error: "Failed to add folder" }));
      return null;
    }
  }, [isDesktop, startWatching]);

  // Remove a folder from the library
  const removeFolder = useCallback(
    async (folderPath: string): Promise<boolean> => {
      if (!isDesktop) return false;

      try {
        const result = await removeLibraryFolder(folderPath);

        if (result.error) {
          setState((prev) => ({ ...prev, error: result.error || null }));
          return false;
        }

        if (result.folders) {
          setState((prev) => ({
            ...prev,
            folders: result.folders!,
            error: null,
          }));
          // Restart watcher with updated folders, or stop if no folders left
          if (result.folders.length > 0) {
            await startWatching();
          } else {
            await stopWatching();
          }
        }

        return true;
      } catch (error) {
        console.error("Failed to remove folder:", error);
        setState((prev) => ({ ...prev, error: "Failed to remove folder" }));
        return false;
      }
    },
    [isDesktop, startWatching, stopWatching],
  );

  // Scan a specific folder
  const scanFolder = useCallback(
    async (folderPath: string): Promise<MusicFileInfo[]> => {
      if (!isDesktop) return [];

      try {
        setState((prev) => ({
          ...prev,
          isScanning: true,
          scanProgress: { current: 0, total: 1, currentFolder: folderPath },
          error: null,
        }));

        const result = await scanLibraryFolder(folderPath);

        setState((prev) => ({
          ...prev,
          isScanning: false,
          scanProgress: null,
          lastScanResult: result,
          error: result.error || null,
        }));

        return result.files;
      } catch (error) {
        console.error("Failed to scan folder:", error);
        setState((prev) => ({
          ...prev,
          isScanning: false,
          scanProgress: null,
          error: "Failed to scan folder",
        }));
        return [];
      }
    },
    [isDesktop],
  );

  // Scan all folders
  const scanAllFolders = useCallback(async (): Promise<MusicFileInfo[]> => {
    if (!isDesktop) return [];

    try {
      setState((prev) => ({
        ...prev,
        isScanning: true,
        scanProgress: {
          current: 0,
          total: prev.folders.length,
          currentFolder: "Scanning...",
        },
        error: null,
      }));

      const result = await scanAllLibraryFolders();

      setState((prev) => ({
        ...prev,
        isScanning: false,
        scanProgress: null,
        lastScanResult: result,
        error: result.error || null,
      }));

      return result.files;
    } catch (error) {
      console.error("Failed to scan all folders:", error);
      setState((prev) => ({
        ...prev,
        isScanning: false,
        scanProgress: null,
        error: "Failed to scan folders",
      }));
      return [];
    }
  }, [isDesktop]);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Set callbacks for file events
  const setOnFileAdded = useCallback(
    (callback: ((file: MusicFileInfo) => void) | null) => {
      onFileAddedCallback.current = callback;
    },
    [],
  );

  const setOnFileRemoved = useCallback(
    (callback: ((filePath: string) => void) | null) => {
      onFileRemovedCallback.current = callback;
    },
    [],
  );

  return {
    folders: state.folders,
    isScanning: state.isScanning,
    scanProgress: state.scanProgress,
    lastScanResult: state.lastScanResult,
    error: state.error,
    isDesktop,
    isWatching: state.isWatching,
    addFolder,
    removeFolder,
    scanFolder,
    scanAllFolders,
    refreshFolders,
    clearError,
    startWatching,
    stopWatching,
    setOnFileAdded,
    setOnFileRemoved,
  };
}
