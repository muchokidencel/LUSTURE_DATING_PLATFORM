import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema, profileUpdateSchema } from './schemas';

describe('Shared Schemas', () => {
  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const data = { email: 'test@example.com', password: 'password123', code: '123456' };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should invalidate incorrect email', () => {
      const data = { email: 'invalid-email', password: 'password123', code: '123456' };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should invalidate short password', () => {
      const data = { email: 'test@example.com', password: '123', code: '123456' };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 8 characters');
      }
    });

    it('should invalidate missing or incorrect length code', () => {
      const dataWithoutCode = { email: 'test@example.com', password: 'password123' };
      expect(registerSchema.safeParse(dataWithoutCode).success).toBe(false);

      const dataWithShortCode = { email: 'test@example.com', password: 'password123', code: '1234' };
      expect(registerSchema.safeParse(dataWithShortCode).success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const data = { email: 'test@example.com', password: 'password123' };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('profileUpdateSchema', () => {
    it('should validate correct profile data', () => {
      const data = { 
        displayName: 'Test User',
        age: 25,
        gender: 'Male',
        intent: 'friendship',
        orientation: 'straight',
        location: 'Nairobi',
        whatsapp: '+254700000000',
        matchPreferences: {
          gender: 'Female',
          ageRange: { min: 18, max: 30 }
        }
      };
      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate all gender enum values', () => {
      ['Male', 'Female', 'Non-binary', 'male', 'female'].forEach(g => {
        expect(profileUpdateSchema.safeParse({ gender: g }).success).toBe(true);
      });
    });

    it('should validate all intent enum values', () => {
      ['casual', 'friendship', 'relationship', 'friends', 'one_night', 'dating'].forEach(i => {
        expect(profileUpdateSchema.safeParse({ intent: i }).success).toBe(true);
      });
    });

    it('should invalidate underage age', () => {
      const data = { age: 17 };
      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should invalidate long bio', () => {
      const data = { bio: 'a'.repeat(301) };
      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
