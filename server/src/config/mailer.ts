import nodemailer from 'nodemailer';

/**
 * Gmail SMTP transporter using App Password authentication.
 * Falls back gracefully when credentials are not configured.
 */
const createTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('[EMAIL] GMAIL_USER or GMAIL_APP_PASSWORD not set. Email sending disabled — OTPs will only be logged to console.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

export const transporter = createTransporter();

export const EMAIL_FROM = `Lustre <${process.env.GMAIL_USER || 'noreply@lustre.app'}>`;
