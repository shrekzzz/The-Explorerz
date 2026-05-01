# Quick Start: New Features

**Date**: May 1, 2026  
**Status**: ✅ Ready to Use

---

## 🚀 Quick Setup (5 Minutes)

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Razorpay

1. Sign up at https://razorpay.com
2. Get your test API keys from Settings → API Keys
3. Add to `server/.env`:

```env
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

### 3. Start Services

```bash
# Terminal 1: Start Docker services
docker-compose up -d

# Terminal 2: Start backend
cd server
npm run dev

# Terminal 3: Start frontend
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3001
📧 Email worker initialized
```

---

## 📊 Admin Dashboard

### Access Dashboard

```bash
# Login as admin
Email: admin@deshyatra.com
Password: Admin123!@#

# Navigate to: http://localhost:5173/admin/dashboard
```

### Available Analytics

1. **Dashboard Stats** - `/api/admin/dashboard`
   - Total users, bookings, revenue
   - Recent bookings
   - Bookings by status

2. **Revenue Analytics** - `/api/admin/analytics/revenue`
   - Daily/weekly/monthly revenue
   - Booking trends
   - Average booking value

3. **Package Analytics** - `/api/admin/analytics/packages`
   - Top performing packages
   - Revenue by package
   - Conversion rates

4. **System Health** - `/api/admin/system/health`
   - Database status
   - Redis status
   - Memory usage

---

## 💳 Booking with Payment

### Complete Flow

```javascript
// 1. Create booking
const booking = await fetch('/api/bookings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    packageId: 'package-uuid',
    travelers: 2,
    travelDate: '2026-06-15',
    contactInfo: { phone: '+91-9876543210' }
  })
});

// 2. Create payment order
const order = await fetch(`/api/bookings/${booking.id}/payment/order`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

// 3. Open Razorpay checkout
const options = {
  key: 'YOUR_RAZORPAY_KEY_ID',
  amount: order.amount,
  order_id: order.orderId,
  handler: async (response) => {
    // 4. Verify payment
    await fetch(`/api/bookings/${booking.id}/payment/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(response)
    });
  }
};

const razorpay = new Razorpay(options);
razorpay.open();
```

### Test Payment

Use Razorpay test card:
- Card: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

---

## 📧 Email Queue

### Automatic Emails

Emails are automatically queued for:

1. **Welcome Email** - On user registration
2. **Booking Confirmation** - After payment verification
3. **Email Verification** - On registration (if needed)
4. **Password Reset** - On forgot password

### Monitor Email Queue

Check server logs:

```bash
cd server
npm run dev

# You'll see:
# ✓ Email queued: type=welcome, recipient=user@example.com
# ✓ Processing email job: type=welcome, jobId=1
# ✓ Email sent: to=user@example.com
# ✓ Email job completed: type=welcome, jobId=1
```

### Manual Email Queue

```typescript
import { queueEmail } from './services/email.service.js';

// Queue any email type
await queueEmail('welcome', {
  email: 'user@example.com',
  firstName: 'John'
});
```

---

## 🧪 Quick Test

### Test Admin Dashboard

```bash
curl -X GET http://localhost:3001/api/admin/dashboard \
  -H "Authorization: Bearer <admin-token>"
```

### Test Booking Flow

```bash
# 1. Create booking
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "packageId": "uuid",
    "travelers": 2,
    "travelDate": "2026-06-15",
    "contactInfo": {"phone": "+91-9876543210"}
  }'

# 2. Create payment order
curl -X POST http://localhost:3001/api/bookings/<booking-id>/payment/order \
  -H "Authorization: Bearer <token>"
```

### Test Email Queue

```bash
# Register new user (triggers welcome email)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'

# Check logs for: ✓ Email queued: type=welcome
```

---

## 📝 New API Endpoints

### Admin

```
GET  /api/admin/dashboard              - Dashboard stats
GET  /api/admin/analytics/revenue      - Revenue analytics
GET  /api/admin/analytics/packages     - Package analytics
GET  /api/admin/system/health          - System health
GET  /api/admin/activity/:userId?      - Activity logs
```

### Booking

```
POST  /api/bookings/:id/payment/order   - Create payment order
POST  /api/bookings/:id/payment/verify  - Verify payment
POST  /api/bookings/:id/cancel          - Cancel booking
PATCH /api/bookings/:id                 - Modify booking
```

---

## 🔧 Configuration

### Required Environment Variables

```env
# Payment (Required for bookings)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Email (Required for notifications)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@deshyatra.com
```

### Optional Configuration

```env
# Redis (for email queue)
REDIS_URL=redis://localhost:6379

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## 🐛 Troubleshooting

### Email Worker Not Starting

**Problem**: No "Email worker initialized" message  
**Solution**: Check Redis connection, ensure Redis is running

```bash
docker-compose ps redis
# Should show: Up
```

### Payment Verification Fails

**Problem**: Invalid signature error  
**Solution**: Verify `RAZORPAY_KEY_SECRET` is correct in `.env`

### Admin Dashboard Empty

**Problem**: No data showing  
**Solution**: Seed database with sample data

```bash
cd server
npm run db:seed
```

---

## 📚 Documentation

- **Complete Guide**: `FEATURES_IMPLEMENTATION_GUIDE.md`
- **API Reference**: See guide for all endpoints
- **Setup Guide**: `SETUP_GUIDE.md`

---

## ✅ Checklist

Before using new features:

- [ ] Razorpay account created
- [ ] Test API keys added to `.env`
- [ ] Docker services running
- [ ] Backend server running
- [ ] Email worker initialized
- [ ] Admin user created
- [ ] Test booking created
- [ ] Test payment completed

---

**Quick Start Date**: May 1, 2026  
**Status**: ✅ Ready to Use

🎉 **Start using the new features now!**
