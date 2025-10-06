/**
 * Shared configuration types for Electron main and renderer processes
 */
export var DEFAULT_CONFIG = {
    database: {
        path: './wigle-data.db'
    },
    map: {
        defaultZoom: 13,
        defaultCenter: [0, 0],
        clusteringEnabled: true
    }
};
