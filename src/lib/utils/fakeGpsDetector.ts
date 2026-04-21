/**
 * GPS Fake Detection Utility
 *
 * Detects potential fake/spoofed GPS coordinates using multiple heuristics:
 * 1. Accuracy too high (fake GPS apps often report unrealistically perfect accuracy)
 * 2. Coordinates are exactly round numbers (common fake GPS defaults)
 * 3. Speed-based anomaly: distance between two timestamps is physically impossible
 */

/** Maximum realistic walking/commuting speed in m/s (~200 km/h for safety margin) */
const MAX_REALISTIC_SPEED_MS = 55; // ~200 km/h

/** Minimum accuracy in meters — browsers on real GPS are rarely below 5m */
const SUSPICIOUSLY_HIGH_ACCURACY = 3;

/** Maximum accuracy allowed — above this is too inaccurate to be trusted for attendance */
const MAX_ALLOWED_ACCURACY = 200;

export interface FakeGpsCheckResult {
  isSuspicious: boolean;
  reason?: string;
}

/**
 * Validates the accuracy value reported by the browser Geolocation API.
 * - Rejects accuracy that is suspiciously perfect (< 3m) — typical of spoofing apps
 * - Rejects accuracy that is too poor (> 200m) — location is too uncertain
 */
export function checkAccuracy(accuracy: number): FakeGpsCheckResult {
  if (accuracy < SUSPICIOUSLY_HIGH_ACCURACY) {
    return {
      isSuspicious: true,
      reason: `Akurasi GPS terlalu sempurna (${accuracy.toFixed(1)}m). Kemungkinan menggunakan aplikasi GPS palsu.`,
    };
  }
  if (accuracy > MAX_ALLOWED_ACCURACY) {
    return {
      isSuspicious: true,
      reason: `Sinyal GPS terlalu lemah (akurasi: ${Math.round(accuracy)}m). Pastikan GPS aktif dan berada di luar ruangan.`,
    };
  }
  return { isSuspicious: false };
}

/**
 * Detects suspiciously round coordinates — many fake GPS apps default to
 * round numbers like -6.200000, 106.800000.
 */
export function checkRoundCoordinates(lat: number, lng: number): FakeGpsCheckResult {
  const latStr = lat.toString();
  const lngStr = lng.toString();

  const latDecimals = latStr.includes('.') ? latStr.split('.')[1].length : 0;
  const lngDecimals = lngStr.includes('.') ? lngStr.split('.')[1].length : 0;

  // Real GPS coordinates have at least 4 decimal places
  if (latDecimals < 4 || lngDecimals < 4) {
    return {
      isSuspicious: true,
      reason: 'Koordinat GPS tidak wajar (terlalu bulat). Kemungkinan lokasi dimanipulasi.',
    };
  }

  return { isSuspicious: false };
}

/**
 * Haversine distance formula — calculates meters between two GPS points.
 */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Server-side: detects if someone "teleported" between their last check-in
 * and this new location, which is physically impossible.
 */
export function checkTeleportation(
  prevLat: number,
  prevLng: number,
  prevTimestamp: string,
  newLat: number,
  newLng: number
): FakeGpsCheckResult {
  const prevTime = new Date(prevTimestamp).getTime();
  const nowTime = Date.now();
  const elapsedSeconds = (nowTime - prevTime) / 1000;

  // If less than 10 seconds have passed, skip (could be same session)
  if (elapsedSeconds < 10) return { isSuspicious: false };

  const distanceMeters = haversineMeters(prevLat, prevLng, newLat, newLng);
  const speedMs = distanceMeters / elapsedSeconds;

  if (speedMs > MAX_REALISTIC_SPEED_MS) {
    const speedKmh = (speedMs * 3.6).toFixed(0);
    return {
      isSuspicious: true,
      reason: `Perpindahan lokasi tidak wajar (kecepatan ~${speedKmh} km/jam). Koordinat GPS tampak dimanipulasi.`,
    };
  }

  return { isSuspicious: false };
}

/**
 * Runs all client-side checks and returns the first suspicious result found.
 */
export function runClientGpsChecks(
  lat: number,
  lng: number,
  accuracy: number
): FakeGpsCheckResult {
  const accuracyCheck = checkAccuracy(accuracy);
  if (accuracyCheck.isSuspicious) return accuracyCheck;

  const roundCheck = checkRoundCoordinates(lat, lng);
  if (roundCheck.isSuspicious) return roundCheck;

  return { isSuspicious: false };
}
