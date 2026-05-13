# Testing Guide: Admin-Only Auth & Enquiry Management

## Prerequisites

1. **Database Setup**
   ```bash
   cd server
   npm run db:migrate
   ```
   This creates the `enquiries` table.

2. **Environment Variables**
   Add to `server/.env`:
   ```env
   ADMIN_EMAIL=your-admin@example.com
   ```

3. **Start Services**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev

   # Terminal 2 - Frontend
   npm run dev
   ```

## Test Scenarios

### 1. Enquiry Submission (Public)

**Test Case 1.1: Valid Enquiry Submission**
1. Navigate to http://localhost:5173/packages
2. Click on any package
3. Click "Send Enquiry" button
4. Fill out the form:
   - Name: John Doe
   - Phone: 9876543210
   - Email: john@example.com
   - City: Mumbai
   - Number of People: 2
   - Travel Date: Select a future date
   - Budget Range: Adjust slider
   - Remarks: "Looking forward to this trip!"
5. Click "Send Enquiry"
6. **Expected**: 
   - Success toast appears
   - Form closes
   - User receives confirmation email
   - Admin receives notification email

**Test Case 1.2: Form Validation**
1. Open enquiry form
2. Try submitting with:
   - Empty name → Error: "Name is required"
   - Invalid phone (123) → Error: "Enter valid 10-digit phone number"
   - Invalid email (test@) → Error: "Enter valid email address"
   - Empty city → Error: "City is required"
   - No travel date → Error: "Travel date is required"
3. **Expected**: Form shows validation errors

**Test Case 1.3: Rate Limiting**
1. Submit 5 enquiries rapidly
2. Try submitting a 6th enquiry
3. **Expected**: Error toast "Too many enquiries submitted. Please try again later."

### 2. Admin Enquiry Management

**Test Case 2.1: View Enquiries**
1. Login as admin at http://localhost:5173/login
2. Navigate to Admin Dashboard
3. Click "Enquiries" tab
4. **Expected**:
   - Table shows all enquiries
   - Columns: Name, Contact, Package, People, Travel Date, Budget, Status, Created
   - Contact info has clickable email/phone links

**Test Case 2.2: Filter Enquiries**
1. In Enquiries tab, use status filter dropdown
2. Select "NEW"
3. **Expected**: Only NEW enquiries shown
4. Select "All Enquiries"
5. **Expected**: All enquiries shown

**Test Case 2.3: Update Enquiry Status**
1. Find an enquiry with status "NEW"
2. Click the status dropdown
3. Select "CONTACTED"
4. **Expected**:
   - Success toast appears
   - Badge color changes to amber
   - Status updates in database

**Test Case 2.4: Dashboard Stats**
1. Navigate to "Overview" tab
2. **Expected**: 
   - "Enquiries" stat card shows total count
   - Count matches number in enquiries table

### 3. Registration Removal

**Test Case 3.1: No Register Route**
1. Navigate to http://localhost:5173/register
2. **Expected**: 404 page or redirect to home

**Test Case 3.2: No Register Links**
1. Check Login page
2. **Expected**: No "Sign up" or "Create account" link
3. Check Navbar
4. **Expected**: No "Register" button

**Test Case 3.3: Backend Registration Disabled**
1. Try POST request to `/api/auth/register`:
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Test@1234",
       "firstName": "Test",
       "lastName": "User"
     }'
   ```
2. **Expected**: 404 Not Found

### 4. Email Notifications

**Test Case 4.1: User Confirmation Email**
1. Submit an enquiry
2. Check user's email inbox
3. **Expected**:
   - Subject: "Enquiry Received — [Package Title] ✅"
   - Body contains:
     - Thank you message
     - Package title
     - "We'll get back to you within 24 hours"
     - Contact phone number

**Test Case 4.2: Admin Notification Email**
1. Submit an enquiry
2. Check admin email (ADMIN_EMAIL from .env)
3. **Expected**:
   - Subject: "🔔 New Enquiry: [Package Title] — [User Name]"
   - Body contains:
     - User details (name, email, phone, city)
     - Package details
     - Number of travelers
     - Travel date
     - Budget range
     - Remarks

### 5. Security Tests

**Test Case 5.1: Unauthorized Access**
1. Logout from admin
2. Try accessing http://localhost:5173/admin
3. **Expected**: Redirect to login page

**Test Case 5.2: API Authorization**
1. Try GET request without auth:
   ```bash
   curl http://localhost:3000/api/enquiries
   ```
2. **Expected**: 401 Unauthorized

**Test Case 5.3: Role-Based Access**
1. Login as regular USER (if exists)
2. Try accessing `/admin`
3. **Expected**: Access denied or redirect

### 6. Edge Cases

**Test Case 6.1: Long Package Title**
1. Submit enquiry for package with very long title
2. View in admin dashboard
3. **Expected**: Title truncates with ellipsis

