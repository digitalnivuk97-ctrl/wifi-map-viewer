const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loading...');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  
  // File import operations
  selectImportFile: () => {
    console.log('selectImportFile called');
    return ipcRenderer.invoke('dialog:selectImportFile');
  },
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  
  // Import progress updates
  onImportProgress: (callback) => {
    ipcRenderer.on('import:progress', (_event, progress, message) => callback(progress, message));
  },
  removeImportProgressListener: () => {
    ipcRenderer.removeAllListeners('import:progress');
  },
  sendImportProgress: (progress, message) => {
    ipcRenderer.send('import:sendProgress', progress, message);
  },

  // Configuration operations
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  resetConfig: () => ipcRenderer.invoke('config:reset'),
  getDatabasePath: () => ipcRenderer.invoke('config:getDatabasePath'),

  // Database operations
  db: {
    findNetworks: (filter, limit, offset) => 
      ipcRenderer.invoke('db:findNetworks', filter, limit, offset),
    
    getNetworkByBssid: (bssid) => 
      ipcRenderer.invoke('db:getNetworkByBssid', bssid),
    
    getObservations: (networkId) => 
      ipcRenderer.invoke('db:getObservations', networkId),
    
    upsertNetwork: (network, observation) => 
      ipcRenderer.invoke('db:upsertNetwork', network, observation),
    
    batchInsertNetworks: (networks) => 
      ipcRenderer.invoke('db:batchInsertNetworks', networks),
    
    clearAllNetworks: () => 
      ipcRenderer.invoke('db:clearAllNetworks')
  },

  // Logging operations
  writeLog: (logEntry) => 
    ipcRenderer.invoke('log:write', logEntry),

  // SQLite parsing (happens in main process)
  parseSQLiteFile: (filePath) =>
    ipcRenderer.invoke('sqlite:parse', filePath)
});

console.log('Preload script loaded successfully. electronAPI exposed to window.');
