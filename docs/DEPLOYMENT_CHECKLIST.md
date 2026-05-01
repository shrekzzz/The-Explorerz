# Deployment Checklist: New Features

**Date**: May 1, 2026  
**Features**: Admin Dashboard, Booking Flow, Email Queue

---

## ✅ Pre-Deployment Checklist

### 1. Environment Configuration

#### Razorpay Setup
- [ ] Create Razorpay account at https://razorpay.com
- [ ] Complete KYC verification (for live mode)
- [ ] Generate test API keys
- [ ] Add to `server/.env`:
  ```env
  RAZORPAY_KEY_ID=rzp_test_your_key_id
  RAZORPAY_KEY_SECRET=your_key_secret
  ```
- [ ] Test payment flow in test mode
- [ ] Generate live API keys (for production)
- [ ] Update production `.env` with live keys

#### Email Configuration
- [ ] Verify SendGrid API key in `server/.env`
- [ ] Test email delivery
- [ ] Verify `EMAIL_FROM` address
- [ ] Check email templates render correctly

#### Redis Configuration
- [ ] Verify Redis is running: `docker-compose ps redis`
- [ ] Test Redis connection
- [ ] Verify `REDIS_URL` in `server/.env`

### 2. Database Setup

- [ ] Run migrations: `cd server && npm run db:migrate`
- [ ] Verify all tables exist
- [ ] Seed database: `npm run db:seed`
- [ ] Verify admin user exists
- [ ] Verify sample packages exist

### 3. Code Verification

- [ ] No TypeScript errors: `cd server && npm run build`
- [ ] All tests pass: `npm test`
- [ ] RLS tests pass: `npm run test:rls`
- [ ] Linting passes: `npm run lint`

### 4. Service Health Checks

- [ ] Database connection: `curl http://localhost:3001/api/health`
- [ ] Redis connection: Check health endpoint
- [ ] Email worker initialized: Check server logs
- [ ] All services show "healthy"

---

## 🧪 Testing Checklist

### Admin Dashboard Testing

#### Dashboard Stats
- [ ] Access `/api/admin/dashboard` with admin token
- [ ] Verify all stats are present:
  - [ ] Total users
  - [ ] Total packages
  - [ ] Total trips
  - [ ] Total bookings
  - [ ] Total revenue
  - [ ] New users this month
  - [ ] Active packages
- [ ] Verify recent bookings list
- [ ] Verify bookings by status

#### Revenue Analytics
- [ ] Access `/api/admin/analytics/revenue`
- [ ] Test with date range
- [ ] Test grouping by day
- [ ] Test grouping by week
- [ ] Test grouping by month
- [ ] Verify summary calculations

#### Package Analytics
- [ ] Access `/api/admin/analytics/packages`
- [ ] Verify all packages listed
- [ ] Verify metrics:
  - [ ] Total bookings
  - [ ] Total reviews
  - [ ] Total revenue
  - [ ] Average rating
  - [ ] Conversion rate
- [ ] Verify sorted by revenue

#### System Health
- [ ] Access `/api/admin/system/health`
- [ ] Verify database status
- [ ] Verify Redis status
- [ ] Verify uptime
- [ ] Verify memory usage

#### User Activity
- [ ] Access `/api/admin/activity`
- [ ] Verify activity logs displayed
- [ ] Test pagination
- [ ] Test filtering by user ID

### Booking Flow Testing

#### Create Booking
- [ ] Create booking with valid data
- [ ] Verify status is PENDING
- [ ] Verify total amount calculated correctly
- [ ] Verify booking saved to database

#### Payment Order
- [ ] Create payment order for booking
- [ ] Verify Razorpay order ID returned
- [ ] Verify amount in paise (x100)
- [ ] Verify currency is INR

#### Payment Verification (Test Mode)
- [ ] Use test card: `4111 1111 1111 1111`
- [ ] Complete payment on Razorpay
- [ ] Verify payment signature
- [ ] Verify booking status updated to CONFIRMED
- [ ] Verify payment ID saved
- [ ] Verify confirmation email queued

