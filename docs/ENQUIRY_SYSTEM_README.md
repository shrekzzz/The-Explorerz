# Enquiry Management System

## Overview

A comprehensive enquiry management system that allows customers to submit travel package enquiries and enables admins to track, manage, and convert leads. This system replaces public user registration with an admin-only authentication model.

## Features

### 🎯 Customer Features
- **Enquiry Form**: Rich form with validation for package enquiries
- **Budget Slider**: Interactive budget range selection
- **Route Selection**: Choose preferred routes for multi-route packages
- **Email Confirmation**: Automatic confirmation email upon submission
- **Rate Limiting**: Protection against spam (5 submissions per 5 minutes)

### 👨‍💼 Admin Features
- **Enquiry Dashboard**: Comprehensive view of all enquiries
- **Status Management**: Track enquiry lifecycle (NEW → CONTACTED → CONVERTED → CLOSED)
- **Filtering**: Filter enquiries by status
- **Contact Integration**: Clickable email and phone links
- **Real-time Stats**: Dashboard widget showing total enquiries
- **Audit Trail**: All enquiry actions are logged

### 🔒 Security Features
- **Admin-Only Auth**: Public registration removed
- **Role-Based Access**: STAFF and SUPERADMIN roles can manage enquiries
- **Rate Limiting**: Prevents spam submissions
- **Input Validation**: Zod schemas validate all data
- **XSS Protection**: Email content sanitized
- **Audit Logging**: All actions tracked for compliance

## Architecture

### Database Schema

```prisma
model Enquiry {
  id             String        @id @default(uuid())
  name           String        @db.VarChar(200)
  email          String        @db.VarChar(255)
  phone          String        @db.VarChar(20)
  city           String        @db.VarChar(100)
  packageTitle   String        @db.VarChar(200)
  packagePrice   Decimal       @db.Decimal(10, 2)
  numberOfPeople Int           @default(1)
  travelDate     DateTime?     @db.Date
  selectedRoute  String?       @db.VarChar(200)
  budgetMin      Decimal       @db.Decimal(10, 2)
  budgetMax      Decimal       @db.Decimal(10, 2)
  remarks        String?       @db.Text
  status         EnquiryStatus @default(NEW)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([status])
  @@index([createdAt])
  @@index([email])
  @@map("enquiries")
}

enum EnquiryStatus {
  NEW
  CONTACTED
  CONVERTED
  CLOSED
}
```

### API Endpoints

#### Public Endpoints
```
POST /api/enquiries
- Submit a new enquiry
- Rate limited: 5 requests per 5 minutes per IP
- Body: { name, email, phone, city, packageTitle, packagePrice, numberOfPeople, travelDate, selectedRoute, budgetMin, budgetMax, remarks }
- Response: { success: true, message: "...", data: { id } }
```

#### Admin Endpoints (Requires Authentication)
```
GET /api/enquiries
- List all enquiries with pagination
- Query params: ?page=1&limit=20&status=NEW
- Response: { success: true, data: { enquiries: [...], pagination: {...} } }

GET /api/enquiries/stats
- Get enquiry statistics
- Response: { success: true, data: { total, byStatus: {...} } }

PATCH /api/enquiries/:id/status
- Update enquiry status
- Body: { status: "CONTACTED" | "CONVERTED" | "CLOSED" }
- Response: { success: true, message: "...", data: {...} }

GET /api/admin/dashboard
- Dashboard stats including totalEnquiries
- Response: { success: true, data: { stats: { totalEnquiries, ... } } }
```

### Frontend Components

#### EnquiryForm.tsx
- Location: `src/components/EnquiryForm.tsx`
- Props: `{ packageTitle, packagePrice, packageData, onClose }`
- Features:
  - Form validation with error messages
  - Budget range slider
  - Route selection (for multi-route packages)
  - Date picker for travel date
  - Loading state during submission
  - Success/error toasts

