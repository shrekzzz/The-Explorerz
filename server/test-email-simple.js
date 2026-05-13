// Simple email test script
// Run with: node test-email-simple.js

import nodemailer from 'nodemailer';

console.log('🧪 Testing Email Configuration...\n');

// Email configuration
const config = {
  host: 'smtp.gmail.com',
  port: 587,
  user: 'kessanchit2@gmail.com',
  pass: 'xzkprhkjelolgcfg',
};

console.log('📧 Configuration:');
console.log('   Host:', config.host);
console.log('   Port:', config.port);
console.log('   User:', config.user);
console.log('   Pass:', config.pass.substring(0, 4) + '************');
console.log('\n⏳ Creating transport...\n');

// Create transporter
const transporter = nodemailer.createTransport({
  host: config.host,
  port: config.port,
  secure: false,
  auth: {
    user: config.user,
    pass: config.pass,
  },
});

// Email content
const mailOptions = {
  from: `"DeshYatra" <${config.user}>`,
  to: config.user,
  subject: 'Test Email — DeshYatra ✅',
  text: 'This is a test email from DeshYatra. If you receive this, your email configuration is working!',
  html: `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">✅ Email Test Successful!</h1>
        <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">Your email configuration is working</p>
      </div>
      <div style="padding: 30px;">
        <p style="color: #374151; font-size: 16px;">Hi there,</p>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          This is a test email from <strong>DeshYatra</strong>. If you're reading this, 
          your email configuration is working correctly! 🎉
        </p>
        <div style="background: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="color: #166534; font-size: 14px; margin: 0;">
            ✅ SMTP Host: ${config.host}<br/>
            ✅ SMTP Port: ${config.port}<br/>
            ✅ From Email: ${config.user}<br/>
            ✅ Status: <strong>Working!</strong>
          </p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          You can now use this configuration for your enquiry and consent form emails.
        </p>
      </div>
      <div style="padding: 20px 30px; background: #f3f4f6; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} DeshYatra. Test Email.
        </p>
      </div>
    </div>
  `,
};

console.log('📤 Sending test email...');
console.log('   From:', mailOptions.from);
console.log('   To:', mailOptions.to);
console.log('   Subject:', mailOptions.subject);
console.log('\n');

// Send email
transporter.sendMail(mailOptions)
  .then((info) => {
    console.log('✅ SUCCESS! Email sent successfully!\n');
    console.log('📬 Message ID:', info.messageId);
    console.log('📧 Check your inbox at:', config.user);
    console.log('📁 Also check spam/junk folder if not in inbox\n');
    console.log('✨ Email configuration is working correctly!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ FAILED! Error sending email:\n');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('\nFull Error:', error);
    
    console.log('\n🔍 Troubleshooting Tips:');
    console.log('1. Check SMTP_PASS is correct: toqfwiharedwusbu');
    console.log('2. Verify 2-Step Verification is enabled on Gmail');
    console.log('3. Verify App Password is valid and not revoked');
    console.log('4. Check if Gmail account is accessible');
    console.log('5. Try regenerating the App Password\n');
    
    if (error.code === 'EAUTH') {
      console.log('⚠️  Authentication Error: The password is incorrect or expired.');
      console.log('   Go to: https://myaccount.google.com/apppasswords');
      console.log('   Delete old password and create a new one.\n');
    }
    
    process.exit(1);
  });
