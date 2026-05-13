# 🚨 Fix Email Authentication Error

## ❌ Error Found

```
Error: Invalid login: 535 Authentication failed: 
The provided authorization grant is invalid, expired, or revoked
```

## 🔧 Quick Fix (5 minutes)

The Gmail App Password has expired or been revoked. You need to generate a new one.

### Step 1: Revoke Old App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Login with: `noreplydocdump@gmail.com`
3. Find and **delete** any existing "DeshYatra" or "Mail" app passwords

### Step 2: Generate New App Password

1. Still on: https://myaccount.google.com/apppasswords
2. Click: **Select app** → Choose "Mail"
3. Click: **Select device** → Choose "Other (Custom name)"
4. Type: `DeshYatra Server`
5. Click: **Generate**
6. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)
7. **Remove all spaces** → `abcdefghijklmnop`

### Step 3: Update server/.env

Open `server/.env` and update the SMTP_PASS line:

```env
SMTP_PASS=abcdefghijklmnop
```

Replace `abcdefghijklmnop` with your actual new app password (no spaces).

### Step 4: Restart Server

**Important:** You must fully restart the server for changes to take effect.

```bash
# Stop the server (Ctrl+C)
# Then start again:
cd server
npm run dev
```

### Step 5: Test Again

```bash
# In a new terminal:
cd server
node test-email-simple.js
```

Then submit an enquiry form from the website.

## 🔍 Why This Happened

The simple test script worked because it reads the password directly from the file. But when you restarted the server, it might have:

1. Cached the old password from a previous run
2. The app password was revoked by Google
3. The password expired (Google sometimes expires them)

## ✅ Verification Steps

After updating and restarting:

1. **Check server logs** - Should NOT show authentication errors
2. **Submit enquiry** - Should see "Email sent" in logs
3. **Check email** - Should receive confirmation email
4. **No errors** - Server should run without email errors

## 🎯 Expected Server Logs (Success)

```
[INFO] Email sent
  to: "user@example.com"
  subject: "Thank You for Your Enquiry..."
```

## ⚠️ If Still Failing

### Option 1: Use Different Gmail Account

If `noreplydocdump@gmail.com` keeps having issues:

1. Create a new Gmail account
2. Enable 2-Step Verification
3. Generate App Password
4. Update server/.env with new credentials

### Option 2: Use SendGrid (More Reliable)

SendGrid is more reliable for production:

1. Sign up: https://signup.sendgrid.com/
2. Create API Key
3. Verify sender email
4. Update server/.env:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your_api_key_here
EMAIL_FROM=noreplydocdump@gmail.com
ADMIN_EMAIL=noreplydocdump@gmail.com
```

## 📝 Important Notes

- **Always restart server** after changing .env
- **Remove spaces** from app password
- **Check Gmail security** - make sure account isn't locked
- **2-Step Verification** must be enabled
- **App passwords** can expire or be revoked by Google

## 🚀 Quick Command Summary

```bash
# 1. Generate new app password at:
# https://myaccount.google.com/apppasswords

# 2. Update server/.env with new password

# 3. Restart server
cd server
npm run dev

# 4. Test (in new terminal)
cd server
node test-email-simple.js

# 5. Submit enquiry from website
```

## ✨ Success Indicators

When fixed:
- ✅ No authentication errors in logs
- ✅ "Email sent" appears in logs
- ✅ Users receive confirmation emails
- ✅ Admin receives notification emails
- ✅ Enquiry form works smoothly

Generate the new app password now and update your .env file!
