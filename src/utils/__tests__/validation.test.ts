/**
 * Tests for validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
    validateLatitude,
    validateLongitude,
    validateCoordinates,
    validateBSSID,
    normalizeBSSID,
    validateSignalStrength,
    validateChannel,
    validateSSID,
    validateTimestamp,
    sanitizeString,
    validateFilePath
} from '../validation';
import { ValidationError } from '../errors';

describe('Coordinate Validation', () => {
    it('should validate correct latitude', () => {
        expect(validateLatitude(0)).toBe(true);
        expect(validateLatitude(45.5)).toBe(true);
        expect(validateLatitude(-45.5)).toBe(true);
        expect(validateLatitude(90)).toBe(true);
        expect(validateLatitude(-90)).toBe(true);
    });

    it('should reject invalid latitude', () => {
        expect(validateLatitude(91)).toBe(false);
        expect(validateLatitude(-91)).toBe(false);
        expect(validateLatitude(NaN)).toBe(false);
    });

    it('should validate correct longitude', () => {
        expect(validateLongitude(0)).toBe(true);
        expect(validateLongitude(122.5)).toBe(true);
        expect(validateLongitude(-122.5)).toBe(true);
        expect(validateLongitude(180)).toBe(true);
        expect(validateLongitude(-180)).toBe(true);
    });

    it('should reject invalid longitude', () => {
        expect(validateLongitude(181)).toBe(false);
        expect(validateLongitude(-181)).toBe(false);
        expect(validateLongitude(NaN)).toBe(false);
    });

    it('should validate coordinate pairs', () => {
        expect(() => validateCoordinates(37.7749, -122.4194)).not.toThrow();
        expect(() => validateCoordinates(0, 0)).not.toThrow();
    });

    it('should throw ValidationError for invalid coordinates', () => {
        expect(() => validateCoordinates(91, 0)).toThrow(ValidationError);
        expect(() => validateCoordinates(0, 181)).toThrow(ValidationError);
    });
});

describe('BSSID Validation', () => {
    it('should validate correct BSSID formats', () => {
        expect(validateBSSID('00:11:22:33:44:55')).toBe(true);
        expect(validateBSSID('AA:BB:CC:DD:EE:FF')).toBe(true);
        expect(validateBSSID('00-11-22-33-44-55')).toBe(true);
        expect(validateBSSID('001122334455')).toBe(true);
    });

    it('should reject invalid BSSID formats', () => {
        expect(validateBSSID('00:11:22:33:44')).toBe(false);
        expect(validateBSSID('00:11:22:33:44:55:66')).toBe(false);
        expect(validateBSSID('GG:HH:II:JJ:KK:LL')).toBe(false);
        expect(validateBSSID('')).toBe(false);
    });

    it('should normalize BSSID to standard format', () => {
        expect(normalizeBSSID('00:11:22:33:44:55')).toBe('00:11:22:33:44:55');
        expect(normalizeBSSID('00-11-22-33-44-55')).toBe('00:11:22:33:44:55');
        expect(normalizeBSSID('001122334455')).toBe('00:11:22:33:44:55');
        expect(normalizeBSSID('aa:bb:cc:dd:ee:ff')).toBe('AA:BB:CC:DD:EE:FF');
    });

    it('should throw ValidationError for invalid BSSID', () => {
        expect(() => normalizeBSSID('invalid')).toThrow(ValidationError);
    });
});

describe('Signal Strength Validation', () => {
    it('should validate correct signal strengths', () => {
        expect(validateSignalStrength(-50)).toBe(true);
        expect(validateSignalStrength(-100)).toBe(true);
        expect(validateSignalStrength(0)).toBe(true);
        expect(validateSignalStrength(-120)).toBe(true);
    });

    it('should reject invalid signal strengths', () => {
        expect(validateSignalStrength(1)).toBe(false);
        expect(validateSignalStrength(-121)).toBe(false);
        expect(validateSignalStrength(NaN)).toBe(false);
    });
});

describe('Channel Validation', () => {
    it('should validate 2.4 GHz channels', () => {
        expect(validateChannel(1)).toBe(true);
        expect(validateChannel(6)).toBe(true);
        expect(validateChannel(11)).toBe(true);
        expect(validateChannel(14)).toBe(true);
    });

    it('should validate 5 GHz channels', () => {
        expect(validateChannel(36)).toBe(true);
        expect(validateChannel(40)).toBe(true);
        expect(validateChannel(149)).toBe(true);
        expect(validateChannel(165)).toBe(true);
    });

    it('should reject invalid channels', () => {
        expect(validateChannel(0)).toBe(false);
        expect(validateChannel(15)).toBe(false);
        expect(validateChannel(37)).toBe(false);
        expect(validateChannel(200)).toBe(false);
    });
});

describe('SSID Validation', () => {
    it('should validate correct SSIDs', () => {
        expect(validateSSID('MyNetwork')).toBe(true);
        expect(validateSSID('Network-5G')).toBe(true);
        expect(validateSSID('')).toBe(true); // Hidden network
        expect(validateSSID('A'.repeat(32))).toBe(true);
    });

    it('should reject SSIDs that are too long', () => {
        expect(validateSSID('A'.repeat(33))).toBe(false);
    });
});

describe('Timestamp Validation', () => {
    it('should validate correct timestamps', () => {
        expect(validateTimestamp(new Date())).toBe(true);
        expect(validateTimestamp(new Date('2020-01-01'))).toBe(true);
        expect(validateTimestamp(Date.now())).toBe(true);
    });

    it('should reject invalid timestamps', () => {
        expect(validateTimestamp(new Date('invalid'))).toBe(false);
        expect(validateTimestamp(new Date('1990-01-01'))).toBe(false); // Before WiFi
        expect(validateTimestamp(new Date('2030-01-01'))).toBe(false); // Too far in future
    });
});

describe('String Sanitization', () => {
    it('should sanitize strings', () => {
        expect(sanitizeString('  test  ')).toBe('test');
        expect(sanitizeString('a'.repeat(300), 100)).toBe('a'.repeat(100));
    });
});

describe('File Path Validation', () => {
    it('should validate safe file paths', () => {
        expect(validateFilePath('/path/to/file.csv')).toBe(true);
        expect(validateFilePath('C:\\Users\\file.csv')).toBe(true);
    });

    it('should reject directory traversal attempts', () => {
        expect(validateFilePath('../../../etc/passwd')).toBe(false);
        expect(validateFilePath('..\\..\\windows\\system32')).toBe(false);
        expect(validateFilePath('')).toBe(false);
    });
});
