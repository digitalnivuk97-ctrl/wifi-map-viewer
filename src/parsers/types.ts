/**
 * File parser types and interfaces
 */

export interface ParsedNetwork {
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

export type ProgressCallback = (progress: number, message?: string) => void;

export interface IFileParser {
    /**
     * Check if this parser can handle the file
     */
    canParse(filename: string, content: string): boolean;
    
    /**
     * Parse file and return network data
     */
    parse(content: string, progressCallback?: ProgressCallback): Promise<ParsedNetwork[]>;
    
    /**
     * Get parser metadata
     */
    getFormatName(): string;
}
