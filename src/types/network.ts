/**
 * Core data types for WiFi networks
 */

export enum EncryptionType {
    OPEN = 'Open',
    WEP = 'WEP',
    WPA = 'WPA',
    WPA2 = 'WPA2',
    WPA3 = 'WPA3',
    UNKNOWN = 'Unknown'
}

export enum NetworkType {
    WIFI = 'WIFI',
    BLE = 'BLE',
    LTE = 'LTE'
}

export interface Network {
    id: number;
    bssid: string;
    ssid: string;
    encryption: EncryptionType;
    channel: number;
    manufacturer: string;
    firstSeen: Date;
    lastSeen: Date;
    observationCount: number;
    bestLat: number;
    bestLon: number;
    bestSignal: number;
    type: NetworkType;
}

export interface Observation {
    id: number;
    networkId: number;
    latitude: number;
    longitude: number;
    signalStrength: number;
    timestamp: Date;
}

export interface NetworkInput {
    bssid: string;
    ssid: string;
    encryption: string;
    channel?: number;
    manufacturer?: string;
    type?: string;
}

export interface ObservationInput {
    latitude: number;
    longitude: number;
    signalStrength: number;
    timestamp: Date;
}

export interface GeoBounds {
    north: number;
    south: number;
    east: number;
    west: number;
}

export interface DateRange {
    start: Date;
    end: Date;
}

export interface NetworkFilter {
    ssid?: string;
    bssid?: string;
    encryption?: EncryptionType[];
    bounds?: GeoBounds;
    dateRange?: DateRange;
    minSignal?: number;
    types?: string[];
}

export interface ImportResult {
    networksImported: number;
    networksUpdated: number;
    observationsAdded: number;
    errors: string[];
}
