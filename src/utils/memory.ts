/**
 * Memory monitoring and management utilities
 */

import { logger } from './logger';

/**
 * Get current memory usage information
 * Returns memory usage in MB
 */
export function getMemoryUsage(): { used: number; total: number; percentage: number } | null {
    // Check if we're in Electron/Node environment
    if (typeof process !== 'undefined' && process.memoryUsage) {
        const usage = process.memoryUsage();
        const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
        const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
        const percentage = Math.round((usage.heapUsed / usage.heapTotal) * 100);
        
        return {
            used: usedMB,
            total: totalMB,
            percentage
        };
    }
    
    // Browser environment - use performance.memory if available
    if (typeof performance !== 'undefined' && (performance as any).memory) {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
        const percentage = Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100);
        
        return {
            used: usedMB,
            total: totalMB,
            percentage
        };
    }
    
    return null;
}

/**
 * Log current memory usage
 */
export function logMemoryUsage(context: string): void {
    const usage = getMemoryUsage();
    if (usage) {
        logger.info(`Memory usage [${context}]: ${usage.used}MB / ${usage.total}MB (${usage.percentage}%)`);
    }
}

/**
 * Check if memory usage is approaching limits
 * Returns true if memory usage is above threshold (default 80%)
 */
export function isMemoryHigh(threshold = 80): boolean {
    const usage = getMemoryUsage();
    if (usage) {
        return usage.percentage >= threshold;
    }
    return false;
}

/**
 * Request garbage collection if available
 * Note: Requires --expose-gc flag in Node.js
 */
export function requestGarbageCollection(): void {
    if (typeof global !== 'undefined' && (global as any).gc) {
        try {
            (global as any).gc();
            logger.debug('Garbage collection requested');
        } catch (error) {
            logger.warn('Failed to request garbage collection');
        }
    }
}

/**
 * Monitor memory usage and warn if it exceeds threshold
 */
export function monitorMemory(context: string, threshold = 400): void {
    const usage = getMemoryUsage();
    if (usage && usage.used > threshold) {
        logger.warn(`High memory usage detected [${context}]: ${usage.used}MB (threshold: ${threshold}MB)`);
    }
}

/**
 * Clear array and help garbage collection
 */
export function clearArray<T>(arr: T[]): void {
    arr.length = 0;
}

/**
 * Clear map and help garbage collection
 */
export function clearMap<K, V>(map: Map<K, V>): void {
    map.clear();
}
