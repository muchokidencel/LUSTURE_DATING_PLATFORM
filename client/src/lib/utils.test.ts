import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('merges tailwind classes', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('handles conditional classes', () => {
    expect(cn('p-4', true && 'm-2', false && 'hidden')).toBe('p-4 m-2');
  });
});
