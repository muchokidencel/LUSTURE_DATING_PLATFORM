import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../db/index.js';
import axios from 'axios';
import { users, profiles, referrals, referralCodes, userPreferences, emailVerificationCodes } from '../../db/schema.js';
import { eq, and, gt } from 'drizzle-orm';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema, sendOtpSchema } from '../../shared/schemas.js';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { sendVerificationEmail } from '../../services/email.service.js';

const router = Router();

const referralRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many referral tracking attempts. Please try again later.' }
});

/**
 * Sets the referral cookie when a user visits a referral link.
 * GET /api/auth/referral?ref=CODE
 */
router.get('/referral', referralRateLimiter, async (req, res) => {
  const { ref } = req.query;
  if (typeof ref !== 'string') {
    return res.status(400).json({ message: 'Invalid referral code' });
  }

  try {
    const codeRecord = await db.query.referralCodes.findFirst({
      where: eq(referralCodes.code, ref),
    });

    if (codeRecord) {
      res.cookie('referral_code', ref, { 
        maxAge: 30 * 24 * 60 * 60 * 1000, 
        httpOnly: true,
        sameSite: 'lax'
      });
      return res.json({ status: 'success', message: 'Referral code stored' });
    }
    
    res.status(404).json({ message: 'Referral code not found' });
  } catch (error) {
    res.status(500).json({ message: 'Error tracking referral' });
  }
});

const generateTokens = (user: { id: number; email: string; role: string | null }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role || 'user' },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

