/**
 * Database initialization and repository for main process
 * This file duplicates some logic from src/database to avoid cross-boundary imports
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
// Database schema
var SCHEMA_SQL = "\n-- Networks table stores unique network identifiers\nCREATE TABLE IF NOT EXISTS networks (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    bssid TEXT NOT NULL UNIQUE,\n    ssid TEXT,\n    encryption TEXT,\n    channel INTEGER,\n    manufacturer TEXT,\n    first_seen INTEGER NOT NULL,\n    last_seen INTEGER NOT NULL,\n    observation_count INTEGER DEFAULT 1,\n    best_lat REAL,\n    best_lon REAL,\n    best_signal INTEGER,\n    type TEXT DEFAULT 'WIFI'\n);\n\n-- Observations table stores individual sightings for trilateration\nCREATE TABLE IF NOT EXISTS observations (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    network_id INTEGER NOT NULL,\n    latitude REAL NOT NULL,\n    longitude REAL NOT NULL,\n    signal_strength INTEGER,\n    timestamp INTEGER NOT NULL,\n    FOREIGN KEY (network_id) REFERENCES networks(id) ON DELETE CASCADE\n);\n\n-- Indexes for performance\nCREATE INDEX IF NOT EXISTS idx_networks_bssid ON networks(bssid);\nCREATE INDEX IF NOT EXISTS idx_networks_ssid ON networks(ssid);\nCREATE INDEX IF NOT EXISTS idx_networks_location ON networks(best_lat, best_lon);\nCREATE INDEX IF NOT EXISTS idx_networks_type ON networks(type);\nCREATE INDEX IF NOT EXISTS idx_observations_network ON observations(network_id);\nCREATE INDEX IF NOT EXISTS idx_observations_timestamp ON observations(timestamp);\n";
/**
 * Initialize database with schema
 */
export function initializeDatabase(db) {
    db.exec(SCHEMA_SQL);
    // Run migrations for existing databases
    migrateDatabase(db);
}
/**
 * Run database migrations for schema updates
 */
function migrateDatabase(db) {
    // Check if type column exists in networks table
    var tableInfo = db.prepare("PRAGMA table_info(networks)").all();
    var hasTypeColumn = tableInfo.some(function (col) { return col.name === 'type'; });
    if (!hasTypeColumn) {
        // Add type column with default value 'WIFI' for backward compatibility
        db.exec("\n            ALTER TABLE networks ADD COLUMN type TEXT DEFAULT 'WIFI';\n            CREATE INDEX IF NOT EXISTS idx_networks_type ON networks(type);\n        ");
    }
}
/**
 * Calculate weighted centroid position based on observations
 */
function calculateWeightedCentroid(observations) {
    if (observations.length === 0) {
        throw new Error('Cannot calculate centroid with no observations');
    }
    if (observations.length === 1) {
        return {
            latitude: observations[0].latitude,
            longitude: observations[0].longitude
        };
    }
    var totalWeight = 0;
    var weightedLat = 0;
    var weightedLon = 0;
    for (var _i = 0, observations_1 = observations; _i < observations_1.length; _i++) {
        var obs = observations_1[_i];
        // Weight is signal strength squared (inverse square law)
        var weight = Math.pow(Math.abs(obs.signalStrength), 2);
        totalWeight += weight;
        weightedLat += obs.latitude * weight;
        weightedLon += obs.longitude * weight;
    }
    return {
        latitude: weightedLat / totalWeight,
        longitude: weightedLon / totalWeight
    };
}
/**
 * Get manufacturer from BSSID OUI prefix
 * This is a simplified version - full OUI lookup is in renderer process
 */
function getManufacturerFromBssid(_bssid) {
    // For now, return Unknown - full OUI lookup happens in renderer
    return 'Unknown';
}
/**
 * NetworkRepository for main process database operations
 */
