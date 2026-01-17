const { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu, nativeImage } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const os = require("os");

// Suppress security warnings in development (CSP warning is expected due to Vite HMR needing unsafe-eval)
// These warnings don't appear in production builds
if (!app.isPackaged) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";
}

// electron-store uses ESM, need to use dynamic import
let store = null;
async function initStore() {
  const { default: Store } = await import("electron-store");
  store = new Store();
}

let mainWindow;
let tray = null;
let currentPlaybackState = {
  isPlaying: false,
  song: null,
};

// ============================================
// Audio Transcoding (FFmpeg)
// ============================================

// Cache directory for transcoded audio files
const TRANSCODE_CACHE_DIR = path.join(app.getPath("userData"), "transcode-cache");

// Formats that need transcoding on Linux (Chromium doesn't support these natively)
const FORMATS_NEEDING_TRANSCODE = [".m4a", ".aac", ".wma", ".ape"];

// Check if a format needs transcoding
function needsTranscoding(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  // On Linux, these formats need transcoding
  if (process.platform === "linux") {
    return FORMATS_NEEDING_TRANSCODE.includes(ext);
  }
  // On Windows/macOS, only WMA and APE need transcoding
  return [".wma", ".ape"].includes(ext);
}

// Get cache path for a file
function getTranscodeCachePath(filePath) {
  // Create a hash of the file path for the cache filename
  const crypto = require("crypto");
  const hash = crypto.createHash("md5").update(filePath).digest("hex");
  const ext = ".wav"; // Transcode to WAV for best compatibility
  return path.join(TRANSCODE_CACHE_DIR, `${hash}${ext}`);
}

// Ensure cache directory exists
function ensureTranscodeCacheDir() {
  if (!fs.existsSync(TRANSCODE_CACHE_DIR)) {
    fs.mkdirSync(TRANSCODE_CACHE_DIR, { recursive: true });
    console.log("[Transcode] Created cache directory:", TRANSCODE_CACHE_DIR);
  }
}

// Check if FFmpeg is available
let ffmpegAvailable = null;
async function checkFFmpeg() {
  if (ffmpegAvailable !== null) return ffmpegAvailable;
  
  return new Promise((resolve) => {
    const ffmpeg = spawn("ffmpeg", ["-version"]);
    ffmpeg.on("error", () => {
      console.log("[Transcode] FFmpeg not found on system");
      ffmpegAvailable = false;
      resolve(false);
    });
    ffmpeg.on("close", (code) => {
      ffmpegAvailable = code === 0;
      if (ffmpegAvailable) {
        console.log("[Transcode] FFmpeg available");
      }
      resolve(ffmpegAvailable);
    });
  });
}

// Transcode audio file to WAV using FFmpeg
function transcodeAudio(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    console.log("[Transcode] Starting:", inputPath);
    
    const ffmpeg = spawn("ffmpeg", [
      "-i", inputPath,           // Input file
      "-y",                      // Overwrite output
      "-vn",                     // No video
      "-acodec", "pcm_s16le",    // PCM 16-bit (WAV)
      "-ar", "44100",            // Sample rate
      "-ac", "2",                // Stereo
      outputPath
    ]);
    
    let stderr = "";
    ffmpeg.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    
    ffmpeg.on("error", (err) => {
      console.error("[Transcode] FFmpeg spawn error:", err.message);
      reject(new Error(`FFmpeg not available: ${err.message}`));
    });
    
    ffmpeg.on("close", (code) => {
      if (code === 0) {
        console.log("[Transcode] Complete:", outputPath);
        resolve(outputPath);
      } else {
        console.error("[Transcode] Failed with code:", code);
        console.error("[Transcode] stderr:", stderr.slice(-500));
        reject(new Error(`FFmpeg failed with code ${code}`));
      }
    });
  });
}

