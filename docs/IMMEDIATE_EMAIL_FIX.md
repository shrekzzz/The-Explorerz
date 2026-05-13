# 🚨 IMMEDIATE EMAIL FIX - Quick Steps

## Problem Identified

Your `SMTP_PASS` in `server/.env` is **NOT a valid SendGrid API key**.

Current value: `d4c0cc2f-10d7-48ee-a24b-558b0f103c2a` ❌
Expected format: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` ✅

## ⚡ FASTEST FIX: Use Gmail (5 minutes)

### Step 1: Create Gmail App Password

1. Open: https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already enabled)
3. Open: https://myaccount.google.com/apppasswords
4. Select:
   - App: **Mail**
   - Device: **Other** (type "DeshYatra")
5. Click **Generate**
6. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
7. **Remove all spaces** → `abcdefghijklmnop`

### Step 2: Update server/.env

Replace the email section with:

```env
# ─── Email (Gmail SMTP) ────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=the.explorerz.online@gmail.com
SMTP_PASS=abcdefghijklmnop
EMAIL_FROM=the.explorerz.online@gmail.com
ADMIN_EMAIL=the.explorerz.online@gmail.com
```

**Replace `abcdefghijklmnop` with your actual app password!**

### Step 3: Restart Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
cd server
npm run dev
```

### Step 4: Test

```bash
# In a new terminal:
cd server
npx tsx src/scripts/test-email.ts
```

Or submit an enquiry form from the website.

### Step 5: Check Email

- Check inbox: the.explorerz.online@gmail.com
- Check spam/junk folder
- Wait 1-2 minutes

## 🔄 ALTERNATIVE: Fix SendGrid (10 minutes)

### Step 1: Get Valid SendGrid API Key

1. Login: https://app.sendgrid.com/
2. Go to: **Settings** → **API Keys**
3. Click: **Create API Key**
4. Name: `DeshYatra Production`
5. Permissions: **Full Access** (or Restricted with Mail Send)
6. Click: **Create & View**
7. **COPY THE KEY** (starts with `SG.`) - You can only see it once!

### Step 2: Verify Sender Email

1. Go to: **Settings** → **Sender Authentication**
2. Click: **Verify a Single Sender**
3. Fill in:
   - From Name: `DeshYatra`
   - From Email: `the.explorerz.online@gmail.com`
   - Reply To: `the.explorerz.online@gmail.com`
4. Click: **Create**
5. Check your email for verification link
6. Click the verification link

### Step 3: Update server/.env

```env
# ─── Email (SendGrid) ────────────
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=the.explorerz.online@gmail.com
ADMIN_EMAIL=the.explorerz.online@gmail.com
```

**Replace the SMTP_PASS with your actual SendGrid API key!**

### Step 4: Restart & Test

Same as Gmail steps 3-5 above.

## 🧪 Quick Test Commands

### Test 1: Check if server starts
```bash
cd server
npm run dev
```

Look for errors related to email configuration.

### Test 2: Send test email
```bash
cd server
npx tsx src/scripts/test-email.ts
```

### Test 3: Check logs
```bash
# While server is running, submit an enquiry
# Watch the terminal for:
# ✅ "Email sent" - Success
# ❌ "Failed to send email" - Error
```

## 🎯 Expected Results

### Success ✅
```
✅ SUCCESS! Email sent successfully!
📬 Check your inbox at: the.explorerz.online@gmail.com
```

### Failure ❌
```
❌ FAILED! Error sending email:
Error Message: Invalid login: 535 Authentication failed
```

## 🔍 Common Errors & Quick Fixes

| Error | Fix |
|-------|-----|
| "Invalid login" | Wrong password - regenerate app password |
| "Sender address rejected" | Verify email in SendGrid |
| "Connection timeout" | Check firewall, try port 465 |
| "Daily limit exceeded" | Wait 24 hours or use SendGrid |

## 📞 Need Help?

If still not working after trying both options:

1. **Check server logs** for specific error messages
2. **Try the test script** to see detailed errors
3. **Verify credentials** are copied correctly (no extra spaces)
4. **Check spam folder** - emails might be there
5. **Wait 2-3 minutes** - sometimes there's a delay

## ✅ Verification Checklist

Before testing:
- [ ] 2-Step Verification enabled (Gmail)
- [ ] App Password created (Gmail) OR API Key created (SendGrid)
- [ ] Email verified (SendGrid only)
- [ ] server/.env updated with correct credentials
- [ ] No extra spaces in SMTP_PASS
- [ ] Server restarted after .env changes

## 🎉 Once Working

You'll receive emails like this:

**Subject:** Thank You for Your Enquiry — [Package Name] ✅

**Content:**
- Personalized greeting
- Package details
- What happens next (4 steps)
- Contact information
- Professional design

Both user and admin will receive emails automatically for every enquiry!

---

**Recommendation:** Start with Gmail (faster), then switch to SendGrid for production.
