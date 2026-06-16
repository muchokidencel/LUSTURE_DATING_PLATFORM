
import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET!;

const generateToken = (id: number, email: string, role: string) => {
  return jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '15m' });
};

async function testAdminStats() {
  const adminToken = generateToken(1, 'muchokidencel@gmail.com', 'admin');
  const userToken = generateToken(2, 'muchokidence52l@gmail.com', 'user');

  console.log('--- Starting Admin Stats Tests ---');

  // 1. Unauthorized (No token)
  try {
    await axios.get(`${API_URL}/admin/stats`);
    console.log('FAIL: Unauthorized request should have failed');
  } catch (err: any) {
    if (err.response?.status === 401) {
      console.log('PASS: Unauthorized request returned 401');
    } else {
      console.log(`FAIL: Unauthorized request returned ${err.response?.status}`);
    }
  }

  // 2. Forbidden (Regular user token)
  try {
    await axios.get(`${API_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('FAIL: User request should have failed with 403');
  } catch (err: any) {
    if (err.response?.status === 403) {
      console.log('PASS: User request returned 403');
    } else {
      console.log(`FAIL: User request returned ${err.response?.status}`);
    }
  }

  // 3. Success (Admin token)
  try {
    const res = await axios.get(`${API_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (res.status === 200 && res.data.status === 'success' && res.data.data.users && res.data.data.commissions) {
      console.log('PASS: Admin request returned 200 and correct data shape');
      // console.log(JSON.stringify(res.data, null, 2));
    } else {
      console.log(`FAIL: Admin request returned status ${res.status} or invalid data`);
      console.log('Response body:', res.data);
    }
  } catch (err: any) {
    console.log(`FAIL: Admin request failed: ${err.message}`);
    if (err.response) {
      console.log('Response data:', err.response.data);
    }
  }
}

testAdminStats().catch(console.error);
