/**
 * Kismet CSV Parser
 * Parses Kismet CSV format with network data
 */

import type { IFileParser, ParsedNetwork, ProgressCallback } from './types';

export class KismetCSVParser implements IFileParser {
    canParse(filename: string, content: string): boolean {
        if (!filename.toLowerCase().endsWith('.csv')) {
            return false;
        }
        
        // Check for Kismet-specific headers
        const firstLine = content.split('\n')[0].toLowerCase();
        return firstLine.includes('bssid') && 
               (firstLine.includes('lastsignal') || firstLine.includes('bestlat'));
    }

    async parse(content: string, progressCallback?: ProgressCallback): Promise<ParsedNetwork[]> {
        // Process in chunks to manage memory for large files
        const CHUNK_SIZE = 1000;
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        
        if (lines.length === 0) {
            throw new Error('Empty CSV file');
        }

        // Parse header
        const header = lines[0].split(';').map(h => h.trim());
        const columnMap = this.mapColumns(header);

        if (!this.validateRequiredColumns(columnMap)) {
            throw new Error('Missing required columns in Kismet CSV');
        }

        const networks: ParsedNetwork[] = [];
        const totalLines = lines.length - 1;

        // Parse data rows in chunks
        for (let chunkStart = 1; chunkStart < lines.length; chunkStart += CHUNK_SIZE) {
            const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, lines.length);
            
            for (let i = chunkStart; i < chunkEnd; i++) {
                try {
                    const network = this.parseRow(lines[i], columnMap);
                    if (network) {
                        networks.push(network);
                    }
                } catch (error) {
                    console.warn(`Skipping invalid row ${i}:`, error);
                }
            }

            // Report progress after each chunk
            if (progressCallback) {
                const progress = (chunkEnd / totalLines) * 100;
                progressCallback(progress, `Parsed ${chunkEnd - 1} of ${totalLines} networks`);
            }

            // Allow garbage collection between chunks for large files
            if (lines.length > 10000) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        if (progressCallback) {
            progressCallback(100, `Completed: ${networks.length} networks parsed`);
        }

        // Clear lines array to free memory
        lines.length = 0;

        return networks;
    }

    getFormatName(): string {
        return 'Kismet CSV';
    }

    private mapColumns(header: string[]): Map<string, number> {
        const map = new Map<string, number>();
        
        // Kismet column names
        const columnMappings: Record<string, string[]> = {
            'bssid': ['BSSID', 'bssid'],
            'ssid': ['SSID', 'ssid', 'Name'],
            'latitude': ['BestLat', 'bestlat', 'Lat'],
            'longitude': ['BestLon', 'bestlon', 'Lon'],
            'signal': ['LastSignal', 'lastsignal', 'Signal', 'MaxSignal'],
            'encryption': ['Encryption', 'encryption', 'Crypt'],
            'channel': ['Channel', 'channel'],
            'timestamp': ['FirstTime', 'firsttime', 'Time'],
            'type': ['Type', 'type', 'NetworkType', 'PhyType']
        };

        header.forEach((col, index) => {
            const normalized = col.trim();
            for (const [key, variations] of Object.entries(columnMappings)) {
                if (variations.some(v => normalized === v)) {
                    map.set(key, index);
                    break;
                }
            }
        });

        return map;
    }

    private validateRequiredColumns(columnMap: Map<string, number>): boolean {
        const required = ['bssid', 'latitude', 'longitude'];
        return required.every(col => columnMap.has(col));
    }

    private parseRow(line: string, columnMap: Map<string, number>): ParsedNetwork | null {
        const values = line.split(';').map(v => v.trim());

        const bssid = this.getValue(values, columnMap, 'bssid');
        const ssid = this.getValue(values, columnMap, 'ssid') || '';
        const latStr = this.getValue(values, columnMap, 'latitude');
        const lonStr = this.getValue(values, columnMap, 'longitude');

        if (!bssid || !latStr || !lonStr) {
            return null;
        }

        const latitude = parseFloat(latStr);
        const longitude = parseFloat(lonStr);

        // Validate coordinates
        if (isNaN(latitude) || isNaN(longitude) || 
            latitude < -90 || latitude > 90 || 
            longitude < -180 || longitude > 180) {
            return null;
        }

        const signalStr = this.getValue(values, columnMap, 'signal');
        const signalStrength = signalStr ? parseInt(signalStr, 10) : -70;

        const encryption = this.normalizeEncryption(
            this.getValue(values, columnMap, 'encryption') || ''
        );

        const channelStr = this.getValue(values, columnMap, 'channel');
        const channel = channelStr ? parseInt(channelStr, 10) : undefined;

        const timestampStr = this.getValue(values, columnMap, 'timestamp');
        const timestamp = timestampStr ? new Date(timestampStr) : new Date();

        // Parse network type - default to WIFI for formats without type information
        const typeStr = this.getValue(values, columnMap, 'type');
        const type = this.normalizeNetworkType(typeStr);

        return {
            bssid: bssid.toUpperCase(),
            ssid,
            latitude,
            longitude,
            signalStrength,
            timestamp,
            encryption,
            channel,
            type
        };
    }

    private getValue(values: string[], columnMap: Map<string, number>, key: string): string | null {
        const index = columnMap.get(key);
        if (index === undefined || index >= values.length) {
            return null;
        }
        return values[index].trim();
    }

    private normalizeEncryption(encryption: string): string {
        const enc = encryption.toUpperCase();
        
        if (enc.includes('WPA3')) return 'WPA3';
        if (enc.includes('WPA2')) return 'WPA2';
        if (enc.includes('WPA')) return 'WPA';
        if (enc.includes('WEP')) return 'WEP';
        if (enc.includes('OPEN') || enc.includes('NONE') || enc === '') return 'Open';
        
        return 'Unknown';
    }

    private normalizeNetworkType(type: string | null): string {
        if (!type) {
            return 'WIFI'; // Default to WIFI for formats without type information
        }

        const normalized = type.toUpperCase().trim();
        
        // Map Type values to NetworkType enum
        if (normalized === 'WIFI' || normalized === 'WI-FI' || normalized === 'IEEE80211') return 'WIFI';
        if (normalized === 'BLE' || normalized === 'BLUETOOTH' || normalized === 'BTLE') return 'BLE';
        if (normalized === 'LTE' || normalized === 'CELL') return 'LTE';
        
        // Default to WIFI if unrecognized
        return 'WIFI';
    }
}
