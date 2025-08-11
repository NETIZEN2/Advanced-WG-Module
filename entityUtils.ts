
import type { PlacedEntity, SystemUnit, DistanceUnit } from '../types';

// --- Hardened GEO Helpers ---
const R = 6371; // Radius of the Earth in km
const toRad = (deg: number): number => deg * (Math.PI / 180);
const toDeg = (rad: number): number => rad * (180 / Math.PI);

export const isValidCoord = (pos: any): pos is [number, number] =>
  Array.isArray(pos) && pos.length === 2 && typeof pos[0] === 'number' && typeof pos[1] === 'number' && !isNaN(pos[0]) && !isNaN(pos[1]);

export const calculateDistance = ([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]): number => {
  if (!isValidCoord([lat1, lon1]) || !isValidCoord([lat2, lon2])) return Infinity;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return isNaN(distance) ? Infinity : distance;
};

export const calculateBearing = ([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]): number => {
    if (!isValidCoord([lat1, lon1]) || !isValidCoord([lat2, lon2])) return 0;
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaLambda = toRad(lon2 - lon1);
    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
    const theta = Math.atan2(y, x);
    return (toDeg(theta) + 360) % 360;
};

export const calculateDestinationPoint = ([lat, lon]: [number, number], distance: number, bearing: number): [number, number] => {
    if (!isValidCoord([lat, lon])) return [lat, lon];
    const sigma = distance / R; // angular distance in radians
    const theta = toRad(bearing);
    const phi1 = toRad(lat);
    const lambda1 = toRad(lon);

    let sinPhi1 = Math.sin(phi1);
    let cosPhi1 = Math.cos(phi1);
    let sinSigma = Math.sin(sigma);
    let cosSigma = Math.cos(sigma);
    let sinTheta = Math.sin(theta);
    let cosTheta = Math.cos(theta);

    let sinPhi2 = sinPhi1 * cosSigma + cosPhi1 * sinSigma * cosTheta;
    sinPhi2 = Math.max(-1.0, Math.min(1.0, sinPhi2)); // clamp to avoid floating point errors
    const phi2 = Math.asin(sinPhi2);

    const y = sinTheta * sinSigma * cosPhi1;
    const x = cosSigma - sinPhi1 * sinPhi2;
    const lambda2 = lambda1 + Math.atan2(y, x);
    
    const newLat = toDeg(phi2);
    const newLon = toDeg(lambda2);

    if (isNaN(newLat) || isNaN(newLon)) {
        console.error("calculateDestinationPoint resulted in NaN", { lat, lon, distance, bearing });
        return [lat, lon]; // Return original on failure
    }
    return [newLat, newLon];
};

export const isEntityConnected = (consumer: PlacedEntity, provider: PlacedEntity, disabledSystemIds: Set<string>): boolean => {
    if (!consumer.linkedTo || consumer.linkedTo.providerId !== provider.instanceId) {
        return false;
    }
    const datalink = provider.datalinks?.find(d => d.id === consumer.linkedTo?.datalinkId);
    if (!datalink) {
        return false;
    }

    // A disabled datalink system on the provider cannot provide a connection
    const datalinkSystemId = `${provider.instanceId}::${datalink.id}`;
    if (disabledSystemIds.has(datalinkSystemId)) {
        return false;
    }
    
    const consumerPos = consumer.currentPosition || consumer.position;
    const providerPos = provider.currentPosition || provider.position;
    if (!isValidCoord(consumerPos) || !isValidCoord(providerPos)) {
        return false;
    }

    const distance = calculateDistance(consumerPos, providerPos);
    return distance <= datalink.range;
};
