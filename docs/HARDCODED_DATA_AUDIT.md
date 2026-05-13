# Hardcoded Data Audit Report

## Executive Summary

This document provides a comprehensive audit of all hardcoded data in the codebase, categorizing them by priority for migration to API/database calls.

## ✅ Completed Removals

### 1. Travel Packages (HIGH PRIORITY) - ✅ COMPLETED
- **Location**: `src/lib/packages.ts`
- **Status**: ✅ Removed
- **Details**: 12 hardcoded travel packages (~254 lines) removed
- **Now Uses**: API calls to `/packages` endpoint with database storage

## 🔴 High Priority - Should Be Moved to Database

### 1. Email Templates (Server-Side)
- **Location**: `server/src/services/email.service.ts`, `server/src/services/account.service.ts`
- **Impact**: HIGH
- **Current State**: Hardcoded HTML email templates
- **Templates Found**:
  - Welcome email
  - Booking confirmation
  - Password reset
  - Enquiry confirmation (customer)
  - Enquiry notification (admin)
  - Consent form confirmation (customer)
  - Consent form notification (admin)
  - Email verification

**Recommendation**: Create an `email_templates` table in the database with fields:
```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY,
  template_key VARCHAR(50) UNIQUE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  variables JSONB, -- List of available variables
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Benefits**:
- Admins can edit email content without code changes
- A/B testing different email versions
- Multi-language support
- Version history
- Preview before sending

**Migration Path**:
1. Create database table
2. Seed with current templates
3. Create admin UI for template management
4. Update email service to fetch from database
5. Add template variable substitution logic

## 🟡 Medium Priority - Consider Moving to Database

### 1. Business Logic Constants
- **Location**: `src/components/EnquiryForm.tsx`
- **Current Values**:
  ```typescript
  const maxBudget = packagePrice * 3;      // 3x multiplier
  const defaultMax = packagePrice * 1.5;   // 1.5x multiplier
  ```
- **Impact**: MEDIUM
- **Recommendation**: Move to a `business_config` table or environment variables

**Suggested Config Table**:
```sql
CREATE TABLE business_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Example entries:
INSERT INTO business_config VALUES 
  ('budget_multipliers', '{"max": 3, "default": 1.5}', 'Budget calculation multipliers'),
  ('enquiry_settings', '{"min_people": 1, "max_people": 50}', 'Enquiry form constraints');
