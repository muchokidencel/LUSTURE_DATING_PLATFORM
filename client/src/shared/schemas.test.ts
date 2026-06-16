import { describe, it, expect } from 'vitest';
import { registerSchema } from './schemas';

describe('Shared Schemas (Client)', () => {
  it('should validate register data', () => {
    expect(registerSchema.safeParse({ email: 'test@me.com', password: 'password123' }).success).toBe(true);
  });
});
