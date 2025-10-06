/**
 * WiGLE CSV Parser
 * Parses WiGLE WiFi Wardriving CSV format
 */

import type { IFileParser, ParsedNetwork, ProgressCallback } from './types';
import { ParseError } from '../utils/errors';
import { validateCoordinates, validateBSSID, normalizeBSSID, validateSignalStrength, validateChannel } from '../utils/validation';
import { logger } from '../utils/logger';

export class WigleCSVParser implements IFileParser {
    canParse(filename: string, content: string): boolean {
        // Check file extension
        if (!filename.toLowerCase().endsWith('.csv')) {
            return false;
        }
        
        // WiGLE CSV files often have a metadata line first, so check first 2 lines
        const lines = content.split('\n');
        const firstLine = lines[0]?.toLowerCase() || '';
        const secondLine = lines[1]?.toLowerCase() || '';
        
        // Check for WiGLE metadata header
        if (firstLine.includes('wiglewifi')) {
            return true;
        }
        
        // Check for common WiFi CSV headers in first or second line
        const headerLine = firstLine + ' ' + secondLine;
        return headerLine.includes('mac') || 
               headerLine.includes('bssid') || 
               headerLine.includes('ssid') || 
               headerLine.includes('authmode') ||
               headerLine.includes('encryption');
    }

