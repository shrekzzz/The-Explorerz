# Deployment Checklist - Enquiry Management System

## Pre-Deployment

### ✅ Code Review
- [ ] All TypeScript compilation errors resolved
- [ ] No console.log statements in production code
- [ ] All TODO comments addressed or documented
- [ ] Code follows project conventions
- [ ] No hardcoded credentials or secrets

### ✅ Testing
- [ ] All test scenarios from TESTING_GUIDE.md passed
- [ ] Enquiry form validation works correctly
- [ ] Admin dashboard loads without errors
- [ ] Status updates work properly
- [ ] Email delivery tested (both user and admin)
- [ ] Rate limiting tested
- [ ] Mobile responsiveness verified

### ✅ Database
- [ ] Migration file created and reviewed
- [ ] Backup of production database taken
- [ ] Migration tested on staging environment
- [ ] Rollback plan documented
- [ ] Indexes created for performance

### ✅ Environment Configuration
- [ ] `ADMIN_EMAIL` added to `.env`
- [ ] SMTP credentials verified
- [ ] All required environment variables set
- [ ] Environment variables documented
- [ ] Secrets stored securely (not in git)

### ✅ Documentation
- [ ] IMPLEMENTATION_SUMMARY.md reviewed
- [ ] TESTING_GUIDE.md completed
- [ ] ENQUIRY_SYSTEM_README.md finalized
- [ ] ADMIN_QUICK_REFERENCE.md prepared
- [ ] API documentation updated
- [ ] User guide created

## Deployment Steps

### 1. Backup (CRITICAL)

```bash
# Backup database
pg_dump -U postgres -d explorerz_db -f backup_$(date +%Y%m%d_%H%M%S).sql

# Backup .env files
cp server/.env server/.env.backup
cp .env .env.backup

# Backup current codebase
git tag pre-enquiry-system-$(date +%Y%m%d)
git push origin --tags
```

### 2. Stop Services

```bash
# Stop backend
pm2 stop explorerz-server

# Stop frontend (if applicable)
pm2 stop explorerz-frontend
```

### 3. Pull Latest Code

```bash
git fetch origin
git checkout main
git pull origin main

# Verify correct commit
git log -1
```

### 4. Install Dependencies

```bash
# Backend
cd server
npm install
npm audit fix

# Frontend
cd ..
npm install
npm audit fix
```

### 5. Run Database Migration

```bash
cd server

# Generate Prisma client
npm run db:generate

# Run migration
npm run db:migrate

# Verify migration
psql -U postgres -d explorerz_db -c "SELECT * FROM enquiries LIMIT 1;"
```

### 6. Build Applications

```bash
# Backend
cd server
npm run build

# Verify build
ls -la dist/

# Frontend
cd ..
npm run build

# Verify build
ls -la dist/
```

### 7. Update Environment Variables

```bash
# Add new variables to production .env
nano server/.env

# Add:
ADMIN_EMAIL=admin@yourcompany.com

# Verify
grep ADMIN_EMAIL server/.env
```

### 8. Start Services

```bash
# Start backend
pm2 start explorerz-server
pm2 logs explorerz-server --lines 50

# Start frontend (if applicable)
pm2 start explorerz-frontend
pm2 logs explorerz-frontend --lines 50

# Save PM2 configuration
pm2 save
```

### 9. Verify Deployment

```bash
# Check server health
curl http://localhost:3000/api/health

# Check enquiry endpoint
curl http://localhost:3000/api/enquiries \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Check frontend
curl http://localhost:5173
```

## Post-Deployment

### ✅ Smoke Tests

#### Backend Tests
```bash
# Test enquiry submission
curl -X POST http://localhost:3000/api/enquiries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "9876543210",
    "city": "Mumbai",
    "packageTitle": "Test Package",
    "packagePrice": 25000,
    "numberOfPeople": 2,
    "budgetMin": 25000,
    "budgetMax": 35000
  }'

# Test admin endpoint (requires auth)
curl http://localhost:3000/api/enquiries \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Frontend Tests
- [ ] Navigate to `/packages`
- [ ] Open a package detail page
- [ ] Click "Send Enquiry"
- [ ] Submit form with valid data
- [ ] Verify success message
- [ ] Login as admin
- [ ] Navigate to Enquiries tab
- [ ] Verify enquiry appears
- [ ] Update status
- [ ] Verify status updates

### ✅ Email Verification
- [ ] Submit test enquiry
- [ ] Check user email for confirmation
- [ ] Check admin email for notification
- [ ] Verify email formatting
- [ ] Check spam folder if not received

### ✅ Monitoring Setup

#### Application Monitoring
```bash
# Check PM2 status
pm2 status

# Monitor logs
pm2 logs explorerz-server --lines 100

# Check memory usage
pm2 monit
```

#### Database Monitoring
```sql
-- Check enquiries table
SELECT COUNT(*) FROM enquiries;

-- Check recent enquiries
SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 5;

-- Check audit logs
SELECT * FROM audit_logs 
WHERE action LIKE 'ENQUIRY%' 
ORDER BY created_at DESC LIMIT 10;
```

#### Error Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure email alerts for errors
- [ ] Set up uptime monitoring
- [ ] Configure performance monitoring

### ✅ Performance Checks
- [ ] Page load time < 3s
- [ ] API response time < 500ms
- [ ] Database query time < 100ms
- [ ] Email delivery time < 5s
- [ ] No memory leaks
- [ ] CPU usage normal

### ✅ Security Verification
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] Authentication working
- [ ] Authorization working
- [ ] Audit logging active
- [ ] No sensitive data in logs

## Rollback Plan

### If Issues Detected

#### 1. Immediate Rollback
```bash
# Stop services
pm2 stop all

