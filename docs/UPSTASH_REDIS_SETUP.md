# 🚀 Upstash Redis Setup Guide

## What is Upstash?

Upstash is a serverless Redis service that's perfect for modern applications:

- ✅ **Serverless** - Pay only for what you use
- ✅ **Global** - Low latency worldwide
- ✅ **Secure** - TLS encryption by default
- ✅ **Scalable** - Auto-scales with your traffic
- ✅ **Free Tier** - 10,000 commands/day free

## Why Use Upstash for This Project?

### Current Use Cases
1. **Rate Limiting** - Prevent API abuse
2. **Idempotency** - Prevent duplicate bookings/payments
3. **Session Storage** - User sessions (if using JWT)
4. **Caching** - API response caching
5. **Email Queue** - BullMQ job queue

### Benefits
- No Redis server to manage
- Automatic backups
- High availability
- Perfect for serverless deployments (Vercel, Netlify, etc.)

## 📋 Setup Instructions

### Step 1: Create Upstash Account

1. Go to [https://console.upstash.com/](https://console.upstash.com/)
2. Sign up with GitHub, Google, or Email
3. Verify your email

### Step 2: Create Redis Database

1. Click **"Create Database"**
2. Configure your database:
   ```
   Name: explorerz-redis
   Type: Regional (cheaper) or Global (faster)
   Region: Choose closest to your users
   TLS: Enabled (default)
   Eviction: No eviction (recommended)
   ```
3. Click **"Create"**

### Step 3: Get Connection URL

1. In your database dashboard, find **"REST API"** section
2. Copy the **"UPSTASH_REDIS_REST_URL"** (for REST API)
3. OR copy the **"Redis URL"** (for ioredis - recommended)

**Redis URL Format:**
```
rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379
```

**Note:** `rediss://` (with double 's') means TLS is enabled

### Step 4: Update Environment Variables

**In `server/.env`:**
```env
# Replace with your Upstash Redis URL
REDIS_URL=rediss://default:AbCdEf123456@us1-example-12345.upstash.io:6379
```

**Important:** 
- Use `rediss://` (with TLS) not `redis://`
- Keep your password secret
- Don't commit `.env` to git

### Step 5: Test Connection

```bash
cd server
npm run dev
```

**Expected output:**
```
✅ Redis connected
✅ Redis ready to accept commands
```

**If you see errors:**
```
❌ Redis connection error
```
Check:
1. URL is correct (copy-paste from Upstash)
2. TLS is enabled (`rediss://` not `redis://`)
3. Firewall allows outbound connections to Upstash

## 🧪 Testing Upstash Redis

### Test 1: Basic Connection

```bash
# In server directory
node -e "
const Redis = require('ioredis');
const redis = new Redis('YOUR_UPSTASH_URL');
redis.ping().then(result => {
  console.log('✅ Ping:', result);
  redis.quit();
}).catch(err => {
  console.error('❌ Error:', err.message);
});
"
```

**Expected output:** `✅ Ping: PONG`

### Test 2: Set and Get

```bash
node -e "
const Redis = require('ioredis');
const redis = new Redis('YOUR_UPSTASH_URL');
(async () => {
  await redis.set('test', 'Hello Upstash!');
  const value = await redis.get('test');
  console.log('✅ Value:', value);
  await redis.del('test');
  await redis.quit();
})();
"
```

**Expected output:** `✅ Value: Hello Upstash!`

### Test 3: Rate Limiting

```bash
# Start your server
npm run dev

# In another terminal, test rate limiting
for i in {1..10}; do
  curl http://localhost:5000/api/v1/packages
done
```

**Expected:** After 100 requests in 1 minute, you should see:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests"
  }
}
```

### Test 4: Idempotency

```bash
# Create a booking twice with same idempotency key
curl -X POST http://localhost:5000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Idempotency-Key: test-key-123" \
  -d '{"packageId":"...","travelers":2}'

# Second request (should return cached)
curl -X POST http://localhost:5000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Idempotency-Key: test-key-123" \
  -d '{"packageId":"...","travelers":2}'