```

### 2. Form Validation Rules
- **Location**: Various form components
- **Examples**:
  - Phone number validation: `/^\d{10}$/`
  - Email validation: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  - Minimum age requirements
  - Maximum group sizes

**Recommendation**: Create a validation rules configuration system

## 🟢 Low Priority - Acceptable to Keep Hardcoded

### 1. UI Configuration Constants ✅ KEEP
- **Location**: `src/lib/constants.ts`
- **Content**: Interest options, category icons
- **Reason**: Pure UI configuration, rarely changes

### 2. Form Options ✅ KEEP
- **Locations**: 
  - `src/pages/ConsentFormPage.tsx`: Travel modes, meal preferences, room types
  - `src/components/PackageEditor.tsx`: Difficulty options
- **Reason**: Standard options that rarely change, not business-critical data

### 3. Navigation Links ✅ KEEP
- **Location**: `src/components/Navbar.tsx`
- **Content**: Navigation menu structure
- **Reason**: Application structure, not business data

### 4. Package Categories ✅ KEEP
- **Location**: `src/lib/packages.ts`
- **Content**: `packageCategories` array
- **Reason**: Core taxonomy, rarely changes, used for filtering

### 5. Sort Options ✅ KEEP
- **Location**: `src/pages/SavedTripsPage.tsx`
- **Content**: Sort order options
- **Reason**: UI configuration

### 6. Enum Definitions ✅ KEEP
- **Location**: `server/src/validators/package.schema.ts`
- **Content**: Package categories, status, difficulty enums
- **Reason**: Type safety and validation, should match database enums

## 📊 Summary Statistics

| Category | Count | Priority | Status |
|----------|-------|----------|--------|
| Travel Packages | 12 items | HIGH | ✅ Removed |
| Email Templates | 8 templates | HIGH | 🔴 To Do |
| Business Logic | 2 configs | MEDIUM | 🟡 Consider |
| Form Options | 15+ options | LOW | ✅ Keep |
| UI Configuration | 10+ items | LOW | ✅ Keep |

## 🎯 Recommended Action Plan

### Phase 1: Immediate (Already Completed) ✅
- [x] Remove hardcoded travel packages
- [x] Implement API-based package management
- [x] Add localStorage caching

### Phase 2: High Priority (Recommended Next)
1. **Create Email Template System**
   - Design database schema
   - Migrate existing templates
   - Build admin UI for template management
   - Implement template rendering engine
   - Add variable substitution
   - Test all email flows

   **Estimated Effort**: 2-3 days
   **Business Value**: HIGH - Enables marketing team to manage emails

### Phase 3: Medium Priority (Future Enhancement)
1. **Business Configuration System**
   - Create config table
   - Move pricing multipliers
   - Add admin UI for config management
   - Implement config caching

   **Estimated Effort**: 1-2 days
   **Business Value**: MEDIUM - Enables quick business rule changes

### Phase 4: Low Priority (Optional)
1. **Dynamic Form Options**
   - Only if business requires frequent changes
   - Consider for international expansion (different options per region)

   **Estimated Effort**: 1 day
   **Business Value**: LOW - Only needed for specific use cases

## 🔍 Code Quality Improvements

### Current State: ✅ Good
- No hardcoded packages in frontend
- All package data from API/database
- Proper fallback mechanisms
- Type-safe interfaces

### Remaining Concerns:
1. **Email templates** - Hardcoded in service files
2. **Business rules** - Scattered across components
3. **No centralized configuration** - Settings in multiple places

## 🛠️ Implementation Guide for Email Templates

### Step 1: Database Schema
```typescript
// prisma/schema.prisma
model EmailTemplate {
  id          String   @id @default(uuid())
  key         String   @unique // e.g., "welcome_email", "booking_confirmation"
  subject     String
  htmlBody    String   @db.Text
  textBody    String?  @db.Text
  variables   Json?    // ["name", "packageTitle", "bookingDate"]
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("email_templates")
}
```

### Step 2: Seed Templates
```typescript
// prisma/seed.ts
const emailTemplates = [
  {
    key: 'welcome_email',
    subject: 'Welcome to DeshYatra! 🌍',
    htmlBody: `<div>...</div>`,
    variables: ['name', 'email'],
  },
  // ... other templates
];
```

### Step 3: Template Service
```typescript
// services/email-template.service.ts
export async function renderEmailTemplate(
  templateKey: string,
  variables: Record<string, any>
): Promise<{ subject: string; html: string }> {
  const template = await prisma.emailTemplate.findUnique({
    where: { key: templateKey, isActive: true }
  });
  
  if (!template) {
    throw new Error(`Template ${templateKey} not found`);
  }
  
  // Replace variables in subject and body
  let subject = template.subject;
  let html = template.htmlBody;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, String(value));
    html = html.replace(regex, String(value));
  });
  
  return { subject, html };
}
```

### Step 4: Update Email Service
```typescript
// services/email.service.ts
export async function sendWelcomeEmail(email: string, name: string) {
  const { subject, html } = await renderEmailTemplate('welcome_email', {
    name,
    email,
  });
  
  await sendEmail({ to: email, subject, html });
}
```

### Step 5: Admin UI
Create admin interface at `/admin/email-templates` with:
- List all templates
- Edit template (WYSIWYG editor)
- Preview with sample data
- Test send
- Version history
- Variable documentation

## 📈 Expected Benefits

### After Email Template Migration:
1. **Faster iterations** - Marketing can update emails without developer
2. **A/B testing** - Test different email versions
3. **Personalization** - Easier to add dynamic content
4. **Multi-language** - Support for multiple languages
5. **Consistency** - Centralized email management
6. **Analytics** - Track which templates perform better

### After Business Config Migration:
1. **Quick adjustments** - Change pricing rules without deployment
2. **Regional differences** - Different configs per region
3. **Experimentation** - Test different business rules
4. **Audit trail** - Track who changed what and when

## 🔒 Security Considerations

### Email Templates:
- **XSS Protection**: Sanitize user input before rendering
- **Access Control**: Only admins can edit templates
- **Validation**: Ensure required variables are present
- **Preview Mode**: Test before activating
- **Rollback**: Keep version history

### Business Config:
- **Validation**: Validate config values before saving
- **Type Safety**: Enforce data types
- **Audit Log**: Track all changes
- **Rollback**: Ability to revert to previous values

## 📝 Conclusion

The removal of hardcoded travel packages is complete and successful. The next recommended step is to implement a database-driven email template system, which will provide significant business value by enabling non-technical team members to manage email communications.

The remaining hardcoded data (form options, UI configuration) is acceptable to keep as-is unless specific business requirements emerge.
