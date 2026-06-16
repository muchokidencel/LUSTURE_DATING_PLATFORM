import { describe, it, expect } from 'vitest';
import { db } from './index';

describe('Database connection', () => {
  it('should export a db instance', () => {
    expect(db).toBeDefined();
  });
});
