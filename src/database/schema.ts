/**
 * Database schema and initialization for WiFi network storage
 */

export const SCHEMA_SQL = `
-- Networks table stores unique network identifiers
CREATE TABLE IF NOT EXISTS networks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bssid TEXT NOT NULL UNIQUE,
    ssid TEXT,
    encryption TEXT,
    channel INTEGER,
    manufacturer TEXT,
    first_seen INTEGER NOT NULL,
    last_seen INTEGER NOT NULL,
    observation_count INTEGER DEFAULT 1,
    best_lat REAL,
    best_lon REAL,
    best_signal INTEGER
);

-- Observations table stores individual sightings for trilateration
CREATE TABLE IF NOT EXISTS observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    network_id INTEGER NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    signal_strength INTEGER,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (network_id) REFERENCES networks(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_networks_bssid ON networks(bssid);
CREATE INDEX IF NOT EXISTS idx_networks_ssid ON networks(ssid);
CREATE INDEX IF NOT EXISTS idx_networks_location ON networks(best_lat, best_lon);
CREATE INDEX IF NOT EXISTS idx_observations_network ON observations(network_id);
CREATE INDEX IF NOT EXISTS idx_observations_timestamp ON observations(timestamp);
`;

/**
 * Initialize database with schema
 * @param db - better-sqlite3 database instance
 */
export function initializeDatabase(db: any): void {
    // Execute schema SQL
    db.exec(SCHEMA_SQL);
}
