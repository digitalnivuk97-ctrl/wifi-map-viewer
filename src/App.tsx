import { useState, useMemo, useEffect, useCallback } from 'react';
import MapView from './components/MapView';
import SearchPanel from './components/SearchPanel';
import ImportDialog from './components/ImportDialog';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Network, GeoBounds, NetworkFilter, ImportResult } from './types/network';
import { databaseService } from './services/DatabaseService';
import { logger } from './utils/logger';
import './App.css';

function App() {
  const [allNetworks, setAllNetworks] = useState<Network[]>([]);
  const [filter, setFilter] = useState<NetworkFilter>({});
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [clusteringEnabled, setClusteringEnabled] = useState(true);
  const [centerOnNetwork, setCenterOnNetwork] = useState<Network | null>(null);

  // Load networks from database
  const loadNetworks = useCallback(async () => {
    try {
      setIsLoading(true);
      logger.info('Loading networks from database');
      
      // Load all networks (no filter, high limit)
      const networks = await databaseService.findNetworks({}, 100000, 0);
      
      logger.info(`Loaded ${networks.length} networks from database`);
      console.log('[App] Loaded networks sample:', networks.slice(0, 5).map(n => ({ bssid: n.bssid, ssid: n.ssid, type: n.type })));
      setAllNetworks(networks);
    } catch (error) {
      logger.error('Failed to load networks', error instanceof Error ? error : new Error(String(error)));
      console.error('Failed to load networks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load networks on mount
  useEffect(() => {
    loadNetworks();
  }, [loadNetworks]);

  // Load clustering preference from config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        if (window.electronAPI) {
          const config = await window.electronAPI.getConfig();
          setClusteringEnabled(config.map.clusteringEnabled);
        }
      } catch (error) {
        logger.error('Failed to load config', error instanceof Error ? error : new Error(String(error)));
      }
    };
    loadConfig();
  }, []);
  
  // Calculate network type counts
  const networkTypeCounts = useMemo(() => {
    const counts: { [key: string]: number } = {
      WIFI: 0,
      BLE: 0,
      LTE: 0
    };
    
    allNetworks.forEach(network => {
      if (counts[network.type] !== undefined) {
        counts[network.type]++;
      }
    });
    
    return counts;
  }, [allNetworks]);

  // Apply filters to networks
  const filteredNetworks = useMemo(() => {
    return allNetworks.filter(network => {
      // SSID filter
      if (filter.ssid && !network.ssid.toLowerCase().includes(filter.ssid.toLowerCase())) {
        return false;
      }

      // BSSID filter
      if (filter.bssid && !network.bssid.toLowerCase().includes(filter.bssid.toLowerCase())) {
        return false;
      }

      // Encryption filter
      if (filter.encryption && filter.encryption.length > 0) {
        if (!filter.encryption.includes(network.encryption)) {
          return false;
        }
      }

      // Signal strength filter
      if (filter.minSignal !== undefined && network.bestSignal < filter.minSignal) {
        return false;
      }

      // Date range filter
      if (filter.dateRange) {
        const networkDate = new Date(network.lastSeen);
        if (filter.dateRange.start && networkDate < filter.dateRange.start) {
          return false;
        }
        if (filter.dateRange.end && networkDate > filter.dateRange.end) {
          return false;
        }
      }

      // Bounds filter (geographic)
      if (filter.bounds) {
        if (
          network.bestLat < filter.bounds.south ||
          network.bestLat > filter.bounds.north ||
          network.bestLon < filter.bounds.west ||
          network.bestLon > filter.bounds.east
        ) {
          return false;
        }
      }

      // Network type filter
      if (filter.types && filter.types.length > 0) {
        if (!filter.types.includes(network.type)) {
          return false;
        }
      }

      return true;
    });
  }, [allNetworks, filter]);
  
  const handleBoundsChange = (bounds: GeoBounds) => {
    console.log('Map bounds changed:', bounds);
    // This will be used later to load networks in viewport
  };

  const handleNetworkClick = (network: Network) => {
    console.log('Network clicked:', network);
  };

  const handleFilterChange = (newFilter: NetworkFilter) => {
    setFilter(newFilter);
  };

  const handleJumpToNetwork = (network: Network) => {
    // Set the network to center on, which will trigger the map to jump
    setCenterOnNetwork(network);
    
    // Reset after a short delay to allow re-jumping to the same network
    setTimeout(() => {
      setCenterOnNetwork(null);
    }, 1000);
  };

  const handleClusteringToggle = async (enabled: boolean) => {
    setClusteringEnabled(enabled);
    
    // Persist to config
    try {
      if (window.electronAPI) {
        await window.electronAPI.saveConfig({
          map: {
            clusteringEnabled: enabled
          }
        });
        logger.info(`Clustering ${enabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      logger.error('Failed to save clustering preference', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const handleImport = async (filePath: string): Promise<ImportResult> => {
    try {
      logger.info(`Starting import from: ${filePath}`);
      
      // Use the actual ImportService
      const { ImportService } = await import('./services/ImportService');
      const importService = new ImportService();
      
      // Import with progress callback
      const result = await importService.importFile(filePath, (progress, message) => {
        console.log(`Import progress: ${progress}% - ${message}`);
      });
      
      logger.info(`Import completed successfully`);
      console.log('[App] Import result:', result);
      
      // Reload networks from database after import
      await loadNetworks();
      
      return result;
    } catch (error) {
      logger.error('Import failed in App', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };

  const handleMenuItemClick = (action: string) => {
    setIsFileMenuOpen(false);
    if (action === 'import') {
      setIsImportDialogOpen(true);
    }
  };

  return (
    <ErrorBoundary>
      <div className="app-container">
        {/* Menu Bar */}
        <div className="menu-bar">
          <div className="menu-bar-title">WiFi Map Viewer</div>
          <div className="menu-bar-items">
            <div className="menu-item">
              <div 
                className="menu-item-label"
                onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
              >
                File
              </div>
              {isFileMenuOpen && (
                <>
                  <div 
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 999
                    }}
                    onClick={() => setIsFileMenuOpen(false)}
                  />
                  <div className="menu-dropdown">
                    <div 
                      className="menu-dropdown-item"
                      onClick={() => handleMenuItemClick('import')}
                    >
                      Import...
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <SearchPanel 
            onFilterChange={handleFilterChange}
            onClusteringToggle={handleClusteringToggle}
            onJumpToNetwork={handleJumpToNetwork}
            clusteringEnabled={clusteringEnabled}
            resultCount={filteredNetworks.length}
            networkTypeCounts={networkTypeCounts}
            searchResults={filteredNetworks}
          />
          <div className="map-container">
            <MapView
              networks={filteredNetworks}
              onBoundsChange={handleBoundsChange}
              onNetworkClick={handleNetworkClick}
              clusteringEnabled={clusteringEnabled}
              defaultCenter={[37.7749, -122.4194]} // San Francisco
              defaultZoom={13}
              centerOnNetwork={centerOnNetwork}
            />
          </div>
        </div>

        {/* Status Bar */}
        <div className="status-bar">
          <div className="status-bar-section">
            <div className="status-bar-item">
              <span className="status-bar-label">Total Networks:</span>
              <span className="status-bar-value">{allNetworks.length}</span>
            </div>
            <div className="status-bar-item">
              <span className="status-bar-label">Filtered Networks:</span>
              <span className="status-bar-value">{filteredNetworks.length}</span>
            </div>
          </div>
          <div className="status-bar-section">
            <div className="status-bar-item">
              <span className="status-bar-label">{isLoading ? 'Loading...' : 'Ready'}</span>
            </div>
          </div>
        </div>
        
        <ImportDialog
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onImport={handleImport}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
