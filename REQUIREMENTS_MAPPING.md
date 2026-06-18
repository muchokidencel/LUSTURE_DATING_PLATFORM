# Lustre Requirements Mapping

This document maps API endpoints to high-level features for STLC Requirement Analysis.

## 1. Authentication
| Method | Endpoint | Feature |
| --- | --- | --- |
| POST | `/api/auth/register` | User Registration |
| POST | `/api/auth/login` | User Login |
| POST | `/api/auth/refresh` | Token Refresh |
| POST | `/api/auth/logout` | User Logout |
| POST | `/api/auth/send-otp` | Send Email Verification OTP |

## 2. Profile Management
| Method | Endpoint | Feature |
| --- | --- | --- |
| GET | `/api/profile/me` | Get Personal Profile |
| PUT | `/api/profile` | Update Profile Details |
| POST | `/api/profile/photos` | Upload Profile Photo |
| DELETE | `/api/profile/photos` | Delete Profile Photo |

## 3. User Discovery & Interactions
| Method | Endpoint | Feature |
| --- | --- | --- |
| GET | `/api/discovery/users` | Discovery Feed |
| POST | `/api/discovery/like` | Swipe Right (Like) |
| POST | `/api/discovery/pass` | Swipe Left (Pass) |
| GET | `/api/likes/received` | View Received Likes |

## 4. Matching
| Method | Endpoint | Feature |
| --- | --- | --- |
| GET | `/api/matching/recommendations` | AI/Score-based Recommendations |
| GET | `/api/matches` | List Confirmed Matches |

## 5. Referral System
| Method | Endpoint | Feature |
| --- | --- | --- |
| GET | `/api/referrals/stats` | Referral Dashboard Stats |
| GET | `/api/referrals/link` | Get Unique Referral Link |
| GET | `/api/referrals/activity` | Referral Activity Feed |
| GET | `/api/referrals/earnings` | Earnings Breakdown |
| POST | `/api/referrals/withdraw` | Request Withdrawal |

## 6. Payments & Premium
| Method | Endpoint | Feature |
| --- | --- | --- |
| POST | `/api/payments/stkpush` | M-Pesa Payment |
| GET | `/api/stats/subscription` | Check Premium Status |

## 7. Admin Panel
| Method | Endpoint | Feature |
| --- | --- | --- |
| GET | `/api/admin/stats` | System Overview Stats |
| GET | `/api/admin/users` | Admin User Management |
| GET | `/api/admin/withdrawals` | Pending Withdrawal Requests |
| PUT | `/api/admin/withdrawals/:id` | Approve/Reject Withdrawal |