#### Booking Cancellation
- [ ] Cancel confirmed booking
- [ ] Verify 7-day policy enforced
- [ ] Verify refund initiated
- [ ] Verify status updated to REFUNDED/CANCELLED
- [ ] Test admin override (cancel within 7 days)

#### Booking Modification
- [ ] Modify booking travel date
- [ ] Modify number of travelers
- [ ] Verify 14-day policy enforced
- [ ] Verify amount recalculated
- [ ] Verify changes saved

### Email Queue Testing

#### Welcome Email
- [ ] Register new user
- [ ] Check server logs for "Email queued: type=welcome"
- [ ] Check logs for "Email sent"
- [ ] Verify email received
- [ ] Verify email content correct

#### Booking Confirmation Email
- [ ] Complete booking with payment
- [ ] Check logs for "Email queued: type=booking-confirmation"
- [ ] Check logs for "Email sent"
- [ ] Verify email received
- [ ] Verify booking details correct

#### Email Worker
- [ ] Verify worker initialized on server start
- [ ] Verify worker processes jobs
- [ ] Test retry on failure (disconnect SMTP temporarily)
- [ ] Verify exponential backoff
- [ ] Verify worker closes on server shutdown

---

## 🚀 Deployment Steps

### Development Environment

1. **Start Services**
   ```bash
   docker-compose up -d
   cd server
   npm run dev
   ```

2. **Verify Startup**
   - [ ] Server running on port 3001
   - [ ] Email worker initialized
   - [ ] No errors in logs

3. **Test Endpoints**
   - [ ] Health check: `curl http://localhost:3001/api/health`
   - [ ] Admin dashboard: Test with admin token
   - [ ] Create test booking
   - [ ] Complete test payment

### Staging Environment

1. **Environment Setup**
   - [ ] Copy `.env.example` to `.env`
   - [ ] Update all credentials
   - [ ] Use Razorpay test keys
   - [ ] Use staging database

2. **Deploy Code**
   - [ ] Push to staging branch
   - [ ] Run migrations
   - [ ] Seed database
   - [ ] Start services

3. **Smoke Tests**
   - [ ] Health check passes
   - [ ] Admin dashboard loads
   - [ ] Create test booking
   - [ ] Complete test payment
   - [ ] Verify email delivery

### Production Environment

1. **Pre-Production**
   - [ ] Backup database
   - [ ] Review all environment variables
   - [ ] Switch to Razorpay live keys
   - [ ] Update CORS origins
   - [ ] Enable production logging

2. **Deploy**
   - [ ] Push to production branch
   - [ ] Run migrations
   - [ ] Verify RLS enabled
   - [ ] Start services
   - [ ] Monitor logs

3. **Post-Deployment**
   - [ ] Health check passes
   - [ ] Admin dashboard accessible
   - [ ] Test booking flow (small amount)
   - [ ] Verify email delivery
   - [ ] Monitor error logs
   - [ ] Monitor payment logs

---

## 🔍 Monitoring Checklist

### Application Monitoring

- [ ] Set up error tracking (Sentry)
- [ ] Monitor API response times
- [ ] Track payment success rate
- [ ] Monitor email delivery rate
- [ ] Set up uptime monitoring

### Email Queue Monitoring

- [ ] Monitor queue length
- [ ] Track failed jobs
- [ ] Set up alerts for queue backlog
- [ ] Monitor email delivery rate
- [ ] Track retry attempts

### Payment Monitoring

- [ ] Monitor payment success rate
- [ ] Track failed payments
- [ ] Set up alerts for payment failures
- [ ] Monitor refund processing
- [ ] Track payment amounts

### Database Monitoring

- [ ] Monitor query performance
- [ ] Track slow queries
- [ ] Monitor connection pool
- [ ] Set up backup alerts
- [ ] Monitor disk usage

---

## 🐛 Troubleshooting Guide

### Email Worker Not Starting

**Symptoms:**
- No "Email worker initialized" in logs
- Emails not being sent

**Checks:**
- [ ] Redis is running: `docker-compose ps redis`
- [ ] Redis URL correct in `.env`
- [ ] No errors in server logs

**Solution:**
```bash
# Restart Redis
docker-compose restart redis

# Restart server
cd server
npm run dev
```

### Payment Verification Fails

