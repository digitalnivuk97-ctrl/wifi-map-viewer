/**
 * NetworkRepository handles all database operations for networks
 */

import type {
    Network,
    Observation,
    NetworkInput,
    ObservationInput,
    NetworkFilter,
    ImportResult
} from '../types/network';
import { calculateWeightedCentroid } from '../utils/trilateration';
import { ouiLookup } from '../utils/OUILookup';
import { DatabaseError } from '../utils/errors';
import { validateCoordinates, validateBSSID, normalizeBSSID, sanitizeString } from '../utils/validation';
import { logger } from '../utils/logger';

export interface INetworkRepository {
    upsertNetwork(network: NetworkInput, observation: ObservationInput): Promise<number>;
    findNetworks(filter: NetworkFilter, limit?: number, offset?: number): Promise<Network[]>;
    getNetworkByBssid(bssid: string): Promise<Network | null>;
    getObservations(networkId: number): Promise<Observation[]>;
    batchInsertNetworks(networks: Array<{ network: NetworkInput; observation: ObservationInput }>): Promise<ImportResult>;
    recalculatePosition(networkId: number): Promise<void>;
    clearAllNetworks(): Promise<void>;
}

export class NetworkRepository implements INetworkRepository {
    // Prepared statements cache for repeated queries
    private preparedStatements: Map<string, any> = new Map();
    // Viewport cache for map queries
    private viewportCache: Map<string, { data: Network[]; timestamp: number }> = new Map();
    private readonly CACHE_TTL = 5000; // 5 seconds cache TTL

    constructor(private db: any) {
        this.initializePreparedStatements();
    }

    /**
     * Initialize prepared statements for frequently used queries
     */
    private initializePreparedStatements(): void {
        // Network lookup by BSSID
        this.preparedStatements.set(
            'getNetworkByBssid',
            this.db.prepare('SELECT * FROM networks WHERE bssid = ?')
        );

        // Network update
        this.preparedStatements.set(
            'updateNetwork',
            this.db.prepare(`
                UPDATE networks 
                SET ssid = ?,
                    encryption = ?,
                    channel = ?,
                    manufacturer = ?,
                    last_seen = ?,
                    observation_count = observation_count + 1,
                    type = ?
                WHERE id = ?
            `)
        );

        // Network insert
        this.preparedStatements.set(
            'insertNetwork',
            this.db.prepare(`
                INSERT INTO networks (
                    bssid, ssid, encryption, channel, manufacturer,
                    first_seen, last_seen, observation_count,
                    best_lat, best_lon, best_signal, type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
            `)
        );

        // Observation insert
        this.preparedStatements.set(
            'insertObservation',
            this.db.prepare(`
                INSERT INTO observations (network_id, latitude, longitude, signal_strength, timestamp)
                VALUES (?, ?, ?, ?, ?)
            `)
        );

        // Get observations for network
        this.preparedStatements.set(
            'getObservations',
            this.db.prepare('SELECT * FROM observations WHERE network_id = ?')
        );

        // Update network position
        this.preparedStatements.set(
            'updatePosition',
            this.db.prepare(`
                UPDATE networks 
                SET best_lat = ?,
                    best_lon = ?,
                    best_signal = ?
                WHERE id = ?
            `)
        );
    }

