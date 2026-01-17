const path = require("path");
const fs = require("fs");
const os = require("os");

// Early debug logging to file
const debugLogPath = path.join(os.tmpdir(), "vinyl-debug.log");
function debugLog(msg) {
  try {
    fs.appendFileSync(debugLogPath, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (e) { /* ignore */ }
}

debugLog("=== Vinyl Starting ===");
debugLog(`__dirname: ${__dirname}`);
debugLog(`process.versions.electron: ${process.versions.electron}`);

let electron, app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu, nativeImage;

try {
  debugLog("Requiring electron...");
  electron = require("electron");
  debugLog(`electron module loaded: ${typeof electron}`);
  debugLog(`electron.app: ${typeof electron.app}`);
  
  app = electron.app;
  BrowserWindow = electron.BrowserWindow;
  ipcMain = electron.ipcMain;
  dialog = electron.dialog;
  shell = electron.shell;
  Tray = electron.Tray;
  Menu = electron.Menu;
  nativeImage = electron.nativeImage;
  
  debugLog("Electron components extracted");
} catch (e) {
  debugLog(`ERROR: ${e.message}\n${e.stack}`);
  throw e;
}

const { spawn } = require("child_process");

// Check if we're running in a packaged app
const isPackaged = app && typeof app.isPackaged === 'boolean' ? app.isPackaged : false;
debugLog(`isPackaged: ${isPackaged}`);

// Helper to get the correct path for resources in both dev and packaged app
function getResourcePath(relativePath) {
  if (isPackaged) {
    // In packaged app, resources are in the Resources folder (macOS) or resources folder (Linux/Windows)
    return path.join(process.resourcesPath, relativePath);
  }
  // In development, use the project root
  return path.join(__dirname, "..", relativePath);
}

// Helper to get the correct path for dist files
function getDistPath(relativePath) {
  if (isPackaged) {
    // In packaged app, dist files are at the app root
    return path.join(__dirname, "..", "dist", relativePath);
  }
  // In development
  return path.join(__dirname, "..", "dist", relativePath);
}

// Suppress security warnings in development (CSP warning is expected due to Vite HMR needing unsafe-eval)
// These warnings don't appear in production builds
if (!isPackaged) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";
}

// electron-store uses ESM, need to use dynamic import
let store = null;
async function initStore() {
  try {
    const { default: Store } = await import("electron-store");
    store = new Store();
    console.log("[Store] electron-store initialized successfully");
  } catch (error) {
    console.error("[Store] Failed to initialize electron-store:", error);
    // Create a simple fallback store using the file system
    const storePath = path.join(app.getPath("userData"), "config.json");
    console.log("[Store] Using fallback file-based store at:", storePath);
    
    store = {
      _data: {},
      _load() {
        try {
          if (fs.existsSync(storePath)) {
            this._data = JSON.parse(fs.readFileSync(storePath, "utf-8"));
          }
        } catch (e) {
          console.error("[Store] Error loading config:", e);
          this._data = {};
        }
      },
      _save() {
        try {
          fs.writeFileSync(storePath, JSON.stringify(this._data, null, 2));
        } catch (e) {
          console.error("[Store] Error saving config:", e);
        }
      },
      get(key, defaultValue) {
        this._load();
        return this._data[key] !== undefined ? this._data[key] : defaultValue;
      },
      set(key, value) {
        this._load();
        this._data[key] = value;
        this._save();
      },
      delete(key) {
        this._load();
        delete this._data[key];
        this._save();
      }
    };
  }
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
  // Try multiple icon paths in order of preference
  const iconPaths = [
    getResourcePath("icons/16x16.png"),    // Packaged app - extraResources
    getResourcePath("icons/icon.svg"),      // Packaged app - SVG fallback
    path.join(__dirname, "../public/icons/16x16.png"),  // Dev - PNG
    path.join(__dirname, "../public/icons/icon.svg"),   // Dev - SVG fallback
  ];
  
  let trayIcon = nativeImage.createEmpty();
  
  for (const iconPath of iconPaths) {
    if (fs.existsSync(iconPath)) {
      trayIcon = nativeImage.createFromPath(iconPath);
      // Resize for tray (macOS uses 16x16, Windows uses 16x16 or 32x32)
      trayIcon = trayIcon.resize({ width: 16, height: 16 });
      console.log("[Tray] Using icon from:", iconPath);
      break;
    }
  }
  
  if (trayIcon.isEmpty()) {
    console.warn("[Tray] No icon found, using empty icon");
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
  console.log("[Electron] isPackaged:", isPackaged);
  console.log("[Electron] resourcesPath:", process.resourcesPath);

  // In development, load from Vite dev server
  // In production, load the built files
  const isDev = process.env.NODE_ENV === "development" || !isPackaged;

  // Find the best available icon
  const iconPaths = [
    getResourcePath("icons/512x512.png"),   // Packaged app
    getResourcePath("icons/icon.svg"),       // Packaged app SVG
    path.join(__dirname, "../public/icons/512x512.png"),  // Dev
    path.join(__dirname, "../public/icons/icon.svg"),     // Dev SVG
  ];
  
  let windowIcon = undefined;
  for (const iconPath of iconPaths) {
    if (fs.existsSync(iconPath)) {
      windowIcon = iconPath;
      console.log("[Electron] Using window icon:", iconPath);
      break;
    }
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: true, // Ensure window is shown
    icon: windowIcon,
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
    // In packaged app, dist files are bundled with the app
    // electron-builder puts the files at the app root based on the "files" config
    const indexPath = path.join(__dirname, "..", "dist", "index.html");
    console.log("[Electron] Loading from file:", indexPath);
    console.log("[Electron] File exists:", fs.existsSync(indexPath));
    
    // Log the directory structure for debugging
    try {
      const appRoot = path.join(__dirname, "..");
      console.log("[Electron] App root contents:", fs.readdirSync(appRoot));
      const distPath = path.join(appRoot, "dist");
      if (fs.existsSync(distPath)) {
        console.log("[Electron] Dist contents:", fs.readdirSync(distPath));
      }
    } catch (e) {
      console.error("[Electron] Error listing directories:", e.message);
    }
    
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on("closed", () => {
    console.log("[Electron] Window closed");
    mainWindow = null;
    windowReady = false;
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error("[Electron] Failed to load:", errorCode, errorDescription);
    },
  );

  mainWindow.webContents.on("did-finish-load", () => {
    console.log("[Electron] Page loaded successfully");
    windowReady = true;
    
    // Send any pending files after a short delay to ensure renderer is ready
    setTimeout(() => {
      sendPendingFiles();
    }, 100);
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
    try {
      chokidar = await import("chokidar");
      console.log("[Watcher] chokidar initialized successfully");
    } catch (error) {
      console.error("[Watcher] Failed to initialize chokidar:", error);
      return null;
    }
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
  if (!chokidarModule) {
    console.warn("[Watcher] chokidar not available, file watching disabled");
    return { error: "File watching not available", success: false };
  }
  
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
// File Open Handler (Open With from Finder)
// ============================================

// Store files that are opened before the window is ready
let pendingFilesToOpen = [];
let windowReady = false;

// Handle files opened via "Open With" in Finder (macOS)
// This event can fire before the app is ready
app.on("open-file", (event, filePath) => {
  event.preventDefault();
  console.log("[OpenFile] File opened:", filePath);
  
  // Check if it's an audio file
  if (isAudioFile(filePath)) {
    // Always queue the file first
    pendingFilesToOpen.push(filePath);
    console.log("[OpenFile] Queued file:", filePath);
    
    // If window exists and is ready, send immediately
    if (windowReady && mainWindow && !mainWindow.isDestroyed()) {
      console.log("[OpenFile] Sending file to renderer:", filePath);
      sendPendingFiles();
      
      // Focus the window
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    } else if (app.isReady() && (!mainWindow || mainWindow.isDestroyed())) {
      // App is ready but no window - create one
      console.log("[OpenFile] Creating window for file open");
      createWindow();
    }
    // If app is not ready yet, whenReady will handle creating the window
  } else {
    console.log("[OpenFile] Not an audio file, ignoring:", filePath);
  }
});

// Also handle files passed as command line arguments (Windows/Linux)
function handleCommandLineArgs(argv) {
  // Skip the first two args (electron executable and app path)
  const args = argv.slice(isPackaged ? 1 : 2);
  
  for (const arg of args) {
    // Skip flags
    if (arg.startsWith("-") || arg.startsWith("--")) continue;
    
    // Check if it's a file path and an audio file
    if (fs.existsSync(arg) && isAudioFile(arg)) {
      console.log("[OpenFile] File from command line:", arg);
      pendingFilesToOpen.push(arg);
    }
  }
}

// Send pending files to the renderer
function sendPendingFiles() {
  if (pendingFilesToOpen.length > 0 && mainWindow && !mainWindow.isDestroyed()) {
    console.log("[OpenFile] Sending pending files:", pendingFilesToOpen);
    
    // Send each file
    for (const filePath of pendingFilesToOpen) {
      mainWindow.webContents.send("file:open", filePath);
    }
    
    // Clear the queue
    pendingFilesToOpen = [];
  }
}

// IPC handler for renderer to get pending files
ipcMain.handle("file:getPendingFiles", async () => {
  const files = [...pendingFilesToOpen];
  pendingFilesToOpen = [];
  return files;
});

// ============================================
// App lifecycle
// ============================================

// Request single instance lock (Windows/Linux)
// This ensures only one instance of the app runs at a time
// When a second instance is launched, it will pass its args to the first instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Another instance is already running, quit this one
  console.log("[Electron] Another instance is running, quitting...");
  app.quit();
} else {
  // Handle second-instance event (Windows/Linux)
  // This fires when user tries to open a file while app is already running
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    console.log("[Electron] Second instance detected");
    console.log("[Electron] Command line:", commandLine);
    
    // Extract files from command line arguments
    // Skip the first args (executable path, app path, flags)
    for (const arg of commandLine) {
      // Skip flags and non-file arguments
      if (arg.startsWith("-") || arg.startsWith("--")) continue;
      if (arg.includes("electron") || arg.includes("app.asar")) continue;
      
      // Check if it's a file path that exists and is an audio file
      if (fs.existsSync(arg) && isAudioFile(arg)) {
        console.log("[OpenFile] File from second instance:", arg);
        
        if (windowReady && mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("file:open", arg);
        } else {
          pendingFilesToOpen.push(arg);
        }
      }
    }
    
    // Focus the existing window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(async () => {
  console.log("[Electron] App ready, starting initialization...");
  console.log("[Electron] App path:", app.getAppPath());
  console.log("[Electron] User data path:", app.getPath("userData"));
  console.log("[Electron] Is packaged:", isPackaged);
  
  // Handle command line arguments (for files opened via command line)
  handleCommandLineArgs(process.argv);
  
  try {
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
    
    console.log("[Electron] Initialization complete");
  } catch (error) {
    console.error("[Electron] Fatal error during initialization:", error);
    
    // Show error dialog
    dialog.showErrorBox(
      "Failed to start Vinyl Music Player",
      `An error occurred during startup:\n\n${error.message}\n\nPlease check the logs for more details.`
    );
    
    app.quit();
  }
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
