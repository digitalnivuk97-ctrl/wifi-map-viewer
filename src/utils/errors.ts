/**
 * Custom error classes for different failure scenarios
 */

export class DatabaseError extends Error {
    constructor(message: string, public cause?: Error) {
        super(message);
        this.name = 'DatabaseError';
        Object.setPrototypeOf(this, DatabaseError.prototype);
    }
}

export class ParseError extends Error {
    constructor(
        message: string,
        public filename: string,
        public line?: number
    ) {
        super(message);
        this.name = 'ParseError';
        Object.setPrototypeOf(this, ParseError.prototype);
    }
}

export class ImportError extends Error {
    constructor(
        message: string,
        public partialResults?: {
            networksImported: number;
            networksUpdated: number;
            observationsAdded: number;
            errors: string[];
        }
    ) {
        super(message);
        this.name = 'ImportError';
        Object.setPrototypeOf(this, ImportError.prototype);
    }
}

export class ValidationError extends Error {
    constructor(
        message: string,
        public field?: string,
        public value?: any
    ) {
        super(message);
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
