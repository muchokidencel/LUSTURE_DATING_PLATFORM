import { resend, EMAIL_FROM } from '../config/resend.js';

interface SendVerificationEmailParams {
  to: string;
  code: string;
}

/**
 * Sends a verification OTP email using Resend.
 * Falls back to console logging if Resend is not configured.
 */
export async function sendVerificationEmail({ to, code }: SendVerificationEmailParams): Promise<boolean> {
  // Fallback: log to console when Resend isn't configured
  if (!resend) {
    console.log(`[EMAIL:VERIFICATION] (no Resend key) OTP code for ${to} is: ${code}`);
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Your Lustre Verification Code',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0f; padding: 40px 32px; border-radius: 16px; border: 1px solid rgba(139, 92, 246, 0.15);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 28px; color: #f5f5f7; margin: 0; letter-spacing: 0.05em; font-weight: 300;">LUSTRE</h1>
            <p style="font-size: 10px; color: rgba(245, 245, 247, 0.4); text-transform: uppercase; letter-spacing: 0.3em; margin-top: 8px;">Exclusive Dating</p>
          </div>
          
          <div style="background: rgba(139, 92, 246, 0.06); border: 1px solid rgba(139, 92, 246, 0.12); border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 11px; color: rgba(245, 245, 247, 0.5); text-transform: uppercase; letter-spacing: 0.2em; margin: 0 0 16px 0;">Your Verification Code</p>
            <p style="font-size: 36px; color: #f5f5f7; font-weight: 700; letter-spacing: 0.4em; margin: 0; font-family: 'Courier New', monospace;">${code}</p>
          </div>
          
          <p style="font-size: 12px; color: rgba(245, 245, 247, 0.4); text-align: center; line-height: 1.6; margin: 0;">
            This code expires in <strong style="color: rgba(245, 245, 247, 0.6);">15 minutes</strong>.<br/>
            If you didn't request this, you can safely ignore this email.
          </p>
          
          <div style="border-top: 1px solid rgba(139, 92, 246, 0.08); margin-top: 32px; padding-top: 20px;">
            <p style="font-size: 9px; color: rgba(245, 245, 247, 0.2); text-align: center; text-transform: uppercase; letter-spacing: 0.15em; margin: 0;">
              © ${new Date().getFullYear()} Lustre. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('[EMAIL:VERIFICATION] Resend error:', error);
      return false;
    }

    console.log(`[EMAIL:VERIFICATION] Code sent to ${to}`);
    return true;
  } catch (err) {
    console.error('[EMAIL:VERIFICATION] Failed to send email:', err);
    return false;
  }
}
