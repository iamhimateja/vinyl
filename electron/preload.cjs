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
    if (result.error) {
      throw new Error(result.error);
    }
    return new Uint8Array(result.data);
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
});

// Log when preload is complete
console.log("Electron preload script loaded");
