# Row-Level Security (RLS) Implementation Guide

## 🔒 Overview

This application implements **PostgreSQL Row-Level Security (RLS)** to provide database-level access control. RLS ensures that even if application-level authentication is bypassed or misconfigured, users can only access data they're authorized to see.

## 🎯 Why RLS?

### Without RLS (Application-Level Only)
```typescript
// ⚠️ VULNERABLE: If auth middleware is bypassed, any user can access any data
const trips = await prisma.trip.findMany({
  where: { userId: req.user.userId } // Can be manipulated
});
```

### With RLS (Database-Level)
```typescript
// ✅ SECURE: Database enforces access control regardless of application code
await setUserContext(prisma, req.user.userId, req.user.role);
const trips = await prisma.trip.findMany(); // Automatically filtered by database
```

## 📋 What's Protected

All tables have RLS policies:

| Table | User Access | Admin Access | Public Access |
|-------|-------------|--------------|---------------|
| `users` | Own profile only | All users | None |
| `sessions` | Own sessions only | All sessions | None |
| `packages` | Available packages | All packages | Available packages |
| `package_images` | All images | All images | All images |
| `trips` | Own trips only | All trips | Public trips (shared) |
| `itinerary_days` | Own trip itineraries | All itineraries | Public trip itineraries |
| `activities` | Own trip activities | All activities | Public trip activities |
| `trip_hotels` | Own trip hotels | All hotels | Public trip hotels |
| `bookings` | Own bookings | All bookings | None |
| `reviews` | All reviews (read) | All reviews | All reviews (read) |
| `audit_logs` | None | Read-only | None |

## 🚀 How It Works

### 1. Database Session Context

RLS policies use PostgreSQL session variables to identify the current user:

```sql
-- Set in application code before database operations
SET LOCAL app.current_user_id = 'user-uuid';
SET LOCAL app.user_role = 'USER';
```

### 2. Policy Enforcement

Database policies automatically filter queries:

```sql
-- Policy example: Users can only see their own trips
CREATE POLICY "trips_select_own"
  ON trips FOR SELECT
  USING (user_id = current_user_id());
```

### 3. Automatic Application

When you query the database, RLS is automatically enforced:

```typescript
// Application code
await setUserContext(prisma, userId, role);
const trips = await prisma.trip.findMany(); // Automatically filtered

// Equivalent SQL executed by database
SELECT * FROM trips WHERE user_id = current_user_id();
```

## 💻 Usage in Code

### Method 1: Automatic Middleware (Recommended)

The RLS middleware is automatically applied to all `/api` routes:

```typescript
// server/src/app.ts
app.use('/api', createRLSMiddleware(prisma));

// In your route handlers - RLS is already set!
router.get('/trips', authenticateToken, async (req, res) => {
  // RLS context is automatically set from req.user
  const trips = await prisma.trip.findMany();
  res.json(trips); // Only returns user's own trips
});
```

### Method 2: Manual Context Setting

For fine-grained control:

```typescript
import { withUserContext } from '../utils/rls';

// Execute operation with user context
const trips = await withUserContext(
  prisma,
  req.user.userId,
  req.user.role,
  async (tx) => {
    return tx.trip.findMany();
  }
);
```

### Method 3: System Operations

For operations that should bypass RLS (e.g., registration):

```typescript
import { withSystemContext } from '../utils/rls';

// Execute without user context (system-level access)
const user = await withSystemContext(prisma, async (tx) => {
  return tx.user.create({
    data: { email, passwordHash, firstName, lastName }
  });
});
```

## 🔧 Migration and Setup

### Step 1: Run the Migration

```bash
cd server
npx prisma migrate deploy
```

This will:
- Enable RLS on all tables
- Create helper functions (`current_user_id()`, `is_admin()`, etc.)
- Create policies for all tables

### Step 2: Verify RLS is Active

```sql
-- Connect to your database
psql $DATABASE_URL

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Should show rowsecurity = true for all tables
```

### Step 3: Test RLS Policies

```sql
-- Test 1: Set user context and verify filtering
SET LOCAL app.current_user_id = 'some-user-uuid';
SET LOCAL app.user_role = 'USER';
SELECT * FROM trips; -- Should only return trips for this user

-- Test 2: Set admin context
SET LOCAL app.current_user_id = 'admin-uuid';
SET LOCAL app.user_role = 'ADMIN';
SELECT * FROM trips; -- Should return all trips

-- Test 3: No context
RESET app.current_user_id;
RESET app.user_role;
SELECT * FROM trips; -- Should return empty (except public trips)
```

## 🛡️ Security Benefits

### 1. Defense in Depth
- **Layer 1**: Application authentication (JWT, sessions)
- **Layer 2**: Application authorization (middleware, RBAC)
- **Layer 3**: Database RLS (enforced at data layer) ✅

### 2. Protection Against Common Attacks

#### SQL Injection
```typescript
// Even if SQL injection bypasses application logic:
const maliciousId = "' OR '1'='1"; // Attacker input
await prisma.$queryRawUnsafe(`SELECT * FROM trips WHERE id = '${maliciousId}'`);
// RLS still enforces: WHERE user_id = current_user_id()
```

