import type { ImportResult, ObservationInput, NetworkInput, Observation, Network, NetworkFilter } from "../src/types/network";
import type { AppConfig } from "./config-types";

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
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  
  // Import progress updates
  onImportProgress: (callback: (progress: number, message: string) => void) => {
    ipcRenderer.on('import:progress', (_event: any, progress: number, message: string) => callback(progress, message));
  },
  removeImportProgressListener: () => {
    ipcRenderer.removeAllListeners('import:progress');
  },
  sendImportProgress: (progress: number, message: string) => {
    ipcRenderer.send('import:sendProgress', progress, message);
  },

  // Configuration operations
  getConfig: (): Promise<AppConfig> => ipcRenderer.invoke('config:get'),
  saveConfig: (config: Partial<AppConfig>): Promise<AppConfig> => ipcRenderer.invoke('config:save', config),
  resetConfig: (): Promise<AppConfig> => ipcRenderer.invoke('config:reset'),
  getDatabasePath: (): Promise<string> => ipcRenderer.invoke('config:getDatabasePath'),

  // Database operations
  db: {
    findNetworks: (filter: NetworkFilter, limit?: number, offset?: number): Promise<Network[]> => 
      ipcRenderer.invoke('db:findNetworks', filter, limit, offset),
    
    getNetworkByBssid: (bssid: string): Promise<Network | null> => 
      ipcRenderer.invoke('db:getNetworkByBssid', bssid),
    
    getObservations: (networkId: number): Promise<Observation[]> => 
      ipcRenderer.invoke('db:getObservations', networkId),
    
    upsertNetwork: (network: NetworkInput, observation: ObservationInput): Promise<number> => 
      ipcRenderer.invoke('db:upsertNetwork', network, observation),
    
    batchInsertNetworks: (networks: Array<{ network: NetworkInput; observation: ObservationInput }>): Promise<ImportResult> => 
      ipcRenderer.invoke('db:batchInsertNetworks', networks),
    
    clearAllNetworks: (): Promise<{ success: boolean }> => 
      ipcRenderer.invoke('db:clearAllNetworks')
  },

  // Logging operations
  writeLog: (logEntry: string): Promise<{ success: boolean; error?: string }> => 
    ipcRenderer.invoke('log:write', logEntry),

  // SQLite parsing (happens in main process)
  parseSQLiteFile: (filePath: string): Promise<{ success: boolean; networks?: any[]; error?: string }> =>
    ipcRenderer.invoke('sqlite:parse', filePath)
});

console.log('Preload script loaded successfully. electronAPI exposed to window.');
