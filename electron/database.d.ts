/**
 * Database initialization and repository for main process
 * This file duplicates some logic from src/database to avoid cross-boundary imports
 */
import type Database from 'better-sqlite3';
import type { Network, Observation, NetworkFilter, NetworkInput, ObservationInput, ImportResult } from '../src/types/network';
/**
 * Initialize database with schema
 */
export declare function initializeDatabase(db: Database.Database): void;
/**
 * NetworkRepository for main process database operations
 */
export declare class MainProcessNetworkRepository {
    private db;
    constructor(db: Database.Database);
    /**
     * Create or update network with observation
     */
    upsertNetwork(network: NetworkInput, observation: ObservationInput): Promise<number>;
    /**
     * Query networks with filters
     */
    findNetworks(filter: NetworkFilter, limit?: number, offset?: number): Promise<Network[]>;
    /**
     * Get single network by BSSID
     */
    getNetworkByBssid(bssid: string): Promise<Network | null>;
    /**
     * Get observations for a network
     */
    getObservations(networkId: number): Promise<Observation[]>;
    /**
     * Batch insert for imports
     */
    batchInsertNetworks(networks: Array<{
        network: NetworkInput;
        observation: ObservationInput;
    }>): Promise<ImportResult>;
    /**
     * Synchronous version of upsertNetwork for use in transactions
     */
    private upsertNetworkSync;
    /**
     * Recalculate position - synchronous implementation
     */
    private recalculatePositionSync;
    /**
     * Delete all networks
     */
    clearAllNetworks(): Promise<void>;
    /**
     * Map database row to Network object
     */
    private mapRowToNetwork;
}
