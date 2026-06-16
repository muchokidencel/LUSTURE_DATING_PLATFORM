import { Router, Request, Response } from 'express';
import { db } from '../../db/index.js';
import { users, payments, subscriptions, affiliateEarnings, referrals } from '../../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import axios from 'axios';

const router = Router();

// --- M-PESA HELPERS ---
const getMpesaAccessToken = async () => {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const response = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );
  return response.data.access_token;
};

const formatTimestamp = () => {
  const date = new Date();
  return date.getFullYear() +
    ('0' + (date.getMonth() + 1)).slice(-2) +
    ('0' + date.getDate()).slice(-2) +
    ('0' + date.getHours()).slice(-2) +
    ('0' + date.getMinutes()).slice(-2) +
    ('0' + date.getSeconds()).slice(-2);
};

// --- SUBSCRIPTION & COMMISSION HELPER ---
const handleSuccessfulPayment = async (userId: number, amount: number, paymentId: number) => {
  const uid = Number(userId);
  console.log(`[Payment Success] Processing for User: ${uid}, Amount: ${amount}`);

  await db.transaction(async (tx) => {
    // 1. Update/Create Subscription
    const now = new Date();
    
    // Check if active subscription exists
    const existingSub = await tx.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, uid),
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.endDate)]
    });

    if (existingSub && new Date(existingSub.endDate) > now) {
      // Extend current active subscription
      const newEndDate = new Date(existingSub.endDate);
      newEndDate.setMonth(newEndDate.getMonth() + 1);
      await tx.update(subscriptions)
        .set({ endDate: newEndDate, status: 'active' })
        .where(eq(subscriptions.id, existingSub.id));
      console.log(`[Payment Success] Extended subscription for ${uid}`);
    } else {
      // Create new subscription or renew expired one
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      
      await tx.insert(subscriptions).values({
        userId: uid,
        endDate,
        status: 'active',
      });
      console.log(`[Payment Success] Created new subscription for ${uid}`);
    }

    // 1.5 Update User Premium Tier (Crucial for match logic)
    await tx.update(users)
      .set({ premiumTier: 'basic' })
      .where(eq(users.id, uid));
    console.log(`[Payment Success] Set User ${uid} premiumTier to 'basic'`);

    // 2. Referral Commission (KES 50) - Only on first payment
    console.log(`[REFERRAL:COMM] Checking attribution for payer ${uid}...`);
    
    // Look for the referral record first - primary source of truth
    const referralRecord = await tx.query.referrals.findFirst({
      where: and(
        eq(referrals.referredId, uid),
        eq(referrals.status, 'pending')
      )
    });

    if (referralRecord) {
      const rid = referralRecord.referrerId;
      console.log(`[REFERRAL:COMM] Found pending referral from referrer ${rid} to payer ${uid}. Processing commission...`);
      
      const now = new Date();

      // Update referral record to 'paid'
      await tx.update(referrals)
        .set({
          status: 'paid',
          convertedAt: now,
          coolingEndsAt: now,
          paidAt: now
        })
        .where(eq(referrals.id, referralRecord.id));
      console.log(`[REFERRAL:COMM] Referral ${referralRecord.id} status updated to 'paid'.`);

      // Create 'available' earnings record
      await tx.insert(affiliateEarnings).values({
        userId: rid,
        amount: 50,
        referralId: referralRecord.id,
        status: 'available',
        availableAt: now,
        createdAt: now,
      });
      console.log(`[REFERRAL:COMM] Earnings record created for user ${rid}.`);

      // Increment referrer's total_earnings balance (with null safety)
      await tx.update(users)
        .set({ 
          totalEarnings: sql`COALESCE(${users.totalEarnings}, 0) + 50` 
        })
        .where(eq(users.id, rid));
      
      console.log(`[REFERRAL:COMM] SUCCESS: KES 50 credited to user ${rid}. Chain complete.`);
    } else {
      console.log(`[REFERRAL:COMM] No pending referral found for payer ${uid}. Checking status...`);
      const existingPaid = await tx.query.referrals.findFirst({
        where: and(
          eq(referrals.referredId, uid),
          eq(referrals.status, 'paid')
        )
      });
      if (existingPaid) {
        console.log(`[REFERRAL:COMM] SKIP: Commission already processed for user ${uid}.`);
      } else {
        console.warn(`[REFERRAL:COMM] IGNORE: User ${uid} was not referred via the program.`);
      }
    }
  });
};