```

**Expected:** Second request returns cached response, no duplicate booking

## 📊 Monitoring Usage

### Upstash Dashboard

1. Go to [https://console.upstash.com/](https://console.upstash.com/)
2. Click on your database
3. View metrics:
   - Commands per second
   - Data size
   - Memory usage
   - Request count

### Check Current Usage

```bash
# Connect to Upstash CLI
redis-cli -u YOUR_UPSTASH_URL

# Check database size
> DBSIZE

# Check memory usage
> INFO memory

# List all keys (careful in production!)
> KEYS *

# Check specific key
> GET idempotency:user-id:key-123

# Check TTL (time to live)
> TTL idempotency:user-id:key-123
```

## 💰 Pricing

### Free Tier
- **10,000 commands/day**
- **256 MB storage**
- **1 database**
- Perfect for development and small projects

### Pay-as-you-go
- **$0.2 per 100K commands**
- **$0.25 per GB storage**
- No minimum commitment

### Example Costs

**Small Project (1,000 users/day):**
- ~50,000 commands/day
- Cost: ~$3/month

**Medium Project (10,000 users/day):**
- ~500,000 commands/day
- Cost: ~$30/month

**Large Project (100,000 users/day):**
- ~5,000,000 commands/day
- Cost: ~$300/month

## 🔧 Configuration Options

### Current Configuration

Our Redis client is configured for Upstash:

```typescript
// server/src/config/redis.ts
const redis = new Redis(env.REDIS_URL, {
  family: 6,              // IPv6 support
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  lazyConnect: true,
  keepAlive: 30000,       // 30 seconds
  
  // TLS for Upstash
  tls: {
    rejectUnauthorized: true
  },
  
  // Retry strategy
  retryStrategy(times) {
    if (times > 10) return null;
    return Math.min(times * 100, 3000);
  },
  
  // Reconnect on READONLY errors
  reconnectOnError(err) {
    return err.message.includes('READONLY');
  },
  
  commandTimeout: 5000,
});
```

### Optimization Tips

1. **Connection Pooling**
   - Reuse connections (already configured)
   - Don't create new Redis instances per request

2. **TTL (Time To Live)**
   - Set expiration on cached data
   - Idempotency keys: 24 hours
   - Rate limit counters: 1 minute
   - Session data: 7 days

3. **Key Naming**
   - Use prefixes: `idempotency:`, `ratelimit:`, `session:`
   - Include user ID: `idempotency:user-123:key-abc`
   - Easy to debug and clean up

4. **Error Handling**
   - App continues if Redis fails (graceful degradation)
   - Logs errors for monitoring
   - Automatic reconnection

## 🚀 Deployment

### Vercel

Add environment variable in Vercel dashboard:
```
REDIS_URL=rediss://default:password@endpoint.upstash.io:6379
```

### Netlify

Add in `netlify.toml`:
```toml
[build.environment]
  REDIS_URL = "rediss://default:password@endpoint.upstash.io:6379"
```

Or add in Netlify dashboard under Environment Variables.

### Docker

Add to `docker-compose.yml`:
```yaml
services:
  app:
    environment:
      - REDIS_URL=rediss://default:password@endpoint.upstash.io:6379
```

### Railway

Add environment variable in Railway dashboard:
```
REDIS_URL=rediss://default:password@endpoint.upstash.io:6379
```

## 🔒 Security Best Practices

### 1. Protect Your Credentials

```bash
# ❌ DON'T commit to git
git add .env

# ✅ DO add to .gitignore
echo ".env" >> .gitignore
```

### 2. Use Environment Variables

```bash
# ❌ DON'T hardcode
const redis = new Redis('rediss://default:password@...');

# ✅ DO use env vars
const redis = new Redis(process.env.REDIS_URL);
```

### 3. Rotate Passwords

1. Go to Upstash dashboard
2. Click "Reset Password"
3. Update `REDIS_URL` in all environments
4. Restart your application

### 4. Use TLS

```bash
# ❌ DON'T use unencrypted
redis://...

