var _a = require('electron'), contextBridge = _a.contextBridge, ipcRenderer = _a.ipcRenderer;
console.log('Preload script loading...');
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    // File import operations
    selectImportFile: function () {
        console.log('selectImportFile called');
        return ipcRenderer.invoke('dialog:selectImportFile');
    },
    readFile: function (filePath) { return ipcRenderer.invoke('file:read', filePath); },
    // Import progress updates
    onImportProgress: function (callback) {
        ipcRenderer.on('import:progress', function (_event, progress, message) { return callback(progress, message); });
    },
    removeImportProgressListener: function () {
        ipcRenderer.removeAllListeners('import:progress');
    },
    sendImportProgress: function (progress, message) {
        ipcRenderer.send('import:sendProgress', progress, message);
    },
    // Configuration operations
    getConfig: function () { return ipcRenderer.invoke('config:get'); },
    saveConfig: function (config) { return ipcRenderer.invoke('config:save', config); },
    resetConfig: function () { return ipcRenderer.invoke('config:reset'); },
    getDatabasePath: function () { return ipcRenderer.invoke('config:getDatabasePath'); },
    // Database operations
    db: {
        findNetworks: function (filter, limit, offset) {
            return ipcRenderer.invoke('db:findNetworks', filter, limit, offset);
        },
        getNetworkByBssid: function (bssid) {
            return ipcRenderer.invoke('db:getNetworkByBssid', bssid);
        },
        getObservations: function (networkId) {
            return ipcRenderer.invoke('db:getObservations', networkId);
        },
        upsertNetwork: function (network, observation) {
            return ipcRenderer.invoke('db:upsertNetwork', network, observation);
        },
        batchInsertNetworks: function (networks) {
            return ipcRenderer.invoke('db:batchInsertNetworks', networks);
        },
        clearAllNetworks: function () {
            return ipcRenderer.invoke('db:clearAllNetworks');
        }
    },
    // Logging operations
    writeLog: function (logEntry) {
        return ipcRenderer.invoke('log:write', logEntry);
    },
    // SQLite parsing (happens in main process)
    parseSQLiteFile: function (filePath) {
        return ipcRenderer.invoke('sqlite:parse', filePath);
    }
});
console.log('Preload script loaded successfully. electronAPI exposed to window.');
export {};
