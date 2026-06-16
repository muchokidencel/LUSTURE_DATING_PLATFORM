import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function runTests() {
  console.log('--- STARTING LIKES RECEIVED ENDPOINT TESTS ---');

  // 1. Generate token for User ID 4
  const token = jwt.sign({ id: 4, email: 'test_referral@gmail.com', role: 'user' }, JWT_SECRET);

  try {
    // 2. Call with valid auth
    console.log('Testing GET /api/likes/received with valid auth...');
    const res = await axios.get(`${API_URL}/likes/received`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 200 && Array.isArray(res.data.data)) {
      console.log('PASS: Status is 200 and data is an array.');
      
      const likers = res.data.data;
      if (likers.length > 0) {
        const first = likers[0];
        const requiredFields = ['id', 'displayName', 'photos'];
        const sensitiveFields = ['email', 'whatsapp', 'instagram', 'matchPreferences'];

        requiredFields.forEach(field => {
          if (first[field] !== undefined) {
            console.log(`PASS: Liked user has ${field}`);
          } else {
            console.error(`FAIL: Liked user is missing ${field}`);
          }
        });

        sensitiveFields.forEach(field => {
          if (first[field] === undefined) {
            console.log(`PASS: Liked user does NOT have sensitive field ${field}`);
          } else {
            console.error(`FAIL: Liked user EXPOSES sensitive field ${field}`);
          }
        });
      } else {
        console.log('INFO: No likes received yet, but array returned.');
      }
    } else {
      console.error('FAIL: Expected 200 and array, got:', res.status, typeof res.data.data);
    }

  } catch (err: any) {
    console.error('FAIL: Request failed with error:', err.message);
    if (err.response) {
      console.error('Response Status:', err.response.status);
      console.error('Response Data:', err.response.data);
    }
  }

  // 3. Call without auth
  try {
    console.log('\nTesting GET /api/likes/received without auth...');
    await axios.get(`${API_URL}/likes/received`);
    console.error('FAIL: Request succeeded without auth (expected 401)');
  } catch (err: any) {
    if (err.response && err.response.status === 401) {
      console.log('PASS: Correctly returned 401 Unauthorized');
    } else {
      console.error('FAIL: Expected 401, got:', err.response?.status || err.message);
    }
  }

  console.log('\n--- TESTS COMPLETED ---');
  process.exit(0);
}

runTests();
