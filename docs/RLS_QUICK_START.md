# 🚀 RLS Quick Start Guide

## What is RLS?

**Row-Level Security (RLS)** is a PostgreSQL feature that enforces access control at the database level. Even if your application code is compromised, the database will still protect your data.

## 🎯 Quick Setup (5 Minutes)

### Step 1: Apply the Migration

```bash
cd server
npx prisma migrate deploy
```

This enables RLS on all tables and creates security policies.

### Step 2: Verify RLS is Working

```bash
npm run db:verify-rls
```

You should see all checks passing ✓

### Step 3: Test with Your Application

The RLS middleware is already integrated! Just start your server:

```bash
npm run dev
```

## ✅ That's It!

RLS is now protecting your database. The middleware automatically:
- Sets user context for authenticated requests
- Enforces policies at the database level
- Logs context in development mode

## 🧪 Testing

Run the RLS test suite:

```bash
npm run test:rls
```

## 📖 Learn More

- **Full Guide**: See `RLS_IMPLEMENTATION_GUIDE.md` for detailed documentation
- **Code Examples**: Check `src/utils/rls.ts` for usage patterns
- **Tests**: Review `src/tests/rls.test.ts` for examples

## 🔍 How to Verify It's Working

### Method 1: Check Logs (Development)

Start your server and watch for RLS context logs:

```bash
npm run dev
```

Make an authenticated request and you'll see:
```
RLS context set for request { userId: '...', role: 'USER', path: '/api/trips' }
```

### Method 2: Database Query

Connect to your database and test:

```sql
-- Set user context
SET LOCAL app.current_user_id = 'your-user-uuid';
SET LOCAL app.user_role = 'USER';

-- Try to query trips
SELECT * FROM trips;
-- Should only return trips for this user
```

### Method 3: API Test

Try to access another user's data:

```bash
# Get your auth token
TOKEN="your-jwt-token"

# Try to access a trip that doesn't belong to you
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/trips/other-user-trip-id

# Should return 404 (RLS filtered it out)
```

## 🛡️ What's Protected?

| Resource | Protection |
|----------|-----------|
| Trips | Users can only see their own trips (or public ones) |
| Bookings | Users can only see their own bookings |
| User Profiles | Users can only see their own profile |
| Sessions | Users can only see their own sessions |
| Packages | Everyone can see available packages |
| Reviews | Everyone can read, users can only edit their own |

## 🚨 Common Issues

### Issue: "No rows returned"

**Cause**: RLS context not set or user doesn't have access

**Solution**: Verify authentication middleware is running before RLS middleware

### Issue: "Function current_user_id() does not exist"

**Cause**: Migration not applied

**Solution**: Run `npx prisma migrate deploy`

### Issue: "Permission denied"

**Cause**: RLS policy blocks the operation

**Solution**: Check if user has correct role or ownership

## 💡 Pro Tips

1. **Always use the middleware**: Don't bypass it unless you have a very good reason
2. **Test your policies**: Write tests to verify RLS works as expected
3. **Monitor logs**: Watch for RLS context in development
4. **Use system context carefully**: Only for registration and system operations

## 🆘 Need Help?

1. Check the full guide: `RLS_IMPLEMENTATION_GUIDE.md`
2. Review the code: `src/utils/rls.ts` and `src/middleware/rls.ts`
3. Run verification: `npm run db:verify-rls`
4. Check tests: `npm run test:rls`

## 📊 Security Impact

Before RLS:
```typescript
// ⚠️ Vulnerable to auth bypass
const trips = await prisma.trip.findMany({
  where: { userId: req.user.userId }
});
```

After RLS:
```typescript
// ✅ Protected at database level
await setUserContext(prisma, req.user.userId, req.user.role);
const trips = await prisma.trip.findMany(); // Automatically filtered
```

**Result**: Even if `req.user` is manipulated, the database enforces the correct access control.

---

**Status**: ✅ RLS is implemented and ready to use

**Next Steps**: 
1. Apply migration: `npx prisma migrate deploy`
2. Verify: `npm run db:verify-rls`
3. Test: `npm run test:rls`
4. Deploy with confidence! 🚀
