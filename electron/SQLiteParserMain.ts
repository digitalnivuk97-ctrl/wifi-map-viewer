/**
 * SQLite Parser for Main Process
 * Handles SQLite database parsing using better-sqlite3 in the main process
 */

import type Database from 'better-sqlite3';

interface ParsedNetwork {
    bssid: string;
    ssid: string;
    latitude: number;
    longitude: number;
    signalStrength: number;
    timestamp: Date;
    encryption: string;
    channel?: number;
    type?: string;
}

export class SQLiteParserMain {
    constructor(private DatabaseConstructor: any) {}

    parseSQLiteFile(filePath: string): { success: boolean; networks?: ParsedNetwork[]; error?: string } {
        let db: Database.Database | null = null;
        
        try {
            db = new this.DatabaseConstructor(filePath, { readonly: true });
            
            // Detect schema type
            const schema = this.detectSchema(db!);
            
            let networks: ParsedNetwork[];
            if (schema === 'wigle') {
                networks = this.parseWigleSchema(db!);
            } else if (schema === 'custom') {
                networks = this.parseCustomSchema(db!);
            } else {
                return { success: false, error: 'Unsupported database schema' };
            }
            
            return { success: true, networks };
        } catch (error) {
            return { 
                success: false, 
                error: `Failed to parse SQLite file: ${error instanceof Error ? error.message : String(error)}` 
            };
        } finally {
            if (db) {
                db.close();
            }
        }
    }

    private detectSchema(db: Database.Database): 'wigle' | 'custom' | 'unknown' {
        // Get list of tables
        const tables = db.prepare(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).all() as Array<{ name: string }>;
        
        const tableNames = tables.map(t => t.name.toLowerCase());
        
        // Check for WiGLE schema (network and location tables)
        if (tableNames.includes('network') && tableNames.includes('location')) {
            return 'wigle';
        }
        
        // Check for custom schema (networks table)
        if (tableNames.includes('networks')) {
            return 'custom';
        }
        
        return 'unknown';
    }

    private parseWigleSchema(db: Database.Database): ParsedNetwork[] {
        // WiGLE schema typically has network and location tables
        // Check if type column exists in network table
        const columns = db.prepare("PRAGMA table_info(network)").all() as Array<{ name: string }>;
        const hasTypeColumn = columns.some(col => col.name.toLowerCase() === 'type');
        
        const query = `
            SELECT 
                n.bssid,
                n.ssid,
                n.capabilities as encryption,
                n.frequency,
                ${hasTypeColumn ? 'n.type,' : ''}
                l.lat as latitude,
                l.lon as longitude,
                l.level as signal,
                l.time as timestamp
            FROM network n
            LEFT JOIN location l ON n.bssid = l.bssid
            WHERE l.lat IS NOT NULL AND l.lon IS NOT NULL
        `;

        const rows = db.prepare(query).all() as any[];
        const networks: ParsedNetwork[] = [];

        rows.forEach((row, index) => {
            try {
                const network = this.mapWigleRow(row);
                if (network) {
                    networks.push(network);
                }
            } catch (error) {
                console.warn(`Skipping invalid row ${index}:`, error);
            }
        });

        return networks;
    }

    private parseCustomSchema(db: Database.Database): ParsedNetwork[] {
        // Try to parse custom schema with networks table
        // Check if type column exists
        const columns = db.prepare("PRAGMA table_info(networks)").all() as Array<{ name: string }>;
        const hasTypeColumn = columns.some(col => col.name.toLowerCase() === 'type');
        
        const query = `
            SELECT 
                bssid,
                ssid,
                encryption,
                channel,
                best_lat,
                best_lon,
                best_signal,
                last_seen
                ${hasTypeColumn ? ', type' : ''}
            FROM networks
            WHERE best_lat IS NOT NULL AND best_lon IS NOT NULL
        `;

        const rows = db.prepare(query).all() as any[];
        const networks: ParsedNetwork[] = [];

        rows.forEach((row, index) => {
            try {
                const network = this.mapCustomRow(row);
                if (network) {
                    networks.push(network);
                }
            } catch (error) {
                console.warn(`Skipping invalid row ${index}:`, error);
            }
        });

        return networks;
    }

    private mapWigleRow(row: any): ParsedNetwork | null {
        if (!row.bssid || !row.latitude || !row.longitude) {
            return null;
        }

        const latitude = parseFloat(row.latitude);
        const longitude = parseFloat(row.longitude);

        if (isNaN(latitude) || isNaN(longitude) || 
            latitude < -90 || latitude > 90 || 
            longitude < -180 || longitude > 180) {
            return null;
        }

        const channel = row.frequency ? this.frequencyToChannel(row.frequency) : undefined;
        const type = this.normalizeNetworkType(row.type);

        return {
            bssid: row.bssid.toUpperCase(),
            ssid: row.ssid || '',
            latitude,
            longitude,
            signalStrength: row.signal || -70,
            timestamp: row.timestamp ? new Date(row.timestamp) : new Date(),
            encryption: this.normalizeEncryption(row.encryption || ''),
            channel,
            type
        };
    }

    private mapCustomRow(row: any): ParsedNetwork | null {
        if (!row.bssid || !row.best_lat || !row.best_lon) {
            return null;
        }

        const latitude = parseFloat(row.best_lat);
        const longitude = parseFloat(row.best_lon);

        if (isNaN(latitude) || isNaN(longitude) || 
            latitude < -90 || latitude > 90 || 
            longitude < -180 || longitude > 180) {
            return null;
        }

        const type = this.normalizeNetworkType(row.type);

        return {
            bssid: row.bssid.toUpperCase(),
            ssid: row.ssid || '',
            latitude,
            longitude,
            signalStrength: row.best_signal || -70,
            timestamp: row.last_seen ? new Date(row.last_seen) : new Date(),
            encryption: this.normalizeEncryption(row.encryption || ''),
            channel: row.channel,
            type
        };
    }

    private frequencyToChannel(frequency: number): number {
        // Convert WiFi frequency (MHz) to channel number
        if (frequency >= 2412 && frequency <= 2484) {
            // 2.4 GHz band
            if (frequency === 2484) return 14;
            return (frequency - 2412) / 5 + 1;
        } else if (frequency >= 5170 && frequency <= 5825) {
            // 5 GHz band
            return (frequency - 5170) / 5 + 34;
        }
        return 0;
    }

    private normalizeEncryption(encryption: string): string {
        const enc = encryption.toUpperCase();
        
        if (enc.includes('WPA3')) return 'WPA3';
        if (enc.includes('WPA2') || enc.includes('RSN')) return 'WPA2';
        if (enc.includes('WPA')) return 'WPA';
        if (enc.includes('WEP')) return 'WEP';
        if (enc.includes('OPEN') || enc.includes('NONE') || enc === '' || enc.includes('ESS')) return 'Open';
        
        return 'Unknown';
    }

    private normalizeNetworkType(type: string | null | undefined): string {
        if (!type) {
            return 'WIFI'; // Default to WIFI for formats without type information
        }

        const normalized = type.toUpperCase().trim();
        
        // Map Type values to NetworkType enum
        if (normalized === 'WIFI' || normalized === 'WI-FI') return 'WIFI';
        if (normalized === 'BLE' || normalized === 'BLUETOOTH') return 'BLE';
        if (normalized === 'LTE' || normalized === 'CELL') return 'LTE';
        
        // Default to WIFI if unrecognized
        return 'WIFI';
    }
}