# ✅ DO use TLS
rediss://...
```

### 5. Limit Access

- Use Upstash IP allowlist (if available)
- Use VPC peering for AWS/GCP
- Monitor unusual activity

## 🐛 Troubleshooting

### Issue: Connection Timeout

**Error:**
```
Error: connect ETIMEDOUT
```

**Solutions:**
1. Check firewall allows outbound connections
2. Verify URL is correct
3. Check Upstash status page
4. Try different region

### Issue: Authentication Failed

**Error:**
```
Error: NOAUTH Authentication required
```

**Solutions:**
1. Check password in URL is correct
2. Ensure URL format: `rediss://default:PASSWORD@...`
3. Reset password in Upstash dashboard

### Issue: TLS Error

**Error:**
```
Error: unable to verify the first certificate
```

**Solutions:**
1. Use `rediss://` (with double 's')
2. Check TLS configuration:
   ```typescript
   tls: {
     rejectUnauthorized: true
   }
   ```
3. Update Node.js to latest version

### Issue: Commands Failing

**Error:**
```
Error: Command timed out
```

**Solutions:**
1. Check Upstash dashboard for issues
2. Increase `commandTimeout`:
   ```typescript
   commandTimeout: 10000 // 10 seconds
   ```
3. Check network latency
4. Consider using closer region

### Issue: High Latency

**Symptoms:**
- Slow API responses
- Timeouts

**Solutions:**
1. Use Global database (instead of Regional)
2. Choose region closer to users
3. Enable connection pooling (already configured)
4. Cache frequently accessed data

## 📈 Performance Tips

### 1. Use Pipelining

```typescript
// ❌ Slow (3 round trips)
await redis.set('key1', 'value1');
await redis.set('key2', 'value2');
await redis.set('key3', 'value3');

// ✅ Fast (1 round trip)
const pipeline = redis.pipeline();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
pipeline.set('key3', 'value3');
await pipeline.exec();
```

### 2. Use Appropriate Data Structures

```typescript
// ❌ Slow for lists
await redis.set('list', JSON.stringify([1, 2, 3]));

// ✅ Fast for lists
await redis.lpush('list', 1, 2, 3);
```

### 3. Set Expiration

```typescript
// ❌ Data never expires
await redis.set('cache:data', data);

// ✅ Auto-cleanup
await redis.setex('cache:data', 3600, data); // 1 hour
```

### 4. Use Lua Scripts

```typescript
// ❌ Multiple round trips
const current = await redis.get('counter');
await redis.set('counter', parseInt(current) + 1);

// ✅ Atomic operation
await redis.eval(`
  local current = redis.call('GET', KEYS[1])
  return redis.call('SET', KEYS[1], current + 1)
`, 1, 'counter');
```

## ✅ Checklist

Before going to production:

- [ ] Created Upstash account
- [ ] Created Redis database
- [ ] Copied connection URL
- [ ] Updated `server/.env` with Upstash URL
- [ ] Tested connection (`npm run dev`)
- [ ] Tested rate limiting
- [ ] Tested idempotency
- [ ] Added `REDIS_URL` to production environment
- [ ] Verified TLS is enabled (`rediss://`)
- [ ] Set up monitoring/alerts
- [ ] Documented URL in team password manager
- [ ] Added `.env` to `.gitignore`

## 🎉 Success!

Your application now uses Upstash Redis for:
- ✅ Rate limiting
- ✅ Idempotency
- ✅ Session storage
- ✅ Caching
- ✅ Email queue

**Benefits:**
- No Redis server to manage
- Automatic scaling
- Global low latency
- Pay only for what you use
- Production-ready

## 📞 Support

- **Upstash Docs:** https://docs.upstash.com/redis
- **Upstash Discord:** https://discord.gg/upstash
- **Status Page:** https://status.upstash.com/

---

**Next Steps:**
1. Create Upstash account
2. Get Redis URL
3. Update `.env`
4. Test connection
5. Deploy to production

**Estimated Time:** 10 minutes ⏱️
