/**
 * KML Parser
 * Parses KML XML format with network data
 */

import type { IFileParser, ParsedNetwork, ProgressCallback } from './types';

export class KMLParser implements IFileParser {
    canParse(filename: string, content: string): boolean {
        if (!filename.toLowerCase().endsWith('.kml')) {
            return false;
        }
        
        // Check for KML XML structure
        return content.includes('<kml') && content.includes('</kml>');
    }

    async parse(content: string, progressCallback?: ProgressCallback): Promise<ParsedNetwork[]> {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/xml');

        // Check for parsing errors
        const parserError = doc.querySelector('parsererror');
        if (parserError) {
            throw new Error('Invalid KML XML format');
        }

        const placemarks = doc.querySelectorAll('Placemark');
        const networks: ParsedNetwork[] = [];
        const totalPlacemarks = placemarks.length;
        const CHUNK_SIZE = 1000;

        // Process placemarks in chunks to manage memory
        for (let chunkStart = 0; chunkStart < placemarks.length; chunkStart += CHUNK_SIZE) {
            const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, placemarks.length);
            
            for (let i = chunkStart; i < chunkEnd; i++) {
                try {
                    const network = this.parsePlacemark(placemarks[i]);
                    if (network) {
                        networks.push(network);
                    }
                } catch (error) {
                    console.warn(`Skipping invalid placemark ${i}:`, error);
                }
            }

            // Report progress after each chunk
            if (progressCallback) {
                const progress = (chunkEnd / totalPlacemarks) * 100;
                progressCallback(progress, `Parsed ${chunkEnd} of ${totalPlacemarks} networks`);
            }

            // Allow garbage collection between chunks for large files
            if (placemarks.length > 10000) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        if (progressCallback) {
            progressCallback(100, `Completed: ${networks.length} networks parsed`);
        }

        return networks;
    }

    getFormatName(): string {
        return 'KML';
    }

    private parsePlacemark(placemark: Element): ParsedNetwork | null {
        // Extract coordinates
        const coordinatesEl = placemark.querySelector('coordinates');
        if (!coordinatesEl || !coordinatesEl.textContent) {
            return null;
        }

        const coords = coordinatesEl.textContent.trim().split(',');
        if (coords.length < 2) {
            return null;
        }

        const longitude = parseFloat(coords[0]);
        const latitude = parseFloat(coords[1]);

        // Validate coordinates
        if (isNaN(latitude) || isNaN(longitude) || 
            latitude < -90 || latitude > 90 || 
            longitude < -180 || longitude > 180) {
            return null;
        }

        // Extract extended data
        const extendedData = this.parseExtendedData(placemark);

        // Get BSSID (required)
        const bssid = extendedData.get('bssid') || 
                      extendedData.get('mac') || 
                      extendedData.get('BSSID') ||
                      extendedData.get('MAC');
        
        if (!bssid) {
            return null;
        }

        // Get SSID
        const ssid = extendedData.get('ssid') || 
                     extendedData.get('SSID') || 
                     extendedData.get('name') ||
                     placemark.querySelector('name')?.textContent || 
                     '';

        // Get signal strength
        const signalStr = extendedData.get('signal') || 
                         extendedData.get('rssi') || 
                         extendedData.get('Signal');
        const signalStrength = signalStr ? parseInt(signalStr, 10) : -70;

        // Get encryption
        const encryptionStr = extendedData.get('encryption') || 
                             extendedData.get('authmode') || 
                             extendedData.get('Encryption') || 
                             '';
        const encryption = this.normalizeEncryption(encryptionStr);

        // Get channel
        const channelStr = extendedData.get('channel') || 
                          extendedData.get('Channel');
        const channel = channelStr ? parseInt(channelStr, 10) : undefined;

        // Get timestamp
        const timestampStr = extendedData.get('timestamp') || 
                            extendedData.get('time') ||
                            placemark.querySelector('TimeStamp when')?.textContent;
        const timestamp = timestampStr ? new Date(timestampStr) : new Date();

        // Get network type - default to WIFI for formats without type information
        const typeStr = extendedData.get('type') || 
                       extendedData.get('networktype') ||
                       extendedData.get('Type');
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

    private parseExtendedData(placemark: Element): Map<string, string> {
        const data = new Map<string, string>();

        // Parse ExtendedData elements
        const extendedData = placemark.querySelector('ExtendedData');
        if (extendedData) {
            const dataElements = extendedData.querySelectorAll('Data');
            dataElements.forEach(dataEl => {
                const name = dataEl.getAttribute('name');
                const value = dataEl.querySelector('value')?.textContent;
                if (name && value) {
                    data.set(name.toLowerCase(), value.trim());
                }
            });

            // Also check for SimpleData elements (used in some KML variants)
            const simpleDataElements = extendedData.querySelectorAll('SimpleData');
            simpleDataElements.forEach(dataEl => {
                const name = dataEl.getAttribute('name');
                const value = dataEl.textContent;
                if (name && value) {
                    data.set(name.toLowerCase(), value.trim());
                }
            });
        }

        // Parse description field (sometimes contains data)
        const description = placemark.querySelector('description')?.textContent;
        if (description) {
            this.parseDescriptionData(description, data);
        }

        return data;
    }

    private parseDescriptionData(description: string, data: Map<string, string>): void {
        // Try to parse key-value pairs from description
        const lines = description.split(/[\n\r]+/);
        lines.forEach(line => {
            const match = line.match(/^([^:]+):\s*(.+)$/);
            if (match) {
                const key = match[1].trim().toLowerCase();
                const value = match[2].trim();
                if (!data.has(key)) {
                    data.set(key, value);
                }
            }
        });
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
