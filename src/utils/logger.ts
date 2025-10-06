/**
 * Logging service for debugging and error tracking
 */

export enum LogLevel {
    ERROR = 'ERROR',
    WARN = 'WARN',
    INFO = 'INFO',
    DEBUG = 'DEBUG'
}

class Logger {
    private logBuffer: string[] = [];
    private maxBufferSize = 1000;

    /**
     * Log error message
     */
    error(message: string, error?: Error): void {
        const logEntry = this.formatLog(LogLevel.ERROR, message, error);
        console.error(logEntry);
        this.addToBuffer(logEntry);
        
        // In Electron environment, also write to file
        this.writeToFile(logEntry);
    }

    /**
     * Log warning message
     */
    warn(message: string): void {
        const logEntry = this.formatLog(LogLevel.WARN, message);
        console.warn(logEntry);
        this.addToBuffer(logEntry);
    }

    /**
     * Log info message
     */
    info(message: string): void {
        const logEntry = this.formatLog(LogLevel.INFO, message);
        console.info(logEntry);
        this.addToBuffer(logEntry);
    }

    /**
     * Log debug message
     */
    debug(message: string): void {
        const logEntry = this.formatLog(LogLevel.DEBUG, message);
        console.debug(logEntry);
        this.addToBuffer(logEntry);
    }

    /**
     * Format log entry
     */
    private formatLog(level: LogLevel, message: string, error?: Error): string {
        const timestamp = new Date().toISOString();
        let logMessage = `[${timestamp}] [${level}] ${message}`;
        
        if (error) {
            logMessage += `\n  Error: ${error.message}`;
            if (error.stack) {
                logMessage += `\n  Stack: ${error.stack}`;
            }
        }
        
        return logMessage;
    }

    /**
     * Add log entry to buffer
     */
    private addToBuffer(logEntry: string): void {
        this.logBuffer.push(logEntry);
        
        // Keep buffer size manageable
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer.shift();
        }
    }

    /**
     * Write log to file (Electron only)
     */
    private async writeToFile(logEntry: string): Promise<void> {
        try {
            if (typeof window !== 'undefined' && (window as any).electronAPI?.writeLog) {
                await (window as any).electronAPI.writeLog(logEntry);
            }
        } catch (error) {
            // Silently fail if logging to file fails
            console.error('Failed to write log to file:', error);
        }
    }

    /**
     * Get recent logs from buffer
     */
    getRecentLogs(count = 100): string[] {
        return this.logBuffer.slice(-count);
    }

    /**
     * Clear log buffer
     */
    clearBuffer(): void {
        this.logBuffer = [];
    }

    /**
     * Export logs as string
     */
    exportLogs(): string {
        return this.logBuffer.join('\n');
    }
}

// Export singleton instance
export const logger = new Logger();
