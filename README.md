# Lustre Dating Platform

A production-ready dating platform built with React, Node.js, and PostgreSQL.

## Stack
- **Frontend:** React, TypeScript, Tailwind CSS, Vite, Framer Motion, Lucide React
- **Backend:** Node.js, Express, Drizzle ORM, Zod
- **Database:** PostgreSQL (Neon)
- **Auth:** JWT with Refresh Token Rotation
- **Payments:** M-Pesa & Paystack (Mocked)

## Features
- **Auth:** Register, Login, JWT Authentication, Refresh Token Rotation.
- **Discovery:** Swipe right to like, left to pass. Mutual likes create matches.
- **Social Connection:** Reveal WhatsApp and Instagram details after a mutual match.
- **Premium:** Subscription for KES 500/month via M-Pesa.
- **Referrals:** Referral system with KES 50 commission on the first payment.
- **Admin Panel:** Monitor users, revenue, and reports.

## Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database (Neon.tech recommended)
- Cloudinary Account (for photos)

### 1. Clone & Install
```bash
git clone <repo-url>
cd dating-platform
cd server && npm install
cd ../client && npm install
```

### 2. Environment Variables
Create `.env` files in both `server/` and `client/` based on `.env.example`.

### 3. Database Migration
```bash
cd server
npm run db:generate
npm run db:push
```

### 4. Run Development
```bash
# In server directory
npm run dev

# In client directory
npm run dev
```

## Security Measures
- **Rate Limiting:** Global and route-specific limits.
- **Input Validation:** Zod schemas for all API requests.
- **Refresh Token Rotation:** Enhanced security for long-lived sessions.
- **Idempotency:** Payment processing is idempotent to prevent double-charging.
- **Fraud Prevention:** Referral checks and payout cooling periods.

## License
MIT
