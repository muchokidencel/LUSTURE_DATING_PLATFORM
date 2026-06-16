/**
 * LUSTRE API DOCUMENTATION (STEP 7)
 * 
 * Base URL: /api
 * Auth: Authorization: Bearer <token> (JWT)
 */

/**
 * 1. DISCOVERY & INTERACTIONS
 */
// GET /discovery/users
// Returns ranked list of potential matches.
// Response: { status: 'success', data: [{ userId, fullName, bio, compatibilityScore, ... }] }

// POST /discovery/like
// Like or Super Like a user.
// Request: { toUserId: number, type: 'standard' | 'super' }
// Response: { status: 'success', match: boolean }

// POST /discovery/pass
// Explicitly dislike a user (prevents re-surfacing).
// Request: { toUserId: number, explicit: boolean }
// Response: { status: 'success' }

/**
 * 2. MATCHES & COMMUNICATION
 */
// GET /matches
// List all mutual matches with tiered handle previews.
// Response: { status: 'success', data: [{ id, otherUser: { fullName, whatsappNumber (blurred?), ... }, bothConsented: bool }] }

// POST /matches/:id/reveal
// Opt-in to reveal contact details for a match.
// Response: { status: 'success', message: 'Consent recorded' }

/**
 * 3. PREMIUM & TOKENS
 */
// GET /stats/subscription
// Get current user's premium tier and expiry.
// Response: { status: 'success', data: { premiumTier, endDate, status } }

// POST /payments/pay/mpesa
// Initiate STK Push (KES 500 for Basic, KES 1000 for Full).
// Request: { phoneNumber, amount, tier: 'basic' | 'full' }

// POST /tokens/redeem
// Redeem tokens for a "Match Reveal" or "Extra Super Like".
// Request: { action: 'reveal_match', matchId: number }

/**
 * 4. NOTIFICATIONS
 */
// GET /notifications
// List all unread notifications.
// Response: { status: 'success', data: [{ id, type, content, createdAt }] }

// PATCH /notifications/:id/read
// Mark a notification as read.
