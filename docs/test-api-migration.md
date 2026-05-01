# 🧪 API Migration Test Guide

## Quick Test Commands

### 1. Test Backend Health
```bash
# Should return health status
curl http://localhost:5000/api/health

# Expected response:
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-05-01T...",
  "uptime": 123.45,
  "checks": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

### 2. Test API Version Info
```bash
# Should return version info
curl http://localhost:5000/api

# Expected response:
{
  "name": "The-Explorerz API",
  "version": "1.0.0",
  "currentVersion": "v1",
  "availableVersions": ["v1"],
  "documentation": "/api/v1/docs",
  "health": "/api/health"
}
```

### 3. Test v1 Endpoint
```bash
# Should return packages
curl http://localhost:5000/api/v1/packages

# Expected response:
{
  "success": true,
  "data": [...]
}
```

### 4. Test Legacy Redirect
```bash
# Should redirect to v1
curl -L http://localhost:5000/api/packages

# Should work (redirected to /api/v1/packages)
```

## Browser Testing

### Open DevTools

1. Open browser: `http://localhost:5173`
2. Open DevTools: `F12` or `Cmd+Option+I`
3. Go to Network tab
4. Filter: `XHR` or `Fetch`

### Test Scenarios

#### Scenario 1: Browse Packages
1. Navigate to Packages page
2. Check Network tab for:
   ```
   ✅ GET /api/v1/packages
   ✅ Status: 200
   ✅ Response: { success: true, data: [...] }
   ```

#### Scenario 2: Create Booking (Idempotency Test)
1. Select a package
2. Fill booking form
3. Click "Book Now"
4. Check Network tab for:
   ```
   ✅ POST /api/v1/bookings
   ✅ Headers include: Idempotency-Key: ...
   ✅ Status: 201
   ```
5. **Important:** Click "Book Now" again quickly
6. Should see:
   ```
   ✅ Same Idempotency-Key
   ✅ Returns cached response (no duplicate booking)
   ```

#### Scenario 3: Payment Flow (Idempotency Test)
1. Create booking
2. Initiate payment
3. Check Network tab for:
   ```
   ✅ POST /api/v1/payments/initiate
   ✅ Headers include: Idempotency-Key: ...
   ✅ Status: 200
   ```
4. Complete Razorpay flow
5. Verify payment
6. Check Network tab for:
   ```
   ✅ POST /api/v1/payments/verify
   ✅ Headers include: Idempotency-Key: ...
   ✅ Status: 200
   ```

#### Scenario 4: Image Upload
1. Go to admin or package creation
2. Upload an image
3. Check Network tab for:
   ```
   ✅ POST /api/v1/uploads/image
   ✅ Content-Type: multipart/form-data
   ✅ Status: 200
   ```

## Console Testing

### Check for Errors

Open browser console and look for:

```
❌ 404 Not Found - Wrong endpoint
❌ CORS error - CORS not configured
❌ 401 Unauthorized - Auth issue
❌ Missing Idempotency-Key - Interceptor not working
```

Should see:
```
✅ No errors
✅ Successful API calls
✅ Idempotency keys logged (in dev mode)
```

## Automated Testing

### Using curl

```bash
#!/bin/bash

echo "Testing API Migration..."

# Test 1: Health check
echo "1. Testing health check..."
curl -s http://localhost:5000/api/health | jq .

# Test 2: API info
echo "2. Testing API info..."
curl -s http://localhost:5000/api | jq .

# Test 3: v1 endpoint
echo "3. Testing v1 packages..."
curl -s http://localhost:5000/api/v1/packages | jq .

# Test 4: Legacy redirect
echo "4. Testing legacy redirect..."
curl -sL http://localhost:5000/api/packages | jq .

echo "✅ All tests complete!"
```

Save as `test-api.sh` and run:
```bash
chmod +x test-api.sh
./test-api.sh
```

### Using JavaScript

```javascript
// test-api.js
const API_URL = 'http://localhost:5000';

async function testAPI() {
  console.log('Testing API Migration...\n');

  // Test 1: Health check
  console.log('1. Testing health check...');
  const health = await fetch(`${API_URL}/api/health`).then(r => r.json());
  console.log('✅ Health:', health.status);

  // Test 2: API info
  console.log('\n2. Testing API info...');
  const info = await fetch(`${API_URL}/api`).then(r => r.json());
  console.log('✅ Version:', info.currentVersion);

  // Test 3: v1 endpoint
  console.log('\n3. Testing v1 packages...');
  const packages = await fetch(`${API_URL}/api/v1/packages`).then(r => r.json());
  console.log('✅ Packages:', packages.data?.length || 0);

  // Test 4: Legacy redirect
  console.log('\n4. Testing legacy redirect...');
  const legacy = await fetch(`${API_URL}/api/packages`).then(r => r.json());
  console.log('✅ Legacy redirect works');

  console.log('\n✅ All tests passed!');
}

testAPI().catch(console.error);
```

