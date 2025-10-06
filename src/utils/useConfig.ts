import { useState, useEffect } from 'react';
import { AppConfig } from '../../electron/config-types';

/**
 * React hook for accessing and updating application configuration
 */
export function useConfig() {
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load config on mount
    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            setError(null);
            if (!window.electronAPI) {
                throw new Error('Electron API not available');
            }
            const loadedConfig = await window.electronAPI.getConfig();
            setConfig(loadedConfig);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load configuration');
            console.error('Error loading config:', err);
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async (newConfig: Partial<AppConfig>) => {
        try {
            setError(null);
            if (!window.electronAPI) {
                throw new Error('Electron API not available');
            }
            const updatedConfig = await window.electronAPI.saveConfig(newConfig);
            setConfig(updatedConfig);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save configuration');
            console.error('Error saving config:', err);
            throw err;
        }
    };

    const resetConfig = async () => {
        try {
            setError(null);
            if (!window.electronAPI) {
                throw new Error('Electron API not available');
            }
            const defaultConfig = await window.electronAPI.resetConfig();
            setConfig(defaultConfig);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset configuration');
            console.error('Error resetting config:', err);
            throw err;
        }
    };

    const getDatabasePath = async (): Promise<string> => {
        try {
            if (!window.electronAPI) {
                throw new Error('Electron API not available');
            }
            return await window.electronAPI.getDatabasePath();
        } catch (err) {
            console.error('Error getting database path:', err);
            throw err;
        }
    };

    return {
        config,
        loading,
        error,
        saveConfig,
        resetConfig,
        getDatabasePath,
        reload: loadConfig
    };
}