// Get audio file data, transcoding if necessary
async function getAudioFileData(filePath) {
  // Check if transcoding is needed
  if (needsTranscoding(filePath)) {
    const hasFFmpeg = await checkFFmpeg();
    
    if (!hasFFmpeg) {
      // FFmpeg not available, try to read raw file anyway
      console.warn("[Transcode] FFmpeg not available, trying raw file");
      return { data: fs.readFileSync(filePath).buffer, transcoded: false };
    }
    
    ensureTranscodeCacheDir();
    const cachePath = getTranscodeCachePath(filePath);
    
    // Check if we have a cached transcode
    if (fs.existsSync(cachePath)) {
      // Verify cache is newer than source
      const srcStat = fs.statSync(filePath);
      const cacheStat = fs.statSync(cachePath);
      
      if (cacheStat.mtime >= srcStat.mtime) {
        console.log("[Transcode] Using cached:", cachePath);
        return { 
          data: fs.readFileSync(cachePath).buffer, 
          transcoded: true,
          mimeType: "audio/wav"
        };
      }
    }
    
    // Transcode the file
    try {
      await transcodeAudio(filePath, cachePath);
      return { 
        data: fs.readFileSync(cachePath).buffer, 
        transcoded: true,
        mimeType: "audio/wav"
      };
    } catch (err) {
      console.error("[Transcode] Error:", err.message);
      // Fall back to raw file
      return { data: fs.readFileSync(filePath).buffer, transcoded: false, error: err.message };
    }
  }
  
  // No transcoding needed
  return { data: fs.readFileSync(filePath).buffer, transcoded: false };
}

// Supported audio extensions
const AUDIO_EXTENSIONS = [
  ".mp3",
  ".wav",
  ".ogg",
  ".flac",
  ".aac",
  ".m4a",
  ".wma",
  ".aiff",
  ".ape",
  ".opus",
  ".webm",
];

function isAudioFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return AUDIO_EXTENSIONS.includes(ext);
}

// Recursively scan directory for audio files
function scanMusicFolder(folderPath, rootPath = folderPath) {
  const results = [];

  try {
    const items = fs.readdirSync(folderPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(folderPath, item.name);

      if (item.isDirectory()) {
        // Recursively scan subdirectories
        results.push(...scanMusicFolder(fullPath, rootPath));
      } else if (item.isFile() && isAudioFile(fullPath)) {
        // Get relative folder path for playlist organization
        const relativePath = path.relative(rootPath, folderPath);

        results.push({
          path: fullPath,
          name: item.name,
          extension: path.extname(item.name).slice(1).toLowerCase(),
          folder: relativePath || null,
        });
      }
    }
  } catch (error) {
    console.error("Error scanning folder:", folderPath, error);
  }

  return results;
}

// ============================================
// System Tray
// ============================================

function createTrayIcon() {
  // Create a simple music note icon using nativeImage
  // For production, you'd want to use proper icon files
  const iconPath = path.join(__dirname, "../public/icons/icon.svg");
  
  let trayIcon;
  
  // Try to load the SVG icon, fall back to creating one if it fails
  if (fs.existsSync(iconPath)) {
    // Create a small icon for the tray (16x16 on most platforms)
    trayIcon = nativeImage.createFromPath(iconPath);
    // Resize for tray (macOS uses 16x16, Windows uses 16x16 or 32x32)
    trayIcon = trayIcon.resize({ width: 16, height: 16 });
  } else {
    // Create a simple placeholder icon
    trayIcon = nativeImage.createEmpty();
  }
  
  return trayIcon;
}

function createTray() {
  if (tray) {
    return; // Tray already exists
  }

  const icon = createTrayIcon();
  tray = new Tray(icon);
  
  tray.setToolTip('Vinyl Music Player');
  
  // Click handler - show/focus the main window
  tray.on('click', () => {
    showMainWindow();
  });
  
  // Double-click handler (Windows)
  tray.on('double-click', () => {
    showMainWindow();
  });
  
  updateTrayMenu();
  console.log("[Tray] System tray created");
}

