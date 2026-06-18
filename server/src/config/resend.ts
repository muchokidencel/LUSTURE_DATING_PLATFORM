import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('[EMAIL] RESEND_API_KEY is not set. Email sending will be disabled — OTPs will only be logged to console.');
}

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * The "from" address for outgoing emails.
 * When using Resend's free tier with an unverified domain,
 * you MUST use "onboarding@resend.dev". Once you add and
 * verify your own domain in the Resend dashboard, update
 * this to something like "verify@yourdomain.com".
 */
export const EMAIL_FROM = process.env.EMAIL_FROM || 'Lustre <onboarding@resend.dev>';
