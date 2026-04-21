import { describe, it, expect } from 'vitest';
import { checkAccuracy, checkRoundCoordinates, checkTeleportation } from '../lib/utils/fakeGpsDetector';

describe('GPS Fake Detection - Accuracy', () => {
  it('should flag suspiciously high accuracy (perfect signal)', () => {
    const result = checkAccuracy(2.9);
    expect(result.isSuspicious).toBe(true);
    expect(result.reason).toContain('terlalu sempurna');
  });

  it('should flag poor accuracy (weak signal)', () => {
    const result = checkAccuracy(201);
    expect(result.isSuspicious).toBe(true);
    expect(result.reason).toContain('terlalu lemah');
  });

  it('should accept normal accuracy', () => {
    const result = checkAccuracy(10);
    expect(result.isSuspicious).toBe(false);
  });
});

describe('GPS Fake Detection - Round Coordinates', () => {
  it('should flag round coordinates (common fake GPS behavior)', () => {
    const result = checkRoundCoordinates(-6.2, 106.8); // Less than 4 decimals
    expect(result.isSuspicious).toBe(true);
    expect(result.reason).toContain('tidak wajar');
  });

  it('should accept high-precision coordinates', () => {
    const result = checkRoundCoordinates(-6.208761, 106.845592);
    expect(result.isSuspicious).toBe(false);
  });
});

describe('GPS Fake Detection - Teleportation', () => {
  it('should flag physically impossible movement speed', () => {
    const prevLat = -6.2088;
    const prevLng = 106.8456;
    const prevTime = new Date(Date.now() - 60000).toISOString(); // 1 minute ago
    
    // Move to Bandung (~150km) in 1 minute -> ~9000 km/h
    const newLat = -6.9175;
    const newLng = 107.6191;
    
    const result = checkTeleportation(prevLat, prevLng, prevTime, newLat, newLng);
    expect(result.isSuspicious).toBe(true);
    expect(result.reason).toContain('tidak wajar');
  });

  it('should accept realistic movement speed', () => {
    const prevLat = -6.2088;
    const prevLng = 106.8456;
    const prevTime = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
    
    // Move 2km in 1 hour -> 2 km/h
    const newLat = -6.2200;
    const newLng = 106.8600;
    
    const result = checkTeleportation(prevLat, prevLng, prevTime, newLat, newLng);
    expect(result.isSuspicious).toBe(false);
  });
});