**Test Case 6.2: No Travel Date**
1. Submit enquiry without selecting travel date
2. View in admin dashboard
3. **Expected**: Shows "Not specified"

**Test Case 6.3: Large Budget Range**
1. Set budget slider to maximum values
2. Submit enquiry
3. **Expected**: Budget displays correctly with proper formatting (₹1.5L, etc.)

**Test Case 6.4: Special Characters in Remarks**
1. Enter remarks with special characters: `<script>alert('xss')</script>`
2. Submit enquiry
3. View in admin dashboard
4. **Expected**: Special characters are escaped/sanitized

## API Endpoints Reference

### Public Endpoints
- `POST /api/enquiries` - Submit enquiry (rate-limited: 5/5min)

### Admin Endpoints (Requires Auth)
- `GET /api/enquiries` - List all enquiries (paginated)
- `GET /api/enquiries?status=NEW` - Filter by status
- `GET /api/enquiries/stats` - Get enquiry statistics
- `PATCH /api/enquiries/:id/status` - Update enquiry status
- `GET /api/admin/dashboard` - Dashboard stats (includes totalEnquiries)

### Removed Endpoints
- `POST /api/auth/register` - ❌ Returns 404

## Database Queries for Verification

```sql
-- Check enquiries table
SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 10;

-- Count by status
SELECT status, COUNT(*) FROM enquiries GROUP BY status;

-- Recent enquiries
SELECT name, email, package_title, status, created_at 
FROM enquiries 
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Check audit logs for enquiry events
SELECT * FROM audit_logs 
WHERE action IN ('ENQUIRY_CREATED', 'ENQUIRY_STATUS_UPDATED')
ORDER BY created_at DESC;
```

## Troubleshooting

### Issue: Emails not sending
**Solution**: 
1. Check SMTP configuration in `server/.env`
2. Verify SMTP credentials are correct
3. Check spam folder
4. Review server logs for email errors

### Issue: Enquiries not appearing in admin
**Solution**:
1. Check browser console for errors
2. Verify admin user has STAFF or SUPERADMIN role
3. Check network tab for API response
4. Verify database has enquiries

### Issue: Rate limit too strict
**Solution**: Adjust in `server/src/routes/enquiry.routes.ts`:
```typescript
const enquiryLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // Change this
  max: 5, // Change this
  // ...
});
```

### Issue: Status update not working
**Solution**:
1. Check browser console for errors
2. Verify user is authenticated
3. Check user has STAFF or SUPERADMIN role
4. Review server logs

## Performance Benchmarks

- Enquiry submission: < 500ms
- Admin enquiry list load: < 1s (for 100 enquiries)
- Status update: < 300ms
- Email delivery: 1-5s (async, doesn't block response)

## Success Criteria Checklist

- [ ] Users can submit enquiries from package pages
- [ ] Form validation works correctly
- [ ] Rate limiting prevents spam
- [ ] Users receive confirmation emails
- [ ] Admins receive notification emails
- [ ] Admin can view all enquiries
- [ ] Admin can filter by status
- [ ] Admin can update enquiry status
- [ ] Status badges show correct colors
- [ ] Dashboard shows enquiry count
- [ ] Public registration is completely removed
- [ ] No broken links or 404 errors
- [ ] All API endpoints return correct responses
- [ ] Unauthorized access is blocked
- [ ] Audit logs capture enquiry events

## Automated Testing (Future)

Consider adding:
1. **Unit Tests**: Enquiry controller functions
2. **Integration Tests**: API endpoints with auth
3. **E2E Tests**: Full enquiry submission flow
4. **Load Tests**: Rate limiting behavior

Example test structure:
```typescript
describe('Enquiry API', () => {
  it('should create enquiry with valid data', async () => {
    const response = await request(app)
      .post('/api/enquiries')
      .send(validEnquiryData);
    expect(response.status).toBe(201);
  });

  it('should reject enquiry without auth', async () => {
    const response = await request(app)
      .get('/api/enquiries');
    expect(response.status).toBe(401);
  });
});
```

## Monitoring Recommendations

1. **Track Metrics**:
   - Enquiry submission rate
   - Conversion rate (NEW → CONVERTED)
   - Average response time
   - Email delivery success rate

2. **Set Alerts**:
   - High rate of failed enquiries
   - Email delivery failures
   - Unusual spike in submissions (potential spam)

3. **Log Analysis**:
   - Review audit logs weekly
   - Monitor for suspicious patterns
   - Track admin actions

## Next Steps After Testing

1. ✅ Verify all test cases pass
2. ✅ Review email templates with stakeholders
3. ✅ Set up monitoring and alerts
4. ✅ Train admin users on enquiry management
5. ✅ Document internal processes for handling enquiries
6. ✅ Consider adding:
   - Enquiry assignment to specific staff
   - Email templates for different statuses
   - Bulk status updates
   - Export to CSV functionality
   - Analytics dashboard