    /**
     * Create or update network with observation
     */
    async upsertNetwork(network: NetworkInput, observation: ObservationInput): Promise<number> {
        try {
            // Validate inputs
            if (!validateBSSID(network.bssid)) {
                throw new DatabaseError(`Invalid BSSID format: ${network.bssid}`);
            }
            
            validateCoordinates(observation.latitude, observation.longitude);
            
            const normalizedBssid = normalizeBSSID(network.bssid);
            const sanitizedSsid = sanitizeString(network.ssid, 32);
            const timestamp = observation.timestamp.getTime();
            const networkType = network.type || 'WIFI';
            
            // Lookup manufacturer from BSSID if not provided
            const manufacturer = network.manufacturer || ouiLookup.getManufacturer(normalizedBssid);
            
            // Check if network exists using prepared statement
            const existing = this.preparedStatements.get('getNetworkByBssid').get(normalizedBssid);
            
            if (existing) {
                // Update existing network using prepared statement
                const networkId = existing.id;
                
                this.preparedStatements.get('updateNetwork').run(
                    sanitizedSsid,
                    network.encryption,
                    network.channel || null,
                    manufacturer,
                    timestamp,
                    networkType,
                    networkId
                );
                
                // Add observation using prepared statement
                this.preparedStatements.get('insertObservation').run(
                    networkId,
                    observation.latitude,
                    observation.longitude,
                    observation.signalStrength,
                    timestamp
                );
                
                // Recalculate position
                await this.recalculatePosition(networkId);
                
                return networkId;
            } else {
                // Insert new network using prepared statement
                const result = this.preparedStatements.get('insertNetwork').run(
                    normalizedBssid,
                    sanitizedSsid,
                    network.encryption,
                    network.channel || null,
                    manufacturer,
                    timestamp,
                    timestamp,
                    observation.latitude,
                    observation.longitude,
                    observation.signalStrength,
                    networkType
                );
                
                const networkId = result.lastInsertRowid as number;
                
                // Add observation using prepared statement
                this.preparedStatements.get('insertObservation').run(
                    networkId,
                    observation.latitude,
                    observation.longitude,
                    observation.signalStrength,
                    timestamp
                );
                
                return networkId;
            }
        } catch (error) {
            logger.error('Error in upsertNetwork', error instanceof Error ? error : new Error(String(error)));
            throw new DatabaseError(
                `Failed to upsert network: ${error instanceof Error ? error.message : String(error)}`,
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Query networks with filters
     * Implements caching for viewport queries
     */
    async findNetworks(filter: NetworkFilter, limit = 1000, offset = 0): Promise<Network[]> {
        // Check cache for viewport queries (most common use case)
        if (filter.bounds && !filter.ssid && !filter.bssid && !filter.encryption && !filter.dateRange && !filter.minSignal && !filter.types) {
            const cacheKey = this.getViewportCacheKey(filter.bounds, limit, offset);
            const cached = this.viewportCache.get(cacheKey);
            
            if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
                return cached.data;
            }
        }

        let query = 'SELECT * FROM networks WHERE 1=1';
        const params: any[] = [];

        if (filter.ssid) {
            query += ' AND ssid LIKE ?';
            params.push(`%${filter.ssid}%`);
        }

        if (filter.bssid) {
            query += ' AND bssid LIKE ?';
            params.push(`%${filter.bssid}%`);
        }

        if (filter.encryption && filter.encryption.length > 0) {
            query += ` AND encryption IN (${filter.encryption.map(() => '?').join(',')})`;
            params.push(...filter.encryption);
        }

        if (filter.bounds) {
            query += ' AND best_lat BETWEEN ? AND ? AND best_lon BETWEEN ? AND ?';
            params.push(filter.bounds.south, filter.bounds.north, filter.bounds.west, filter.bounds.east);
        }

        if (filter.dateRange) {
            query += ' AND last_seen BETWEEN ? AND ?';
            params.push(filter.dateRange.start.getTime(), filter.dateRange.end.getTime());
        }

        if (filter.minSignal !== undefined) {
            query += ' AND best_signal >= ?';
            params.push(filter.minSignal);
        }

        if (filter.types && filter.types.length > 0) {
            query += ` AND type IN (${filter.types.map(() => '?').join(',')})`;
            params.push(...filter.types);
        }

        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const rows = this.db.prepare(query).all(...params);
        const networks = rows.map(this.mapRowToNetwork);

        // Cache viewport queries
        if (filter.bounds && !filter.ssid && !filter.bssid && !filter.encryption && !filter.dateRange && !filter.minSignal && !filter.types) {
            const cacheKey = this.getViewportCacheKey(filter.bounds, limit, offset);
            this.viewportCache.set(cacheKey, { data: networks, timestamp: Date.now() });
            
            // Clean old cache entries (keep max 10 entries)
            if (this.viewportCache.size > 10) {
                const oldestKey = Array.from(this.viewportCache.keys())[0];
                this.viewportCache.delete(oldestKey);
            }
        }

        return networks;
    }

    /**
     * Generate cache key for viewport queries
     */
    private getViewportCacheKey(bounds: { north: number; south: number; east: number; west: number }, limit: number, offset: number): string {
        return `${bounds.north.toFixed(4)},${bounds.south.toFixed(4)},${bounds.east.toFixed(4)},${bounds.west.toFixed(4)},${limit},${offset}`;
    }

    /**
     * Clear viewport cache (call when data changes)
     */
    clearCache(): void {
        this.viewportCache.clear();
    }

    /**
     * Get single network by BSSID using prepared statement
     */
    async getNetworkByBssid(bssid: string): Promise<Network | null> {
        const row = this.preparedStatements.get('getNetworkByBssid').get(bssid);
        return row ? this.mapRowToNetwork(row) : null;
    }

    /**
     * Get observations for a network using prepared statement
     */
    async getObservations(networkId: number): Promise<Observation[]> {
        const rows = this.preparedStatements.get('getObservations').all(networkId);
        return rows.map((row: any) => ({
            id: row.id,
            networkId: row.network_id,
            latitude: row.latitude,
            longitude: row.longitude,
            signalStrength: row.signal_strength,
            timestamp: new Date(row.timestamp)
        }));
    }

    /**
     * Batch insert for imports with transaction
     * Optimized for bulk operations
     */
    async batchInsertNetworks(
        networks: Array<{ network: NetworkInput; observation: ObservationInput }>
    ): Promise<ImportResult> {
        const result: ImportResult = {
            networksImported: 0,
            networksUpdated: 0,
            observationsAdded: 0,
            errors: []
        };

        // Use transaction for batch insert - much faster than individual inserts
        const transaction = this.db.transaction((items: typeof networks) => {
            for (const item of items) {
                try {
                    const existing = this.preparedStatements.get('getNetworkByBssid').get(item.network.bssid);
                    
                    if (existing) {
                        result.networksUpdated++;
                    } else {
                        result.networksImported++;
                    }
                    
                    this.upsertNetworkSync(item.network, item.observation);
                    result.observationsAdded++;
                } catch (error) {
                    result.errors.push(`Error importing ${item.network.bssid}: ${error}`);
                }
            }
        });

        transaction(networks);
        
        // Clear cache after bulk insert
        this.clearCache();
        
        return result;
    }

    /**
     * Synchronous version of upsertNetwork for use in transactions
     * Uses prepared statements for better performance
     */
    private upsertNetworkSync(network: NetworkInput, observation: ObservationInput): number {
        const timestamp = observation.timestamp.getTime();
        const networkType = network.type || 'WIFI';
        
        // Lookup manufacturer from BSSID if not provided
        const manufacturer = network.manufacturer || ouiLookup.getManufacturer(network.bssid);
        
        const existing = this.preparedStatements.get('getNetworkByBssid').get(network.bssid);
        
        if (existing) {
            const networkId = existing.id;
            
            this.preparedStatements.get('updateNetwork').run(
                network.ssid,
                network.encryption,
                network.channel || null,
                manufacturer,
                timestamp,
                networkType,
                networkId
            );
            
            this.preparedStatements.get('insertObservation').run(
                networkId,
                observation.latitude,
                observation.longitude,
                observation.signalStrength,
                timestamp
            );
            
            this.recalculatePositionSync(networkId);
            
            return networkId;
        } else {
            const result = this.preparedStatements.get('insertNetwork').run(
                network.bssid,
                network.ssid,
                network.encryption,
                network.channel || null,
                manufacturer,
                timestamp,
                timestamp,
                observation.latitude,
                observation.longitude,
                observation.signalStrength,
                networkType
            );
            
            const networkId = result.lastInsertRowid as number;
            
            this.preparedStatements.get('insertObservation').run(
                networkId,
                observation.latitude,
                observation.longitude,
                observation.signalStrength,
                timestamp
            );
            
            return networkId;
        }
    }

    /**
     * Recalculate position - async wrapper
     */
    async recalculatePosition(networkId: number): Promise<void> {
        this.recalculatePositionSync(networkId);
    }

    /**
     * Recalculate position - synchronous implementation
     * Updates network location based on weighted centroid of all observations
     * Uses prepared statements for better performance
     */
    private recalculatePositionSync(networkId: number): void {
        // Get all observations for this network using prepared statement
        const rows = this.preparedStatements.get('getObservations').all(networkId);
        
        if (rows.length === 0) {
            return;
        }

        const observations: Observation[] = rows.map((row: any) => ({
            id: row.id,
            networkId: row.network_id,
            latitude: row.latitude,
            longitude: row.longitude,
            signalStrength: row.signal_strength,
            timestamp: new Date(row.timestamp)
        }));

        // Calculate weighted centroid
        const position = calculateWeightedCentroid(observations);

        // Find best signal strength
        const bestSignal = Math.max(...observations.map(obs => obs.signalStrength));

        // Update network position using prepared statement
        this.preparedStatements.get('updatePosition').run(
            position.latitude,
            position.longitude,
            bestSignal,
            networkId
        );
    }

    /**
     * Delete all networks
     */
    async clearAllNetworks(): Promise<void> {
        this.db.prepare('DELETE FROM observations').run();
        this.db.prepare('DELETE FROM networks').run();
    }

    /**
     * Map database row to Network object
     */
    private mapRowToNetwork(row: any): Network {
        return {
            id: row.id,
            bssid: row.bssid,
            ssid: row.ssid,
            encryption: row.encryption,
            channel: row.channel,
            manufacturer: row.manufacturer,
            firstSeen: new Date(row.first_seen),
            lastSeen: new Date(row.last_seen),
            observationCount: row.observation_count,
            bestLat: row.best_lat,
            bestLon: row.best_lon,
            bestSignal: row.best_signal,
            type: row.type || 'WIFI'
        };
    }
}
