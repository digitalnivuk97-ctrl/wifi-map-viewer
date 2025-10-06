/**
 * NetworkService - main business logic for network operations
 */

import type {
    Network,
    NetworkFilter,
    GeoBounds,
    Observation
} from '../types/network';
import { databaseService } from './DatabaseService';

export interface NetworkDetails extends Network {
    observations: Observation[];
}

export class NetworkService {
    /**
     * Search networks with filter support
     * Implements Requirements 4.1, 4.2, 4.3, 4.5, 4.6, 4.7, 4.8
     */
    async searchNetworks(filter: NetworkFilter, limit?: number, offset?: number): Promise<Network[]> {
        return databaseService.findNetworks(filter, limit, offset);
    }

    /**
     * Get detailed information for a single network including observations
     * Implements Requirement 4.2
     */
    async getNetworkDetails(bssid: string): Promise<NetworkDetails | null> {
        const network = await databaseService.getNetworkByBssid(bssid);
        
        if (!network) {
            return null;
        }

        const observations = await databaseService.getObservations(network.id);

        return {
            ...network,
            observations
        };
    }

    /**
     * Get networks within map viewport bounds
     * Implements Requirement 4.4, 4.9, 9.4
     */
    async getNetworksInBounds(bounds: GeoBounds, types?: string[], limit?: number): Promise<Network[]> {
        const filter: NetworkFilter = {
            bounds,
            types
        };

        return databaseService.findNetworks(filter, limit);
    }
}

// Export singleton instance
export const networkService = new NetworkService();
