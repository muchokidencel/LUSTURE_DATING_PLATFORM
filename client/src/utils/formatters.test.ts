import { describe, it, expect } from 'vitest';
import { formatKES, formatDate } from './formatters';

describe('Formatters', () => {
  describe('formatKES', () => {
    it('should format numbers correctly', () => {
      // Note: non-breaking space might be used in some environments
      const result = formatKES(500).replace(/\u00A0/g, ' ');
      expect(result).toMatch(/(KES|Ksh)\s?500/);
    });

    it('should handle string inputs', () => {
      const result = formatKES('1000').replace(/\u00A0/g, ' ');
      expect(result).toMatch(/(KES|Ksh)\s?1,000/);
    });
  });

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2026-06-12');
      const result = formatDate(date);
      expect(result).toContain('12 Jun 2026');
    });

    it('should handle string dates', () => {
      const result = formatDate('2026-06-12');
      expect(result).toContain('12 Jun 2026');
    });
  });
});