#### AdminPage.tsx - Enquiries Tab
- Location: `src/pages/AdminPage.tsx`
- Features:
  - Enquiry list table
  - Status filter dropdown
  - Inline status updates
  - Color-coded status badges
  - Clickable contact information
  - Responsive design

### Email Templates

#### User Confirmation Email
- **Subject**: "Enquiry Received — [Package Title] ✅"
- **Content**:
  - Thank you message
  - Package details
  - Response time expectation (24 hours)
  - Contact information

#### Admin Notification Email
- **Subject**: "🔔 New Enquiry: [Package Title] — [User Name]"
- **Content**:
  - Complete enquiry details
  - User contact information
  - Package and travel details
  - Budget range
  - Special remarks

## Installation

### 1. Database Migration

```bash
cd server
npm run db:migrate
```

This creates the `enquiries` table and `EnquiryStatus` enum.

### 2. Environment Configuration

Add to `server/.env`:
```env
# Admin email for enquiry notifications
ADMIN_EMAIL=admin@yourcompany.com

# SMTP configuration (if not already set)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourcompany.com
```

### 3. Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ..
npm install
```

### 4. Build & Start

```bash
# Backend
cd server
npm run build
npm run dev

# Frontend (in another terminal)
npm run dev
```

## Usage

### For Customers

1. Browse packages at `/packages`
2. Click on a package to view details
3. Click "Send Enquiry" button
4. Fill out the enquiry form:
   - Personal details (name, email, phone, city)
   - Number of travelers
   - Preferred travel date
   - Budget range (use slider)
   - Optional remarks
5. Submit and receive confirmation email

### For Admins

1. Login at `/login` with admin credentials
2. Navigate to Admin Dashboard
3. Click "Enquiries" tab
4. View all enquiries in table format
5. Filter by status using dropdown
6. Update enquiry status by clicking status badge
7. Contact customers using email/phone links

## Status Workflow

```
NEW (Blue)
  ↓ Admin contacts customer
CONTACTED (Amber)
  ↓ Customer confirms booking
CONVERTED (Green)
  ↓ Booking completed or cancelled
