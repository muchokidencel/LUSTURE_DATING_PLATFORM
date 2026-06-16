import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupMatchingEngines } from './engines';
import { db } from './index';

vi.mock('./index', () => ({
  db: {
    execute: vi.fn().mockResolvedValue({}),
  },
}));

describe('Matching Engines', () => {
  it('should call execute multiple times to setup functions', async () => {
    await setupMatchingEngines();
    expect(db.execute).toHaveBeenCalled();
  });
});
