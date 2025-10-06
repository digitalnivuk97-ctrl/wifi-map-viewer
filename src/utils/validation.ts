/**
 * Input validation utilities
 */

import { ValidationError } from './errors';

/**
 * Validate latitude coordinate
 */
export function validateLatitude(lat: number): boolean {
    return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
}

/**
 * Validate longitude coordinate
 */
export function validateLongitude(lon: number): boolean {
    return typeof lon === 'number' && !isNaN(lon) && lon >= -180 && lon <= 180;
}

/**
 * Validate coordinate pair
 */
export function validateCoordinates(lat: number, lon: number): void {
    if (!validateLatitude(lat)) {
        throw new ValidationError(
            `Invalid latitude: ${lat}. Must be between -90 and 90.`,
            'latitude',
            lat
        );
    }
    if (!validateLongitude(lon)) {
        throw new ValidationError(
            `Invalid longitude: ${lon}. Must be between -180 and 180.`,
            'longitude',
            lon
        );
    }
}

/**
 * Validate BSSID (MAC address) format
 * Accepts formats: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX
 */
export function validateBSSID(bssid: string): boolean {
    if (typeof bssid !== 'string') {
        return false;
    }
    
    // Remove common separators
    const cleaned = bssid.replace(/[:-]/g, '');
    
    // Check if it's 12 hex characters
    return /^[0-9A-Fa-f]{12}$/.test(cleaned);
}

/**
 * Validate and normalize BSSID format
 */
export function normalizeBSSID(bssid: string): string {
    if (!validateBSSID(bssid)) {
        throw new ValidationError(
            `Invalid BSSID format: ${bssid}. Expected format: XX:XX:XX:XX:XX:XX`,
            'bssid',
            bssid
        );
    }
    
    // Normalize to uppercase with colons
    const cleaned = bssid.replace(/[:-]/g, '').toUpperCase();
    return cleaned.match(/.{2}/g)?.join(':') || bssid;
}

/**
 * Validate signal strength (typically -100 to 0 dBm)
 */
export function validateSignalStrength(signal: number): boolean {
    return typeof signal === 'number' && !isNaN(signal) && signal >= -120 && signal <= 0;
}

/**
 * Validate WiFi channel number
 */
export function validateChannel(channel: number): boolean {
    if (typeof channel !== 'number' || isNaN(channel)) {
        return false;
    }
    
    // 2.4 GHz channels: 1-14
    // 5 GHz channels: 36, 40, 44, 48, 52, 56, 60, 64, 100-144, 149-165
    const valid24GHz = channel >= 1 && channel <= 14;
    const valid5GHz = (
        (channel >= 36 && channel <= 64 && channel % 4 === 0) ||
        (channel >= 100 && channel <= 144 && channel % 4 === 0) ||
        (channel >= 149 && channel <= 165 && channel % 4 === 1)
    );
    
    return valid24GHz || valid5GHz;
}

/**
 * Validate SSID (network name)
 */
export function validateSSID(ssid: string): boolean {
    if (typeof ssid !== 'string') {
        return false;
    }
    
    // SSID can be 0-32 bytes
    // Allow empty SSID (hidden networks)
    return ssid.length <= 32;
}

/**
 * Validate timestamp
 */
export function validateTimestamp(timestamp: Date | number): boolean {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    
    // Check if valid date
    if (isNaN(date.getTime())) {
        return false;
    }
    
    // Check if reasonable (not in far future, not before WiFi existed ~1997)
    const minDate = new Date('1997-01-01').getTime();
    const maxDate = Date.now() + 86400000; // Allow up to 1 day in future for clock skew
    
    return date.getTime() >= minDate && date.getTime() <= maxDate;
}

/**
 * Sanitize string input to prevent injection attacks
 */
export function sanitizeString(input: string, maxLength = 255): string {
    if (typeof input !== 'string') {
        return '';
    }
    
    // Trim and limit length
    return input.trim().substring(0, maxLength);
}

/**
 * Validate file path to prevent directory traversal
 */
export function validateFilePath(filePath: string): boolean {
    if (typeof filePath !== 'string' || filePath.length === 0) {
        return false;
    }
    
    // Check for directory traversal attempts
    const dangerous = ['../', '..\\', '%2e%2e', '%252e%252e'];
    const normalized = filePath.toLowerCase();
    
    return !dangerous.some(pattern => normalized.includes(pattern));
}