// --- ROUTES ---

// M-Pesa STK Push
router.post('/pay/mpesa', authenticate, async (req: AuthRequest, res) => {
  const { phoneNumber, amount } = req.body;
  const userId = req.user!.id;

  try {
    const accessToken = await getMpesaAccessToken();
    const timestamp = formatTimestamp();
    const shortCode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: shortCode,
        PhoneNumber: phoneNumber,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: 'Lustre Premium',
        TransactionDesc: 'Payment for Lustre Premium Subscription',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.data.ResponseCode === '0') {
      await db.insert(payments).values({
        userId,
        amount,
        provider: 'mpesa',
        status: 'pending',
        providerRef: response.data.CheckoutRequestID,
      });

      res.json({ status: 'success', message: 'STK Push sent successfully', checkoutRequestId: response.data.CheckoutRequestID });
    } else {
      res.status(400).json({ message: 'STK Push failed', details: response.data });
    }
  } catch (error: any) {
    console.error('M-Pesa Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error initiating M-Pesa payment' });
  }
});

// M-Pesa Callback
router.post('/callback/mpesa', async (req: Request, res: Response) => {
  const { Body } = req.body;
  const { stkCallback } = Body;

  console.log('M-Pesa Callback:', JSON.stringify(stkCallback));

  try {
    const payment = await db.query.payments.findFirst({
      where: eq(payments.providerRef, stkCallback.CheckoutRequestID),
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (stkCallback.ResultCode === 0) {
      await db.update(payments)
        .set({ status: 'completed' })
        .where(eq(payments.id, payment.id));

      await handleSuccessfulPayment(payment.userId, payment.amount, payment.id);
    } else {
      await db.update(payments)
        .set({ status: 'failed' })
        .where(eq(payments.id, payment.id));
    }

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('Callback Error:', error);
    res.status(500).json({ ResultCode: 1, ResultDesc: 'Internal Error' });
  }
});

// Paystack Initialize
router.post('/pay/paystack/initialize', authenticate, async (req: AuthRequest, res) => {
  const { amount, email, callbackUrl } = req.body;
  const userId = req.user!.id;

  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100, // Paystack expects amount in subunits (kobo/cents)
        callback_url: callbackUrl || `${process.env.CLIENT_URL || 'http://localhost:5173'}/premium`,
        metadata: {
          userId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    await db.insert(payments).values({
      userId,
      amount,
      provider: 'paystack',
      status: 'pending',
      providerRef: response.data.data.reference,
    });

    res.json({ status: 'success', data: response.data.data });
  } catch (error: any) {
    console.error('Paystack Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error initializing Paystack payment' });
  }
});

// Paystack Verify
router.get('/pay/paystack/verify/:reference', authenticate, async (req: AuthRequest, res) => {
  const { reference } = req.params;

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const { data } = response.data;
    const payment = await db.query.payments.findFirst({
      where: eq(payments.providerRef, reference as string),
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    if (data.status === 'success' && payment.status !== 'completed') {
      await db.update(payments)
        .set({ status: 'completed' })
        .where(eq(payments.id, payment.id));

      await handleSuccessfulPayment(payment.userId, payment.amount, payment.id);
      res.json({ status: 'success', message: 'Payment verified and subscription activated' });
    } else {
      res.json({ status: data.status, message: data.gateway_response });
    }
  } catch (error: any) {
    console.error('Paystack Verify Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error verifying Paystack payment' });
  }
});

// Paystack Webhook
router.post('/callback/paystack', async (req: Request, res: Response) => {
  // In a real app, verify signature: x-paystack-signature
  const { event, data } = req.body;

  if (event === 'charge.success') {
    const reference = data.reference;
    const userId = data.metadata.userId;

    try {
      const payment = await db.query.payments.findFirst({
        where: eq(payments.providerRef, reference),
      });

      if (payment && payment.status !== 'completed') {
        await db.update(payments)
          .set({ status: 'completed' })
          .where(eq(payments.id, payment.id));

        await handleSuccessfulPayment(userId, payment.amount, payment.id);
      }
    } catch (error) {
      console.error('Paystack Webhook Error:', error);
    }
  }

  res.sendStatus(200);
});

export default router;
