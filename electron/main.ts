import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import fsSync from 'fs';
import { createRequire } from 'module';
import { ConfigRepository } from './ConfigRepository';
import { initializeDatabase, MainProcessNetworkRepository } from './database';
import { SQLiteParserMain } from './SQLiteParserMain';
import type { NetworkFilter, NetworkInput, ObservationInput } from '../src/types/network';
import type Database from 'better-sqlite3';

// Create require function and __dirname for ES modules
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up file logging
const logFile = path.join(app.getPath('temp'), 'wifi-map-viewer-debug.log');
function logToFile(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  try {
    fsSync.appendFileSync(logFile, logMessage);
    console.log(message);
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
}

logToFile(`=== WiFi Map Viewer Starting ===`);
logToFile(`Log file: ${logFile}`);

let mainWindow: BrowserWindow | null = null;
let configRepo: ConfigRepository | null = null;
let db: Database.Database | null = null;
let networkRepo: MainProcessNetworkRepository | null = null;
let sqliteParser: SQLiteParserMain | null = null;

// Dynamic require for better-sqlite3 to avoid bundling issues
const requireBetterSqlite3 = () => {
  try {
    if (app.isPackaged) {
      // In production, better-sqlite3 is unpacked from asar
      // It's in app.asar.unpacked/node_modules/better-sqlite3
      const sqlitePath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'better-sqlite3');
      logToFile(`Loading better-sqlite3 from: ${sqlitePath}`);
      logToFile(`Path exists: ${fsSync.existsSync(sqlitePath)}`);
      return require(sqlitePath);
    } else {
      // In development, use normal require
      logToFile('Loading better-sqlite3 from node_modules (dev mode)');
      return require('better-sqlite3');
    }
  } catch (error) {
    logToFile(`Error loading better-sqlite3: ${error}`);
    throw error;
  }
};

function createWindow() {
  logToFile('Creating main window...');
  logToFile(`__dirname: ${__dirname}`);
  logToFile(`process.resourcesPath: ${process.resourcesPath}`);
  
  const preloadPath = path.join(__dirname, 'preload.cjs');
  logToFile(`Preload path: ${preloadPath}`);
  logToFile(`Preload exists: ${fsSync.existsSync(preloadPath)}`);
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Don't show until ready
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Show window when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    logToFile('Window ready to show');
    mainWindow?.show();
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    logToFile(`Loading dev server URL: ${process.env.VITE_DEV_SERVER_URL}`);
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from the packaged dist directory
    const indexPath = path.join(__dirname, '../dist/index.html');
    logToFile(`Loading index.html from: ${indexPath}`);
    logToFile(`File exists: ${fsSync.existsSync(indexPath)}`);
    
    mainWindow.loadFile(indexPath).then(() => {
      logToFile('Successfully loaded index.html');
    }).catch((err) => {
      logToFile(`Failed to load index.html: ${err}`);
    });
    
    // Enable DevTools in production for debugging
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    logToFile('Window closed');
    mainWindow = null;
  });
  
  // Log any errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    logToFile(`Failed to load: ${errorCode} - ${errorDescription}`);
  });
}

app.whenReady().then(() => {
  logToFile('App is ready');
  logToFile(`User data path: ${app.getPath('userData')}`);
  
  try {
    // Initialize configuration
    const userDataPath = app.getPath('userData');
    configRepo = new ConfigRepository(userDataPath);
    logToFile('Configuration initialized');
    
    // Initialize database
    const dbPath = configRepo.getDatabasePath(userDataPath);
    logToFile(`Database path: ${dbPath}`);
    
    const DatabaseConstructor = requireBetterSqlite3();
    db = new DatabaseConstructor(dbPath);
    initializeDatabase(db!);
    networkRepo = new MainProcessNetworkRepository(db!);
    sqliteParser = new SQLiteParserMain(DatabaseConstructor);
    logToFile('Database initialized');
    
    createWindow();
    setupIpcHandlers();
    logToFile('IPC handlers set up');

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    logToFile(`Error during initialization: ${error}`);
    throw error;
  }
}).catch((error) => {
  logToFile(`Failed to start app: ${error}`);
});

