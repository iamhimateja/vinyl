/**
 * Platform abstraction layer
 * Allows the app to work on both web browsers and Tauri desktop
 */

// Check if we're running in Tauri
export const isTauri = (): boolean => {
  const result = typeof window !== "undefined" && "__TAURI__" in window;
  return result;
};

// Platform info available via getPlatformInfo() if needed

// Platform info for debugging
export const getPlatformInfo = (): {
  platform: "web" | "desktop";
  userAgent: string;
} => {
  return {
    platform: isTauri() ? "desktop" : "web",
    userAgent: navigator.userAgent,
  };
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

const STORE_KEY = "vinyl-music-config";
const FOLDER_PATH_KEY = "musicFolderPath";

/**
 * Get the stored music folder path (Tauri only)
 */
export async function getStoredFolderPath(): Promise<string | null> {
  if (!isTauri()) {
    return null;
  }

  try {
    const { load } = await import("@tauri-apps/plugin-store");
    const store = await load(STORE_KEY);
    const path = await store.get<string>(FOLDER_PATH_KEY);
    return path || null;
  } catch (error) {
    console.error("Failed to get stored folder path:", error);
    return null;
  }
}

/**
 * Save the music folder path (Tauri only)
 */
export async function saveStoredFolderPath(path: string): Promise<void> {
  if (!isTauri()) {
    return;
  }

  try {
    const { load } = await import("@tauri-apps/plugin-store");
    const store = await load(STORE_KEY);
    await store.set(FOLDER_PATH_KEY, path);
    await store.save();
  } catch (error) {
    console.error("Failed to save folder path:", error);
  }
}

/**
 * Open a folder picker dialog (Tauri only)
 */
export async function openFolderPicker(): Promise<string | null> {
  if (!isTauri()) {
    return null;
  }

  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select your music folder",
    });

    return selected as string | null;
  } catch (error) {
    console.error("Failed to open folder picker:", error);
    return null;
  }
}

/**
 * Scan a folder for music files (Tauri only)
 */
export async function scanMusicFolder(
  folderPath: string,
): Promise<MusicFileInfo[]> {
  if (!isTauri()) {
    return [];
  }

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const files = await invoke<MusicFileInfo[]>("scan_music_folder", {
      folderPath,
    });
    return files;
  } catch (error) {
    console.error("Failed to scan music folder:", error);
    return [];
  }
}

/**
 * Check if a file exists (Tauri only)
 */
export async function fileExists(filePath: string): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<boolean>("file_exists", { filePath });
  } catch (error) {
    console.error("fileExists failed:", error);
    return false;
  }
}

/**
 * Convert a file path to an asset URL for Tauri
 * Reads the file and creates a blob URL that WebKitGTK can play
 * On web, this returns null as we use blob URLs from File objects
 */
export async function getAssetUrl(filePath: string): Promise<string | null> {
  if (!isTauri()) {
    return null;
  }

  try {
    const { readFile } = await import("@tauri-apps/plugin-fs");
    const data = await readFile(filePath);

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
    const blob = new Blob([data], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("getAssetUrl failed:", filePath, error);
    return null;
  }
}

/**
 * Read a file as an ArrayBuffer (for audio metadata parsing)
 * Works on both platforms
 */
export async function readFileAsArrayBuffer(
  fileOrPath: File | string,
): Promise<ArrayBuffer> {
  if (typeof fileOrPath === "string") {
    // Tauri: read from file path
    if (!isTauri()) {
      throw new Error("Cannot read file by path in web browser");
    }

    const { readFile } = await import("@tauri-apps/plugin-fs");
    const data = await readFile(fileOrPath);
    return data.buffer;
  } else {
    // Web: read from File object
    return fileOrPath.arrayBuffer();
  }
}

/**
 * Create a playable URL for an audio file
 * On desktop: uses Tauri's asset protocol
 * On web: uses blob URL from File object
 */
export async function createAudioUrl(
  fileOrPath: File | string,
): Promise<string> {
  if (typeof fileOrPath === "string") {
    // Tauri: use asset protocol
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