var MainProcessNetworkRepository = /** @class */ (function () {
    function MainProcessNetworkRepository(db) {
        this.db = db;
    }
    /**
     * Create or update network with observation
     */
    MainProcessNetworkRepository.prototype.upsertNetwork = function (network, observation) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, manufacturer, networkType, existing, networkId, result, networkId;
            return __generator(this, function (_a) {
                timestamp = observation.timestamp.getTime();
                manufacturer = network.manufacturer || getManufacturerFromBssid(network.bssid);
                networkType = network.type || 'WIFI';
                existing = this.db.prepare('SELECT id FROM networks WHERE bssid = ?').get(network.bssid);
                if (existing) {
                    networkId = existing.id;
                    this.db.prepare("\n                UPDATE networks \n                SET ssid = ?,\n                    encryption = ?,\n                    channel = ?,\n                    manufacturer = ?,\n                    last_seen = ?,\n                    observation_count = observation_count + 1,\n                    type = ?\n                WHERE id = ?\n            ").run(network.ssid, network.encryption, network.channel || null, manufacturer, timestamp, networkType, networkId);
                    this.db.prepare("\n                INSERT INTO observations (network_id, latitude, longitude, signal_strength, timestamp)\n                VALUES (?, ?, ?, ?, ?)\n            ").run(networkId, observation.latitude, observation.longitude, observation.signalStrength, timestamp);
                    this.recalculatePositionSync(networkId);
                    return [2 /*return*/, networkId];
                }
                else {
                    result = this.db.prepare("\n                INSERT INTO networks (\n                    bssid, ssid, encryption, channel, manufacturer,\n                    first_seen, last_seen, observation_count,\n                    best_lat, best_lon, best_signal, type\n                ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)\n            ").run(network.bssid, network.ssid, network.encryption, network.channel || null, manufacturer, timestamp, timestamp, observation.latitude, observation.longitude, observation.signalStrength, networkType);
                    networkId = result.lastInsertRowid;
                    this.db.prepare("\n                INSERT INTO observations (network_id, latitude, longitude, signal_strength, timestamp)\n                VALUES (?, ?, ?, ?, ?)\n            ").run(networkId, observation.latitude, observation.longitude, observation.signalStrength, timestamp);
                    return [2 /*return*/, networkId];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Query networks with filters
     */
    MainProcessNetworkRepository.prototype.findNetworks = function (filter_1) {
        return __awaiter(this, arguments, void 0, function (filter, limit, offset) {
            var query, params, rows;
            var _a;
            if (limit === void 0) { limit = 1000; }
            if (offset === void 0) { offset = 0; }
            return __generator(this, function (_b) {
                query = 'SELECT * FROM networks WHERE 1=1';
                params = [];
                if (filter.ssid) {
                    query += ' AND ssid LIKE ?';
                    params.push("%".concat(filter.ssid, "%"));
                }
                if (filter.bssid) {
                    query += ' AND bssid LIKE ?';
                    params.push("%".concat(filter.bssid, "%"));
                }
                if (filter.encryption && filter.encryption.length > 0) {
                    query += " AND encryption IN (".concat(filter.encryption.map(function () { return '?'; }).join(','), ")");
                    params.push.apply(params, filter.encryption);
                }
                if (filter.bounds) {
                    query += ' AND best_lat BETWEEN ? AND ? AND best_lon BETWEEN ? AND ?';
                    params.push(filter.bounds.south, filter.bounds.north, filter.bounds.west, filter.bounds.east);
                }
                if (filter.dateRange) {
                    query += ' AND last_seen BETWEEN ? AND ?';
                    params.push(filter.dateRange.start.getTime(), filter.dateRange.end.getTime());
                }
                if (filter.minSignal !== undefined) {
                    query += ' AND best_signal >= ?';
                    params.push(filter.minSignal);
                }
                if (filter.types && filter.types.length > 0) {
                    query += " AND type IN (".concat(filter.types.map(function () { return '?'; }).join(','), ")");
                    params.push.apply(params, filter.types);
                }
                query += ' LIMIT ? OFFSET ?';
                params.push(limit, offset);
                rows = (_a = this.db.prepare(query)).all.apply(_a, params);
                return [2 /*return*/, rows.map(this.mapRowToNetwork)];
            });
        });
    };
    /**
     * Get single network by BSSID
     */
    MainProcessNetworkRepository.prototype.getNetworkByBssid = function (bssid) {
        return __awaiter(this, void 0, void 0, function () {
            var row;
            return __generator(this, function (_a) {
                row = this.db.prepare('SELECT * FROM networks WHERE bssid = ?').get(bssid);
                return [2 /*return*/, row ? this.mapRowToNetwork(row) : null];
            });
        });
    };
    /**
     * Get observations for a network
     */
    MainProcessNetworkRepository.prototype.getObservations = function (networkId) {
        return __awaiter(this, void 0, void 0, function () {
            var rows;
            return __generator(this, function (_a) {
                rows = this.db.prepare('SELECT * FROM observations WHERE network_id = ?').all(networkId);
                return [2 /*return*/, rows.map(function (row) { return ({
                        id: row.id,
                        networkId: row.network_id,
                        latitude: row.latitude,
                        longitude: row.longitude,
                        signalStrength: row.signal_strength,
                        timestamp: new Date(row.timestamp)
                    }); })];
            });
        });
    };
    /**
     * Batch insert for imports
     */
    MainProcessNetworkRepository.prototype.batchInsertNetworks = function (networks) {
        return __awaiter(this, void 0, void 0, function () {
            var result, transaction;
            var _this = this;
            return __generator(this, function (_a) {
                result = {
                    networksImported: 0,
                    networksUpdated: 0,
                    observationsAdded: 0,
                    errors: []
                };
                transaction = this.db.transaction(function (items) {
                    for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
                        var item = items_1[_i];
                        try {
                            var existing = _this.db.prepare('SELECT id FROM networks WHERE bssid = ?').get(item.network.bssid);
                            if (existing) {
                                result.networksUpdated++;
                            }
                            else {
                                result.networksImported++;
                            }
                            _this.upsertNetworkSync(item.network, item.observation);
                            result.observationsAdded++;
                        }
                        catch (error) {
                            result.errors.push("Error importing ".concat(item.network.bssid, ": ").concat(error));
                        }
                    }
                });
                transaction(networks);
                return [2 /*return*/, result];
            });
        });
    };
    /**
     * Synchronous version of upsertNetwork for use in transactions
     */
    MainProcessNetworkRepository.prototype.upsertNetworkSync = function (network, observation) {
        var timestamp = observation.timestamp.getTime();
        var manufacturer = network.manufacturer || getManufacturerFromBssid(network.bssid);
        var networkType = network.type || 'WIFI';
        var existing = this.db.prepare('SELECT id FROM networks WHERE bssid = ?').get(network.bssid);
        if (existing) {
            var networkId = existing.id;
            this.db.prepare("\n                UPDATE networks \n                SET ssid = ?,\n                    encryption = ?,\n                    channel = ?,\n                    manufacturer = ?,\n                    last_seen = ?,\n                    observation_count = observation_count + 1,\n                    type = ?\n                WHERE id = ?\n            ").run(network.ssid, network.encryption, network.channel || null, manufacturer, timestamp, networkType, networkId);
            this.db.prepare("\n                INSERT INTO observations (network_id, latitude, longitude, signal_strength, timestamp)\n                VALUES (?, ?, ?, ?, ?)\n            ").run(networkId, observation.latitude, observation.longitude, observation.signalStrength, timestamp);
            this.recalculatePositionSync(networkId);
            return networkId;
        }
        else {
            var result = this.db.prepare("\n                INSERT INTO networks (\n                    bssid, ssid, encryption, channel, manufacturer,\n                    first_seen, last_seen, observation_count,\n                    best_lat, best_lon, best_signal, type\n                ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)\n            ").run(network.bssid, network.ssid, network.encryption, network.channel || null, manufacturer, timestamp, timestamp, observation.latitude, observation.longitude, observation.signalStrength, networkType);
            var networkId = result.lastInsertRowid;
            this.db.prepare("\n                INSERT INTO observations (network_id, latitude, longitude, signal_strength, timestamp)\n                VALUES (?, ?, ?, ?, ?)\n            ").run(networkId, observation.latitude, observation.longitude, observation.signalStrength, timestamp);
            return networkId;
        }
    };
    /**
     * Recalculate position - synchronous implementation
     */
    MainProcessNetworkRepository.prototype.recalculatePositionSync = function (networkId) {
        var rows = this.db.prepare('SELECT * FROM observations WHERE network_id = ?').all(networkId);
        if (rows.length === 0) {
            return;
        }
        var observations = rows.map(function (row) { return ({
            id: row.id,
            networkId: row.network_id,
            latitude: row.latitude,
            longitude: row.longitude,
            signalStrength: row.signal_strength,
            timestamp: new Date(row.timestamp)
        }); });
        var position = calculateWeightedCentroid(observations);
        var bestSignal = Math.max.apply(Math, observations.map(function (obs) { return obs.signalStrength; }));
        this.db.prepare("\n            UPDATE networks \n            SET best_lat = ?,\n                best_lon = ?,\n                best_signal = ?\n            WHERE id = ?\n        ").run(position.latitude, position.longitude, bestSignal, networkId);
    };
    /**
     * Delete all networks
     */
    MainProcessNetworkRepository.prototype.clearAllNetworks = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.db.prepare('DELETE FROM observations').run();
                this.db.prepare('DELETE FROM networks').run();
                return [2 /*return*/];
            });
        });
    };
    /**
     * Map database row to Network object
     */
    MainProcessNetworkRepository.prototype.mapRowToNetwork = function (row) {
        return {
            id: row.id,
            bssid: row.bssid,
            ssid: row.ssid,
            encryption: row.encryption,
            channel: row.channel,
            manufacturer: row.manufacturer,
            firstSeen: new Date(row.first_seen),
            lastSeen: new Date(row.last_seen),
            observationCount: row.observation_count,
            bestLat: row.best_lat,
            bestLon: row.best_lon,
            bestSignal: row.best_signal,
            type: row.type || 'WIFI'
        };
    };
    return MainProcessNetworkRepository;
}());
export { MainProcessNetworkRepository };
