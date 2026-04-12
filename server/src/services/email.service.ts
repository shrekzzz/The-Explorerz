import { emailTransport, emailDefaults } from '../config/email.js';
import logger from '../utils/logger.js';

// ─── Email Templates ────────────────────

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using the configured transport.
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await emailTransport.sendMail({
      ...emailDefaults,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    logger.info({ to: options.to, subject: options.subject }, 'Email sent');
    return true;
  } catch (err) {
    logger.error({ err, to: options.to }, 'Failed to send email');
    return false;
  }
}

// ─── Template Functions ─────────────────

export async function sendWelcomeEmail(email: string, firstName: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Welcome to DeshYatra! 🌍',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to DeshYatra!</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">Your journey begins here</p>
        </div>
        <div style="padding: 30px;">
          <p style="color: #374151; font-size: 16px;">Hi ${firstName},</p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Thank you for joining DeshYatra — your ultimate travel companion for exploring
            the beauty of India. Start planning your next adventure today!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:5173'}/plan"
               style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 12px 32px;
                      border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Plan Your First Trip
            </a>
          </div>
        </div>
        <div style="padding: 20px 30px; background: #f3f4f6; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} DeshYatra. All rights reserved.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${firstName}, welcome to DeshYatra! Start planning your trips at our platform.`,
  });
}

export async function sendBookingConfirmationEmail(
  email: string,
  firstName: string,
  packageTitle: string,
  bookingId: string,
  travelDate: string,
  travelers: number,
  totalAmount: number
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Booking Confirmed — ${packageTitle} ✅`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Booking Confirmed! ✅</h1>
        </div>
        <div style="padding: 30px;">
          <p style="color: #374151; font-size: 16px;">Hi ${firstName},</p>
          <p style="color: #6b7280; font-size: 14px;">Your booking has been confirmed.</p>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #6b7280;">Booking ID</td><td style="padding: 8px 0; font-weight: 600;">${bookingId.slice(0, 8).toUpperCase()}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Package</td><td style="padding: 8px 0; font-weight: 600;">${packageTitle}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Travel Date</td><td style="padding: 8px 0; font-weight: 600;">${travelDate}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Travelers</td><td style="padding: 8px 0; font-weight: 600;">${travelers}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Total Amount</td><td style="padding: 8px 0; font-weight: 600; color: #059669;">₹${totalAmount.toLocaleString('en-IN')}</td></tr>
            </table>
          </div>
        </div>
        <div style="padding: 20px 30px; background: #f3f4f6; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} DeshYatra. All rights reserved.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${firstName}, your booking for ${packageTitle} is confirmed. Booking ID: ${bookingId}. Travel Date: ${travelDate}. Travelers: ${travelers}. Total: ₹${totalAmount}`,
  });
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  const resetUrl = `${process.env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  await sendEmail({
    to: email,
    subject: 'Reset Your Password — DeshYatra',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
        </div>
        <div style="padding: 30px;">
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            We received a request to reset your password. Click the button below to set a new password.
            This link will expire in 1 hour.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 12px 32px;
                      border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
    text: `Reset your password at: ${resetUrl}. If you didn't request this, ignore this email.`,
  });
}