**Symptoms:**
- "Invalid payment signature" error
- Booking stays in PENDING

**Checks:**
- [ ] `RAZORPAY_KEY_SECRET` correct in `.env`
- [ ] Using correct Razorpay account
- [ ] Signature calculation correct

**Solution:**
```bash
# Verify environment variable
echo $RAZORPAY_KEY_SECRET

# Check Razorpay dashboard for correct secret
# Update .env and restart server
```

### Admin Dashboard Empty

**Symptoms:**
- Dashboard shows zero for all stats
- No bookings displayed

**Checks:**
- [ ] Database seeded: `npm run db:seed`
- [ ] Admin user exists
- [ ] Sample packages exist

**Solution:**
```bash
cd server
npm run db:seed
```

### Email Queue Backing Up

**Symptoms:**
- Emails delayed
- Queue length increasing

**Checks:**
- [ ] SMTP credentials correct
- [ ] SendGrid account active
- [ ] Rate limits not exceeded

**Solution:**
```bash
# Check queue status in Redis
redis-cli
> LLEN bull:emails:wait

# Increase worker concurrency in email.service.ts
# Change: concurrency: 5 to concurrency: 10
```

---

## 📊 Success Metrics

### After Deployment

Track these metrics to ensure successful deployment:

#### Performance
- [ ] API response time < 500ms
- [ ] Email queue processing < 10s
- [ ] Payment verification < 1s
- [ ] Admin dashboard load < 2s

#### Reliability
- [ ] Email delivery rate > 99%
- [ ] Payment success rate > 95%
- [ ] API uptime > 99.9%
- [ ] Zero critical errors

#### Business
- [ ] Bookings being created
- [ ] Payments being processed
- [ ] Emails being delivered
- [ ] Admin dashboard being used

---

## 🔐 Security Checklist

### API Security
- [ ] All admin endpoints require authentication
- [ ] RBAC enforced on admin routes
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] SQL injection protection (Prisma)

### Payment Security
- [ ] Razorpay signature verification
- [ ] HTTPS enforced (production)
- [ ] Payment IDs not exposed
- [ ] Refund authorization required

### Email Security
- [ ] Email content sanitized
- [ ] No sensitive data in emails
- [ ] Unsubscribe links (future)
- [ ] SPF/DKIM configured

---

## 📝 Documentation Checklist

### For Developers
- [x] Implementation guide created
- [x] Quick start guide created
- [x] API documentation complete
- [x] Code examples provided
- [x] Troubleshooting guide included

### For Operations
- [x] Deployment checklist created
- [x] Monitoring guide included
- [x] Troubleshooting steps documented
- [x] Configuration guide provided

### For Business
- [ ] User guide for admin dashboard
- [ ] Booking flow documentation
- [ ] Payment policy documentation
- [ ] Email template documentation

---

## ✅ Final Verification

Before marking deployment complete:

### Code Quality
- [ ] No TypeScript errors
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation complete

### Functionality
- [ ] All features working
- [ ] All endpoints tested
- [ ] Email delivery verified
- [ ] Payment flow tested

### Performance
- [ ] Response times acceptable
- [ ] No memory leaks
- [ ] Database queries optimized
- [ ] Caching working (if implemented)

### Security
- [ ] Authentication working
- [ ] Authorization enforced
- [ ] Input validation active
- [ ] Rate limiting working

### Monitoring
- [ ] Error tracking active
- [ ] Logging configured
- [ ] Alerts set up
- [ ] Dashboards created

---

## 🎉 Deployment Complete

Once all items are checked:

1. **Notify Team**
   - [ ] Send deployment notification
   - [ ] Share documentation links
   - [ ] Schedule training session

2. **Monitor Closely**
   - [ ] Watch logs for 24 hours
   - [ ] Monitor error rates
   - [ ] Track user feedback
   - [ ] Be ready for hotfixes

3. **Gather Feedback**
   - [ ] Collect user feedback
   - [ ] Track feature usage
   - [ ] Identify improvements
   - [ ] Plan next iteration

---

**Checklist Created**: May 1, 2026  
**Status**: Ready for Deployment

🚀 **Good luck with your deployment!**
