/**
 * SQLite Database Parser
 * Parses SQLite database files with WiGLE-compatible schema
 * Note: SQLite parsing happens in the main process via IPC
 */

import type { IFileParser, ParsedNetwork, ProgressCallback } from './types';

export class SQLiteParser implements IFileParser {
    canParse(filename: string, content: string): boolean {
        // Check file extension
        const lower = filename.toLowerCase();
        if (!lower.endsWith('.db') && !lower.endsWith('.sqlite') && !lower.endsWith('.sqlite3')) {
            return false;
        }
        
        // Check SQLite magic header (first 16 bytes)
        return content.startsWith('SQLite format 3');
    }

    async parse(filePath: string, progressCallback?: ProgressCallback): Promise<ParsedNetwork[]> {
        // SQLite parsing must happen in main process because better-sqlite3 is a native module
        // Send request to main process via IPC
        if (typeof window === 'undefined' || !(window as any).electronAPI) {
            throw new Error('SQLite parsing requires Electron environment');
        }

        try {
            // Call main process to parse SQLite file
            const result = await (window as any).electronAPI.parseSQLiteFile(filePath, progressCallback);
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to parse SQLite file');
            }
            
            return result.networks;
        } catch (error) {
            throw new Error(`SQLite parsing failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    getFormatName(): string {
        return 'SQLite Database';
    }
}
