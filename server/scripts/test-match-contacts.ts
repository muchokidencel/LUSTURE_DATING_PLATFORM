import { db } from '../src/db/index.js';
import { users, matches, profiles } from '../src/db/schema.js';
import { eq, and, or } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const API_URL = 'http://localhost:5000/api';

async function testMatchContacts() {
  console.log('--- STARTING MATCH CONTACT TESTS ---');

  try {
    // 1. Setup Test Users
    let userA = await db.query.users.findFirst({ where: eq(users.email, 'usera@test.com') });
    if (!userA) {
      [userA] = await db.insert(users).values({ email: 'usera@test.com', password: 'password', premiumTier: 'full' }).returning();
      await db.insert(profiles).values({ userId: userA.id, fullName: 'User A' });
    } else {
      await db.update(users).set({ premiumTier: 'full' }).where(eq(users.id, userA.id));
    }

    let userB = await db.query.users.findFirst({ where: eq(users.email, 'userb@test.com') });
    if (!userB) {
      [userB] = await db.insert(users).values({ email: 'userb@test.com', password: 'password', premiumTier: 'full' }).returning();
      await db.insert(profiles).values({ userId: userB.id, fullName: 'User B' });
    }

    const tokenA = jwt.sign({ id: userA.id, email: userA.email }, JWT_SECRET);
    const tokenB = jwt.sign({ id: userB.id, email: userB.email }, JWT_SECRET);

    // 2. Setup Match
    const existingMatch = await db.query.matches.findFirst({
      where: or(
        and(eq(matches.userOneId, userA.id), eq(matches.userTwoId, userB.id)),
        and(eq(matches.userOneId, userB.id), eq(matches.userTwoId, userA.id))
      )
    });

    if (!existingMatch) {
      await db.insert(matches).values({ userOneId: userA.id, userTwoId: userB.id });
      console.log('Created match between User A and User B');
    }

    // 3. Test PUT /api/profile (Validation & Save)
    console.log('Testing Profile Update...');
    
    // Valid Update
    try {
      const res = await axios.put(`${API_URL}/profile`, {
        whatsapp: '+254 700 000 000',
        instagram: '@test_handle'
      }, { headers: { Authorization: `Bearer ${tokenA}` } });
      
      const updatedUserA = await db.query.users.findFirst({ where: eq(users.id, userA.id) });
      if (updatedUserA?.whatsapp === '+254700000000' && updatedUserA?.instagram === 'test_handle') {
        console.log('PASS: Profile update saved and formatted correctly');
      } else {
        console.log('FAIL: Profile update formatting failed', updatedUserA?.whatsapp, updatedUserA?.instagram);
      }
    } catch (err: any) {
      console.log('FAIL: Profile update error', err.response?.data || err.message);
    }

    // Invalid WhatsApp
    try {
      await axios.put(`${API_URL}/profile`, {
        whatsapp: 'invalid-number'
      }, { headers: { Authorization: `Bearer ${tokenA}` } });
      console.log('FAIL: Invalid WhatsApp number was accepted');
    } catch (err: any) {
      if (err.response?.status === 400) {
        console.log('PASS: Invalid WhatsApp rejected (400)');
      } else {
        console.log('FAIL: Unexpected error for invalid WhatsApp', err.response?.status);
      }
    }

    // 4. Test GET /api/matches (Reveal)
    console.log('Testing Match Reveal...');
    try {
      const res = await axios.get(`${API_URL}/matches`, {
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      const match = res.data.data.find((m: any) => m.otherUser.userId === userA.id);
      if (match && match.otherUser.whatsapp === '+254700000000' && match.otherUser.instagram === 'test_handle') {
        console.log('PASS: Matched user can see contact details');
      } else {
        console.log('FAIL: Matched user could not see contact details', match?.otherUser);
      }
    } catch (err: any) {
      console.log('FAIL: Matches reveal error', err.response?.data || err.message);
    }

    // 5. Test GET /api/users/:id (Privacy)
    console.log('Testing Public Privacy...');
    try {
      const res = await axios.get(`${API_URL}/users/${userA.id}`);
      if (res.data.data.whatsapp === undefined && res.data.data.instagram === undefined) {
        console.log('PASS: Public profile does not reveal contact details');
      } else {
        console.log('FAIL: Public profile revealed contact details', res.data.data);
      }
    } catch (err: any) {
      console.log('FAIL: Public profile fetch error', err.response?.data || err.message);
    }

  } catch (error) {
    console.error('Test Execution Error:', error);
  }

  console.log('--- MATCH CONTACT TESTS COMPLETE ---');
  process.exit(0);
}

testMatchContacts();
