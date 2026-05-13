# ✅ Email Configuration Updated!

## 📧 New Configuration

Your `server/.env` has been updated with:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreplydocdump@gmail.com
SMTP_PASS=toqfwiharedwusbu
EMAIL_FROM=noreplydocdump@gmail.com
ADMIN_EMAIL=noreplydocdump@gmail.com
```

## 🧪 Test Now (3 Steps)

### Step 1: Restart the Server

```bash
# Stop the current server (Ctrl+C if running)
cd server
npm run dev
```

### Step 2: Run Test Script

Open a **new terminal** and run:

```bash
cd server
npx tsx src/scripts/test-email.ts
```

**Expected Output:**
```
🧪 Testing Email Configuration...

📧 Sending test email to: noreplydocdump@gmail.com
📦 Package: Goa Beach Paradise - 5 Days
👤 Name: Test User

⏳ Sending...

✅ SUCCESS! Email sent successfully!

📬 Check your inbox at: noreplydocdump@gmail.com
📁 Also check spam/junk folder if not in inbox
```

### Step 3: Check Email

1. Open Gmail: https://mail.google.com/
2. Login with: `noreplydocdump@gmail.com`
3. Check **Inbox** for email with subject: "Thank You for Your Enquiry — Goa Beach Paradise - 5 Days ✅"
4. If not in inbox, check **Spam/Junk** folder

## 🎯 Alternative Test: Submit Enquiry Form

1. Start the server (if not running):
   ```bash
   cd server
   npm run dev
   ```

2. Open the website in browser
3. Go to any package detail page
4. Fill out the enquiry form
5. Submit the form
6. Check `noreplydocdump@gmail.com` for confirmation email

## 📊 What to Expect

### User Confirmation Email

**Subject:** Thank You for Your Enquiry — [Package Name] ✅

**Content:**
- Personalized greeting
- Package details
- What happens next (4 steps)
- 24-hour response timeline
- Contact information
- Professional gradient design

### Admin Notification Email

**Subject:** 🔔 New Enquiry: [Package Name] — [User Name]

**Content:**
- All enquiry details in table format
- User contact information
- Package and travel details
- Budget and remarks

## 🔍 Troubleshooting

### If Test Fails

**Error: "Invalid login: 535 Authentication failed"**

**Solution:** The app password might be incorrect. Verify:
1. Password is exactly: `toqfwiharedwusbu` (no spaces)
2. 2-Step Verification is enabled on the Gmail account
3. App password was created for "Mail" app

**To regenerate app password:**
1. Go to: https://myaccount.google.com/apppasswords
2. Delete old "DeshYatra" password
3. Create new one
4. Update `server/.env` with new password
5. Restart server and test again

### If Email Not Received

1. **Check spam folder** - Gmail might filter it
2. **Wait 2-3 minutes** - sometimes there's a delay
3. **Check server logs** - look for "Email sent" or error messages
4. **Verify Gmail account** - make sure noreplydocdump@gmail.com is accessible

### Check Server Logs

While server is running, watch for:
```
✅ "Email sent" - Success
❌ "Failed to send email" - Error with details
```

## ✨ Success Indicators

When working correctly:

1. ✅ Test script shows "SUCCESS!"
2. ✅ No errors in server console
3. ✅ Email received within 1-2 minutes
4. ✅ Email has professional design with gradients
5. ✅ All content is properly formatted

## 🚀 Next Steps After Success

Once emails are working:

1. **Test with real enquiry** - Submit form from website
2. **Check both emails** - User confirmation + Admin notification
3. **Verify admin panel** - Check enquiry appears in admin dashboard
4. **Test consent form emails** - They use the same configuration

## 📝 Important Notes

- **From Address:** All emails will come from `noreplydocdump@gmail.com`
- **Reply-To:** Users can reply to `noreplydocdump@gmail.com`
- **Admin Notifications:** Will be sent to `noreplydocdump@gmail.com`
- **Daily Limit:** Gmail allows 500 emails per day
- **Production:** Consider using a custom domain email for better branding

## 🎉 Ready to Test!

Run this command now:

```bash
cd server
npx tsx src/scripts/test-email.ts
```

Then check your email at: **noreplydocdump@gmail.com**

Good luck! 🚀
