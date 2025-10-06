var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import fsSync from 'fs';
import { createRequire } from 'module';
import { ConfigRepository } from './ConfigRepository';
import { initializeDatabase, MainProcessNetworkRepository } from './database';
import { SQLiteParserMain } from './SQLiteParserMain';
// Create require function and __dirname for ES modules
var require = createRequire(import.meta.url);
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
// Set up file logging
var logFile = path.join(app.getPath('temp'), 'wifi-map-viewer-debug.log');
function logToFile(message) {
    var timestamp = new Date().toISOString();
    var logMessage = "[".concat(timestamp, "] ").concat(message, "\n");
    try {
        fsSync.appendFileSync(logFile, logMessage);
        console.log(message);
    }
    catch (err) {
        console.error('Failed to write to log file:', err);
    }
}
logToFile("=== WiFi Map Viewer Starting ===");
logToFile("Log file: ".concat(logFile));
var mainWindow = null;
var configRepo = null;
var db = null;
var networkRepo = null;
var sqliteParser = null;
// Dynamic require for better-sqlite3 to avoid bundling issues
var requireBetterSqlite3 = function () {
    try {
        if (app.isPackaged) {
            // In production, better-sqlite3 is unpacked from asar
            // It's in app.asar.unpacked/node_modules/better-sqlite3
            var sqlitePath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'better-sqlite3');
            logToFile("Loading better-sqlite3 from: ".concat(sqlitePath));
            logToFile("Path exists: ".concat(fsSync.existsSync(sqlitePath)));
            return require(sqlitePath);
        }
        else {
            // In development, use normal require
            logToFile('Loading better-sqlite3 from node_modules (dev mode)');
            return require('better-sqlite3');
        }
    }
    catch (error) {
        logToFile("Error loading better-sqlite3: ".concat(error));
        throw error;
    }
};
function createWindow() {
    logToFile('Creating main window...');
    logToFile("__dirname: ".concat(__dirname));
    logToFile("process.resourcesPath: ".concat(process.resourcesPath));
    var preloadPath = path.join(__dirname, 'preload.cjs');
    logToFile("Preload path: ".concat(preloadPath));
    logToFile("Preload exists: ".concat(fsSync.existsSync(preloadPath)));
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
    mainWindow.once('ready-to-show', function () {
        logToFile('Window ready to show');
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.show();
    });
    if (process.env.VITE_DEV_SERVER_URL) {
        logToFile("Loading dev server URL: ".concat(process.env.VITE_DEV_SERVER_URL));
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        mainWindow.webContents.openDevTools();
    }
    else {
        // In production, load from the packaged dist directory
        var indexPath = path.join(__dirname, '../dist/index.html');
        logToFile("Loading index.html from: ".concat(indexPath));
        logToFile("File exists: ".concat(fsSync.existsSync(indexPath)));
        mainWindow.loadFile(indexPath).then(function () {
            logToFile('Successfully loaded index.html');
        }).catch(function (err) {
            logToFile("Failed to load index.html: ".concat(err));
        });
        // Enable DevTools in production for debugging
        mainWindow.webContents.openDevTools();
    }
    mainWindow.on('closed', function () {
        logToFile('Window closed');
        mainWindow = null;
    });
    // Log any errors
    mainWindow.webContents.on('did-fail-load', function (event, errorCode, errorDescription) {
        logToFile("Failed to load: ".concat(errorCode, " - ").concat(errorDescription));
    });
}
app.whenReady().then(function () {
    logToFile('App is ready');
    logToFile("User data path: ".concat(app.getPath('userData')));
    try {
        // Initialize configuration
        var userDataPath = app.getPath('userData');
        configRepo = new ConfigRepository(userDataPath);
        logToFile('Configuration initialized');
        // Initialize database
        var dbPath = configRepo.getDatabasePath(userDataPath);
        logToFile("Database path: ".concat(dbPath));
        var DatabaseConstructor = requireBetterSqlite3();
        db = new DatabaseConstructor(dbPath);
        initializeDatabase(db);
        networkRepo = new MainProcessNetworkRepository(db);
        sqliteParser = new SQLiteParserMain(DatabaseConstructor);
        logToFile('Database initialized');
        createWindow();
        setupIpcHandlers();
        logToFile('IPC handlers set up');
        app.on('activate', function () {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    }
    catch (error) {
        logToFile("Error during initialization: ".concat(error));
        throw error;
    }
}).catch(function (error) {
    logToFile("Failed to start app: ".concat(error));
});
app.on('window-all-closed', function () {
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
    var _this = this;
    // Handle file selection dialog
    ipcMain.handle('dialog:selectImportFile', function () { return __awaiter(_this, void 0, void 0, function () {
        var result, filePath, format;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, dialog.showOpenDialog({
                        properties: ['openFile'],
                        filters: [
                            { name: 'All Supported Files', extensions: ['csv', 'kml', 'sqlite', 'db', 'sqlite3'] },
                            { name: 'CSV Files', extensions: ['csv'] },
                            { name: 'KML Files', extensions: ['kml'] },
                            { name: 'SQLite Database', extensions: ['sqlite', 'db', 'sqlite3'] },
                            { name: 'All Files', extensions: ['*'] }
                        ]
                    })];
                case 1:
                    result = _a.sent();
                    if (result.canceled || result.filePaths.length === 0) {
                        return [2 /*return*/, { canceled: true, filePath: null, format: null }];
                    }
                    filePath = result.filePaths[0];
                    format = detectFileFormat(filePath);
                    return [2 /*return*/, { canceled: false, filePath: filePath, format: format }];
            }
        });
    }); });
    // Handle file reading
    ipcMain.handle('file:read', function (_event, filePath) { return __awaiter(_this, void 0, void 0, function () {
        var content, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fs.readFile(filePath, 'utf-8')];
                case 1:
                    content = _a.sent();
                    return [2 /*return*/, content];
                case 2:
                    error_1 = _a.sent();
                    throw new Error("Failed to read file: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Handle config operations
    ipcMain.handle('config:get', function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!configRepo) {
                throw new Error('Configuration not initialized');
            }
            return [2 /*return*/, configRepo.getConfig()];
        });
    }); });
    ipcMain.handle('config:save', function (_event, newConfig) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!configRepo) {
                throw new Error('Configuration not initialized');
            }
            configRepo.saveConfig(newConfig);
            return [2 /*return*/, configRepo.getConfig()];
        });
    }); });
    ipcMain.handle('config:reset', function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!configRepo) {
                throw new Error('Configuration not initialized');
            }
            configRepo.resetToDefaults();
            return [2 /*return*/, configRepo.getConfig()];
        });
    }); });
    ipcMain.handle('config:getDatabasePath', function () { return __awaiter(_this, void 0, void 0, function () {
        var userDataPath;
        return __generator(this, function (_a) {
            if (!configRepo) {
                throw new Error('Configuration not initialized');
            }
            userDataPath = app.getPath('userData');
            return [2 /*return*/, configRepo.getDatabasePath(userDataPath)];
        });
    }); });
    // Database operations
    ipcMain.handle('db:findNetworks', function (_event, filter, limit, offset) { return __awaiter(_this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!networkRepo) {
                        throw new Error('Database not initialized');
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, networkRepo.findNetworks(filter, limit, offset)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    error_2 = _a.sent();
                    throw new Error("Failed to find networks: ".concat(error_2 instanceof Error ? error_2.message : String(error_2)));
                case 4: return [2 /*return*/];
            }
        });
    }); });
    ipcMain.handle('db:getNetworkByBssid', function (_event, bssid) { return __awaiter(_this, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!networkRepo) {
                        throw new Error('Database not initialized');
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, networkRepo.getNetworkByBssid(bssid)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    error_3 = _a.sent();
                    throw new Error("Failed to get network: ".concat(error_3 instanceof Error ? error_3.message : String(error_3)));
                case 4: return [2 /*return*/];
            }
        });
    }); });
    ipcMain.handle('db:getObservations', function (_event, networkId) { return __awaiter(_this, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!networkRepo) {
                        throw new Error('Database not initialized');
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, networkRepo.getObservations(networkId)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    error_4 = _a.sent();
                    throw new Error("Failed to get observations: ".concat(error_4 instanceof Error ? error_4.message : String(error_4)));
                case 4: return [2 /*return*/];
            }
        });
    }); });
    ipcMain.handle('db:upsertNetwork', function (_event, network, observation) { return __awaiter(_this, void 0, void 0, function () {
        var error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!networkRepo) {
                        throw new Error('Database not initialized');
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, networkRepo.upsertNetwork(network, observation)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    error_5 = _a.sent();
                    throw new Error("Failed to upsert network: ".concat(error_5 instanceof Error ? error_5.message : String(error_5)));
                case 4: return [2 /*return*/];
            }
        });
    }); });
    ipcMain.handle('db:batchInsertNetworks', function (_event, networks) { return __awaiter(_this, void 0, void 0, function () {
        var result, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!networkRepo) {
                        throw new Error('Database not initialized');
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, networkRepo.batchInsertNetworks(networks)];
                case 2:
                    result = _a.sent();
                    return [2 /*return*/, result];
                case 3:
                    error_6 = _a.sent();
                    throw new Error("Failed to batch insert networks: ".concat(error_6 instanceof Error ? error_6.message : String(error_6)));
                case 4: return [2 /*return*/];
            }
        });
    }); });
    ipcMain.handle('db:clearAllNetworks', function () { return __awaiter(_this, void 0, void 0, function () {
        var error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!networkRepo) {
                        throw new Error('Database not initialized');
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, networkRepo.clearAllNetworks()];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
                case 3:
                    error_7 = _a.sent();
                    throw new Error("Failed to clear networks: ".concat(error_7 instanceof Error ? error_7.message : String(error_7)));
                case 4: return [2 /*return*/];
            }
        });
    }); });
    // Import progress notification (sent from main to renderer)
    ipcMain.on('import:sendProgress', function (_event, progress, message) {
        if (mainWindow) {
            mainWindow.webContents.send('import:progress', progress, message);
        }
    });
    // Logging support
    ipcMain.handle('log:write', function (_event, logEntry) { return __awaiter(_this, void 0, void 0, function () {
        var userDataPath, logDir, err_1, date, logFile_1, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    userDataPath = app.getPath('userData');
                    logDir = path.join(userDataPath, 'logs');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fs.mkdir(logDir, { recursive: true })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    return [3 /*break*/, 4];
                case 4:
                    date = new Date().toISOString().split('T')[0];
                    logFile_1 = path.join(logDir, "wifi-map-viewer-".concat(date, ".log"));
                    // Append log entry
                    return [4 /*yield*/, fs.appendFile(logFile_1, logEntry + '\n', 'utf-8')];
                case 5:
                    // Append log entry
                    _a.sent();
                    return [2 /*return*/, { success: true }];
                case 6:
                    error_8 = _a.sent();
                    console.error('Failed to write log:', error_8);
                    return [2 /*return*/, { success: false, error: String(error_8) }];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    // SQLite file parsing
    ipcMain.handle('sqlite:parse', function (_event, filePath) { return __awaiter(_this, void 0, void 0, function () {
        var result;
        var _a;
        return __generator(this, function (_b) {
            if (!sqliteParser) {
                return [2 /*return*/, { success: false, error: 'SQLite parser not initialized' }];
            }
            try {
                logToFile("Parsing SQLite file: ".concat(filePath));
                result = sqliteParser.parseSQLiteFile(filePath);
                logToFile("SQLite parse result: ".concat(result.success ? "".concat((_a = result.networks) === null || _a === void 0 ? void 0 : _a.length, " networks") : result.error));
                return [2 /*return*/, result];
            }
            catch (error) {
                logToFile("SQLite parse error: ".concat(error));
                return [2 /*return*/, {
                        success: false,
                        error: "Failed to parse SQLite file: ".concat(error instanceof Error ? error.message : String(error))
                    }];
            }
            return [2 /*return*/];
        });
    }); });
}
// Detect file format based on extension
function detectFileFormat(filePath) {
    var ext = path.extname(filePath).toLowerCase();
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
