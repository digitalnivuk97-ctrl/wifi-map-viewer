import fs from 'fs';
import path from 'path';
import { AppConfig, DEFAULT_CONFIG, DeepPartial } from './config-types';

/**
 * ConfigRepository handles loading and saving application configuration
 */
export class ConfigRepository {
    private configPath: string;
    private config: AppConfig;

    constructor(configDir: string) {
        this.configPath = path.join(configDir, 'config.json');
        this.config = this.loadConfig();
    }

    /**
     * Load configuration from file or use defaults
     */
    private loadConfig(): AppConfig {
        try {
            if (fs.existsSync(this.configPath)) {
                const content = fs.readFileSync(this.configPath, 'utf-8');
                const loadedConfig = JSON.parse(content) as Partial<AppConfig>;
                
                // Merge with defaults to ensure all properties exist
                return {
                    database: {
                        ...DEFAULT_CONFIG.database,
                        ...loadedConfig.database
                    },
                    map: {
                        ...DEFAULT_CONFIG.map,
                        ...loadedConfig.map,
                        // Ensure clusteringEnabled has a default value
                        clusteringEnabled: loadedConfig.map?.clusteringEnabled ?? DEFAULT_CONFIG.map.clusteringEnabled
                    },
                    ui: {
                        ...DEFAULT_CONFIG.ui,
                        ...loadedConfig.ui
                    }
                };
            }
        } catch (error) {
            console.error('Error loading config, using defaults:', error);
        }

        // Return default config if file doesn't exist or error occurred
        return { ...DEFAULT_CONFIG };
    }

    /**
     * Get current configuration
     */
    getConfig(): AppConfig {
        return { ...this.config };
    }

    /**
     * Update configuration and save to file
     */
    saveConfig(newConfig: DeepPartial<AppConfig>): void {
        // Merge new config with existing, being careful with nested objects
        if (newConfig.database) {
            this.config.database = {
                ...this.config.database,
                ...newConfig.database
            };
        }
        
        if (newConfig.map) {
            this.config.map = {
                ...this.config.map,
                ...newConfig.map
            } as AppConfig['map'];
        }

        if (newConfig.ui) {
            this.config.ui = {
                ...this.config.ui,
                ...newConfig.ui
            };
        }

        try {
            // Ensure directory exists
            const dir = path.dirname(this.configPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Write config to file
            fs.writeFileSync(
                this.configPath,
                JSON.stringify(this.config, null, 2),
                'utf-8'
            );
        } catch (error) {
            console.error('Error saving config:', error);
            throw new Error(`Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Reset configuration to defaults
     */
    resetToDefaults(): void {
        this.config = { ...DEFAULT_CONFIG };
        this.saveConfig(this.config);
    }

    /**
     * Get database path (resolved to absolute path)
     */
    getDatabasePath(appDataPath: string): string {
        const dbPath = this.config.database.path;
        
        // If path is relative, resolve it relative to app data directory
        if (!path.isAbsolute(dbPath)) {
            return path.join(appDataPath, dbPath);
        }
        
        return dbPath;
    }
}
