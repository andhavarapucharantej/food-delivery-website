export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Validates coordinate bounds: lat between -90 and 90, lng between -180 and 180.
 */
export function isValidCoordinates(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === "number" &&
    !Number.isNaN(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    typeof lng === "number" &&
    !Number.isNaN(lng) &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Computes Haversine distance between two coordinates in kilometers.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Computes Haversine distance between two coordinates in meters.
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return haversineDistanceKm(lat1, lon1, lat2, lon2) * 1000;
}

/**
 * Computes ETA in seconds: 120s per km, clamped between 90s and 300s.
 */
export function computeEtaSeconds(distanceKm: number): number {
  const rawSeconds = Math.round(distanceKm * 120);
  return Math.min(300, Math.max(90, rawSeconds));
}

/**
 * Linear interpolation helper between two { lat, lng } points.
 * Fraction is clamped between 0 and 1.
 */
export function interpolateCoordinates(
  start: LatLng,
  end: LatLng,
  fraction: number
): LatLng {
  const clampedFraction = Math.min(1, Math.max(0, fraction));
  return {
    lat: start.lat + (end.lat - start.lat) * clampedFraction,
    lng: start.lng + (end.lng - start.lng) * clampedFraction,
  };
}

/**
 * Converts GeoJSON [lng, lat] coordinate array to { lat, lng } object.
 */
export function geoJsonToLatLng(coords: [number, number]): LatLng {
  return {
    lat: coords[1],
    lng: coords[0],
  };
}

/**
 * Converts { lat, lng } to MongoDB GeoJSON Point format: [lng, lat].
 */
export function latLngToGeoJson(lat: number, lng: number): [number, number] {
  return [lng, lat];
}

/**
 * Formats distance nicely for cards, e.g. "2.3 km away" or "600 m away".
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}
