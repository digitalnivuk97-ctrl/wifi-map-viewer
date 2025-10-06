/**
 * Database initialization and repository for main process
 * This file duplicates some logic from src/database to avoid cross-boundary imports
 */

import type Database from 'better-sqlite3';
import type { Network, Observation, NetworkFilter, NetworkInput, ObservationInput, ImportResult } from '../src/types/network';

// Database schema
const SCHEMA_SQL = `
-- Networks table stores unique network identifiers
CREATE TABLE IF NOT EXISTS networks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bssid TEXT NOT NULL UNIQUE,
    ssid TEXT,
    encryption TEXT,
    channel INTEGER,
    manufacturer TEXT,
    first_seen INTEGER NOT NULL,
    last_seen INTEGER NOT NULL,
    observation_count INTEGER DEFAULT 1,
    best_lat REAL,
    best_lon REAL,
    best_signal INTEGER,
    type TEXT DEFAULT 'WIFI'
);

-- Observations table stores individual sightings for trilateration
CREATE TABLE IF NOT EXISTS observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    network_id INTEGER NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    signal_strength INTEGER,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (network_id) REFERENCES networks(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_networks_bssid ON networks(bssid);
CREATE INDEX IF NOT EXISTS idx_networks_ssid ON networks(ssid);
CREATE INDEX IF NOT EXISTS idx_networks_location ON networks(best_lat, best_lon);
CREATE INDEX IF NOT EXISTS idx_networks_type ON networks(type);
CREATE INDEX IF NOT EXISTS idx_observations_network ON observations(network_id);
CREATE INDEX IF NOT EXISTS idx_observations_timestamp ON observations(timestamp);
`;

/**
 * Initialize database with schema
 */
export function initializeDatabase(db: Database.Database): void {
    db.exec(SCHEMA_SQL);
    
    // Run migrations for existing databases
    migrateDatabase(db);
}

/**
 * Run database migrations for schema updates
 */
function migrateDatabase(db: Database.Database): void {
    // Check if type column exists in networks table
    const tableInfo = db.prepare("PRAGMA table_info(networks)").all() as Array<{ name: string }>;
    const hasTypeColumn = tableInfo.some(col => col.name === 'type');
    
    if (!hasTypeColumn) {
        // Add type column with default value 'WIFI' for backward compatibility
        db.exec(`
            ALTER TABLE networks ADD COLUMN type TEXT DEFAULT 'WIFI';
            CREATE INDEX IF NOT EXISTS idx_networks_type ON networks(type);
        `);
    }
}

/**
 * Calculate weighted centroid position based on observations
 */
function calculateWeightedCentroid(observations: Observation[]): { latitude: number; longitude: number } {
    if (observations.length === 0) {
        throw new Error('Cannot calculate centroid with no observations');
    }

    if (observations.length === 1) {
        return {
            latitude: observations[0].latitude,
            longitude: observations[0].longitude
        };
    }

    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLon = 0;

    for (const obs of observations) {
        // Weight is signal strength squared (inverse square law)
        const weight = Math.pow(Math.abs(obs.signalStrength), 2);
        totalWeight += weight;
        weightedLat += obs.latitude * weight;
        weightedLon += obs.longitude * weight;
    }

    return {
        latitude: weightedLat / totalWeight,
        longitude: weightedLon / totalWeight
    };
}

/**
 * Get manufacturer from BSSID OUI prefix
 * This is a simplified version - full OUI lookup is in renderer process
 */
function getManufacturerFromBssid(_bssid: string): string {
    // For now, return Unknown - full OUI lookup happens in renderer
    return 'Unknown';
}

/**
 * NetworkRepository for main process database operations
 */
export class MainProcessNetworkRepository {
    constructor(private db: Database.Database) {}