router.post('/send-otp', validate(sendOtpSchema), async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Save in verification requests
    await db.insert(emailVerificationCodes).values({
      email,
      code,
      expiresAt,
    });

    console.log(`[EMAIL:VERIFICATION] OTP code generated for ${email}`);

    // Actually send the email
    const sent = await sendVerificationEmail({ to: email, code });
    if (!sent) {
      return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }

    res.json({
      status: 'success',
      message: 'Verification code sent successfully'
    });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/register', validate(registerSchema), async (req, res) => {
  const { email, password, referralCode: bodyReferralCode, code } = req.body;
  const cookieReferralCode = req.cookies?.referral_code;
  const rawRefCode = bodyReferralCode || cookieReferralCode;
  const refCode = typeof rawRefCode === 'string' ? rawRefCode.trim().toUpperCase() : null;

  console.log(`[REFERRAL:ATTR] New registration attempt for ${email}. Code provided: ${refCode || 'NONE'} (Source: ${bodyReferralCode ? 'body' : cookieReferralCode ? 'cookie' : 'none'})`);

  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate verification code
    const validCode = await db.query.emailVerificationCodes.findFirst({
      where: and(
        eq(emailVerificationCodes.email, email),
        eq(emailVerificationCodes.code, code),
        gt(emailVerificationCodes.expiresAt, new Date())
      )
    });

    if (!validCode) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Validate referrer
    let referrerId: number | null = null;
    if (refCode) {
      // 1. Check referral_codes table
      const codeRecord = await db.query.referralCodes.findFirst({
        where: eq(referralCodes.code, refCode),
      });
      
      if (codeRecord) {
        referrerId = codeRecord.userId;
        console.log(`[REFERRAL:ATTR] Code ${refCode} matched user ${referrerId} in referralCodes table.`);
      } else {
        // 2. Fallback to users table for legacy codes
        const legacyUser = await db.query.users.findFirst({
          where: eq(users.referralCode, refCode),
        });
        if (legacyUser) {
          referrerId = legacyUser.id;
          console.log(`[REFERRAL:ATTR] Code ${refCode} matched legacy user ${referrerId} in users table.`);
        } else {
          console.warn(`[REFERRAL:ATTR] Code ${refCode} did not match any active user.`);
        }
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // ... unique code generation logic ...
    let newReferralCode = '';
    let isUnique = false;
    while (!isUnique) {
      newReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      const existingCode = await db.query.referralCodes.findFirst({
        where: eq(referralCodes.code, newReferralCode),
      });
      const existingUserCode = await db.query.users.findFirst({
        where: eq(users.referralCode, newReferralCode),
      });
      if (!existingCode && !existingUserCode) isUnique = true;
    }

    const result = await db.insert(users).values({
      email,
      password: hashedPassword,
      referralCode: newReferralCode,
      referredBy: referrerId,
    }).returning();
    
    const newUser = result[0];
    console.log(`[REFERRAL:ATTR] User ${newUser.id} created with new code: ${newReferralCode}`);

    // Store in referral_codes table
    await db.insert(referralCodes).values({
      userId: newUser.id,
      code: newReferralCode,
    });

    // Initialize profile and preferences
    await db.insert(profiles).values({
      userId: newUser.id,
    });
    
    await db.insert(userPreferences).values({
      userId: newUser.id,
      interestedInGenders: [],
    });

    // Record referral if valid and not self-referral
    if (referrerId) {
      if (referrerId === newUser.id) {
        console.warn(`[REFERRAL:ATTR] Self-referral detected for user ${newUser.id}. Blocking attribution.`);
      } else {
        const existingReferral = await db.query.referrals.findFirst({
          where: eq(referrals.referredId, newUser.id),
        });

        if (!existingReferral) {
          await db.insert(referrals).values({
            referrerId,
            referredId: newUser.id,
            status: 'pending',
            referredAt: new Date(),
          });
          console.log(`[REFERRAL:ATTR] Attribution successful: Referrer ${referrerId} -> Referred ${newUser.id}`);
        } else {
          console.log(`[REFERRAL:ATTR] User ${newUser.id} already has an existing referral record.`);
        }
      }
    }

    // Clear referral cookie
    res.clearCookie('referral_code');

    // Clean up verification codes
    await db.delete(emailVerificationCodes).where(eq(emailVerificationCodes.email, email));

    const { accessToken, refreshToken } = generateTokens(newUser);

    res.status(201).json({
      status: 'success',
      data: {
        user: { id: newUser.id, email: newUser.email, referralCode: newUser.referralCode, role: newUser.role },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    res.json({
      status: 'success',
      data: {
        user: { id: user.id, email: user.email, referralCode: user.referralCode, role: user.role },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { id: number };
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.id),
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const tokens = generateTokens(user);

    res.json({
      status: 'success',
      data: tokens
    });
  } catch (error) {
    return res.status(403).json({ message: 'Invalid refresh token' });
  }
});

router.post('/google', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({ message: 'Google access token is required' });
  }

  try {
    // Call Google's userinfo API
    const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const googleUser = response.data;
    if (!googleUser || !googleUser.email) {
      return res.status(400).json({ message: 'Failed to retrieve Google user profile' });
    }

    const { email, name, sub: googleId } = googleUser;

    // 1. Look up by Google ID first (fast, no ambiguity)
    let user = await db.query.users.findFirst({
      where: eq(users.googleId, googleId),
    });

    // 2. If not found by googleId, check by email (account linking)
    if (!user) {
      user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      // Link Google account to existing email-based user
      if (user) {
        await db.update(users).set({
          googleId,
          authProvider: 'google',
          isEmailVerified: true,
        }).where(eq(users.id, user.id));
        console.log(`[GOOGLE:OAUTH] Linked Google (${googleId}) to existing user ${user.id}`);
      }
    }

    // 3. Create new user if doesn't exist
    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Unique referral code generation logic
      let newReferralCode = '';
      let isUnique = false;
      while (!isUnique) {
        newReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
        const existingCode = await db.query.referralCodes.findFirst({
          where: eq(referralCodes.code, newReferralCode),
        });
        const existingUserCode = await db.query.users.findFirst({
          where: eq(users.referralCode, newReferralCode),
        });
        if (!existingCode && !existingUserCode) isUnique = true;
      }

      // Check cookie for referral
      const cookieReferralCode = req.cookies?.referral_code;
      const refCode = typeof cookieReferralCode === 'string' ? cookieReferralCode.trim().toUpperCase() : null;
      let referrerId: number | null = null;
      if (refCode) {
        const codeRecord = await db.query.referralCodes.findFirst({
          where: eq(referralCodes.code, refCode),
        });
        if (codeRecord) {
          referrerId = codeRecord.userId;
        } else {
          const legacyUser = await db.query.users.findFirst({
            where: eq(users.referralCode, refCode),
          });
          if (legacyUser) referrerId = legacyUser.id;
        }
      }

      const result = await db.insert(users).values({
        email,
        password: hashedPassword,
        isEmailVerified: true,
        googleId,
        authProvider: 'google',
        referralCode: newReferralCode,
        referredBy: referrerId,
      }).returning();

      user = result[0];
      console.log(`[GOOGLE:OAUTH] Created new user ${user.id} (Google ID: ${googleId})`);

      // Store in referral_codes table
      await db.insert(referralCodes).values({
        userId: user.id,
        code: newReferralCode,
      });

      // Initialize profile and preferences
      await db.insert(profiles).values({
        userId: user.id,
        fullName: name || null,
      });

      await db.insert(userPreferences).values({
        userId: user.id,
        interestedInGenders: [],
      });

      // Record referral if valid
      if (referrerId && referrerId !== user.id) {
        const existingReferral = await db.query.referrals.findFirst({
          where: eq(referrals.referredId, user.id),
        });

        if (!existingReferral) {
          await db.insert(referrals).values({
            referrerId,
            referredId: user.id,
            status: 'pending',
            referredAt: new Date(),
          });
        }
      }

      // Clear referral cookie
      res.clearCookie('referral_code');
    }

    const { accessToken: jwtAccessToken, refreshToken: jwtRefreshToken } = generateTokens(user);

    res.json({
      status: 'success',
      data: {
        user: { id: user.id, email: user.email, referralCode: user.referralCode, role: user.role },
        accessToken: jwtAccessToken,
        refreshToken: jwtRefreshToken,
      },
    });
  } catch (error: any) {
    console.error('Google Auth Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Internal server error during Google Authentication' });
  }
});

export default router;
