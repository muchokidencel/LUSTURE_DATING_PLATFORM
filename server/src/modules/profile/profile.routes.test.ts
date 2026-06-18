import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index.js';
import { db } from '../../db/index.js';

vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      users: { findFirst: vi.fn() },
      profiles: { findFirst: vi.fn() },
      affiliateEarnings: { findMany: vi.fn().mockResolvedValue([]) },
      subscriptions: { findFirst: vi.fn().mockResolvedValue(null) },
      photos: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn() },
      userPreferences: { findFirst: vi.fn() },
    },
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn().mockReturnValue({ id: 1, email: 'test@test.com', role: 'user' }),
    sign: vi.fn().mockReturnValue('mock_token'),
  },
}));

// Mock Cloudinary
vi.mock('../../config/cloudinary.js', () => ({
  default: {
    uploader: {
      upload_stream: vi.fn().mockImplementation((options, callback) => {
        return {
          end: vi.fn().mockImplementation((buffer) => {
            callback(null, { public_id: 'photo_123', secure_url: 'http://test.com/photo.jpg' });
          })
        };
      }),
      destroy: vi.fn().mockResolvedValue({ result: 'ok' }),
    },
  },
}));

describe('Profile Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock behavior for syncPremium
    vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 1, email: 'test@test.com', photos: [] } as any);
  });

  describe('GET /api/profile/me', () => {
    it('should return current user profile', async () => {
      const mockProfile = { userId: 1, fullName: 'Test User' };
      vi.mocked(db.query.profiles.findFirst).mockResolvedValue(mockProfile as any);

      const res = await request(app)
        .get('/api/profile/me')
        .set('Authorization', 'Bearer mock_token');
      
      expect(res.status).toBe(200);
      expect(res.body.data.fullName).toBe('Test User');
    });
  });

  describe('PUT /api/profile', () => {
    it('should update profile successfully', async () => {
      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', 'Bearer mock_token')
        .send({ displayName: 'Updated Name', bio: 'New Bio', age: 25 });
      
      expect(res.status).toBe(200);
      // Profile update uses db.insert(...).onConflictDoUpdate(...)
      expect(db.insert).toHaveBeenCalled();
    });

    it('should convert age to birth date if provided', async () => {
      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', 'Bearer mock_token')
        .send({ age: 30 });
      
      expect(res.status).toBe(200);
      // Verify that db.insert was called (for the upsert)
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('POST /api/profile/photos', () => {
    it('should upload photo successfully', async () => {
      // Mock Cloudinary success is usually handled by the service/middleware, 
      // but here we check the route's response to the upload.
      const res = await request(app)
        .post('/api/profile/photos')
        .set('Authorization', 'Bearer mock_token')
        .attach('photo', Buffer.from('fake-image'), 'test.jpg');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      // Photos array update uses db.update(users)
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/profile/photos', () => {
    it('should delete photo successfully', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        photos: [{ public_id: 'lustre/profile-photos/1/photo_123', url: 'http://test.com/photo.jpg' }]
      } as any);

      const res = await request(app)
        .delete('/api/profile/photos')
        .set('Authorization', 'Bearer mock_token')
        .send({ public_id: 'lustre/profile-photos/1/photo_123' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });

    it('should return 404 if photo not found or not owned by user', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        photos: []
      } as any);

      const res = await request(app)
        .delete('/api/profile/photos')
        .set('Authorization', 'Bearer mock_token')
        .send({ public_id: 'lustre/profile-photos/1/not_mine' });

      expect(res.status).toBe(404);
    });
  });
});
