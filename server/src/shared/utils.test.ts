import { getRelativeTime, getDistanceKm } from './utils';

describe('getRelativeTime', () => {
  it('should return "Just now" for current time', () => {
    const now = new Date();
    expect(getRelativeTime(now)).toBe('Just now');
  });

  it('should return minutes ago', () => {
    const date = new Date(Date.now() - 5 * 60000);
    expect(getRelativeTime(date)).toBe('5 minutes ago');
  });

  it('should return hours ago', () => {
    const date = new Date(Date.now() - 2 * 3600000);
    expect(getRelativeTime(date)).toBe('2 hours ago');
  });

  it('should return days ago', () => {
    const date = new Date(Date.now() - 3 * 86400000);
    expect(getRelativeTime(date)).toBe('3 days ago');
  });
});

describe('getDistanceKm', () => {
  it('should return 0 for same coordinates', () => {
    expect(getDistanceKm(1.234, 5.678, 1.234, 5.678)).toBe(0);
  });

  it('should calculate approximate distance between Nairobi and Mombasa', () => {
    const nairobiLat = -1.2921;
    const nairobiLon = 36.8219;
    const mombasaLat = -4.0435;
    const mombasaLon = 39.6682;
    const distance = getDistanceKm(nairobiLat, nairobiLon, mombasaLat, mombasaLon);
    expect(distance).toBeGreaterThan(430);
    expect(distance).toBeLessThan(450);
  });
});