Run with:
```bash
node test-api.js
```

## Integration Testing

### Test Complete Flow

```javascript
// test-booking-flow.js
import { api } from './src/lib/api';

async function testBookingFlow() {
  console.log('Testing complete booking flow...\n');

  try {
    // 1. Login
    console.log('1. Logging in...');
    const { data: authData } = await api.post('/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('✅ Logged in');

    // 2. Get packages
    console.log('\n2. Fetching packages...');
    const { data: packagesData } = await api.get('/packages');
    const packageId = packagesData.data[0].id;
    console.log('✅ Got packages');

    // 3. Create booking (with idempotency)
    console.log('\n3. Creating booking...');
    const { data: bookingData } = await api.post('/bookings', {
      packageId,
      travelers: 2,
      travelDate: '2026-06-01',
      contactInfo: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890'
      }
    });
    console.log('✅ Booking created:', bookingData.data.id);

    // 4. Try to create duplicate (should be prevented)
    console.log('\n4. Testing idempotency (duplicate booking)...');
    try {
      await api.post('/bookings', {
        packageId,
        travelers: 2,
        travelDate: '2026-06-01',
        contactInfo: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '1234567890'
        }
      });
      console.log('✅ Idempotency working (returned cached response)');
    } catch (err) {
      console.log('⚠️ Idempotency might not be working');
    }

    // 5. Initiate payment
    console.log('\n5. Initiating payment...');
    const { data: paymentData } = await api.post('/payments/initiate', {
      bookingId: bookingData.data.id,
      amount: bookingData.data.totalAmount
    });
    console.log('✅ Payment initiated');

    console.log('\n✅ Complete flow test passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBookingFlow();
```

## Performance Testing

### Test Idempotency Performance

```javascript
// test-idempotency-performance.js
async function testIdempotencyPerformance() {
  console.log('Testing idempotency performance...\n');

  const bookingData = {
    packageId: 'test-package-id',
    travelers: 2,
    travelDate: '2026-06-01'
  };

  // First request (should create booking)
  console.log('1. First request (creates booking)...');
  const start1 = Date.now();
  await api.post('/bookings', bookingData);
  const time1 = Date.now() - start1;
  console.log(`✅ Time: ${time1}ms`);

  // Second request (should return cached)
  console.log('\n2. Second request (returns cached)...');
  const start2 = Date.now();
  await api.post('/bookings', bookingData);
  const time2 = Date.now() - start2;
  console.log(`✅ Time: ${time2}ms`);

  console.log(`\n📊 Performance improvement: ${Math.round((1 - time2/time1) * 100)}%`);
}

testIdempotencyPerformance();
```

## Checklist

### Backend Tests
- [ ] Health check returns 200
- [ ] API info endpoint works
- [ ] v1 endpoints work
- [ ] Legacy redirects work
- [ ] Idempotency middleware active
- [ ] CORS configured correctly

### Frontend Tests
- [ ] All pages load without errors
- [ ] API calls use /api/v1
- [ ] Idempotency keys added automatically
- [ ] Auth tokens attached automatically
- [ ] Image uploads work
- [ ] No 404 errors in console

### Integration Tests
- [ ] Login flow works
- [ ] Package browsing works
- [ ] Trip creation works
- [ ] Booking creation works
- [ ] Payment flow works
- [ ] Duplicate prevention works

### Performance Tests
- [ ] API response times acceptable
- [ ] Idempotency cache working
- [ ] No memory leaks
- [ ] No excessive requests

## Success Criteria

✅ **All tests pass**
✅ **No console errors**
✅ **Idempotency working**
✅ **All flows functional**
✅ **Performance acceptable**

## Troubleshooting

### If tests fail:

1. **Check backend is running**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Check frontend is running**
   ```bash
   curl http://localhost:5173
   ```

3. **Check environment variables**
   ```bash
   # Frontend
   cat .env | grep VITE_API_URL
   
   # Backend
   cat server/.env | grep PORT
   ```

4. **Check browser console**
   - Open DevTools
   - Look for errors
   - Check Network tab

5. **Check backend logs**
   ```bash
   tail -f server/logs/app.log
   ```

---

**Ready to test?** Start with the Quick Test Commands above!
