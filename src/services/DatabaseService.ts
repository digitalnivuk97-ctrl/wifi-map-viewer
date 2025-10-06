/**
 * DatabaseService - Renderer process wrapper for database operations via IPC
 * This service provides a clean interface for components to interact with the database
 * through Electron IPC channels
 */

import type { Network, Observation, NetworkFilter, NetworkInput, ObservationInput, ImportResult } from '../types/network';

export class DatabaseService {
    /**
     * Find networks matching the given filter
     */
    async findNetworks(filter: NetworkFilter, limit?: number, offset?: number): Promise<Network[]> {
        if (!window.electronAPI?.db) {
            throw new Error('Database API not available. Please ensure the app is running in Electron.');
        }
        return await window.electronAPI.db.findNetworks(filter, limit, offset);
    }

    /**
     * Get a single network by BSSID
     */
    async getNetworkByBssid(bssid: string): Promise<Network | null> {
        if (!window.electronAPI?.db) {
            throw new Error('Database API not available. Please ensure the app is running in Electron.');
        }
        return await window.electronAPI.db.getNetworkByBssid(bssid);
    }

    /**
     * Get all observations for a network
     */
    async getObservations(networkId: number): Promise<Observation[]> {
        if (!window.electronAPI?.db) {
            throw new Error('Database API not available. Please ensure the app is running in Electron.');
        }
        return await window.electronAPI.db.getObservations(networkId);
    }

    /**
     * Create or update a network with an observation
     */
    async upsertNetwork(network: NetworkInput, observation: ObservationInput): Promise<number> {
        if (!window.electronAPI?.db) {
            throw new Error('Database API not available. Please ensure the app is running in Electron.');
        }
        return await window.electronAPI.db.upsertNetwork(network, observation);
    }

    /**
     * Batch insert networks (used during import)
     */
    async batchInsertNetworks(
        networks: Array<{ network: NetworkInput; observation: ObservationInput }>
    ): Promise<ImportResult> {
        if (!window.electronAPI?.db) {
            throw new Error('Database API not available. Please ensure the app is running in Electron.');
        }
        return await window.electronAPI.db.batchInsertNetworks(networks);
    }

    /**
     * Clear all networks from the database
     */
    async clearAllNetworks(): Promise<void> {
        if (!window.electronAPI?.db) {
            throw new Error('Database API not available. Please ensure the app is running in Electron.');
        }
        await window.electronAPI.db.clearAllNetworks();
    }

    /**
     * Check if database API is available
     */
    isAvailable(): boolean {
        return typeof window !== 'undefined' && !!window.electronAPI?.db;
    }
}

// Export singleton instance
export const databaseService = new DatabaseService();