#### Broken Authentication
```typescript
// If auth middleware is accidentally removed or bypassed:
router.get('/trips', async (req, res) => { // Missing authenticateToken!
  const trips = await prisma.trip.findMany();
  // Without RLS: Returns ALL trips ❌
  // With RLS: Returns empty (no user context set) ✅
});
```

#### Privilege Escalation
```typescript
// If user manipulates their role in JWT:
const fakeToken = { userId: 'user-123', role: 'ADMIN' }; // Forged
// Application might be fooled, but database checks actual role from users table
```

## 📊 Performance Considerations

### Indexing
All RLS policies use indexed columns for optimal performance:
- `user_id` columns are indexed
- `role` column is indexed
- Foreign key relationships are indexed

### Query Planning
PostgreSQL optimizes RLS policies:
```sql
EXPLAIN ANALYZE SELECT * FROM trips;
-- Shows RLS filter is pushed down to index scan
```

### Connection Pooling
RLS context is transaction-scoped, so it works with connection pooling:
```typescript
// Each transaction gets its own context
await prisma.$transaction(async (tx) => {
  await setUserContext(tx, userId, role);
  // Operations here are isolated
});
```

## 🧪 Testing RLS

### Unit Tests

```typescript
import { withUserContext, withSystemContext } from '../utils/rls';

describe('RLS Policies', () => {
  it('should only return user own trips', async () => {
    const user1Trips = await withUserContext(
      prisma,
      user1.id,
      'USER',
      async (tx) => tx.trip.findMany()
    );
    
    expect(user1Trips).toHaveLength(2);
    expect(user1Trips.every(t => t.userId === user1.id)).toBe(true);
  });

  it('should allow admin to see all trips', async () => {
    const allTrips = await withUserContext(
      prisma,
      admin.id,
      'ADMIN',
      async (tx) => tx.trip.findMany()
    );
    
    expect(allTrips.length).toBeGreaterThan(2);
  });

  it('should prevent access without context', async () => {
    const trips = await withSystemContext(
      prisma,
      async (tx) => tx.trip.findMany()
    );
    
    // Only public trips should be returned
    expect(trips.every(t => t.isPublic)).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('API with RLS', () => {
  it('should enforce RLS on trip endpoints', async () => {
    const user1Token = await getAuthToken(user1);
    const user2Token = await getAuthToken(user2);
    
    // User 1 creates a trip
    const trip = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${user1Token}`)
      .send(tripData);
    
    // User 2 cannot access User 1's trip
    const response = await request(app)
      .get(`/api/trips/${trip.body.id}`)
      .set('Authorization', `Bearer ${user2Token}`);
    
    expect(response.status).toBe(404); // RLS filters it out
  });
});
```

## 🐛 Debugging

### Check Current RLS Context

```typescript
import { getRLSContext } from '../utils/rls';

const context = await getRLSContext(prisma);
console.log('Current RLS context:', context);
// Output: { userId: 'uuid', userRole: 'USER' }
```

### Enable RLS Logging

```typescript
// In development
if (process.env.NODE_ENV === 'development') {
  app.use('/api', logRLSContext(prisma));
}
```

### Common Issues

#### Issue: "No rows returned"
**Cause**: RLS context not set or user doesn't have access
**Solution**: Verify `setUserContext()` is called before query

#### Issue: "Permission denied"
**Cause**: RLS policy blocks the operation
**Solution**: Check if user has correct role or ownership

#### Issue: "Function current_user_id() does not exist"
**Cause**: Migration not applied
**Solution**: Run `npx prisma migrate deploy`

## 🔄 Updating Policies

To modify RLS policies:

1. Create a new migration:
```bash
npx prisma migrate dev --name update_rls_policies
```

2. Add your policy changes:
```sql
-- Drop old policy
DROP POLICY IF EXISTS "trips_select_own" ON trips;

-- Create new policy
CREATE POLICY "trips_select_own"
  ON trips FOR SELECT
  USING (user_id = current_user_id() OR is_public = TRUE);
```

3. Test thoroughly before deploying to production

## 📚 Additional Resources

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Prisma RLS Guide](https://www.prisma.io/docs/guides/database/row-level-security)
- [OWASP Access Control](https://owasp.org/www-project-top-ten/2017/A5_2017-Broken_Access_Control)

## ✅ Checklist

- [x] RLS enabled on all tables
- [x] Policies created for all CRUD operations
- [x] Helper functions implemented
- [x] Middleware integrated
- [x] Documentation complete
- [ ] Migration applied to database
- [ ] Tests written and passing
- [ ] Team trained on RLS usage
- [ ] Monitoring and logging configured

## 🚨 Important Notes

1. **Always use middleware**: The RLS middleware should be applied to all authenticated routes
2. **Test policies**: Write tests to verify RLS policies work as expected
3. **Monitor performance**: Check query plans to ensure RLS doesn't cause performance issues
4. **Document exceptions**: If you need to bypass RLS, document why and use `withSystemContext()`
5. **Regular audits**: Periodically review RLS policies to ensure they match business requirements

## 🆘 Support

If you encounter issues with RLS:
1. Check the logs for RLS context information
2. Verify the migration was applied successfully
3. Test policies directly in the database
4. Review the middleware order in `app.ts`
5. Consult this guide and the code comments
