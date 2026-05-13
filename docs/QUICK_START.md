# 🚀 Quick Start Guide

## ✅ Servers Running

### Backend Server
- **URL**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **Status**: ✅ Running
- **Note**: Redis unavailable (running without cache) - this is OK for development

### Frontend Server
- **URL**: http://localhost:5174 (or 5173 if available)
- **Status**: ✅ Running
- **Network Access**: Also available on local network (http://192.168.1.6:5174)

## 🔐 Admin Credentials

### Super Admin Account
```
Email: admin@deshyatra.com
Password: Admin@123
Role: SUPERADMIN
```

### Test User Account
```
Email: user@deshyatra.com
Password: User@123
Role: USER
```

## 📍 Important URLs

### Public Pages
- **Home**: http://localhost:5174/
- **Packages**: http://localhost:5174/packages
- **Plan Trip**: http://localhost:5174/plan
- **Consent Form**: http://localhost:5174/consent-form
- **Login**: http://localhost:5174/login

### Admin Pages (Requires Login)
- **Admin Dashboard**: http://localhost:5174/admin
- **Super Admin**: http://localhost:5174/superadmin

### API Endpoints
- **Health Check**: http://localhost:3001/api/health
- **Enquiries**: http://localhost:3001/api/enquiries
- **Consent Forms**: http://localhost:3001/api/consent-forms
- **Packages**: http://localhost:3001/api/packages

## 🧪 Testing Workflow

### 1. Test Enquiry System
```bash
# Step 1: Open a package page
http://localhost:5174/packages

# Step 2: Click on any package

# Step 3: Click "Send Enquiry" button

# Step 4: Fill out the form and submit

# Step 5: Login as admin
http://localhost:5174/login
Email: admin@deshyatra.com
Password: Admin@123

# Step 6: Go to Enquiries tab
# Step 7: View and manage enquiries
```

### 2. Test Consent Form System
```bash
# Step 1: Open consent form
http://localhost:5174/consent-form

# Step 2: Fill out the form
- Select a package
- Add traveler details
- Upload photo (max 10MB)
- Upload ID proof (max 5MB)
- Fill emergency contact
- Accept all consents

# Step 3: Submit form

# Step 4: Login as admin
http://localhost:5174/login

# Step 5: Go to "Consent Forms" tab

# Step 6: Click "View" on a form

# Step 7: Review details and Approve/Reject
```

### 3. Test Admin Features
```bash
# Login as admin
http://localhost:5174/login
Email: admin@deshyatra.com
Password: Admin@123

# Available Tabs:
1. Overview - Dashboard with stats
2. Package Editor - Create/edit packages
3. Enquiries - Manage customer enquiries
4. Consent Forms - Review and approve forms
```

## 📊 Dashboard Stats

The admin dashboard shows:
- Total Users
- Total Trips
- Packages
- Bookings
- **Enquiries** (NEW)
- **Consent Forms** (NEW)

## 🔧 Database Setup

If you haven't run migrations yet:

```bash
cd server
npm run db:generate
npm run db:migrate
npm run db:seed  # Creates admin user and sample packages
```

## 📧 Email Configuration

Emails are configured to send to:
- **User emails**: Confirmation emails
- **Admin email**: the.explorerz.online@gmail.com

**Note**: Check spam folder if emails don't appear in inbox.

## 🎨 Features Implemented

### Enquiry Management
✅ Public enquiry form on package pages
✅ Email notifications (user + admin)
✅ Admin dashboard with filtering
✅ Status tracking (NEW → CONTACTED → CONVERTED → CLOSED)
✅ Rate limiting (5 per 5 minutes)

### Consent Form System
✅ Comprehensive consent form at `/consent-form`
✅ File uploads (photo + ID proof) via Cloudinary
✅ Email notifications (user + admin)
✅ Admin review and approval system
✅ Status tracking (PENDING → APPROVED/REJECTED)
✅ Rate limiting (3 per 10 minutes)
✅ Document viewer in admin panel

### Security
✅ Admin-only authentication (no public registration)
✅ Role-based access control (STAFF, SUPERADMIN)
✅ Rate limiting on all public endpoints
✅ Input validation with Zod schemas
✅ Audit logging for all actions
✅ Secure file uploads to Cloudinary

## 🐛 Troubleshooting

### Backend Issues

**Redis Warning**
```
WARN: Redis unavailable — running without cache/rate-limit store
```
**Solution**: This is OK for development. Redis is optional. Rate limiting will use memory store.

**Database Connection Error**
```
Error: P1000: Authentication failed
```
**Solution**: Check DATABASE_URL in `server/.env`

### Frontend Issues

**API Connection Error**
```
Failed to fetch
```
**Solution**: 
1. Check backend is running on http://localhost:3001
2. Check CORS_ORIGINS in `server/.env` includes http://localhost:5174

**File Upload Error**
```
Failed to upload file
```
**Solution**: 
1. Check Cloudinary credentials in `server/.env`
2. Verify file size (photo: 10MB, ID: 5MB)
3. Check file type (images or PDF)

## 📱 Mobile Testing

The frontend is responsive and can be accessed on mobile:
- **Local Network**: http://192.168.1.6:5174
- Use your phone's browser
- Connect to same WiFi network

## 🔄 Stopping Servers

To stop the servers, use Ctrl+C in the terminal or:

```bash
# List running processes
pm2 list

# Stop specific process
pm2 stop <process-id>

# Stop all
pm2 stop all
```

## 📚 Documentation

- `IMPLEMENTATION_SUMMARY.md` - Complete implementation details
- `TESTING_GUIDE.md` - Comprehensive testing scenarios
- `ENQUIRY_SYSTEM_README.md` - Enquiry system documentation
- `CONSENT_FORM_COMPLETE.md` - Consent form documentation
- `ADMIN_QUICK_REFERENCE.md` - Admin user guide
- `DEPLOYMENT_CHECKLIST.md` - Production deployment guide

## 🎯 Next Steps

1. ✅ **Test Enquiry System**
   - Submit an enquiry from a package page
   - Login as admin and review it

2. ✅ **Test Consent Form**
   - Fill out the consent form
   - Upload documents
   - Review in admin panel

3. ✅ **Check Emails**
   - Verify confirmation emails are sent
   - Check admin notification emails

4. ✅ **Explore Admin Dashboard**
   - View all tabs
   - Test filtering
   - Update statuses

5. 📝 **Customize**
   - Update email templates
   - Adjust rate limits
   - Add more packages

## 💡 Tips

- **Use Chrome DevTools**: Network tab to debug API calls
- **Check Browser Console**: For frontend errors
- **Check Server Logs**: Terminal output for backend errors
- **Test on Mobile**: Use network URL for mobile testing
- **Clear Browser Cache**: If seeing old data

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Review server logs in terminal
3. Check browser console for errors
4. Verify database has data
5. Check Cloudinary dashboard for uploads

---

**Status**: ✅ All Systems Running  
**Backend**: http://localhost:3001  
**Frontend**: http://localhost:5174  
**Admin**: admin@deshyatra.com / Admin@123
