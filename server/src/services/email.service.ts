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

// ─── Enquiry Email Templates ────────────

export async function sendEnquiryConfirmationEmail(
  email: string,
  name: string,
  packageTitle: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Thank You for Your Enquiry — ${packageTitle} ✅`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Thank You, ${name}! 🙏</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 16px;">We've received your enquiry</p>
        </div>
        
        <div style="padding: 30px;">
          <p style="color: #374151; font-size: 16px; margin-bottom: 16px;">Hi ${name},</p>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            Thank you for your interest in <strong style="color: #667eea;">${packageTitle}</strong>. 
            We're excited to help you plan your perfect journey!
          </p>

          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #374151; font-size: 16px; margin: 0 0 12px 0;">📋 What Happens Next?</h3>
            <ul style="color: #6b7280; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Our travel experts will review your requirements</li>
              <li>We'll contact you within <strong>24 hours</strong> via email or phone</li>
              <li>You'll receive a customized itinerary and pricing details</li>
              <li>We'll answer all your questions and finalize your booking</li>
            </ul>
          </div>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="color: #374151; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">
              Need Immediate Assistance?
            </p>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              📞 Call us at <strong style="color: #667eea;">+91-XXXXXXXXXX</strong><br/>
              📧 Email us at <strong style="color: #667eea;">support@deshyatra.com</strong>
            </p>
          </div>

          <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.6;">
              <strong>💡 Pro Tip:</strong> Keep your phone handy! Our team will reach out soon to discuss your travel plans and answer any questions you may have.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:5173'}/packages"
               style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 14px 32px;
                      border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 14px;">
              Explore More Packages
            </a>
          </div>

          <p style="color: #9ca3af; font-size: 13px; text-align: center; margin-top: 30px; line-height: 1.6;">
            We're committed to making your travel experience unforgettable.<br/>
            Thank you for choosing DeshYatra! 🌍✨
          </p>
        </div>
        
        <div style="padding: 20px 30px; background: #f3f4f6; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} DeshYatra. All rights reserved.
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">
            This is an automated confirmation email. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${name},\n\nThank you for your enquiry about ${packageTitle}!\n\nWhat happens next:\n- Our travel experts will review your requirements\n- We'll contact you within 24 hours via email or phone\n- You'll receive a customized itinerary and pricing details\n- We'll answer all your questions and finalize your booking\n\nNeed immediate assistance? Call us at +91-XXXXXXXXXX or email support@deshyatra.com\n\nThank you for choosing DeshYatra!\n\n© ${new Date().getFullYear()} DeshYatra. All rights reserved.`,
  });
}

interface EnquiryNotificationData {
  name: string;
  email: string;
  phone: string;
  city: string;
  packageTitle: string;
  numberOfPeople: number;
  travelDate: string;
  budgetMin: number;
  budgetMax: number;
  remarks: string;
}

export async function sendEnquiryNotificationEmail(
  adminEmail: string,
  data: EnquiryNotificationData
): Promise<void> {
  await sendEmail({
    to: adminEmail,
    subject: `🔔 New Enquiry: ${data.packageTitle} — ${data.name}`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔔 New Enquiry Received</h1>
        </div>
        <div style="padding: 30px;">
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${data.name}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Email</td><td style="padding: 8px 0; font-weight: 600;">${data.email}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Phone</td><td style="padding: 8px 0; font-weight: 600;">${data.phone}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">City</td><td style="padding: 8px 0; font-weight: 600;">${data.city}</td></tr>
              <tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 8px 0; color: #6b7280;">Package</td><td style="padding: 8px 0; font-weight: 600;">${data.packageTitle}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Travelers</td><td style="padding: 8px 0; font-weight: 600;">${data.numberOfPeople}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Travel Date</td><td style="padding: 8px 0; font-weight: 600;">${data.travelDate}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Budget</td><td style="padding: 8px 0; font-weight: 600;">₹${Number(data.budgetMin).toLocaleString('en-IN')} — ₹${Number(data.budgetMax).toLocaleString('en-IN')}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Remarks</td><td style="padding: 8px 0;">${data.remarks}</td></tr>
            </table>
          </div>
        </div>
        <div style="padding: 20px 30px; background: #f3f4f6; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} DeshYatra Admin Notifications
          </p>
        </div>
      </div>
    `,
    text: `New Enquiry from ${data.name} (${data.email}, ${data.phone}) for ${data.packageTitle}. ${data.numberOfPeople} travelers, Budget: ₹${data.budgetMin}-${data.budgetMax}. Date: ${data.travelDate}. Remarks: ${data.remarks}`,
  });
}

// ─── Consent Form Email Templates ───────

export async function sendConsentFormConfirmationEmail(
  email: string,
  fullName: string,
  packageName: string,
  travelDate: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Consent Form Received — ${packageName} ✅`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Consent Form Received! ✅</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">Thank you for completing the form</p>
        </div>
        <div style="padding: 30px;">
          <p style="color: #374151; font-size: 16px;">Hi ${fullName},</p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            We have successfully received your consent form for <strong>${packageName}</strong> 
            scheduled on <strong>${travelDate}</strong>.
          </p>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #374151; font-size: 16px; margin: 0 0 10px 0;">Next Steps:</h3>
            <ul style="color: #6b7280; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Our team will review your form within 24-48 hours</li>
              <li>You'll receive a confirmation email once approved</li>
              <li>Keep your travel documents ready</li>
              <li>Check your email for further instructions</li>
            </ul>
          </div>
          <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="color: #92400e; font-size: 13px; margin: 0;">
              <strong>Important:</strong> Please ensure all information provided is accurate. 
              Contact us immediately if you need to make any changes.
            </p>
          </div>
        </div>
        <div style="padding: 20px 30px; background: #f3f4f6; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} DeshYatra. All rights reserved.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${fullName}, we have received your consent form for ${packageName} on ${travelDate}. Our team will review it within 24-48 hours.`,
  });
}

interface ConsentFormNotificationData {
  fullName: string;
  email: string;
  phone: string;
  packageName: string;
  travelDate: string;
  numberOfTravelers: number;
}

export async function sendConsentFormNotificationEmail(
  adminEmail: string,
  data: ConsentFormNotificationData
): Promise<void> {
  await sendEmail({
    to: adminEmail,
    subject: `📋 New Consent Form: ${data.packageName} — ${data.fullName}`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📋 New Consent Form Submitted</h1>
        </div>
        <div style="padding: 30px;">
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">Full Name</td><td style="padding: 8px 0; font-weight: 600;">${data.fullName}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Email</td><td style="padding: 8px 0; font-weight: 600;">${data.email}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Phone</td><td style="padding: 8px 0; font-weight: 600;">${data.phone}</td></tr>
              <tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 8px 0; color: #6b7280;">Package</td><td style="padding: 8px 0; font-weight: 600;">${data.packageName}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Travel Date</td><td style="padding: 8px 0; font-weight: 600;">${data.travelDate}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Travelers</td><td style="padding: 8px 0; font-weight: 600;">${data.numberOfTravelers}</td></tr>
            </table>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Please review the consent form in the admin dashboard.
            </p>
          </div>
        </div>
        <div style="padding: 20px 30px; background: #f3f4f6; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} DeshYatra Admin Notifications
          </p>
        </div>
      </div>
    `,
    text: `New Consent Form from ${data.fullName} (${data.email}, ${data.phone}) for ${data.packageName} on ${data.travelDate}. ${data.numberOfTravelers} travelers.`,
  });
}