function updateTrayMenu() {
  if (!tray) return;
  
  const { isPlaying, song } = currentPlaybackState;
  
  const menuTemplate = [];
  
  // Show current song info if available
  if (song) {
    menuTemplate.push({
      label: song.title || 'Unknown Title',
      enabled: false,
    });
    menuTemplate.push({
      label: song.artist || 'Unknown Artist',
      enabled: false,
    });
    menuTemplate.push({ type: 'separator' });
  }
  
  // Playback controls
  menuTemplate.push({
    label: isPlaying ? '⏸ Pause' : '▶ Play',
    click: () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('tray:playPause');
      }
    },
  });
  
  menuTemplate.push({
    label: '⏮ Previous',
    click: () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('tray:previous');
      }
    },
  });
  
  menuTemplate.push({
    label: '⏭ Next',
    click: () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('tray:next');
      }
    },
  });
  
  menuTemplate.push({ type: 'separator' });
  
  menuTemplate.push({
    label: 'Show Vinyl',
    click: () => {
      showMainWindow();
    },
  });
  
  menuTemplate.push({ type: 'separator' });
  
  menuTemplate.push({
    label: 'Quit',
    click: () => {
      app.quit();
    },
  });
  
  const contextMenu = Menu.buildFromTemplate(menuTemplate);
  tray.setContextMenu(contextMenu);
  
  // Update tooltip with current song
  if (song) {
    const status = isPlaying ? '▶' : '⏸';
    tray.setToolTip(`${status} ${song.title} - ${song.artist}`);
  } else {
    tray.setToolTip('Vinyl Music Player');
  }
}

function showMainWindow() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  } else {
    createWindow();
  }
}

function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
    console.log("[Tray] System tray destroyed");
  }
}

// ============================================
// Main Window
// ============================================

function createWindow() {
  console.log("[Electron] Creating window...");
  console.log("[Electron] NODE_ENV:", process.env.NODE_ENV);
  console.log("[Electron] __dirname:", __dirname);

  // In development, load from Vite dev server
  // In production, load the built files
  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: true, // Ensure window is shown
    icon: path.join(__dirname, "../public/icons/icon.svg"),
    autoHideMenuBar: true, // Hide the menu bar
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    frame: true, // Always show frame for now
  });

  // Set Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      const csp = isDev
        ? // Development CSP - more permissive for HMR
          "default-src 'self' http://localhost:* ws://localhost:*; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*; " +
          "style-src 'self' 'unsafe-inline' http://localhost:*; " +
          "img-src 'self' data: blob: http://localhost:*; " +
          "media-src 'self' blob: file:; " +
          "connect-src 'self' http://localhost:* ws://localhost:*; " +
          "font-src 'self' data:"
        : // Production CSP - stricter
          "default-src 'self'; " +
          "script-src 'self'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: blob:; " +
          "media-src 'self' blob: file:; " +
          "connect-src 'self'; " +
          "font-src 'self' data:";

      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [csp],
        },
      });
    },
  );

  console.log("[Electron] isDev:", isDev);

  if (isDev) {
    console.log("[Electron] Loading from dev server...");
    mainWindow.loadURL("http://localhost:5173");
  } else {
    const indexPath = path.join(__dirname, "../dist/index.html");
    console.log("[Electron] Loading from file:", indexPath);
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on("closed", () => {
    console.log("[Electron] Window closed");
    mainWindow = null;
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error("[Electron] Failed to load:", errorCode, errorDescription);
    },
  );

  mainWindow.webContents.on("did-finish-load", () => {
    console.log("[Electron] Page loaded successfully");
  });
}

// ============================================
// IPC Handlers
// ============================================

// Open folder picker dialog
ipcMain.handle("dialog:openFolder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select your music folder",
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

// Scan a folder for music files
ipcMain.handle("fs:scanMusicFolder", async (event, folderPath) => {
  if (!fs.existsSync(folderPath)) {
    return { error: "Folder does not exist" };
  }

  const files = scanMusicFolder(folderPath);
  return { files };
});

// Read a file and return as buffer (for audio data)
// Automatically transcodes unsupported formats using FFmpeg
ipcMain.handle("fs:readFile", async (event, filePath) => {
  try {
    const result = await getAudioFileData(filePath);
    return { 
      data: result.data,
      transcoded: result.transcoded,
      mimeType: result.mimeType,
      error: result.error
    };
  } catch (error) {
    return { error: error.message };
  }
});

// Check if a file exists
ipcMain.handle("fs:fileExists", async (event, filePath) => {
  return fs.existsSync(filePath);
});

// Get file stats
ipcMain.handle("fs:getStats", async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      mtime: stats.mtime.toISOString(),
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
    };
  } catch (error) {
    return null;
  }
});

