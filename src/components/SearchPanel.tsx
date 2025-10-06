import { useState } from 'react';
import { NetworkFilter, EncryptionType, NetworkType } from '../types/network';
import './SearchPanel.css';

interface SearchPanelProps {
  onFilterChange: (filter: NetworkFilter) => void;
  onClusteringToggle: (enabled: boolean) => void;
  onJumpToNetwork?: (network: any) => void;
  clusteringEnabled: boolean;
  resultCount?: number;
  networkTypeCounts?: { [key: string]: number };
  searchResults?: any[];
}

export default function SearchPanel({ 
  onFilterChange, 
  onClusteringToggle, 
  onJumpToNetwork,
  clusteringEnabled, 
  resultCount, 
  networkTypeCounts,
  searchResults = []
}: SearchPanelProps) {
  const [ssid, setSsid] = useState('');
  const [bssid, setBssid] = useState('');
  const [selectedEncryption, setSelectedEncryption] = useState<EncryptionType[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [minSignal, setMinSignal] = useState<number>(-100);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleApplyFilters = () => {
    const filter: NetworkFilter = {};

    if (ssid.trim()) {
      filter.ssid = ssid.trim();
    }

    if (bssid.trim()) {
      filter.bssid = bssid.trim();
    }

    if (selectedEncryption.length > 0) {
      filter.encryption = selectedEncryption;
    }

    if (selectedTypes.length > 0) {
      filter.types = selectedTypes;
    }

    if (minSignal > -100) {
      filter.minSignal = minSignal;
    }

    if (dateStart || dateEnd) {
      filter.dateRange = {
        start: dateStart ? new Date(dateStart) : new Date(0),
        end: dateEnd ? new Date(dateEnd) : new Date(),
      };
    }

    onFilterChange(filter);
    setShowResults(true);
  };

  const handleJumpToNetwork = (network: any) => {
    if (onJumpToNetwork) {
      // Validate coordinates before jumping
      if (network.bestLat && network.bestLon && 
          network.bestLat >= -90 && network.bestLat <= 90 &&
          network.bestLon >= -180 && network.bestLon <= 180) {
        onJumpToNetwork(network);
      } else {
        console.warn('Invalid network coordinates, cannot jump to location:', network);
      }
    }
  };

  const handleClearFilters = () => {
    setSsid('');
    setBssid('');
    setSelectedEncryption([]);
    setSelectedTypes([]);
    setMinSignal(-100);
    setDateStart('');
    setDateEnd('');
    setShowResults(false);
    onFilterChange({});
  };

  const handleEncryptionChange = (encryption: EncryptionType) => {
    setSelectedEncryption(prev => {
      if (prev.includes(encryption)) {
        return prev.filter(e => e !== encryption);
      } else {
        return [...prev, encryption];
      }
    });
  };

  const handleTypeChange = (type: string) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  return (
    <div className="search-panel">
      <div className="search-panel-header">
        <h2>Search & Filter</h2>
        {resultCount !== undefined && (
          <div className="result-count">{resultCount} networks</div>
        )}
      </div>

      <div className="search-panel-content">
        {/* SSID Search */}
        <div className="filter-group">
          <label htmlFor="ssid-input">SSID</label>
          <input
            id="ssid-input"
            type="text"
            placeholder="Search by network name..."
            value={ssid}
            onChange={(e) => setSsid(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
          />
        </div>

        {/* BSSID Search */}
        <div className="filter-group">
          <label htmlFor="bssid-input">BSSID</label>
          <input
            id="bssid-input"
            type="text"
            placeholder="Search by MAC address..."
            value={bssid}
            onChange={(e) => setBssid(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
          />
        </div>

        {/* Encryption Type Filter */}
        <div className="filter-group">
          <label>Encryption Type</label>
          <div className="encryption-checkboxes">
            {Object.values(EncryptionType).map((type) => (
              <label key={type} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedEncryption.includes(type)}
                  onChange={() => handleEncryptionChange(type)}
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Network Type Filter */}
        <div className="filter-group">
          <label>Network Type</label>
          <div className="network-type-checkboxes">
            {Object.values(NetworkType).map((type) => (
              <label key={type} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => handleTypeChange(type)}
                />
                <span>
                  {type}
                  {networkTypeCounts && networkTypeCounts[type] !== undefined && (
                    <span className="type-count"> ({networkTypeCounts[type]})</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Clustering Toggle */}
        <div className="filter-group">
          <label className="toggle-label">
            <span>Enable Marker Clustering</span>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={clusteringEnabled}
                onChange={(e) => onClusteringToggle(e.target.checked)}
                id="clustering-toggle"
              />
              <label htmlFor="clustering-toggle" className="toggle-slider"></label>
            </div>
          </label>
          <div className="toggle-description">
            Groups nearby markers for better performance with large datasets
          </div>
        </div>

        {/* Signal Strength Filter */}
        <div className="filter-group">
          <label htmlFor="signal-slider">
            Min Signal Strength: {minSignal} dBm
          </label>
          <input
            id="signal-slider"
            type="range"
            min="-100"
            max="-30"
            value={minSignal}
            onChange={(e) => setMinSignal(Number(e.target.value))}
            className="signal-slider"
          />
        </div>

        {/* Date Range Filter */}
        <div className="filter-group">
          <label>Date Range</label>
          <div className="date-range">
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              placeholder="Start date"
            />
            <span className="date-separator">to</span>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              placeholder="End date"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="filter-actions">
          <button onClick={handleApplyFilters} className="btn-primary">
            Apply Filters
          </button>
          <button onClick={handleClearFilters} className="btn-secondary">
            Clear All
          </button>
        </div>

        {/* Search Results with Jump Buttons */}
        {showResults && searchResults && searchResults.length > 0 && (
          <div className="search-results">
            <div className="search-results-header">
              <h3>Search Results</h3>
              <span className="results-count">{searchResults.length} network{searchResults.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="search-results-list">
              {searchResults.slice(0, 50).map((network) => (
                <div key={network.id} className="search-result-item">
                  <div className="search-result-info">
                    <div className="search-result-ssid">
                      {network.ssid || '(Hidden Network)'}
                    </div>
                    <div className="search-result-details">
                      <span className="search-result-bssid">{network.bssid}</span>
                      <span className="search-result-type">{network.type}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJumpToNetwork(network)}
                    className="btn-jump"
                    title="Jump to network location on map"
                    disabled={!network.bestLat || !network.bestLon}
                  >
                    📍 Jump
                  </button>
                </div>
              ))}
              {searchResults.length > 50 && (
                <div className="search-results-more">
                  Showing first 50 of {searchResults.length} results
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
