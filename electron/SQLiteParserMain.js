/**
 * SQLite Parser for Main Process
 * Handles SQLite database parsing using better-sqlite3 in the main process
 */
var SQLiteParserMain = /** @class */ (function () {
    function SQLiteParserMain(DatabaseConstructor) {
        this.DatabaseConstructor = DatabaseConstructor;
    }
    SQLiteParserMain.prototype.parseSQLiteFile = function (filePath) {
        var db = null;
        try {
            db = new this.DatabaseConstructor(filePath, { readonly: true });
            // Detect schema type
            var schema = this.detectSchema(db);
            var networks = void 0;
            if (schema === 'wigle') {
                networks = this.parseWigleSchema(db);
            }
            else if (schema === 'custom') {
                networks = this.parseCustomSchema(db);
            }
            else {
                return { success: false, error: 'Unsupported database schema' };
            }
            return { success: true, networks: networks };
        }
        catch (error) {
            return {
                success: false,
                error: "Failed to parse SQLite file: ".concat(error instanceof Error ? error.message : String(error))
            };
        }
        finally {
            if (db) {
                db.close();
            }
        }
    };
    SQLiteParserMain.prototype.detectSchema = function (db) {
        // Get list of tables
        var tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        var tableNames = tables.map(function (t) { return t.name.toLowerCase(); });
        // Check for WiGLE schema (network and location tables)
        if (tableNames.includes('network') && tableNames.includes('location')) {
            return 'wigle';
        }
        // Check for custom schema (networks table)
        if (tableNames.includes('networks')) {
            return 'custom';
        }
        return 'unknown';
    };
    SQLiteParserMain.prototype.parseWigleSchema = function (db) {
        var _this = this;
        // WiGLE schema typically has network and location tables
        // Check if type column exists in network table
        var columns = db.prepare("PRAGMA table_info(network)").all();
        var hasTypeColumn = columns.some(function (col) { return col.name.toLowerCase() === 'type'; });
        var query = "\n            SELECT \n                n.bssid,\n                n.ssid,\n                n.capabilities as encryption,\n                n.frequency,\n                ".concat(hasTypeColumn ? 'n.type,' : '', "\n                l.lat as latitude,\n                l.lon as longitude,\n                l.level as signal,\n                l.time as timestamp\n            FROM network n\n            LEFT JOIN location l ON n.bssid = l.bssid\n            WHERE l.lat IS NOT NULL AND l.lon IS NOT NULL\n        ");
        var rows = db.prepare(query).all();
        var networks = [];
        rows.forEach(function (row, index) {
            try {
                var network = _this.mapWigleRow(row);
                if (network) {
                    networks.push(network);
                }
            }
            catch (error) {
                console.warn("Skipping invalid row ".concat(index, ":"), error);
            }
        });
        return networks;
    };
    SQLiteParserMain.prototype.parseCustomSchema = function (db) {
        var _this = this;
        // Try to parse custom schema with networks table
        // Check if type column exists
        var columns = db.prepare("PRAGMA table_info(networks)").all();
        var hasTypeColumn = columns.some(function (col) { return col.name.toLowerCase() === 'type'; });
        var query = "\n            SELECT \n                bssid,\n                ssid,\n                encryption,\n                channel,\n                best_lat,\n                best_lon,\n                best_signal,\n                last_seen\n                ".concat(hasTypeColumn ? ', type' : '', "\n            FROM networks\n            WHERE best_lat IS NOT NULL AND best_lon IS NOT NULL\n        ");
        var rows = db.prepare(query).all();
        var networks = [];
        rows.forEach(function (row, index) {
            try {
                var network = _this.mapCustomRow(row);
                if (network) {
                    networks.push(network);
                }
            }
            catch (error) {
                console.warn("Skipping invalid row ".concat(index, ":"), error);
            }
        });
        return networks;
    };
    SQLiteParserMain.prototype.mapWigleRow = function (row) {
        if (!row.bssid || !row.latitude || !row.longitude) {
            return null;
        }
        var latitude = parseFloat(row.latitude);
        var longitude = parseFloat(row.longitude);
        if (isNaN(latitude) || isNaN(longitude) ||
            latitude < -90 || latitude > 90 ||
            longitude < -180 || longitude > 180) {
            return null;
        }
        var channel = row.frequency ? this.frequencyToChannel(row.frequency) : undefined;
        var type = this.normalizeNetworkType(row.type);
        return {
            bssid: row.bssid.toUpperCase(),
            ssid: row.ssid || '',
            latitude: latitude,
            longitude: longitude,
            signalStrength: row.signal || -70,
            timestamp: row.timestamp ? new Date(row.timestamp) : new Date(),
            encryption: this.normalizeEncryption(row.encryption || ''),
            channel: channel,
            type: type
        };
    };
    SQLiteParserMain.prototype.mapCustomRow = function (row) {
        if (!row.bssid || !row.best_lat || !row.best_lon) {
            return null;
        }
        var latitude = parseFloat(row.best_lat);
        var longitude = parseFloat(row.best_lon);
        if (isNaN(latitude) || isNaN(longitude) ||
            latitude < -90 || latitude > 90 ||
            longitude < -180 || longitude > 180) {
            return null;
        }
        var type = this.normalizeNetworkType(row.type);
        return {
            bssid: row.bssid.toUpperCase(),
            ssid: row.ssid || '',
            latitude: latitude,
            longitude: longitude,
            signalStrength: row.best_signal || -70,
            timestamp: row.last_seen ? new Date(row.last_seen) : new Date(),
            encryption: this.normalizeEncryption(row.encryption || ''),
            channel: row.channel,
            type: type
        };
    };
    SQLiteParserMain.prototype.frequencyToChannel = function (frequency) {
        // Convert WiFi frequency (MHz) to channel number
        if (frequency >= 2412 && frequency <= 2484) {
            // 2.4 GHz band
            if (frequency === 2484)
                return 14;
            return (frequency - 2412) / 5 + 1;
        }
        else if (frequency >= 5170 && frequency <= 5825) {
            // 5 GHz band
            return (frequency - 5170) / 5 + 34;
        }
        return 0;
    };
    SQLiteParserMain.prototype.normalizeEncryption = function (encryption) {
        var enc = encryption.toUpperCase();
        if (enc.includes('WPA3'))
            return 'WPA3';
        if (enc.includes('WPA2') || enc.includes('RSN'))
            return 'WPA2';
        if (enc.includes('WPA'))
            return 'WPA';
        if (enc.includes('WEP'))
            return 'WEP';
        if (enc.includes('OPEN') || enc.includes('NONE') || enc === '' || enc.includes('ESS'))
            return 'Open';
        return 'Unknown';
    };
    SQLiteParserMain.prototype.normalizeNetworkType = function (type) {
        if (!type) {
            return 'WIFI'; // Default to WIFI for formats without type information
        }
        var normalized = type.toUpperCase().trim();
        // Map Type values to NetworkType enum
        if (normalized === 'WIFI' || normalized === 'WI-FI')
            return 'WIFI';
        if (normalized === 'BLE' || normalized === 'BLUETOOTH')
            return 'BLE';
        if (normalized === 'LTE' || normalized === 'CELL')
            return 'LTE';
        // Default to WIFI if unrecognized
        return 'WIFI';
    };
    return SQLiteParserMain;
}());
export { SQLiteParserMain };
