/**
 * Shared configuration types for Electron main and renderer processes
 */
export interface AppConfig {
    database: {
        path: string;
    };
    map: {
        defaultZoom: number;
        defaultCenter: [number, number];
        clusteringEnabled: boolean;
    };
}
/**
 * Deep partial type for nested config updates
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export declare const DEFAULT_CONFIG: AppConfig;