CLOSED (Gray)
```

### Status Definitions

- **NEW**: Fresh enquiry, not yet contacted
- **CONTACTED**: Admin has reached out to customer
- **CONVERTED**: Customer has booked the package
- **CLOSED**: Enquiry resolved (booked or declined)

## Configuration

### Rate Limiting

Adjust in `server/src/routes/enquiry.routes.ts`:

```typescript
const enquiryLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many enquiries submitted. Please try again later.',
    },
  },
});
```

### Pagination

Adjust in `server/src/controllers/enquiry.controller.ts`:

```typescript
const page = parseInt(req.query.page as string) || 1;
const limit = parseInt(req.query.limit as string) || 20; // Change default
```

### Email Templates

Customize in `server/src/services/email.service.ts`:
- `sendEnquiryConfirmationEmail()`
- `sendEnquiryNotificationEmail()`

## Monitoring

### Key Metrics to Track

1. **Enquiry Volume**
   - Total enquiries per day/week/month
   - Enquiries by package
   - Enquiries by city

2. **Conversion Rate**
   - NEW → CONTACTED rate
   - CONTACTED → CONVERTED rate
   - Overall conversion rate

3. **Response Time**
   - Time from NEW to CONTACTED
   - Average response time

4. **Email Delivery**
   - Confirmation email success rate
   - Admin notification success rate

### Database Queries

See `MIGRATION_REFERENCE.sql` for useful monitoring queries:
- Count by status
- Recent enquiries
- Top packages by enquiry count
- Conversion rate by package
- Monthly trends
- Response time analysis

## Troubleshooting

### Enquiries Not Appearing

**Symptoms**: Form submits but enquiries don't show in admin panel

**Solutions**:
1. Check browser console for errors
2. Verify API response in Network tab
3. Check database: `SELECT * FROM enquiries;`
4. Verify admin user has STAFF or SUPERADMIN role
5. Check server logs for errors

### Emails Not Sending

**Symptoms**: Enquiry submitted but no emails received

**Solutions**:
1. Verify SMTP configuration in `.env`
2. Check SMTP credentials are correct
3. Look in spam/junk folder
4. Check server logs: `grep -i "email" server.log`
5. Test SMTP connection manually
6. Verify `ADMIN_EMAIL` is set

### Rate Limit Too Strict

**Symptoms**: Users getting rate limit errors too quickly

**Solutions**:
1. Increase `max` in `enquiryLimiter`
2. Increase `windowMs` duration
3. Consider IP whitelisting for testing
4. Check if multiple users share same IP (office/school)

### Status Update Fails

**Symptoms**: Status dropdown doesn't update

**Solutions**:
1. Check browser console for errors
2. Verify user is authenticated
3. Confirm user has STAFF or SUPERADMIN role
4. Check API response in Network tab
5. Verify enquiry ID is valid

## Security Considerations

### Data Protection

1. **PII Handling**
   - Email and phone are indexed for quick lookup
   - Consider encryption at rest for sensitive data
   - Implement data retention policy

2. **Access Control**
   - Only STAFF and SUPERADMIN can view enquiries
   - Audit logs track all access
   - Session management with refresh tokens

3. **Input Validation**
   - Zod schemas validate all inputs
   - Phone number format enforced (10 digits)
   - Email format validated
   - XSS protection on text fields

4. **Rate Limiting**
   - Prevents spam submissions
   - IP-based tracking
   - Configurable limits

### Compliance

1. **GDPR Considerations**
   - Users consent to data collection via form submission
   - Data retention policy needed
   - Right to deletion (implement if required)
   - Data export capability

2. **Audit Trail**
   - All enquiry creations logged
   - All status updates logged
   - User actions tracked
   - IP addresses recorded

## Performance

### Optimization Tips

1. **Database Indexes**
   - Status index for filtering
   - CreatedAt index for sorting
   - Email index for lookups

2. **Caching**
   - Cache enquiry stats (60s TTL)
   - Cache dashboard data
   - Use Redis for session storage

3. **Pagination**
   - Default 20 items per page
   - Lazy loading for large datasets
   - Cursor-based pagination for scale

4. **Email Delivery**
   - Async email sending (non-blocking)
   - Queue for bulk emails
   - Retry logic for failures

### Load Testing

Expected performance:
- Enquiry submission: < 500ms
- Admin list load: < 1s (100 enquiries)
- Status update: < 300ms
- Email delivery: 1-5s (async)

## Future Enhancements

### Planned Features

1. **Enquiry Assignment**
   - Assign enquiries to specific staff members
   - Workload distribution
   - Performance tracking per staff

2. **Email Templates**
   - Custom templates for different statuses
   - Template variables
   - Rich text editor

3. **Bulk Operations**
   - Bulk status updates
   - Bulk email sending
   - Bulk export

4. **Analytics Dashboard**
   - Conversion funnel
   - Package popularity
   - Geographic distribution
   - Time-based trends

5. **Integration**
   - CRM integration
   - WhatsApp notifications
   - SMS alerts
   - Calendar integration

6. **Advanced Features**
   - Enquiry notes/comments
   - File attachments
   - Follow-up reminders
   - Automated responses

## Support

### Documentation
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `TESTING_GUIDE.md` - Comprehensive testing guide
- `MIGRATION_REFERENCE.sql` - Database queries and maintenance

### Logs
- Server logs: `server/logs/`
- Audit logs: Database `audit_logs` table
- Email logs: Check SMTP provider dashboard

### Contact
For issues or questions:
1. Check troubleshooting section above
2. Review server logs
3. Check database for data integrity
4. Contact development team

## License

This feature is part of the DeshYatra platform.

---

**Version**: 1.0.0  
**Last Updated**: May 11, 2026  
**Author**: Development Team
