/**
 * Trilateration utilities for calculating network positions
 */

import type { Observation } from '../types/network';

export interface Position {
    latitude: number;
    longitude: number;
}

/**
 * Calculate weighted centroid position based on signal strength
 * Uses signal strength squared as weight (inverse square law)
 */
export function calculateWeightedCentroid(observations: Observation[]): Position {
    if (observations.length === 0) {
        throw new Error('Cannot calculate centroid with no observations');
    }

    if (observations.length === 1) {
        return {
            latitude: observations[0].latitude,
            longitude: observations[0].longitude
        };
    }

    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLon = 0;

    for (const obs of observations) {
        // Weight is signal strength squared (inverse square law)
        // Use absolute value since signal strength is typically negative
        const weight = Math.pow(Math.abs(obs.signalStrength), 2);
        totalWeight += weight;
        weightedLat += obs.latitude * weight;
        weightedLon += obs.longitude * weight;
    }

    return {
        latitude: weightedLat / totalWeight,
        longitude: weightedLon / totalWeight
    };
}