    async parse(content: string, progressCallback?: ProgressCallback): Promise<ParsedNetwork[]> {
        // For large files, process in chunks to avoid memory issues
        const CHUNK_SIZE = 1000;
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        
        if (lines.length === 0) {
            throw new ParseError('Empty CSV file', 'WiGLE CSV');
        }

        // Skip WiGLE metadata line if present (starts with "WigleWifi-")
        let headerLineIndex = 0;
        if (lines[0].toLowerCase().startsWith('wiglewifi-')) {
            headerLineIndex = 1;
            logger.info('Detected WiGLE metadata header, skipping to line 2');
        }

        if (headerLineIndex >= lines.length) {
            throw new ParseError('No header line found in CSV file', 'WiGLE CSV');
        }

        // Parse header
        const header = lines[headerLineIndex].split(',').map(h => h.trim());
        const columnMap = this.mapColumns(header);

        if (!this.validateRequiredColumns(columnMap)) {
            throw new ParseError('Missing required columns in WiGLE CSV', 'WiGLE CSV', 1);
        }

        const networks: ParsedNetwork[] = [];
        const dataStartLine = headerLineIndex + 1; // Start after header
        const totalLines = lines.length - dataStartLine;
        let errorCount = 0;

        // Parse data rows in chunks to manage memory
        for (let chunkStart = dataStartLine; chunkStart < lines.length; chunkStart += CHUNK_SIZE) {
            const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, lines.length);
            
            for (let i = chunkStart; i < chunkEnd; i++) {
                try {
                    const network = this.parseRow(lines[i], columnMap, i + 1);
                    if (network) {
                        networks.push(network);
                    }
                } catch (error) {
                    // Skip invalid rows but log them
                    errorCount++;
                    logger.warn(`Skipping invalid row ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
                    
                    // Stop if too many errors (>50% failure rate)
                    if (errorCount > totalLines / 2) {
                        throw new ParseError(
                            `Too many parse errors (${errorCount}/${i}). File may be corrupted or in wrong format.`,
                            'WiGLE CSV',
                            i + 1
                        );
                    }
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

        logger.info(`WiGLE CSV parse complete: ${networks.length} networks, ${errorCount} errors`);
        
        // Clear lines array to free memory
        lines.length = 0;
        
        return networks;
    }

    getFormatName(): string {
        return 'WiGLE CSV';
    }

    private mapColumns(header: string[]): Map<string, number> {
        const map = new Map<string, number>();
        
        // Common WiGLE column names and their variations
        const columnMappings: Record<string, string[]> = {
            'bssid': ['MAC', 'BSSID', 'mac'],
            'ssid': ['SSID', 'ssid'],
            'latitude': ['CurrentLatitude', 'Latitude', 'lat'],
            'longitude': ['CurrentLongitude', 'Longitude', 'lon', 'long'],
            'signal': ['RSSI', 'Signal', 'signal', 'rssi'],
            'encryption': ['AuthMode', 'Encryption', 'encryption', 'Capabilities'],
            'channel': ['Channel', 'channel'],
            'timestamp': ['FirstSeen', 'Time', 'timestamp', 'Date'],
            'type': ['Type', 'type', 'NetworkType']
        };

        header.forEach((col, index) => {
            const normalized = col.trim();
            for (const [key, variations] of Object.entries(columnMappings)) {
                if (variations.some(v => normalized.includes(v))) {
                    map.set(key, index);
                    break;
                }
            }
        });

        // Debug log column mapping
        console.log('[WiGLE Parser] Column mapping:', {
            header: header,
            mappedColumns: Array.from(map.entries())
        });

        return map;
    }

    private validateRequiredColumns(columnMap: Map<string, number>): boolean {
        const required = ['bssid', 'ssid', 'latitude', 'longitude'];
        return required.every(col => columnMap.has(col));
    }

    private parseRow(line: string, columnMap: Map<string, number>, lineNumber: number): ParsedNetwork | null {
        const values = this.parseCSVLine(line);

        const bssid = this.getValue(values, columnMap, 'bssid');
        const ssid = this.getValue(values, columnMap, 'ssid') || '';
        const latStr = this.getValue(values, columnMap, 'latitude');
        const lonStr = this.getValue(values, columnMap, 'longitude');

        if (!bssid || !latStr || !lonStr) {
            return null;
        }

        // Parse network type first to determine validation rules
        const typeStr = this.getValue(values, columnMap, 'type');
        const type = this.normalizeNetworkType(typeStr);
        
        // Validate and normalize BSSID (LTE uses cell IDs, not MAC addresses)
        let normalizedBssid: string;
        if (type === 'LTE') {
            // LTE cell IDs don't follow MAC address format, use as-is
            normalizedBssid = bssid;
        } else {
            // WiFi and BLE use MAC addresses
            if (!validateBSSID(bssid)) {
                throw new ParseError(`Invalid BSSID format: ${bssid}`, 'WiGLE CSV', lineNumber);
            }
            normalizedBssid = normalizeBSSID(bssid);
        }

        const latitude = parseFloat(latStr);
        const longitude = parseFloat(lonStr);

        // Validate coordinates
        try {
            validateCoordinates(latitude, longitude);
        } catch (error) {
            throw new ParseError(
                `Invalid coordinates: ${latitude}, ${longitude}`,
                'WiGLE CSV',
                lineNumber
            );
        }

        const signalStr = this.getValue(values, columnMap, 'signal');
        let signalStrength = signalStr ? parseInt(signalStr, 10) : -70;
        
        // Validate signal strength
        if (!validateSignalStrength(signalStrength)) {
            logger.warn(`Invalid signal strength ${signalStrength} at line ${lineNumber}, using default -70`);
            signalStrength = -70;
        }

        const encryption = this.normalizeEncryption(
            this.getValue(values, columnMap, 'encryption') || ''
        );

        const channelStr = this.getValue(values, columnMap, 'channel');
        let channel: number | undefined = channelStr ? parseInt(channelStr, 10) : undefined;
        
        // Validate channel if present
        if (channel !== undefined && !validateChannel(channel)) {
            logger.warn(`Invalid channel ${channel} at line ${lineNumber}, ignoring`);
            channel = undefined;
        }

        const timestampStr = this.getValue(values, columnMap, 'timestamp');
        const timestamp = timestampStr ? new Date(timestampStr) : new Date();

        return {
            bssid: normalizedBssid,
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

    private parseCSVLine(line: string): string[] {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        values.push(current.trim());
        return values;
    }

    private getValue(values: string[], columnMap: Map<string, number>, key: string): string | null {
        const index = columnMap.get(key);
        if (index === undefined || index >= values.length) {
            return null;
        }
        return values[index].replace(/^"|"$/g, '').trim();
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
            return 'WIFI'; // Default to WIFI for backward compatibility
        }

        const normalized = type.toUpperCase().trim();
        
        // Debug logging for first few networks
        if (Math.random() < 0.01) { // Log ~1% of networks
            console.log(`[WiGLE Parser] Type value: "${type}" -> normalized: "${normalized}"`);
        }
        
        // Map Type values to NetworkType enum
        if (normalized === 'WIFI' || normalized === 'WI-FI') return 'WIFI';
        if (normalized === 'BLE' || normalized === 'BLUETOOTH' || normalized === 'BT') return 'BLE';
        if (normalized === 'LTE' || normalized === 'CELL' || normalized === 'GSM' || normalized === 'CDMA') return 'LTE';
        
        // Log unrecognized types
        if (normalized !== 'WIFI') {
            console.log(`[WiGLE Parser] Unrecognized type: "${type}" (normalized: "${normalized}"), defaulting to WIFI`);
        }
        
        // Default to WIFI if unrecognized
        return 'WIFI';
    }
}