    /**
     * Create or update network with observation
     */
    async upsertNetwork(network: NetworkInput, observation: ObservationInput): Promise<number> {
        const timestamp = observation.timestamp.getTime();
        const manufacturer = network.manufacturer || getManufacturerFromBssid(network.bssid);
        const networkType = network.type || 'WIFI';
        
        const existing = this.db.prepare('SELECT id FROM networks WHERE bssid = ?').get(network.bssid) as { id: number } | undefined;
        
        if (existing) {
            const networkId = existing.id;
            
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
            `).run(
                network.ssid,
                network.encryption,
                network.channel || null,
                manufacturer,
                timestamp,
                networkType,
                networkId
            );
            
            this.db.prepare(`
                INSERT INTO observations (network_id, latitude, longitude, signal_strength, timestamp)
                VALUES (?, ?, ?, ?, ?)
            `).run(
                networkId,
                observation.latitude,
                observation.longitude,
                observation.signalStrength,
                timestamp
            );
            
            this.recalculatePositionSync(networkId);
            
            return networkId;
        } else {
            const result = this.db.prepare(`
                INSERT INTO networks (
                    bssid, ssid, encryption, channel, manufacturer,
                    first_seen, last_seen, observation_count,
                    best_lat, best_lon, best_signal, type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
            `).run(
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
            
            this.db.prepare(`
                INSERT INTO observations (network_id, latitude, longitude, signal_strength, timestamp)
                VALUES (?, ?, ?, ?, ?)
            `).run(
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
     * Query networks with filters
     */
    async findNetworks(filter: NetworkFilter, limit = 1000, offset = 0): Promise<Network[]> {
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

        const rows = this.db.prepare(query).all(...params) as any[];
        return rows.map(this.mapRowToNetwork);
    }

    /**
     * Get single network by BSSID
     */
    async getNetworkByBssid(bssid: string): Promise<Network | null> {
        const row = this.db.prepare('SELECT * FROM networks WHERE bssid = ?').get(bssid) as any;
        return row ? this.mapRowToNetwork(row) : null;
    }

    /**
     * Get observations for a network
     */
    async getObservations(networkId: number): Promise<Observation[]> {
        const rows = this.db.prepare('SELECT * FROM observations WHERE network_id = ?').all(networkId) as any[];
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
     * Batch insert for imports
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

        const transaction = this.db.transaction((items: typeof networks) => {
            for (const item of items) {
                try {
                    const existing = this.db.prepare('SELECT id FROM networks WHERE bssid = ?').get(item.network.bssid) as { id: number } | undefined;
                    
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
        return result;
    }

    /**
     * Synchronous version of upsertNetwork for use in transactions
     */
    private upsertNetworkSync(network: NetworkInput, observation: ObservationInput): number {
        const timestamp = observation.timestamp.getTime();
        const manufacturer = network.manufacturer || getManufacturerFromBssid(network.bssid);
        const networkType = network.type || 'WIFI';
        
        const existing = this.db.prepare('SELECT id FROM networks WHERE bssid = ?').get(network.bssid) as { id: number } | undefined;
        
        if (existing) {
            const networkId = existing.id;
            
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
            `).run(
                network.ssid,
                network.encryption,
                network.channel || null,
                manufacturer,
                timestamp,
                networkType,
                networkId
            );
            
            this.db.prepare(`
                INSERT INTO observations (network_id, latitude, longitude, signal_strength, timestamp)
                VALUES (?, ?, ?, ?, ?)
            `).run(
                networkId,
                observation.latitude,
                observation.longitude,
                observation.signalStrength,
                timestamp
            );
            
            this.recalculatePositionSync(networkId);
            
            return networkId;
        } else {
            const result = this.db.prepare(`
                INSERT INTO networks (
                    bssid, ssid, encryption, channel, manufacturer,
                    first_seen, last_seen, observation_count,
                    best_lat, best_lon, best_signal, type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
            `).run(
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
            
            this.db.prepare(`
                INSERT INTO observations (network_id, latitude, longitude, signal_strength, timestamp)
                VALUES (?, ?, ?, ?, ?)
            `).run(
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
     * Recalculate position - synchronous implementation
     */
    private recalculatePositionSync(networkId: number): void {
        const rows = this.db.prepare('SELECT * FROM observations WHERE network_id = ?').all(networkId) as any[];
        
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

        const position = calculateWeightedCentroid(observations);
        const bestSignal = Math.max(...observations.map(obs => obs.signalStrength));

        this.db.prepare(`
            UPDATE networks 
            SET best_lat = ?,
                best_lon = ?,
                best_signal = ?
            WHERE id = ?
        `).run(position.latitude, position.longitude, bestSignal, networkId);
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
