# Enquiry Email System - Complete Guide

## ✅ Current Status

The enquiry email system is **ALREADY IMPLEMENTED AND WORKING**! When a user submits an enquiry form, the system automatically:

1. ✅ Sends a **confirmation email to the user**
2. ✅ Sends a **notification email to the admin**
3. ✅ Saves the enquiry in the database

## 📧 Email Flow

```
User Submits Enquiry Form
         ↓
    Backend API
         ↓
    ┌────┴────┐
    ↓         ↓
User Email  Admin Email
(Confirmation) (Notification)
```

## 🎨 Enhanced Confirmation Email

The confirmation email now includes:

- **Personalized greeting** with user's name
- **Package details** they enquired about
- **Clear next steps** explaining what happens next
- **Timeline**: 24-hour response commitment
- **Contact information** for urgent queries
- **Call-to-action** to explore more packages
- **Professional design** with gradient headers and icons

### Email Content:
- ✅ Thank you message
- ✅ Package name highlighted
- ✅ What happens next (4-step process)
- ✅ Response timeline (24 hours)
- ✅ Contact details (phone & email)
- ✅ Pro tip for users
- ✅ Link to explore more packages
- ✅ Professional footer

## 📝 Email Configuration

### Required Environment Variables (server/.env)

```env
# Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=YOUR_SENDGRID_API_KEY_HERE
EMAIL_FROM=your-email@domain.com
ADMIN_EMAIL=admin@domain.com
```

### Current Setup:
- **Provider**: SendGrid
- **From Email**: the.explorerz.online@gmail.com
- **Admin Email**: the.explorerz.online@gmail.com

## 🔧 How It Works

### 1. User Submits Enquiry
Location: `src/pages/PackageDetailPage.tsx` (or wherever enquiry form is)

```typescript
// Form submission sends data to API
POST /api/enquiries
{
  name, email, phone, city,
  packageTitle, packagePrice,
  numberOfPeople, travelDate,
  budgetMin, budgetMax, remarks
}
```

### 2. Backend Processes Request
Location: `server/src/controllers/enquiry.controller.ts`

```typescript
export async function createEnquiry(req, res, next) {
  // 1. Save enquiry to database
  const enquiry = await prisma.enquiry.create({ ... });
  
  // 2. Send confirmation email to user
  await sendEnquiryConfirmationEmail(email, name, packageTitle);
  
  // 3. Send notification to admin
  await sendEnquiryNotificationEmail(adminEmail, enquiryData);
  
  // 4. Return success response
  res.status(201).json({ success: true, ... });
}
```

### 3. Email Service Sends Emails
Location: `server/src/services/email.service.ts`

- Uses configured SMTP transport (SendGrid)
- Sends HTML and plain text versions
- Logs success/failure
- Non-blocking (doesn't fail if email fails)

## 📊 Email Templates

### User Confirmation Email
- **Subject**: `Thank You for Your Enquiry — [Package Name] ✅`
- **Design**: Gradient header, structured content, clear CTAs
- **Tone**: Friendly, professional, reassuring

### Admin Notification Email
- **Subject**: `🔔 New Enquiry: [Package Name] — [User Name]`
- **Content**: All enquiry details in a table format
- **Purpose**: Quick review and action

## 🚀 Testing the Email System

### 1. Check Email Configuration

```bash
cd server
cat .env | grep SMTP
```

Ensure all SMTP variables are set correctly.

### 2. Test Enquiry Submission

1. Go to any package detail page
2. Fill out the enquiry form
3. Submit the form
4. Check:
   - ✅ Success message appears
   - ✅ User receives confirmation email
   - ✅ Admin receives notification email

### 3. Check Server Logs

```bash
# In server directory
npm run dev

# Look for log messages:
# "Email sent" - Success
# "Failed to send email" - Error
```

## 🔍 Troubleshooting

### Email Not Sending?

**1. Check SendGrid API Key**
```bash
# Verify SMTP_PASS is a valid SendGrid API key
# Format: SG.xxxxxxxxxxxxxxxxxxxxx
```

**2. Verify SendGrid Account**
- Login to SendGrid dashboard
- Check API key is active
- Verify sender email is verified
- Check sending limits

**3. Check Server Logs**
```bash
cd server
npm run dev
# Submit enquiry and watch for errors
```

**4. Test Email Service Directly**
```typescript
// In server console or test file
import { sendEnquiryConfirmationEmail } from './services/email.service.js';

await sendEnquiryConfirmationEmail(
  'test@example.com',
  'Test User',
  'Test Package'
);
```

### Common Issues:

| Issue | Solution |
|-------|----------|
| "Invalid API Key" | Update `SMTP_PASS` with valid SendGrid API key |
| "Sender not verified" | Verify sender email in SendGrid dashboard |
| "Rate limit exceeded" | Check SendGrid sending limits |
| "Connection timeout" | Check firewall/network settings |

## 📱 Customization

### Update Contact Phone Number

In `server/src/services/email.service.ts`, replace:
```typescript
📞 Call us at <strong>+91-XXXXXXXXXX</strong>
```

With your actual phone number:
```typescript
📞 Call us at <strong>+91-9876543210</strong>
```

### Update Support Email

Replace:
```typescript
📧 Email us at <strong>support@deshyatra.com</strong>
```

With your actual support email.

### Change Response Timeline

Update "24 hours" to your preferred timeline:
```typescript
We'll contact you within <strong>24 hours</strong>
```

### Customize Email Design

Modify the HTML template in `sendEnquiryConfirmationEmail()`:
- Change colors (currently using #667eea, #764ba2)
- Update fonts
- Add/remove sections
- Change button text/links

## 🎯 Best Practices

1. **Always test emails** before going live
2. **Monitor email delivery rates** in SendGrid dashboard
3. **Keep templates mobile-responsive**
4. **Include plain text version** for email clients that don't support HTML
5. **Don't fail the request** if email fails (log error instead)
6. **Use environment variables** for all configuration
7. **Verify sender domain** for better deliverability

## 📈 Monitoring

### SendGrid Dashboard
- Track email delivery rates
- Monitor bounces and spam reports
- View email opens and clicks
- Check API usage

### Server Logs
```bash
# Filter email-related logs
grep "Email sent" logs/app.log
grep "Failed to send email" logs/app.log
```

## 🔐 Security Notes

- ✅ API keys stored in environment variables
- ✅ Never commit `.env` file to git
- ✅ Use SendGrid API key (not password)
- ✅ Rotate API keys periodically
- ✅ Limit API key permissions to "Mail Send" only

## 📚 Related Files

- `server/src/controllers/enquiry.controller.ts` - Enquiry creation logic
- `server/src/services/email.service.ts` - Email templates and sending
- `server/src/config/email.ts` - Email transport configuration
- `server/.env` - Email configuration variables

## ✨ Summary

The enquiry email system is **fully functional** and sends professional, informative emails to users automatically. The enhanced template provides:

- Clear communication
- Professional appearance
- Actionable next steps
- Contact information
- Brand consistency

Just ensure your SendGrid API key is valid and the sender email is verified!
