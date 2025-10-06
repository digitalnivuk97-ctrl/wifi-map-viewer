/**
 * Core data types for WiFi networks
 */
export var EncryptionType;
(function (EncryptionType) {
    EncryptionType["OPEN"] = "Open";
    EncryptionType["WEP"] = "WEP";
    EncryptionType["WPA"] = "WPA";
    EncryptionType["WPA2"] = "WPA2";
    EncryptionType["WPA3"] = "WPA3";
    EncryptionType["UNKNOWN"] = "Unknown";
})(EncryptionType || (EncryptionType = {}));
export var NetworkType;
(function (NetworkType) {
    NetworkType["WIFI"] = "WIFI";
    NetworkType["BLE"] = "BLE";
    NetworkType["LTE"] = "LTE";
})(NetworkType || (NetworkType = {}));
