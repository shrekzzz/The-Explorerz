# Email Setup & Troubleshooting Guide

## 🔍 Current Issue

Your `SMTP_PASS` appears to be incorrect. SendGrid API keys should start with `SG.` but yours looks like a UUID.

## 🚀 Quick Fix Options

### Option 1: Use Gmail SMTP (Easiest)

Since your email is `the.explorerz.online@gmail.com`, you can use Gmail's SMTP:

#### Step 1: Enable 2-Step Verification
1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification"

#### Step 2: Create App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Name it "DeshYatra Server"
4. Click "Generate"
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

#### Step 3: Update server/.env

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=the.explorerz.online@gmail.com
SMTP_PASS=abcdefghijklmnop  # Your 16-char app password (no spaces)
EMAIL_FROM=the.explorerz.online@gmail.com
ADMIN_EMAIL=the.explorerz.online@gmail.com
```

### Option 2: Fix SendGrid Configuration

If you want to use SendGrid:

#### Step 1: Get Valid API Key
1. Login to https://app.sendgrid.com/
2. Go to Settings → API Keys
3. Click "Create API Key"
4. Choose "Full Access" or "Restricted Access" with "Mail Send" permission
5. Copy the API key (starts with `SG.`)

#### Step 2: Verify Sender Email
1. Go to Settings → Sender Authentication
2. Verify your email: `the.explorerz.online@gmail.com`
3. Check your email for verification link
4. Click the link to verify

#### Step 3: Update server/.env

```env
# SendGrid Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=the.explorerz.online@gmail.com
ADMIN_EMAIL=the.explorerz.online@gmail.com
```

## 🧪 Testing Email Configuration

### Method 1: Run Test Script

```bash
cd server
npx tsx src/scripts/test-email.ts
```

This will:
- Send a test email to `the.explorerz.online@gmail.com`
- Show detailed error messages if it fails
- Provide troubleshooting tips

### Method 2: Test via API

1. Start the server:
```bash
cd server
npm run dev
```

2. Submit an enquiry form from the frontend
3. Check server logs for email errors
4. Check your email inbox (and spam folder)

### Method 3: Manual Test with Nodemailer

Create a test file:

```typescript
// server/test-manual.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // or smtp.sendgrid.net
  port: 587,
  secure: false,
  auth: {
    user: 'the.explorerz.online@gmail.com',
    pass: 'YOUR_APP_PASSWORD_HERE',
  },
});

transporter.sendMail({
  from: '"DeshYatra" <the.explorerz.online@gmail.com>',
  to: 'the.explorerz.online@gmail.com',
  subject: 'Test Email',
  text: 'This is a test email',
  html: '<b>This is a test email</b>',
}).then(() => {
  console.log('✅ Email sent!');
}).catch((err) => {
  console.error('❌ Error:', err);
});
```

Run it:
```bash
npx tsx test-manual.ts
```

## 🔧 Common Issues & Solutions

### Issue 1: "Invalid login: 535 Authentication failed"

**Cause**: Wrong username or password

**Solutions**:
- Gmail: Use App Password, not your regular password
- SendGrid: Use `apikey` as username and valid API key as password
- Check for typos in credentials

### Issue 2: "Sender address rejected"

**Cause**: Email not verified

**Solutions**:
- SendGrid: Verify sender email in dashboard
- Gmail: Use the same email as SMTP_USER and EMAIL_FROM

### Issue 3: "Connection timeout"

**Cause**: Firewall blocking SMTP

**Solutions**:
- Check server firewall allows port 587
- Try port 465 with `secure: true`
- Check if ISP blocks SMTP

### Issue 4: "Daily sending limit exceeded"

**Cause**: Too many emails sent

**Solutions**:
- Gmail: 500 emails/day limit
- SendGrid: Check your plan limits
- Wait 24 hours or upgrade plan

### Issue 5: Emails going to spam

**Solutions**:
- Use verified domain email (not Gmail)
- Set up SPF, DKIM, DMARC records
- Avoid spam trigger words
- Include unsubscribe link

## 📊 Recommended Setup (Production)

### Best Option: SendGrid with Custom Domain

1. **Get a custom domain** (e.g., deshyatra.com)
2. **Set up email** (e.g., noreply@deshyatra.com)
3. **Verify domain in SendGrid**
4. **Configure DNS records** (SPF, DKIM, DMARC)
5. **Use SendGrid API key**

Benefits:
- ✅ Professional appearance
- ✅ Better deliverability
- ✅ Higher sending limits
- ✅ Detailed analytics
- ✅ No spam issues

### Alternative: Gmail (Development Only)

Good for:
- ✅ Quick testing
- ✅ Development environment
- ✅ Low volume

Limitations:
- ❌ 500 emails/day limit
- ❌ Less professional
- ❌ May go to spam
- ❌ Not recommended for production

## 🎯 Step-by-Step: Gmail Setup (Quickest)

1. **Enable 2-Step Verification**
   - Visit: https://myaccount.google.com/security
   - Turn on 2-Step Verification

2. **Create App Password**
   - Visit: https://myaccount.google.com/apppasswords
   - App: Mail
   - Device: Other (DeshYatra Server)
   - Click Generate
   - Copy the password (remove spaces)

3. **Update server/.env**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=the.explorerz.online@gmail.com
   SMTP_PASS=abcdefghijklmnop
   EMAIL_FROM=the.explorerz.online@gmail.com
   ADMIN_EMAIL=the.explorerz.online@gmail.com
   ```

4. **Restart Server**
   ```bash
   cd server
   npm run dev
   ```

5. **Test**
   ```bash
   npx tsx src/scripts/test-email.ts
   ```

6. **Check Email**
   - Check inbox
   - Check spam folder
   - Check server logs

## 📝 Verification Checklist

- [ ] SMTP credentials are correct
- [ ] Email address is verified (SendGrid) or App Password created (Gmail)
- [ ] Server can connect to SMTP server (port 587 open)
- [ ] EMAIL_FROM matches authenticated email
- [ ] Server is running without errors
- [ ] Test email sent successfully
- [ ] Email received in inbox (or spam)

## 🆘 Still Not Working?

### Check Server Logs

```bash
cd server
npm run dev

# Look for:
# "Email sent" - Success
# "Failed to send email" - Error with details
```

### Enable Debug Mode

Add to `server/src/config/email.ts`:

```typescript
export const emailTransport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  debug: true, // Add this
  logger: true, // Add this
});
```

### Contact Support

- **SendGrid**: https://support.sendgrid.com/
- **Gmail**: https://support.google.com/mail/

## 🎉 Success Indicators

When working correctly, you should see:

1. ✅ Server logs: "Email sent"
2. ✅ No errors in console
3. ✅ Email in inbox within 1-2 minutes
4. ✅ Email has correct content and formatting
5. ✅ Admin also receives notification email

## 📚 Additional Resources

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Email Deliverability Guide](https://sendgrid.com/blog/email-deliverability-guide/)
