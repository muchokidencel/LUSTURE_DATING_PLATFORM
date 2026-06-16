import { db } from '../src/db/index.js';
import { users, profiles, photos, blocks } from '../src/db/schema.js';
import { eq, ne } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const API_URL = 'http://localhost:5000/api';

async function testDiscovery() {
  console.log('--- STARTING DISCOVERY TESTS ---');

  // 1. Find or Create Premium User
  let premiumUser = await db.query.users.findFirst({
    where: eq(users.premiumTier, 'full')
  });

  if (!premiumUser) {
    console.log('No premium user found, creating one...');
    const [newUser] = await db.insert(users).values({
      email: 'premium@test.com',
      password: 'password',
      premiumTier: 'full'
    }).returning();
    premiumUser = newUser;
  }

  // 2. Find or Create Free User
  let freeUser = await db.query.users.findFirst({
    where: eq(users.premiumTier, 'free')
  });

  if (!freeUser) {
    console.log('No free user found, creating one...');
    const [newUser] = await db.insert(users).values({
      email: 'free@test.com',
      password: 'password',
      premiumTier: 'free'
    }).returning();
    freeUser = newUser;
  }

  const premiumToken = jwt.sign({ id: premiumUser.id, email: premiumUser.email, role: premiumUser.role }, JWT_SECRET);
  const freeToken = jwt.sign({ id: freeUser.id, email: freeUser.email, role: freeUser.role }, JWT_SECRET);

  // Test 1: Premium User access
  try {
    const res = await axios.get(`${API_URL}/discovery/users`, {
      headers: { Authorization: `Bearer ${premiumToken}` }
    });
    if (res.status === 200 && res.data.status === 'success') {
      console.log('PASS: Premium user can access discovery');
    } else {
      console.log('FAIL: Premium user could not access discovery');
    }
  } catch (error: any) {
    console.log('FAIL: Premium user access error', error.response?.status, error.response?.data);
  }

  // Test 2: Free User access (should be 403)
  try {
    await axios.get(`${API_URL}/discovery/users`, {
      headers: { Authorization: `Bearer ${freeToken}` }
    });
    console.log('FAIL: Free user accessed discovery (should be 403)');
  } catch (error: any) {
    if (error.response?.status === 403) {
      console.log('PASS: Free user blocked from discovery (403)');
    } else {
      console.log('FAIL: Unexpected error for free user', error.response?.status);
    }
  }

  // Test 3: Pagination
  try {
    const res = await axios.get(`${API_URL}/discovery/users?page=2`, {
      headers: { Authorization: `Bearer ${premiumToken}` }
    });
    if (res.status === 200 && res.data.pagination?.page === 2) {
      console.log('PASS: Pagination offset works (?page=2)');
    } else {
      console.log('FAIL: Pagination offset failed', res.data.pagination);
    }
  } catch (error: any) {
    console.log('FAIL: Pagination test error', error.response?.status);
  }

  console.log('--- DISCOVERY TESTS COMPLETE ---');
  process.exit(0);
}

testDiscovery().catch(err => {
  console.error(err);
  process.exit(1);
});