# Restore database
psql -U postgres -d explorerz_db -f backup_YYYYMMDD_HHMMSS.sql

# Restore code
git checkout pre-enquiry-system-YYYYMMDD

# Restore .env
cp server/.env.backup server/.env

# Rebuild
cd server && npm run build
cd .. && npm run build

# Restart services
pm2 restart all
```

#### 2. Partial Rollback (Keep Database)
```bash
# Just rollback code
git checkout pre-enquiry-system-YYYYMMDD
npm install
cd server && npm install
npm run build
cd .. && npm run build
pm2 restart all
```

#### 3. Database-Only Rollback
```sql
-- Drop enquiries table
DROP TABLE enquiries;
DROP TYPE "EnquiryStatus";

-- Restore from backup
psql -U postgres -d explorerz_db -f backup_YYYYMMDD_HHMMSS.sql
```

## Communication Plan

### Stakeholder Notification

#### Before Deployment
**To**: Management, Team Leads  
**Subject**: Enquiry Management System Deployment - [Date]

```
Hi Team,

We will be deploying the new Enquiry Management System on [Date] at [Time].

Expected downtime: 15-30 minutes

New features:
- Customer enquiry form on package pages
- Admin enquiry management dashboard
- Email notifications for new enquiries
- Status tracking workflow

Please review the Admin Quick Reference guide attached.

Thanks,
[Your Name]
```

#### After Deployment
**To**: All Staff  
**Subject**: Enquiry Management System - Now Live! 🎉

```
Hi Team,

The Enquiry Management System is now live!

What's New:
✅ Customers can submit enquiries from package pages
✅ You can manage enquiries from the Admin Dashboard
✅ Automatic email notifications for new enquiries
✅ Status tracking (NEW → CONTACTED → CONVERTED → CLOSED)

Getting Started:
1. Login to admin panel
2. Click "Enquiries" tab
3. Review the Admin Quick Reference guide

Training session: [Date & Time]

Questions? Contact [Support Contact]

Thanks,
[Your Name]
```

### User Notification

#### Website Banner (Optional)
```
🎉 New Feature: Send us an enquiry directly from package pages!
We'll get back to you within 24 hours.
```

#### Social Media Post (Optional)
```
📢 Exciting Update!

You can now send enquiries directly from our package pages! 
Just click "Send Enquiry" and we'll get back to you within 24 hours.

Making your travel planning easier! ✈️

#DeshYatra #TravelUpdate
```

## Training Plan

### Admin Training Session

#### Session 1: Overview (30 minutes)
- [ ] Introduction to enquiry system
- [ ] Demo of customer enquiry form
- [ ] Walkthrough of admin dashboard
- [ ] Q&A

#### Session 2: Hands-On (45 minutes)
- [ ] Practice viewing enquiries
- [ ] Practice updating status
- [ ] Practice filtering
- [ ] Practice contacting customers
- [ ] Q&A

#### Session 3: Best Practices (30 minutes)
- [ ] Response time targets
- [ ] Status workflow
- [ ] Email templates
- [ ] Conversion tips
- [ ] Q&A

### Training Materials
- [ ] Admin Quick Reference guide
- [ ] Video tutorial (record session)
- [ ] FAQ document
- [ ] Email templates
- [ ] Troubleshooting guide

## Monitoring & Maintenance

### Daily Checks
- [ ] Check PM2 status
- [ ] Review error logs
- [ ] Monitor enquiry volume
- [ ] Check email delivery
- [ ] Verify database health

### Weekly Checks
- [ ] Review conversion rates
- [ ] Analyze response times
- [ ] Check disk space
- [ ] Review audit logs
- [ ] Update documentation

### Monthly Checks
- [ ] Performance optimization
- [ ] Security audit
- [ ] Backup verification
- [ ] Dependency updates
- [ ] Feature requests review

## Success Metrics

### Week 1 Targets
- [ ] 0 critical bugs
- [ ] 100% email delivery
- [ ] < 24h average response time
- [ ] > 90% admin adoption

### Month 1 Targets
- [ ] > 50 enquiries received
- [ ] > 30% conversion rate
- [ ] < 12h average response time
- [ ] 100% admin adoption

### Quarter 1 Targets
- [ ] > 200 enquiries received
- [ ] > 40% conversion rate
- [ ] < 6h average response time
- [ ] Positive user feedback

## Issue Tracking

### Known Issues
- [ ] None currently

### Reported Issues
| Date | Issue | Severity | Status | Assigned To |
|------|-------|----------|--------|-------------|
| - | - | - | - | - |

### Feature Requests
| Date | Request | Priority | Status | Notes |
|------|---------|----------|--------|-------|
| - | - | - | - | - |

## Sign-Off

### Deployment Approval

- [ ] **Developer**: Code reviewed and tested  
  Name: _________________ Date: _________

- [ ] **QA**: All tests passed  
  Name: _________________ Date: _________

- [ ] **DevOps**: Infrastructure ready  
  Name: _________________ Date: _________

- [ ] **Product Manager**: Features approved  
  Name: _________________ Date: _________

- [ ] **CTO/Tech Lead**: Final approval  
  Name: _________________ Date: _________

### Post-Deployment Verification

- [ ] **Developer**: Deployment successful  
  Name: _________________ Date: _________

- [ ] **QA**: Smoke tests passed  
  Name: _________________ Date: _________

- [ ] **DevOps**: Monitoring active  
  Name: _________________ Date: _________

---

**Deployment Date**: ______________  
**Deployment Time**: ______________  
**Deployed By**: ______________  
**Version**: 1.0.0

**Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
