import { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import './MapView.css';
import { Network, GeoBounds, EncryptionType, NetworkType } from '../types/network';
import ClusteringIndicator from './ClusteringIndicator';

// Fix for default marker icons in Leaflet with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapViewProps {
  networks: Network[];
  onNetworkClick?: (network: Network) => void;
  onBoundsChange?: (bounds: GeoBounds) => void;
  clusteringEnabled: boolean;
  autoClusterZoomThreshold?: number;
  defaultCenter?: [number, number];
  defaultZoom?: number;
  centerOnNetwork?: Network | null;
}

// Get marker icon based on network type and encryption
const getMarkerIcon = (network: Network): L.DivIcon => {
  // Base colors for encryption types
  const encryptionColors: Record<EncryptionType, string> = {
    [EncryptionType.OPEN]: '#ff4444',      // Red for open networks
    [EncryptionType.WEP]: '#ff8800',       // Orange for WEP
    [EncryptionType.WPA]: '#ffcc00',       // Yellow for WPA
    [EncryptionType.WPA2]: '#44ff44',      // Green for WPA2
    [EncryptionType.WPA3]: '#0088ff',      // Blue for WPA3
    [EncryptionType.UNKNOWN]: '#888888',   // Gray for unknown
  };

  // Network type configurations
  const networkTypeConfig = {
    [NetworkType.WIFI]: {
      baseColor: encryptionColors[network.encryption] || encryptionColors[EncryptionType.UNKNOWN],
      shape: 'circle',
      className: 'marker-wifi',
    },
    [NetworkType.BLE]: {
      baseColor: '#00bfff',  // Light blue for BLE
      shape: 'diamond',
      className: 'marker-ble',
    },
    [NetworkType.LTE]: {
      baseColor: '#ff8c00',  // Orange for LTE
      shape: 'square',
      className: 'marker-lte',
    },
  };

  const config = networkTypeConfig[network.type] || networkTypeConfig[NetworkType.WIFI];
  
  // Generate shape-specific HTML
  let shapeHtml = '';
  if (config.shape === 'circle') {
    shapeHtml = `<div class="marker-shape marker-circle" style="background-color: ${config.baseColor};"></div>`;
  } else if (config.shape === 'diamond') {
    shapeHtml = `<div class="marker-shape marker-diamond" style="background-color: ${config.baseColor};"></div>`;
  } else if (config.shape === 'square') {
    shapeHtml = `<div class="marker-shape marker-square" style="background-color: ${config.baseColor};"></div>`;
  }

  return L.divIcon({
    className: `custom-marker ${config.className}`,
    html: shapeHtml,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

// Component to handle map events and update bounds
function MapEventHandler({ onBoundsChange }: { onBoundsChange?: (bounds: GeoBounds) => void }) {
  const map = useMapEvents({
    moveend: () => {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
      }
    },
    zoomend: () => {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
      }
    },
  });

  return null;
}

// Component to handle jumping to a specific network location
function JumpToNetworkHandler({ network }: { network: Network | null | undefined }) {
  const map = useMap();
  const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markerLayerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (network && network.bestLat && network.bestLon) {
      // Validate coordinates
      if (network.bestLat < -90 || network.bestLat > 90 || 
          network.bestLon < -180 || network.bestLon > 180) {
        console.warn('Invalid network coordinates:', network);
        return;
      }

      // Center map on network with animation
      map.setView([network.bestLat, network.bestLon], 18, {
        animate: true,
        duration: 1,
      });

      // Find and open the marker's popup after a short delay
      setTimeout(() => {
        // Try to find the marker in cluster group or layer group
        let foundMarker: L.Marker | null = null;

        // Check if we have a reference to the marker groups
        // Use type assertion to access internal _layers property
        const layers = (map as any)._layers;
        if (layers) {
          Object.values(layers).forEach((layer: any) => {
            if (layer instanceof L.Marker) {
              const latLng = layer.getLatLng();
              if (Math.abs(latLng.lat - network.bestLat) < 0.0001 && 
                  Math.abs(latLng.lng - network.bestLon) < 0.0001) {
                foundMarker = layer;
              }
            } else if (layer instanceof L.MarkerClusterGroup) {
              markerClusterGroupRef.current = layer;
              // Search within cluster group
              layer.eachLayer((marker: any) => {
                if (marker instanceof L.Marker) {
                  const latLng = marker.getLatLng();
                  if (Math.abs(latLng.lat - network.bestLat) < 0.0001 && 
                      Math.abs(latLng.lng - network.bestLon) < 0.0001) {
                    foundMarker = marker;
                  }
                }
              });
            } else if (layer instanceof L.LayerGroup && !(layer instanceof L.MarkerClusterGroup)) {
              markerLayerGroupRef.current = layer;
              // Search within layer group
              layer.eachLayer((marker: any) => {
                if (marker instanceof L.Marker) {
                  const latLng = marker.getLatLng();
                  if (Math.abs(latLng.lat - network.bestLat) < 0.0001 && 
                      Math.abs(latLng.lng - network.bestLon) < 0.0001) {
                    foundMarker = marker;
                  }
                }
              });
            }
          });
        }

        // Open popup if marker found
        if (foundMarker && typeof (foundMarker as any).openPopup === 'function') {
          (foundMarker as any).openPopup();
        }
      }, 500); // Wait for animation to complete
    }
  }, [network, map]);

  return null;
}

