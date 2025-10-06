/**
 * SQLite Parser for Main Process
 * Handles SQLite database parsing using better-sqlite3 in the main process
 */
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
export declare class SQLiteParserMain {
    private DatabaseConstructor;
    constructor(DatabaseConstructor: any);
    parseSQLiteFile(filePath: string): {
        success: boolean;
        networks?: ParsedNetwork[];
        error?: string;
    };
    private detectSchema;
    private parseWigleSchema;
    private parseCustomSchema;
    private mapWigleRow;
    private mapCustomRow;
    private frequencyToChannel;
    private normalizeEncryption;
    private normalizeNetworkType;
}
export {};
