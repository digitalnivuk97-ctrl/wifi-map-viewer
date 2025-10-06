import type { AppConfig, DeepPartial } from '../../electron/config-types';
import type { Network, Observation, NetworkFilter, NetworkInput, ObservationInput, ImportResult } from './network';

export interface ElectronAPI {
  platform: string;
  
  // File import operations
  selectImportFile: () => Promise<{ canceled: boolean; filePath: string | null; format: string | null }>;
  readFile: (filePath: string) => Promise<string>;
  
  // Import progress updates
  onImportProgress: (callback: (progress: number, message: string) => void) => void;
  removeImportProgressListener: () => void;
  sendImportProgress: (progress: number, message: string) => void;

  // Configuration operations
  getConfig: () => Promise<AppConfig>;
  saveConfig: (config: DeepPartial<AppConfig>) => Promise<AppConfig>;
  resetConfig: () => Promise<AppConfig>;
  getDatabasePath: () => Promise<string>;

  // Database operations
  db: {
    findNetworks: (filter: NetworkFilter, limit?: number, offset?: number) => Promise<Network[]>;
    getNetworkByBssid: (bssid: string) => Promise<Network | null>;
    getObservations: (networkId: number) => Promise<Observation[]>;
    upsertNetwork: (network: NetworkInput, observation: ObservationInput) => Promise<number>;
    batchInsertNetworks: (networks: Array<{ network: NetworkInput; observation: ObservationInput }>) => Promise<ImportResult>;
    clearAllNetworks: () => Promise<{ success: boolean }>;
  };

  // Logging operations
  writeLog: (logEntry: string) => Promise<{ success: boolean; error?: string }>;

  // SQLite parsing (happens in main process)
  parseSQLiteFile: (filePath: string) => Promise<{ success: boolean; networks?: any[]; error?: string }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