// Store operations
ipcMain.handle("store:get", async (event, key) => {
  if (!store) return undefined;
  return store.get(key);
});

ipcMain.handle("store:set", async (event, key, value) => {
  if (!store) return false;
  store.set(key, value);
  return true;
});

ipcMain.handle("store:delete", async (event, key) => {
  if (!store) return false;
  store.delete(key);
  return true;
});

// ============================================
// First Launch / Setup State
// ============================================

// Check if this is the first launch
ipcMain.handle("setup:isFirstLaunch", async () => {
  if (!store) return true;
  return !store.get("setupCompleted", false);
});

// Mark setup as completed
ipcMain.handle("setup:completeSetup", async () => {
  if (!store) return false;
  store.set("setupCompleted", true);
  return true;
});

// Reset setup state (for testing)
ipcMain.handle("setup:resetSetup", async () => {
  if (!store) return false;
  store.delete("setupCompleted");
  return true;
});

// ============================================
// Music Library Management
// ============================================

// Get all watched music folders
ipcMain.handle("library:getFolders", async () => {
  if (!store) return [];
  return store.get("musicFolders", []);
});

// Add a folder to watched list
ipcMain.handle("library:addFolder", async (event, folderPath) => {
  if (!store) return { error: "Store not initialized" };

  // Verify folder exists
  if (!fs.existsSync(folderPath)) {
    return { error: "Folder does not exist" };
  }

  const folders = store.get("musicFolders", []);

  // Check if already added
  if (folders.includes(folderPath)) {
    return { error: "Folder already in library" };
  }

  folders.push(folderPath);
  store.set("musicFolders", folders);

  return { success: true, folders };
});

// Remove a folder from watched list
ipcMain.handle("library:removeFolder", async (event, folderPath) => {
  if (!store) return { error: "Store not initialized" };

  const folders = store.get("musicFolders", []);
  const index = folders.indexOf(folderPath);

  if (index === -1) {
    return { error: "Folder not in library" };
  }

  folders.splice(index, 1);
  store.set("musicFolders", folders);

  return { success: true, folders };
});

// Scan a folder and count files (for progress reporting)
ipcMain.handle("library:scanFolderWithProgress", async (event, folderPath) => {
  if (!fs.existsSync(folderPath)) {
    return { error: "Folder does not exist", files: [] };
  }

  const files = scanMusicFolder(folderPath);
  return {
    files,
    totalCount: files.length,
    folderPath,
  };
});

// Scan all watched folders
ipcMain.handle("library:scanAllFolders", async () => {
  if (!store) return { error: "Store not initialized", files: [] };

  const folders = store.get("musicFolders", []);
  const allFiles = [];
  const folderStats = [];

  for (const folderPath of folders) {
    if (fs.existsSync(folderPath)) {
      const files = scanMusicFolder(folderPath);
      allFiles.push(...files);
      folderStats.push({
        path: folderPath,
        count: files.length,
        exists: true,
      });
    } else {
      folderStats.push({
        path: folderPath,
        count: 0,
        exists: false,
      });
    }
  }

  return {
    files: allFiles,
    totalCount: allFiles.length,
    folderStats,
  };
});

// Show item in folder (file manager)
ipcMain.handle("shell:showItemInFolder", async (event, filePath) => {
  if (fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath);
    return true;
  }
  return false;
});

// ============================================
// System Tray IPC Handlers
// ============================================

// Update playback state (called from renderer)
ipcMain.handle("tray:updatePlaybackState", async (event, state) => {
  currentPlaybackState = {
    isPlaying: state.isPlaying || false,
    song: state.song || null,
  };
  
  // Create tray if it doesn't exist and we're playing
  if (currentPlaybackState.isPlaying && !tray) {
    createTray();
  }
  
  // Update tray menu and tooltip
  if (tray) {
    updateTrayMenu();
  }
  
  return { success: true };
});

// Show/hide tray
ipcMain.handle("tray:show", async () => {
  createTray();
  return { success: true };
});

ipcMain.handle("tray:hide", async () => {
  destroyTray();
  return { success: true };
});

