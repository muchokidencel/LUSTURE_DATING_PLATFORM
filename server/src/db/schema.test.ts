import { describe, it, expect } from 'vitest';
import * as schema from './schema';

describe('Database Schema', () => {
  it('should have users table defined', () => {
    expect(schema.users).toBeDefined();
  });

  it('should have profiles table defined', () => {
    expect(schema.profiles).toBeDefined();
  });
  
  it('should have referrals table defined', () => {
    expect(schema.referrals).toBeDefined();
  });
});
