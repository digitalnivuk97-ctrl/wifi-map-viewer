var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import fs from 'fs';
import path from 'path';
import { DEFAULT_CONFIG } from './config-types';
/**
 * ConfigRepository handles loading and saving application configuration
 */
var ConfigRepository = /** @class */ (function () {
    function ConfigRepository(configDir) {
        this.configPath = path.join(configDir, 'config.json');
        this.config = this.loadConfig();
    }
    /**
     * Load configuration from file or use defaults
     */
    ConfigRepository.prototype.loadConfig = function () {
        var _a, _b;
        try {
            if (fs.existsSync(this.configPath)) {
                var content = fs.readFileSync(this.configPath, 'utf-8');
                var loadedConfig = JSON.parse(content);
                // Merge with defaults to ensure all properties exist
                return {
                    database: __assign(__assign({}, DEFAULT_CONFIG.database), loadedConfig.database),
                    map: __assign(__assign(__assign({}, DEFAULT_CONFIG.map), loadedConfig.map), { 
                        // Ensure clusteringEnabled has a default value
                        clusteringEnabled: (_b = (_a = loadedConfig.map) === null || _a === void 0 ? void 0 : _a.clusteringEnabled) !== null && _b !== void 0 ? _b : DEFAULT_CONFIG.map.clusteringEnabled })
                };
            }
        }
        catch (error) {
            console.error('Error loading config, using defaults:', error);
        }
        // Return default config if file doesn't exist or error occurred
        return __assign({}, DEFAULT_CONFIG);
    };
    /**
     * Get current configuration
     */
    ConfigRepository.prototype.getConfig = function () {
        return __assign({}, this.config);
    };
    /**
     * Update configuration and save to file
     */
    ConfigRepository.prototype.saveConfig = function (newConfig) {
        // Merge new config with existing, being careful with nested objects
        if (newConfig.database) {
            this.config.database = __assign(__assign({}, this.config.database), newConfig.database);
        }
        if (newConfig.map) {
            this.config.map = __assign(__assign({}, this.config.map), newConfig.map);
        }
        try {
            // Ensure directory exists
            var dir = path.dirname(this.configPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            // Write config to file
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
        }
        catch (error) {
            console.error('Error saving config:', error);
            throw new Error("Failed to save configuration: ".concat(error instanceof Error ? error.message : String(error)));
        }
    };
    /**
     * Reset configuration to defaults
     */
    ConfigRepository.prototype.resetToDefaults = function () {
        this.config = __assign({}, DEFAULT_CONFIG);
        this.saveConfig(this.config);
    };
    /**
     * Get database path (resolved to absolute path)
     */
    ConfigRepository.prototype.getDatabasePath = function (appDataPath) {
        var dbPath = this.config.database.path;
        // If path is relative, resolve it relative to app data directory
        if (!path.isAbsolute(dbPath)) {
            return path.join(appDataPath, dbPath);
        }
        return dbPath;
    };
    return ConfigRepository;
}());
export { ConfigRepository };
