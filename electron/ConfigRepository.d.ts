import { AppConfig, DeepPartial } from './config-types';
/**
 * ConfigRepository handles loading and saving application configuration
 */
export declare class ConfigRepository {
    private configPath;
    private config;
    constructor(configDir: string);
    /**
     * Load configuration from file or use defaults
     */
    private loadConfig;
    /**
     * Get current configuration
     */
    getConfig(): AppConfig;
    /**
     * Update configuration and save to file
     */
    saveConfig(newConfig: DeepPartial<AppConfig>): void;
    /**
     * Reset configuration to defaults
     */
    resetToDefaults(): void;
    /**
     * Get database path (resolved to absolute path)
     */
    getDatabasePath(appDataPath: string): string;
}