app.on('window-all-closed', () => {
  // Close database connection
  if (db) {
    db.close();
    db = null;
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
function setupIpcHandlers() {
  // Handle file selection dialog
  ipcMain.handle('dialog:selectImportFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'All Supported Files', extensions: ['csv', 'kml', 'sqlite', 'db', 'sqlite3'] },
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'KML Files', extensions: ['kml'] },
        { name: 'SQLite Database', extensions: ['sqlite', 'db', 'sqlite3'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true, filePath: null, format: null };
    }

    const filePath = result.filePaths[0];
    const format = detectFileFormat(filePath);

    return { canceled: false, filePath, format };
  });

  // Handle file reading
  ipcMain.handle('file:read', async (_event, filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Handle config operations
  ipcMain.handle('config:get', async () => {
    if (!configRepo) {
      throw new Error('Configuration not initialized');
    }
    return configRepo.getConfig();
  });

  ipcMain.handle('config:save', async (_event, newConfig) => {
    if (!configRepo) {
      throw new Error('Configuration not initialized');
    }
    configRepo.saveConfig(newConfig);
    return configRepo.getConfig();
  });

  ipcMain.handle('config:reset', async () => {
    if (!configRepo) {
      throw new Error('Configuration not initialized');
    }
    configRepo.resetToDefaults();
    return configRepo.getConfig();
  });

  ipcMain.handle('config:getDatabasePath', async () => {
    if (!configRepo) {
      throw new Error('Configuration not initialized');
    }
    const userDataPath = app.getPath('userData');
    return configRepo.getDatabasePath(userDataPath);
  });

  // Database operations
  ipcMain.handle('db:findNetworks', async (_event, filter: NetworkFilter, limit?: number, offset?: number) => {
    if (!networkRepo) {
      throw new Error('Database not initialized');
    }
    try {
      return await networkRepo.findNetworks(filter, limit, offset);
    } catch (error) {
      throw new Error(`Failed to find networks: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  ipcMain.handle('db:getNetworkByBssid', async (_event, bssid: string) => {
    if (!networkRepo) {
      throw new Error('Database not initialized');
    }
    try {
      return await networkRepo.getNetworkByBssid(bssid);
    } catch (error) {
      throw new Error(`Failed to get network: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  ipcMain.handle('db:getObservations', async (_event, networkId: number) => {
    if (!networkRepo) {
      throw new Error('Database not initialized');
    }
    try {
      return await networkRepo.getObservations(networkId);
    } catch (error) {
      throw new Error(`Failed to get observations: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  ipcMain.handle('db:upsertNetwork', async (_event, network: NetworkInput, observation: ObservationInput) => {
    if (!networkRepo) {
      throw new Error('Database not initialized');
    }
    try {
      return await networkRepo.upsertNetwork(network, observation);
    } catch (error) {
      throw new Error(`Failed to upsert network: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  ipcMain.handle('db:batchInsertNetworks', async (_event, networks: Array<{ network: NetworkInput; observation: ObservationInput }>) => {
    if (!networkRepo) {
      throw new Error('Database not initialized');
    }
    try {
      const result = await networkRepo.batchInsertNetworks(networks);
      return result;
    } catch (error) {
      throw new Error(`Failed to batch insert networks: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  ipcMain.handle('db:clearAllNetworks', async () => {
    if (!networkRepo) {
      throw new Error('Database not initialized');
    }
    try {
      await networkRepo.clearAllNetworks();
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to clear networks: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Import progress notification (sent from main to renderer)
  ipcMain.on('import:sendProgress', (_event, progress: number, message: string) => {
    if (mainWindow) {
      mainWindow.webContents.send('import:progress', progress, message);
    }
  });

  // Logging support
  ipcMain.handle('log:write', async (_event, logEntry: string) => {
    try {
      const userDataPath = app.getPath('userData');
      const logDir = path.join(userDataPath, 'logs');
      
      // Ensure logs directory exists
      try {
        await fs.mkdir(logDir, { recursive: true });
      } catch (err) {
        // Directory might already exist, ignore error
      }
      
      // Create log file with date
      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(logDir, `wifi-map-viewer-${date}.log`);
      
      // Append log entry
      await fs.appendFile(logFile, logEntry + '\n', 'utf-8');
      
      return { success: true };
    } catch (error) {
      console.error('Failed to write log:', error);
      return { success: false, error: String(error) };
    }
  });

  // SQLite file parsing
  ipcMain.handle('sqlite:parse', async (_event, filePath: string) => {
    if (!sqliteParser) {
      return { success: false, error: 'SQLite parser not initialized' };
    }
    
    try {
      logToFile(`Parsing SQLite file: ${filePath}`);
      const result = sqliteParser.parseSQLiteFile(filePath);
      logToFile(`SQLite parse result: ${result.success ? `${result.networks?.length} networks` : result.error}`);
      return result;
    } catch (error) {
      logToFile(`SQLite parse error: ${error}`);
      return { 
        success: false, 
        error: `Failed to parse SQLite file: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  });
}

// Detect file format based on extension
function detectFileFormat(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  
  switch (ext) {
    case '.csv':
      return 'CSV (Auto-detect WiGLE/Kismet)';
    case '.kml':
      return 'KML';
    case '.sqlite':
    case '.db':
    case '.sqlite3':
      return 'SQLite Database';
    default:
      return 'Unknown';
  }
}
