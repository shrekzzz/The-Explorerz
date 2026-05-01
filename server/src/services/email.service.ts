import { emailTransport, emailDefaults } from '../config/email.js';
import logger from '../utils/logger.js';
import { sanitizePlainText, escapeHtml } from '../utils/sanitize.js';
import { Queue, Worker } from 'bullmq';
import redis from '../config/redis.js';

// ─── Email Queue Setup ──────────────────

export const emailQueue = new Queue('emails', {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// ─── Email Templates ────────────────────

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailJobData {
  type: 'welcome' | 'booking-confirmation' | 'email-verification' | 'password-reset';
  data: any;
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
  // Sanitize user input to prevent XSS in emails
  const safeName = escapeHtml(sanitizePlainText(firstName));
  
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
          <p style="color: #374151; font-size: 16px;">Hi ${safeName},</p>
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
  // Sanitize all user inputs
  const safeName = escapeHtml(sanitizePlainText(firstName));
  const safePackageTitle = escapeHtml(sanitizePlainText(packageTitle));
  const safeTravelDate = escapeHtml(sanitizePlainText(travelDate));
  
  await sendEmail({
    to: email,
    subject: `Booking Confirmed — ${safePackageTitle} ✅`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Booking Confirmed! ✅</h1>
        </div>
        <div style="padding: 30px;">
          <p style="color: #374151; font-size: 16px;">Hi ${safeName},</p>
          <p style="color: #6b7280; font-size: 14px;">Your booking has been confirmed.</p>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #6b7280;">Booking ID</td><td style="padding: 8px 0; font-weight: 600;">${bookingId.slice(0, 8).toUpperCase()}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Package</td><td style="padding: 8px 0; font-weight: 600;">${safePackageTitle}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Travel Date</td><td style="padding: 8px 0; font-weight: 600;">${safeTravelDate}</td></tr>
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

export async function sendEmailVerification(
  email: string,
  firstName: string,
  verificationToken: string
): Promise<void> {
  // Sanitize user input
  const safeName = escapeHtml(sanitizePlainText(firstName));
  
  const verificationUrl = `${process.env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

  await sendEmail({
    to: email,
    subject: 'Verify Your Email — DeshYatra',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
        </div>
        <div style="padding: 30px;">
          <p style="color: #374151; font-size: 16px;">Hi ${safeName},</p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Thank you for registering with DeshYatra! Please verify your email address to
            unlock all features and start planning your trips.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 12px 32px;
                      border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px;">
            This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
        <div style="padding: 20px 30px; background: #f3f4f6; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} DeshYatra. All rights reserved.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${firstName}, verify your email at: ${verificationUrl}. This link expires in 24 hours.`,
  });
}

// ─── Email Queue Functions ──────────────

/**
 * Queue an email for asynchronous sending with retry logic
 */
export async function queueEmail(type: EmailJobData['type'], data: any): Promise<void> {
  try {
    await emailQueue.add(type, { type, data });
    logger.info({ type, recipient: data.email }, 'Email queued');
  } catch (err) {
    logger.error({ err, type }, 'Failed to queue email');
    throw err;
  }
}

/**
 * Initialize email worker to process queued emails
 */
export function initEmailWorker(): Worker {
  const worker = new Worker(
    'emails',
    async (job) => {
      const { type, data } = job.data as EmailJobData;
      
      logger.info({ type, jobId: job.id }, 'Processing email job');
      
      try {
        switch (type) {
          case 'welcome':
            await sendWelcomeEmail(data.email, data.firstName);
            break;
          case 'booking-confirmation':
            await sendBookingConfirmationEmail(
              data.email,
              data.firstName,
              data.packageTitle,
              data.bookingId,
              data.travelDate,
              data.travelers,
              data.totalAmount
            );
            break;
          case 'email-verification':
            await sendEmailVerification(data.email, data.firstName, data.verificationToken);
            break;
          case 'password-reset':
            await sendPasswordResetEmail(data.email, data.resetToken);
            break;
          default:
            throw new Error(`Unknown email type: ${type}`);
        }
        
        logger.info({ type, jobId: job.id }, 'Email job completed');
      } catch (err) {
        logger.error({ err, type, jobId: job.id }, 'Email job failed');
        throw err;
      }
    },
    {
      connection: redis as any,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Email worker: job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Email worker: job failed');
  });

  return worker;
}