// Component to manage markers with clustering and optimizations
function NetworkMarkers({ 
  networks, 
  onNetworkClick,
  clusteringEnabled,
  autoClusterZoomThreshold = 13,
  onForcedClusteringChange
}: { 
  networks: Network[]; 
  onNetworkClick?: (network: Network) => void;
  clusteringEnabled: boolean;
  autoClusterZoomThreshold?: number;
  onForcedClusteringChange?: (isForcedClustering: boolean) => void;
}) {
  const map = useMap();
  const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markerLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());
  const [viewportBounds, setViewportBounds] = useState(map.getBounds());

  // Maximum markers to render at once (performance cap)
  const MAX_MARKERS = 10000;

  // Compute effective clustering state based on zoom threshold and user preference
  const effectiveClusteringEnabled = useMemo(() => {
    return currentZoom < autoClusterZoomThreshold || clusteringEnabled;
  }, [currentZoom, autoClusterZoomThreshold, clusteringEnabled]);

  // Track if clustering is forced due to zoom level
  const isForcedClustering = useMemo(() => {
    return currentZoom < autoClusterZoomThreshold && !clusteringEnabled;
  }, [currentZoom, autoClusterZoomThreshold, clusteringEnabled]);

  // Notify parent when forced clustering state changes
  useEffect(() => {
    if (onForcedClusteringChange) {
      onForcedClusteringChange(isForcedClustering);
    }
  }, [isForcedClustering, onForcedClusteringChange]);

  useEffect(() => {
    // Clean up existing layers when clustering mode changes
    if (markerClusterGroupRef.current) {
      map.removeLayer(markerClusterGroupRef.current);
      markerClusterGroupRef.current.clearLayers();
      markerClusterGroupRef.current = null;
    }
    if (markerLayerGroupRef.current) {
      map.removeLayer(markerLayerGroupRef.current);
      markerLayerGroupRef.current.clearLayers();
      markerLayerGroupRef.current = null;
    }

    // Create appropriate layer group based on effective clustering state
    let layerGroup: L.MarkerClusterGroup | L.LayerGroup;
    
    if (effectiveClusteringEnabled) {
      // Create marker cluster group for clustering mode
      markerClusterGroupRef.current = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        chunkedLoading: true, // Load markers in chunks for better performance
        chunkInterval: 200,
        chunkDelay: 50,
      });
      layerGroup = markerClusterGroupRef.current;
    } else {
      // Create regular layer group for non-clustering mode
      markerLayerGroupRef.current = L.layerGroup();
      layerGroup = markerLayerGroupRef.current;
    }

    map.addLayer(layerGroup);

    // Viewport culling: only render networks within viewport (with padding)
    const bounds = viewportBounds.pad(0.2); // Add 20% padding for smooth panning
    const visibleNetworks = networks.filter((network) => {
      if (!network.bestLat || !network.bestLon) return false;
      return bounds.contains([network.bestLat, network.bestLon]);
    });

    // Apply stricter limits when clustering is disabled for performance
    const effectiveMaxMarkers = effectiveClusteringEnabled ? MAX_MARKERS : Math.min(MAX_MARKERS, 5000);
    const networksToRender = visibleNetworks.slice(0, effectiveMaxMarkers);
    
    // Log if we're hitting the cap
    if (visibleNetworks.length > effectiveMaxMarkers) {
      console.warn(`Rendering ${effectiveMaxMarkers} of ${visibleNetworks.length} visible networks (performance cap${!effectiveClusteringEnabled ? ' - clustering disabled' : ''})`);
    }
    
    // Warn user if clustering is disabled with many markers
    if (!effectiveClusteringEnabled && visibleNetworks.length > 1000) {
      console.warn(`Performance warning: ${visibleNetworks.length} markers without clustering. Consider enabling clustering for better performance.`);
    }

    // Add markers for each network
    networksToRender.forEach((network) => {
      if (network.bestLat && network.bestLon) {
        const icon = getMarkerIcon(network);
        
        // Create marker with custom icon
        const marker = L.marker([network.bestLat, network.bestLon], { icon });

        // Create popup content with network type-specific formatting
        const networkTypeLabel = network.type === NetworkType.BLE ? 'BLE Device' : 
                                 network.type === NetworkType.LTE ? 'LTE Cell' : 
                                 'WiFi Network';
        
        const networkTypeBadgeColor = network.type === NetworkType.BLE ? '#00bfff' : 
                                      network.type === NetworkType.LTE ? '#ff8c00' : 
                                      '#0088ff';

        let typeSpecificFields = '';
        
        if (network.type === NetworkType.BLE) {
          // BLE-specific fields
          typeSpecificFields = `
            <strong>MAC Address:</strong> ${network.bssid}<br/>
            ${network.manufacturer ? `<strong>Manufacturer:</strong> ${network.manufacturer}<br/>` : ''}
          `;
        } else if (network.type === NetworkType.LTE) {
          // LTE-specific fields
          typeSpecificFields = `
            <strong>Cell ID:</strong> ${network.bssid}<br/>
            ${network.channel ? `<strong>Band:</strong> ${network.channel}<br/>` : ''}
          `;
        } else {
          // WiFi-specific fields
          typeSpecificFields = `
            <strong>BSSID:</strong> ${network.bssid}<br/>
            <strong>Encryption:</strong> ${network.encryption}<br/>
            <strong>Channel:</strong> ${network.channel || 'N/A'}<br/>
            ${network.manufacturer ? `<strong>Manufacturer:</strong> ${network.manufacturer}<br/>` : ''}
          `;
        }

        const popupContent = `
          <div style="min-width: 220px;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <h3 style="margin: 0; font-size: 14px; flex: 1;">${network.ssid || '(Hidden Network)'}</h3>
              <span style="
                background-color: ${networkTypeBadgeColor};
                color: white;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 10px;
                font-weight: bold;
                margin-left: 8px;
              ">${networkTypeLabel}</span>
            </div>
            <div style="font-size: 12px; line-height: 1.6;">
              ${typeSpecificFields}
              <strong>Signal:</strong> ${network.bestSignal} dBm<br/>
              <strong>First Seen:</strong> ${new Date(network.firstSeen).toLocaleString()}<br/>
              <strong>Last Seen:</strong> ${new Date(network.lastSeen).toLocaleString()}<br/>
              <strong>Observations:</strong> ${network.observationCount}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);

        // Add click handler
        if (onNetworkClick) {
          marker.on('click', () => {
            onNetworkClick(network);
          });
        }

        // Add SSID label for high zoom levels (only if not too many markers)
        if (currentZoom >= 16 && network.ssid && networksToRender.length < 1000) {
          marker.bindTooltip(network.ssid, {
            permanent: true,
            direction: 'top',
            className: 'network-label',
            offset: [0, -10],
          });
        }

        layerGroup.addLayer(marker);
      }
    });

    return () => {
      // Cleanup on unmount or when clustering mode changes
      if (markerClusterGroupRef.current) {
        map.removeLayer(markerClusterGroupRef.current);
        markerClusterGroupRef.current.clearLayers();
        markerClusterGroupRef.current = null;
      }
      if (markerLayerGroupRef.current) {
        map.removeLayer(markerLayerGroupRef.current);
        markerLayerGroupRef.current.clearLayers();
        markerLayerGroupRef.current = null;
      }
    };
  }, [networks, onNetworkClick, currentZoom, viewportBounds, map, effectiveClusteringEnabled]);

  // Listen to zoom and move changes to update viewport
  useEffect(() => {
    const handleMapChange = () => {
      setCurrentZoom(map.getZoom());
      setViewportBounds(map.getBounds());
    };

    map.on('zoomend', handleMapChange);
    map.on('moveend', handleMapChange);

    return () => {
      map.off('zoomend', handleMapChange);
      map.off('moveend', handleMapChange);
    };
  }, [map]);

  return null;
}

export default function MapView({
  networks,
  onNetworkClick,
  onBoundsChange,
  clusteringEnabled,
  autoClusterZoomThreshold = 13,
  defaultCenter = [0, 0],
  defaultZoom = 13,
  centerOnNetwork = null,
}: MapViewProps) {
  const [isForcedClustering, setIsForcedClustering] = useState(false);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ClusteringIndicator isVisible={isForcedClustering} />
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        maxZoom={20}
        minZoom={2}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={20}
        />
        <MapEventHandler onBoundsChange={onBoundsChange} />
        <NetworkMarkers 
          networks={networks} 
          onNetworkClick={onNetworkClick}
          clusteringEnabled={clusteringEnabled}
          autoClusterZoomThreshold={autoClusterZoomThreshold}
          onForcedClusteringChange={setIsForcedClustering}
        />
        <JumpToNetworkHandler network={centerOnNetwork} />
      </MapContainer>
    </div>
  );
}
