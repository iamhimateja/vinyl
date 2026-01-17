/**
 * Platform abstraction layer
 * Allows the app to work on web browsers and Electron desktop
 */

// Types for library scan results
export interface LibraryScanResult {
  files: MusicFileInfo[];
  totalCount: number;
  folderPath?: string;
  folderStats?: {
    path: string;
    count: number;
    exists: boolean;
  }[];
  error?: string;
}

export interface LibraryFolderResult {
  success?: boolean;
  folders?: string[];
  error?: string;
}

// File change event from watcher
export interface FileChangeEvent {
  type: "add" | "remove";
  file: MusicFileInfo;
  rootFolder: string | null;
}

// Watcher status
export interface WatcherStatus {
  watching: boolean;
  folders: string[];
}

// Types for Electron API exposed via preload
interface ElectronAPI {
  platform: string;
  isElectron: boolean;
  openFolderPicker: () => Promise<string | null>;
  scanMusicFolder: (
    folderPath: string,
  ) => Promise<{ files?: MusicFileInfo[]; error?: string }>;
  readFile: (filePath: string) => Promise<Uint8Array>;
  fileExists: (filePath: string) => Promise<boolean>;
  getFileStats: (filePath: string) => Promise<{
    size: number;
    mtime: string;
    isFile: boolean;
    isDirectory: boolean;
  } | null>;
  showItemInFolder: (filePath: string) => Promise<boolean>;
  store: {
    get: <T>(key: string) => Promise<T | undefined>;
    set: <T>(key: string, value: T) => Promise<boolean>;
    delete: (key: string) => Promise<boolean>;
  };
  setup: {
    isFirstLaunch: () => Promise<boolean>;
    completeSetup: () => Promise<boolean>;
    resetSetup: () => Promise<boolean>;
  };
  library: {
    getFolders: () => Promise<string[]>;
    addFolder: (folderPath: string) => Promise<LibraryFolderResult>;
    removeFolder: (folderPath: string) => Promise<LibraryFolderResult>;
    scanFolder: (folderPath: string) => Promise<LibraryScanResult>;
    scanAllFolders: () => Promise<LibraryScanResult>;
    // Watcher APIs
    startWatching: () => Promise<{
      success?: boolean;
      watching?: number;
      error?: string;
    }>;
    stopWatching: () => Promise<{ success?: boolean; error?: string }>;
    getWatcherStatus: () => Promise<WatcherStatus>;
    onFileChange: (callback: (event: FileChangeEvent) => void) => () => void;
  };
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

// Check if we're running in Electron
export const isElectron = (): boolean => {
  return typeof window !== "undefined" && window.electron?.isElectron === true;
};

// Check if we're running in any desktop environment
export const isDesktop = (): boolean => {
  return isElectron();
};

// Platform info for debugging
export const getPlatformInfo = (): {
  platform: "web" | "electron";
  userAgent: string;
} => {
  if (isElectron()) {
    return { platform: "electron", userAgent: navigator.userAgent };
  }
  return { platform: "web", userAgent: navigator.userAgent };
};

/**
 * Music file info returned from scanning
 */
export interface MusicFileInfo {
  path: string;
  name: string;
  extension: string;
  /** Relative folder path from scanned root (for playlist creation) */
  folder: string | null;
}

/**
 * Stored music folder configuration
 */
export interface StoredMusicConfig {
  folderPath: string;
  lastConnected: string;
}

const FOLDER_PATH_KEY = "musicFolderPath";

/**
 * Clear all stored data (Desktop only - for reset)
 */
export async function clearStoredData(): Promise<void> {
  if (isElectron() && window.electron) {
    try {
      await window.electron.store.delete(FOLDER_PATH_KEY);
    } catch (error) {
      console.error("Failed to clear stored data:", error);
    }
  }
}

/**
 * Get the stored music folder path (Desktop only)
 */
export async function getStoredFolderPath(): Promise<string | null> {
  if (isElectron() && window.electron) {
    try {
      const path = await window.electron.store.get<string>(FOLDER_PATH_KEY);
      return path || null;
    } catch (error) {
      console.error("Failed to get stored folder path:", error);
      return null;
    }
  }
  return null;
}

/**
 * Save the music folder path (Desktop only)
 */
export async function saveStoredFolderPath(path: string): Promise<void> {
  if (isElectron() && window.electron) {
    try {
      await window.electron.store.set(FOLDER_PATH_KEY, path);
    } catch (error) {
      console.error("Failed to save folder path:", error);
    }
  }
}

/**
 * Open a folder picker dialog (Desktop only)
 */
export async function openFolderPicker(): Promise<string | null> {
  if (isElectron() && window.electron) {
    try {
      return await window.electron.openFolderPicker();
    } catch (error) {
      console.error("Failed to open folder picker:", error);
      return null;
    }
  }
  return null;
}

/**
 * Scan a folder for music files (Desktop only)
 */
export async function scanMusicFolder(
  folderPath: string,
): Promise<MusicFileInfo[]> {
  if (isElectron() && window.electron) {
    try {
      const result = await window.electron.scanMusicFolder(folderPath);
      if (result.error) {
        console.error("Failed to scan music folder:", result.error);
        return [];
      }
      return result.files || [];
    } catch (error) {
      console.error("Failed to scan music folder:", error);
      return [];
    }
  }
  return [];
}

/**
 * Check if a file exists (Desktop only)
 */
export async function fileExists(filePath: string): Promise<boolean> {
  if (isElectron() && window.electron) {
    try {
      return await window.electron.fileExists(filePath);
    } catch (error) {
      console.error("fileExists failed:", error);
      return false;
    }
  }
  return false;
}

/**
 * Read file data from disk (Desktop only)
 */
export async function readFileData(filePath: string): Promise<Uint8Array> {
  if (isElectron() && window.electron) {
    return await window.electron.readFile(filePath);
  }
  throw new Error("Cannot read file by path in web browser");
}

/**
 * Convert a file path to a playable blob URL
 * Reads the file and creates a blob URL
 */
export async function getAssetUrl(filePath: string): Promise<string | null> {
  if (!isDesktop()) {
    return null;
  }

  try {
    const data = await readFileData(filePath);

    // Determine MIME type from extension
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const mimeTypes: Record<string, string> = {
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      flac: "audio/flac",
      aac: "audio/aac",
      m4a: "audio/mp4",
      wma: "audio/x-ms-wma",
      aiff: "audio/aiff",
      opus: "audio/opus",
      webm: "audio/webm",
    };
    const mimeType = mimeTypes[ext] || "audio/mpeg";

    // Create blob URL
    const blob = new Blob([new Uint8Array(data)], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("getAssetUrl failed:", filePath, error);
    return null;
  }
}

/**
 * Read a file as an ArrayBuffer (for audio metadata parsing)
 * Works on all platforms
 */
export async function readFileAsArrayBuffer(
  fileOrPath: File | string,
): Promise<ArrayBuffer> {
  if (typeof fileOrPath === "string") {
    // Desktop: read from file path
    const data = await readFileData(fileOrPath);
    // Create a copy of the buffer to ensure it's a proper ArrayBuffer
    return new Uint8Array(data).buffer as ArrayBuffer;
  } else {
    // Web: read from File object
    return fileOrPath.arrayBuffer();
  }
}

/**
 * Create a playable URL for an audio file
 * On desktop: reads file and creates blob URL
 * On web: uses blob URL from File object
 */
export async function createAudioUrl(
  fileOrPath: File | string,
): Promise<string> {
  if (typeof fileOrPath === "string") {
    // Desktop: read file and create blob URL
    const url = await getAssetUrl(fileOrPath);
    if (!url) {
      throw new Error("Failed to create asset URL");
    }
    return url;
  } else {
    // Web: create blob URL
    return URL.createObjectURL(fileOrPath);
  }
}

// ============================================
// Music Library Management (Desktop only)
// ============================================

/**
 * Get all watched music folders
 */
export async function getLibraryFolders(): Promise<string[]> {
  if (isElectron() && window.electron?.library) {
    try {
      return await window.electron.library.getFolders();
    } catch (error) {
      console.error("Failed to get library folders:", error);
      return [];
    }
  }
  return [];
}

/**
 * Add a folder to the music library
 */
export async function addLibraryFolder(
  folderPath: string,
): Promise<LibraryFolderResult> {
  if (isElectron() && window.electron?.library) {
    try {
      return await window.electron.library.addFolder(folderPath);
    } catch (error) {
      console.error("Failed to add library folder:", error);
      return { error: String(error) };
    }
  }
  return { error: "Not available on web" };
}

/**
 * Remove a folder from the music library
 */
export async function removeLibraryFolder(
  folderPath: string,
): Promise<LibraryFolderResult> {
  if (isElectron() && window.electron?.library) {
    try {
      return await window.electron.library.removeFolder(folderPath);
    } catch (error) {
      console.error("Failed to remove library folder:", error);
      return { error: String(error) };
    }
  }
  return { error: "Not available on web" };
}

/**
 * Scan a specific folder for music files
 */
export async function scanLibraryFolder(
  folderPath: string,
): Promise<LibraryScanResult> {
  if (isElectron() && window.electron?.library) {
    try {
      return await window.electron.library.scanFolder(folderPath);
    } catch (error) {
      console.error("Failed to scan library folder:", error);
      return { files: [], totalCount: 0, error: String(error) };
    }
  }
  return { files: [], totalCount: 0, error: "Not available on web" };
}

/**
 * Scan all watched folders for music files
 */
export async function scanAllLibraryFolders(): Promise<LibraryScanResult> {
  if (isElectron() && window.electron?.library) {
    try {
      return await window.electron.library.scanAllFolders();
    } catch (error) {
      console.error("Failed to scan all library folders:", error);
      return { files: [], totalCount: 0, error: String(error) };
    }
  }
  return { files: [], totalCount: 0, error: "Not available on web" };
}

// ============================================
// File Watcher (Desktop only)
// ============================================

/**
 * Start watching all library folders for changes
 */
export async function startLibraryWatcher(): Promise<{
  success: boolean;
  watching: number;
  error?: string;
}> {
  if (isElectron() && window.electron?.library) {
    try {
      const result = await window.electron.library.startWatching();
      return {
        success: result.success ?? false,
        watching: result.watching ?? 0,
        error: result.error,
      };
    } catch (error) {
      console.error("Failed to start library watcher:", error);
      return { success: false, watching: 0, error: String(error) };
    }
  }
  return { success: false, watching: 0, error: "Not available on web" };
}

/**
 * Stop watching library folders
 */
export async function stopLibraryWatcher(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (isElectron() && window.electron?.library) {
    try {
      const result = await window.electron.library.stopWatching();
      return { success: result.success ?? false, error: result.error };
    } catch (error) {
      console.error("Failed to stop library watcher:", error);
      return { success: false, error: String(error) };
    }
  }
  return { success: false, error: "Not available on web" };
}

/**
 * Get the current watcher status
 */
export async function getLibraryWatcherStatus(): Promise<WatcherStatus> {
  if (isElectron() && window.electron?.library) {
    try {
      return await window.electron.library.getWatcherStatus();
    } catch (error) {
      console.error("Failed to get watcher status:", error);
      return { watching: false, folders: [] };
    }
  }
  return { watching: false, folders: [] };
}

/**
 * Subscribe to file change events
 * Returns an unsubscribe function
 */
export function onLibraryFileChange(
  callback: (event: FileChangeEvent) => void,
): () => void {
  if (isElectron() && window.electron?.library) {
    return window.electron.library.onFileChange(callback);
  }
  // Return no-op cleanup function for web
  return () => {};
}

// ============================================
// Setup / First Launch (Desktop only)
// ============================================

/**
 * Check if this is the first launch of the app
 */
export async function isFirstLaunch(): Promise<boolean> {
  if (isElectron() && window.electron?.setup) {
    try {
      return await window.electron.setup.isFirstLaunch();
    } catch (error) {
      console.error("Failed to check first launch:", error);
      return false;
    }
  }
  // On web, check localStorage
  return localStorage.getItem("vinyl-setup-completed") !== "true";
}

/**
 * Mark the setup as completed
 */
export async function completeSetup(): Promise<boolean> {
  if (isElectron() && window.electron?.setup) {
    try {
      return await window.electron.setup.completeSetup();
    } catch (error) {
      console.error("Failed to complete setup:", error);
      return false;
    }
  }
  // On web, use localStorage
  localStorage.setItem("vinyl-setup-completed", "true");
  return true;
}

/**
 * Reset setup state (for testing)
 */
export async function resetSetup(): Promise<boolean> {
  if (isElectron() && window.electron?.setup) {
    try {
      return await window.electron.setup.resetSetup();
    } catch (error) {
      console.error("Failed to reset setup:", error);
      return false;
    }
  }
  // On web, use localStorage
  localStorage.removeItem("vinyl-setup-completed");
  return true;
}

// ============================================
// System Tray (Desktop only)
// ============================================

export interface TrayPlaybackState {
  isPlaying: boolean;
  song: {
    title: string;
    artist: string;
    album?: string;
  } | null;
}

/**
 * Update the system tray with current playback state
 */
export async function updateTrayPlaybackState(
  state: TrayPlaybackState,
): Promise<void> {
  if (isElectron() && (window.electron as ElectronAPIWithTray)?.tray) {
    try {
      await (window.electron as ElectronAPIWithTray).tray.updatePlaybackState(state);
    } catch (error) {
      console.error("Failed to update tray playback state:", error);
    }
  }
}

/**
 * Show the system tray
 */
export async function showTray(): Promise<void> {
  if (isElectron() && (window.electron as ElectronAPIWithTray)?.tray) {
    try {
      await (window.electron as ElectronAPIWithTray).tray.show();
    } catch (error) {
      console.error("Failed to show tray:", error);
    }
  }
}

/**
 * Hide the system tray
 */
export async function hideTray(): Promise<void> {
  if (isElectron() && (window.electron as ElectronAPIWithTray)?.tray) {
    try {
      await (window.electron as ElectronAPIWithTray).tray.hide();
    } catch (error) {
      console.error("Failed to hide tray:", error);
    }
  }
}

/**
 * Subscribe to tray play/pause events
 */
export function onTrayPlayPause(callback: () => void): () => void {
  if (isElectron() && (window.electron as ElectronAPIWithTray)?.tray) {
    return (window.electron as ElectronAPIWithTray).tray.onPlayPause(callback);
  }
  return () => {};
}

/**
 * Subscribe to tray next track events
 */
export function onTrayNext(callback: () => void): () => void {
  if (isElectron() && (window.electron as ElectronAPIWithTray)?.tray) {
    return (window.electron as ElectronAPIWithTray).tray.onNext(callback);
  }
  return () => {};
}

/**
 * Subscribe to tray previous track events
 */
export function onTrayPrevious(callback: () => void): () => void {
  if (isElectron() && (window.electron as ElectronAPIWithTray)?.tray) {
    return (window.electron as ElectronAPIWithTray).tray.onPrevious(callback);
  }
  return () => {};
}

// Extended Electron API type with tray
interface ElectronAPIWithTray extends ElectronAPI {
  tray: {
    updatePlaybackState: (state: TrayPlaybackState) => Promise<{ success: boolean }>;
    show: () => Promise<{ success: boolean }>;
    hide: () => Promise<{ success: boolean }>;
    onPlayPause: (callback: () => void) => () => void;
    onNext: (callback: () => void) => () => void;
    onPrevious: (callback: () => void) => () => void;
  };
}
