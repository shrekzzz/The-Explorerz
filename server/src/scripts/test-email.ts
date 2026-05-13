import 'dotenv/config';
import { sendEnquiryConfirmationEmail } from '../services/email.service.js';
import logger from '../utils/logger.js';

/**
 * Test script to verify email configuration
 * Run with: npx tsx src/scripts/test-email.ts
 */

async function testEmail() {
  console.log('🧪 Testing Email Configuration...\n');

  // Test email details
  const testEmail = 'noreplydocdump@gmail.com'; // Updated to your email
  const testName = 'Test User';
  const testPackage = 'Goa Beach Paradise - 5 Days';

  console.log('📧 Sending test email to:', testEmail);
  console.log('📦 Package:', testPackage);
  console.log('👤 Name:', testName);
  console.log('\n⏳ Sending...\n');

  try {
    await sendEnquiryConfirmationEmail(testEmail, testName, testPackage);
    console.log('✅ SUCCESS! Email sent successfully!');
    console.log('\n📬 Check your inbox at:', testEmail);
    console.log('📁 Also check spam/junk folder if not in inbox\n');
  } catch (error: any) {
    console.error('❌ FAILED! Error sending email:\n');
    console.error('Error Message:', error.message);
    console.error('\nFull Error:', error);
    
    console.log('\n🔍 Troubleshooting Tips:');
    console.log('1. Check SMTP_PASS is a valid SendGrid API key (starts with SG.)');
    console.log('2. Verify EMAIL_FROM is verified in SendGrid dashboard');
    console.log('3. Check SendGrid account is active and not suspended');
    console.log('4. Verify API key has "Mail Send" permission');
    console.log('5. Check server firewall allows outbound SMTP connections\n');
  }
}

// Run the test
testEmail()
  .then(() => {
    console.log('✨ Test completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Unexpected error:', err);
    process.exit(1);
  });
