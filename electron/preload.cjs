const { contextBridge, ipcRenderer } = require("electron");

// Expose Electron APIs to the renderer process
contextBridge.exposeInMainWorld("electron", {
  // Platform info
  platform: process.platform,
  isElectron: true,

  // Dialog APIs
  openFolderPicker: () => ipcRenderer.invoke("dialog:openFolder"),

  // File system APIs
  scanMusicFolder: (folderPath) =>
    ipcRenderer.invoke("fs:scanMusicFolder", folderPath),

  readFile: async (filePath) => {
    const result = await ipcRenderer.invoke("fs:readFile", filePath);
    if (result.error && !result.data) {
      throw new Error(result.error);
    }
    // Return the full result with transcoding info
    return {
      data: result.data,
      transcoded: result.transcoded,
      mimeType: result.mimeType,
      error: result.error, // May have warning even with data
    };
  },

  fileExists: (filePath) => ipcRenderer.invoke("fs:fileExists", filePath),

  getFileStats: (filePath) => ipcRenderer.invoke("fs:getStats", filePath),

  // Shell APIs
  showItemInFolder: (filePath) =>
    ipcRenderer.invoke("shell:showItemInFolder", filePath),

  // Store APIs for persisting settings
  store: {
    get: (key) => ipcRenderer.invoke("store:get", key),
    set: (key, value) => ipcRenderer.invoke("store:set", key, value),
    delete: (key) => ipcRenderer.invoke("store:delete", key),
  },

  // Setup / First Launch APIs
  setup: {
    isFirstLaunch: () => ipcRenderer.invoke("setup:isFirstLaunch"),
    completeSetup: () => ipcRenderer.invoke("setup:completeSetup"),
    resetSetup: () => ipcRenderer.invoke("setup:resetSetup"),
  },

  // Music Library APIs
  library: {
    getFolders: () => ipcRenderer.invoke("library:getFolders"),
    addFolder: (folderPath) =>
      ipcRenderer.invoke("library:addFolder", folderPath),
    removeFolder: (folderPath) =>
      ipcRenderer.invoke("library:removeFolder", folderPath),
    scanFolder: (folderPath) =>
      ipcRenderer.invoke("library:scanFolderWithProgress", folderPath),
    scanAllFolders: () => ipcRenderer.invoke("library:scanAllFolders"),
    // Watcher APIs
    startWatching: () => ipcRenderer.invoke("library:startWatching"),
    stopWatching: () => ipcRenderer.invoke("library:stopWatching"),
    getWatcherStatus: () => ipcRenderer.invoke("library:getWatcherStatus"),
    // Event listener for file changes
    onFileChange: (callback) => {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on("library:fileChange", handler);
      // Return cleanup function
      return () => ipcRenderer.removeListener("library:fileChange", handler);
    },
  },

  // System Tray APIs
  tray: {
    // Update playback state in tray
    updatePlaybackState: (state) =>
      ipcRenderer.invoke("tray:updatePlaybackState", state),
    
    // Show/hide tray
    show: () => ipcRenderer.invoke("tray:show"),
    hide: () => ipcRenderer.invoke("tray:hide"),
    
    // Event listeners for tray control actions
    onPlayPause: (callback) => {
      const handler = () => callback();
      ipcRenderer.on("tray:playPause", handler);
      return () => ipcRenderer.removeListener("tray:playPause", handler);
    },
    
    onNext: (callback) => {
      const handler = () => callback();
      ipcRenderer.on("tray:next", handler);
      return () => ipcRenderer.removeListener("tray:next", handler);
    },
    
    onPrevious: (callback) => {
      const handler = () => callback();
      ipcRenderer.on("tray:previous", handler);
      return () => ipcRenderer.removeListener("tray:previous", handler);
    },
  },

  // File Open APIs (for "Open With" from Finder/Explorer)
  fileOpen: {
    // Get any files that were opened before the renderer was ready
    getPendingFiles: () => ipcRenderer.invoke("file:getPendingFiles"),
    
    // Listen for files being opened while the app is running
    onFileOpen: (callback) => {
      const handler = (_event, filePath) => callback(filePath);
      ipcRenderer.on("file:open", handler);
      return () => ipcRenderer.removeListener("file:open", handler);
    },
  },
});

// Log when preload is complete
console.log("Electron preload script loaded");
