# ⚡ Upstash Redis - Quick Start

## 🚀 5-Minute Setup

### 1. Create Account (2 minutes)
```
1. Go to: https://console.upstash.com/
2. Sign up with GitHub/Google
3. Verify email
```

### 2. Create Database (1 minute)
```
1. Click "Create Database"
2. Name: explorerz-redis
3. Type: Regional (cheaper) or Global (faster)
4. Region: Choose closest to you
5. Click "Create"
```

### 3. Get Connection URL (30 seconds)
```
1. In database dashboard
2. Copy "Redis URL"
3. Format: rediss://default:PASSWORD@ENDPOINT:6379
```

### 4. Update .env (30 seconds)
```bash
# server/.env
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379
```

### 5. Test Connection (1 minute)
```bash
cd server
npm run test:redis
```

**Expected output:**
```
✅ Connected successfully
✅ PING response: PONG
✅ SET/GET working
🎉 All tests passed!
```

## ✅ That's It!

Your app now uses Upstash Redis for:
- Rate limiting
- Idempotency (prevent duplicate bookings)
- Session storage
- Caching
- Email queue

## 🆘 Troubleshooting

### Connection Failed?

**Check 1: URL Format**
```bash
# ❌ Wrong
redis://localhost:6379

# ✅ Correct
rediss://default:password@endpoint.upstash.io:6379
```

**Check 2: TLS Enabled**
```bash
# Must use rediss:// (with double 's')
rediss://...
```

**Check 3: Password Correct**
```bash
# Copy-paste from Upstash dashboard
# Don't type manually
```

### Still Not Working?

```bash
# Run diagnostic
npm run test:redis

# Check logs
tail -f logs/app.log

# Verify environment
echo $REDIS_URL
```

## 📊 Monitor Usage

**Dashboard:** https://console.upstash.com/

**Free Tier Limits:**
- 10,000 commands/day
- 256 MB storage
- 1 database

**Check usage:**
```bash
# In Upstash dashboard
1. Click your database
2. View "Metrics" tab
3. See commands/day
```

## 💰 Pricing

**Free Tier:** Perfect for development
- 10K commands/day
- 256 MB storage

**Pay-as-you-go:** Only pay for what you use
- $0.2 per 100K commands
- $0.25 per GB storage

**Example:** 1,000 users/day = ~$3/month

## 🔒 Security

**DO:**
- ✅ Use `rediss://` (TLS enabled)
- ✅ Keep password in `.env`
- ✅ Add `.env` to `.gitignore`
- ✅ Use environment variables

**DON'T:**
- ❌ Commit `.env` to git
- ❌ Hardcode password in code
- ❌ Use `redis://` (no TLS)
- ❌ Share password publicly

## 📚 Learn More

**Full Guide:** `server/UPSTASH_REDIS_SETUP.md`

**Upstash Docs:** https://docs.upstash.com/redis

**Support:** https://discord.gg/upstash

---

**Next Steps:**
1. ✅ Create Upstash account
2. ✅ Get Redis URL
3. ✅ Update `.env`
4. ✅ Run `npm run test:redis`
5. ✅ Start building! 🚀
