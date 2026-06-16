import { db } from '../src/db/index.js';
import { users, profiles } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from 'dotenv';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const API_URL = 'http://localhost:5000/api';

async function testPhotoEndpoints() {
  console.log('--- STARTING PHOTO ENDPOINT TESTS ---');

  try {
    // 1. Setup Test User
    let testUser = await db.query.users.findFirst({ where: eq(users.email, 'phototester@test.com') });
    if (!testUser) {
      [testUser] = await db.insert(users).values({ 
        email: 'phototester@test.com', 
        password: 'password',
        premiumTier: 'full' 
      }).returning();
      await db.insert(profiles).values({ userId: testUser.id, fullName: 'Photo Tester' });
    }
    const token = jwt.sign({ id: testUser.id, email: testUser.email }, JWT_SECRET);

    // 2. Test POST /api/profile/photos (Real Upload)
    console.log('Testing Real Binary Upload...');
    try {
      // 1x1 Pixel Red JPEG in Base64
      const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      const buffer = Buffer.from(base64Image, 'base64');
      
      const form = new FormData();
      form.append('photo', buffer, { filename: 'test.png', contentType: 'image/png' });

      const res = await axios.post(`${API_URL}/profile/photos`, form, {
        headers: { 
          ...form.getHeaders(),
          Authorization: `Bearer ${token}` 
        }
      });
      
      if (res.status === 200 && res.data.data.length > 0) {
        const uploadedPhoto = res.data.data[res.data.data.length - 1];
        console.log('PASS: Real upload successful!', uploadedPhoto.url);

        // 2.1 Test DELETE /api/profile/photos (Real Delete)
        console.log('Testing Real Delete...');
        const delRes = await axios.delete(`${API_URL}/profile/photos`, {
          data: { public_id: uploadedPhoto.public_id },
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (delRes.status === 200) {
          console.log('PASS: Real delete successful!');
        } else {
          console.log('FAIL: Real delete failed', delRes.status);
        }
      } else {
        console.log('FAIL: Upload returned unexpected status', res.status);
      }
    } catch (err: any) {
      console.log('FAIL: Real upload error', err.response?.data || err.message);
    }

    // 3. Test DELETE /api/profile/photos (Unauthorized)
    console.log('Testing Unauthorized Delete...');
    try {
      await axios.delete(`${API_URL}/profile/photos`, {
        data: { public_id: 'lustre/profile-photos/999/other-user-photo' },
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('FAIL: Allowed deleting another user\'s photo');
    } catch (err: any) {
      if (err.response?.status === 403) {
        console.log('PASS: Unauthorized delete rejected (403)');
      } else {
        console.log('FAIL: Unexpected error for unauthorized delete', err.response?.status);
      }
    }

    // 4. Test Validation (No Photo)
    console.log('Testing Empty Upload...');
    try {
      await axios.post(`${API_URL}/profile/photos`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('FAIL: Allowed upload with no file');
    } catch (err: any) {
      if (err.response?.status === 400) {
        console.log('PASS: Empty upload rejected (400)');
      } else {
        console.log('FAIL: Unexpected error for empty upload', err.response?.status);
      }
    }

    // 5. Test Auth
    console.log('Testing No Auth...');
    try {
      await axios.post(`${API_URL}/profile/photos`, {});
      console.log('FAIL: Allowed request without auth');
    } catch (err: any) {
      if (err.response?.status === 401) {
        console.log('PASS: No auth rejected (401)');
      } else {
        console.log('FAIL: Unexpected error for no auth', err.response?.status);
      }
    }

  } catch (error) {
    console.error('Test Execution Error:', error);
  }

  console.log('--- PHOTO ENDPOINT TESTS COMPLETE ---');
  process.exit(0);
}

testPhotoEndpoints();
