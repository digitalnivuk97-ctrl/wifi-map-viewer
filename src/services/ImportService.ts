/**
 * ImportService handles file imports with format detection and batch processing
 */

import type { IFileParser, ParsedNetwork, ProgressCallback } from '../parsers/types';
import type { ImportResult, NetworkInput, ObservationInput } from '../types/network';
import { WigleCSVParser } from '../parsers/WigleCSVParser';
import { KismetCSVParser } from '../parsers/KismetCSVParser';
import { KMLParser } from '../parsers/KMLParser';
import { SQLiteParser } from '../parsers/SQLiteParser';
import { databaseService } from './DatabaseService';
import { ImportError, ParseError } from '../utils/errors';
import { validateFilePath } from '../utils/validation';
import { logger } from '../utils/logger';
import { logMemoryUsage, monitorMemory, isMemoryHigh } from '../utils/memory';

const BATCH_SIZE = 1000;

export class ImportService {
    private parsers: IFileParser[];

    constructor() {
        // Initialize all available parsers
        this.parsers = [
            new WigleCSVParser(),
            new KismetCSVParser(),
            new KMLParser(),
            new SQLiteParser()
        ];
    }

    /**
     * Import file with automatic format detection
     */
    async importFile(
        filePath: string,
        progressCallback?: ProgressCallback
    ): Promise<ImportResult> {
        try {
            logger.info(`Starting import of file: ${filePath}`);
            logMemoryUsage('Import start');
            
            // Validate file path
            if (!validateFilePath(filePath)) {
                throw new ImportError('Invalid file path');
            }
            
            // Read file content (for format detection)
            let content = await this.readFile(filePath);
            logMemoryUsage('After file read');
            
            // Detect parser
            const parser = this.detectParser(filePath, content);
            if (!parser) {
                throw new ImportError('Unsupported file format. Unable to detect parser.');
            }

            if (progressCallback) {
                progressCallback(0, `Detected format: ${parser.getFormatName()}`);
            }

            // Parse file with progress updates
            const parseProgressCallback: ProgressCallback = (progress, message) => {
                if (progressCallback) {
                    // Reserve 0-70% for parsing
                    progressCallback(progress * 0.7, message);
                }
            };

            // SQLite parser needs file path, others need content
            const parsedNetworks = parser.getFormatName() === 'SQLite Database'
                ? await parser.parse(filePath, parseProgressCallback)
                : await parser.parse(content, parseProgressCallback);

            // Clear content from memory after parsing
            content = '';
            logMemoryUsage('After parsing');
            monitorMemory('Post-parse', 400);

            if (parsedNetworks.length === 0) {
                logger.warn('No networks parsed from file');
                return {
                    networksImported: 0,
                    networksUpdated: 0,
                    observationsAdded: 0,
                    errors: ['No valid networks found in file']
                };
            }

            if (progressCallback) {
                progressCallback(70, `Parsed ${parsedNetworks.length} networks. Starting import...`);
            }

            // Import in batches
            const result = await this.importInBatches(parsedNetworks, progressCallback);

            // Clear parsed networks from memory after import
            parsedNetworks.length = 0;
            logMemoryUsage('After import');

            if (progressCallback) {
                progressCallback(100, 'Import complete');
            }

            logger.info(`Import complete: ${result.networksImported} imported, ${result.networksUpdated} updated, ${result.errors.length} errors`);
            return result;
        } catch (error) {
            logger.error('Import failed', error instanceof Error ? error : new Error(String(error)));
            
            if (error instanceof ImportError || error instanceof ParseError) {
                throw error;
            }
            
            throw new ImportError(
                `Import failed: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Detect appropriate parser based on file extension and content
     */
    private detectParser(filename: string, content: string): IFileParser | null {
        logger.info(`Detecting parser for: ${filename}`);
        logger.info(`Content length: ${content.length}, First 200 chars: ${content.substring(0, 200)}`);
        
        for (const parser of this.parsers) {
            const canParse = parser.canParse(filename, content);
            logger.info(`${parser.getFormatName()}: ${canParse ? 'YES' : 'NO'}`);
            if (canParse) {
                return parser;
            }
        }
        
        logger.warn('No parser found for file');
        return null;
    }

    /**
     * Import parsed networks in batches to prevent memory issues
     */
    private async importInBatches(
        parsedNetworks: ParsedNetwork[],
        progressCallback?: ProgressCallback
    ): Promise<ImportResult> {
        const totalNetworks = parsedNetworks.length;
        const aggregatedResult: ImportResult = {
            networksImported: 0,
            networksUpdated: 0,
            observationsAdded: 0,
            errors: []
        };

        // Process in batches
        for (let i = 0; i < totalNetworks; i += BATCH_SIZE) {
            const batch = parsedNetworks.slice(i, Math.min(i + BATCH_SIZE, totalNetworks));
            
            // Convert parsed networks to repository format
            const networkBatch = batch.map(parsed => ({
                network: this.toNetworkInput(parsed),
                observation: this.toObservationInput(parsed)
            }));

            try {
                // Insert batch using database service (via IPC)
                const batchResult = await databaseService.batchInsertNetworks(networkBatch);
                
                // Aggregate results
                aggregatedResult.networksImported += batchResult.networksImported;
                aggregatedResult.networksUpdated += batchResult.networksUpdated;
                aggregatedResult.observationsAdded += batchResult.observationsAdded;
                aggregatedResult.errors.push(...batchResult.errors);

                // Clear batch from memory
                networkBatch.length = 0;

                // Monitor memory usage and warn if high
                if (isMemoryHigh(75)) {
                    logger.warn(`High memory usage during import batch ${i / BATCH_SIZE + 1}`);
                    monitorMemory(`Import batch ${i / BATCH_SIZE + 1}`, 400);
                }

                // Report progress
                if (progressCallback) {
                    const processed = Math.min(i + BATCH_SIZE, totalNetworks);
                    const progress = 70 + (processed / totalNetworks) * 30; // 70-100%
                    progressCallback(
                        progress,
                        `Imported ${processed} of ${totalNetworks} networks`
                    );
                }
            } catch (error) {
                const errorMsg = `Batch ${i / BATCH_SIZE + 1} failed: ${error instanceof Error ? error.message : String(error)}`;
                aggregatedResult.errors.push(errorMsg);
            }
        }

        return aggregatedResult;
    }

    /**
     * Convert ParsedNetwork to NetworkInput
     */
    private toNetworkInput(parsed: ParsedNetwork): NetworkInput {
        return {
            bssid: parsed.bssid,
            ssid: parsed.ssid,
            encryption: parsed.encryption,
            channel: parsed.channel,
            manufacturer: this.getManufacturerFromBssid(parsed.bssid),
            type: parsed.type
        };
    }

    /**
     * Convert ParsedNetwork to ObservationInput
     */
    private toObservationInput(parsed: ParsedNetwork): ObservationInput {
        return {
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            signalStrength: parsed.signalStrength,
            timestamp: parsed.timestamp
        };
    }

    /**
     * Extract manufacturer from BSSID (placeholder - will be enhanced with OUI lookup)
     */
    private getManufacturerFromBssid(_bssid: string): string {
        // TODO: Implement OUI lookup in task 9
        // The bssid parameter will be used when OUI lookup is implemented
        return 'Unknown';
    }

    /**
     * Read file content from disk
     * This method will use Electron's IPC to read files from the main process
     */
    private async readFile(filePath: string): Promise<string> {
        // Check if we're in Electron environment
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
            // Use Electron IPC to read file
            return await (window as any).electronAPI.readFile(filePath);
        }
        
        // Fallback for testing/development - use File API
        throw new Error('File reading requires Electron environment. Please ensure the app is running in Electron.');
    }

    /**
     * Get list of available parsers
     */
    getAvailableParsers(): string[] {
        return this.parsers.map(parser => parser.getFormatName());
    }

    /**
     * Detect file format without parsing
     */
    async detectFileFormat(filePath: string): Promise<string | null> {
        try {
            const content = await this.readFile(filePath);
            const parser = this.detectParser(filePath, content);
            return parser ? parser.getFormatName() : null;
        } catch (error) {
            return null;
        }
    }
}