// ============================================
// File Watcher (Auto-detect new songs)
// ============================================

let watcher = null;
let chokidar = null;

// Debounce map to prevent duplicate events
const pendingEvents = new Map();
const DEBOUNCE_DELAY = 500; // ms

// Initialize chokidar (lazy load since it's ESM)
async function initChokidar() {
  if (!chokidar) {
    chokidar = await import("chokidar");
  }
  return chokidar;
}

// Send event to renderer with debouncing
function sendWatcherEvent(eventType, filePath) {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  // Create a unique key for this file+event combination
  const key = `${eventType}:${filePath}`;

  // Clear any pending event for this key
  if (pendingEvents.has(key)) {
    clearTimeout(pendingEvents.get(key));
  }

  // Set a new debounced event
  const timeoutId = setTimeout(() => {
    pendingEvents.delete(key);

    if (!mainWindow || mainWindow.isDestroyed()) return;

    const fileName = path.basename(filePath);
    const folderPath = path.dirname(filePath);
    const ext = path.extname(filePath).slice(1).toLowerCase();

    // Find the root folder this file belongs to
    const folders = store ? store.get("musicFolders", []) : [];
    let rootFolder = null;
    let relativePath = null;

    for (const folder of folders) {
      if (filePath.startsWith(folder)) {
        rootFolder = folder;
        relativePath = path.relative(folder, folderPath);
        break;
      }
    }

    mainWindow.webContents.send("library:fileChange", {
      type: eventType,
      file: {
        path: filePath,
        name: fileName,
        extension: ext,
        folder: relativePath || null,
      },
      rootFolder,
    });

    console.log(`[Watcher] ${eventType}: ${filePath}`);
  }, DEBOUNCE_DELAY);

  pendingEvents.set(key, timeoutId);
}

// Start watching all music folders
ipcMain.handle("library:startWatching", async () => {
  if (!store) return { error: "Store not initialized" };

  const chokidarModule = await initChokidar();
  const folders = store.get("musicFolders", []);

  if (folders.length === 0) {
    return { success: true, watching: 0 };
  }

  // Stop existing watcher if any
  if (watcher) {
    await watcher.close();
    watcher = null;
  }

  // Create glob patterns for audio files
  const patterns = folders.map((folder) =>
    path.join(folder, "**", `*{${AUDIO_EXTENSIONS.join(",")}}`),
  );

  console.log("[Watcher] Starting to watch folders:", folders);

  watcher = chokidarModule.watch(patterns, {
    ignored: /(^|[\/\\])\../, // Ignore dotfiles
    persistent: true,
    ignoreInitial: true, // Don't fire events for existing files
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100,
    },
    depth: 10, // Max depth to recurse
  });

  watcher
    .on("add", (filePath) => {
      if (isAudioFile(filePath)) {
        sendWatcherEvent("add", filePath);
      }
    })
    .on("unlink", (filePath) => {
      if (isAudioFile(filePath)) {
        sendWatcherEvent("remove", filePath);
      }
    })
    .on("error", (error) => {
      console.error("[Watcher] Error:", error);
    })
    .on("ready", () => {
      console.log("[Watcher] Ready and watching for changes");
    });

  return { success: true, watching: folders.length };
});

// Stop watching
ipcMain.handle("library:stopWatching", async () => {
  if (watcher) {
    await watcher.close();
    watcher = null;
    console.log("[Watcher] Stopped watching");
  }

  // Clear any pending events
  for (const timeoutId of pendingEvents.values()) {
    clearTimeout(timeoutId);
  }
  pendingEvents.clear();

  return { success: true };
});

// Get watcher status
ipcMain.handle("library:getWatcherStatus", async () => {
  if (!store) return { watching: false, folders: [] };

  const folders = store.get("musicFolders", []);
  return {
    watching: watcher !== null,
    folders: folders,
  };
});

// ============================================
// App lifecycle
// ============================================

app.whenReady().then(async () => {
  // Initialize store first
  await initStore();

  createWindow();
  
  // Create tray on startup (will be updated when playback starts)
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Clean up tray on quit
app.on("before-quit", () => {
  destroyTray();
});

// Handle any uncaught errors
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});
