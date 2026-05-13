# Consent Form Integration Guide

## Overview
The existing ConsentFormPage.tsx has been integrated with the backend API and Cloudinary for file uploads.

## Changes Made

### Backend
1. ✅ Created `ConsentForm` model in Prisma schema
2. ✅ Created consent form validators (`consent.schema.ts`)
3. ✅ Created consent form controller with CRUD operations
4. ✅ Created consent form routes with rate limiting
5. ✅ Added email notifications (user confirmation + admin notification)
6. ✅ Registered routes in `app.ts`
7. ✅ Added consent form stats to admin dashboard

### Frontend Integration Needed
The existing form needs these updates:

1. **Add Cloudinary Upload Helper** - Create utility to upload files
2. **Update Form Submission** - Connect to `/api/consent-forms` endpoint
3. **Map Form Fields** - Align with backend schema
4. **Add Admin View** - Create consent forms management tab in AdminPage

## Field Mapping

### Existing Form → Backend Schema

| Frontend Field | Backend Field | Notes |
|---|---|---|
| travellers[0].name | fullName | Use first traveler as main |
| travellers[0].email | email | |
| travellers[0].phone | phone | |
| (calculated from travellers[0].age) | dateOfBirth | Calculate from age |
| travellers[0].gender | gender | |
| (needs to be added) | nationality | Add field |
| leadAddress | address | |
| (extract from leadAddress) | city | Parse from address |
| (extract from leadAddress) | state | Parse from address |
| (needs to be added) | pincode | Add field |
| emergencyName | emergencyName | |
| emergencyPhone | emergencyPhone | |
| emergencyRelation | emergencyRelation | |
| tourPackage | packageName | |
| travelDate | travelDate | |
| travellers.length | numberOfTravelers | |
| medicalConditions | medicalConditions | |
| (needs to be added) | allergies | Add field |
| (needs to be added) | medications | Add field |
| (needs to be added) | bloodGroup | Add field |
| travellers[0].passportPhoto | photoUrl, photoPublicId | Upload to Cloudinary |
| travellers[0].idProof | idProofUrl, idProofPublicId | Upload to Cloudinary |
| travellers[0].idType | idProofType | |
| consentChecked | termsAccepted | |
| accuracyChecked | privacyAccepted | |
| agreeRisk + others | medicalConsent | Combine all consents |
| agreePermission | photoConsent | |
| specialNeeds | specialRequests | |
| mealPref | dietaryPreference | |

## Implementation Steps

### Step 1: Install Cloudinary SDK (if not already)
```bash
npm install cloudinary
```

### Step 2: Add Cloudinary Upload Utility
Create `src/lib/cloudinary.ts`:
```typescript
import { api } from './api';

export async function uploadToCloudinary(file: File, folder: string = 'consent-forms'): Promise<{ url: string; publicId: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const { data } = await api.post('/uploads/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return {
    url: data.data.url,
    publicId: data.data.publicId,
  };
}
```

### Step 3: Update ConsentFormPage.tsx

Add these imports:
```typescript
import { api, getErrorMessage } from '@/lib/api';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { format } from 'date-fns';
```

Update the `handleSubmit` function:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!allConsentsChecked) {
    toast.error("Please complete all fields in the declaration section.");
    return;
  }

  setIsSubmitting(true);

  try {
    // Upload photo and ID proof to Cloudinary
    const mainTraveler = travellers[0];
    
    let photoUrl = null, photoPublicId = null;
    if (mainTraveler.passportPhoto) {
      const photoUpload = await uploadToCloudinary(mainTraveler.passportPhoto, 'consent-forms/photos');
      photoUrl = photoUpload.url;
      photoPublicId = photoUpload.publicId;
    }

    let idProofUrl = null, idProofPublicId = null;
    if (mainTraveler.idProof) {
      const idUpload = await uploadToCloudinary(mainTraveler.idProof, 'consent-forms/id-proofs');
      idProofUrl = idUpload.url;
      idProofPublicId = idUpload.publicId;
    }

    // Calculate date of birth from age
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - parseInt(mainTraveler.age);
    const dateOfBirth = `${birthYear}-01-01`; // Approximate

    // Submit to backend
    await api.post('/consent-forms', {
      fullName: mainTraveler.name,
      email: mainTraveler.email,
      phone: mainTraveler.phone,
      dateOfBirth,
      gender: mainTraveler.gender,
      nationality: 'Indian', // Default or add field
      address: leadAddress,
      city: 'Mumbai', // Parse from address or add field
      state: 'Maharashtra', // Parse from address or add field
      pincode: '400001', // Add field
      emergencyName,
      emergencyPhone,
      emergencyRelation,
      packageName: tourPackage,
      travelDate,
      numberOfTravelers: travellers.length,
      medicalConditions: medicalConditions || null,
      allergies: null, // Add field if needed
      medications: null, // Add field if needed
      bloodGroup: null, // Add field if needed
      photoUrl,
      photoPublicId,
      idProofUrl,
      idProofPublicId,
      idProofType: mainTraveler.idType,
      termsAccepted: consentChecked,
      privacyAccepted: accuracyChecked,
      medicalConsent: agreeRisk && agreeEmergency,
      photoConsent: agreePermission,
      specialRequests: specialNeeds || null,
      dietaryPreference: mealPref || null,
    });

    setSubmitted(true);
    toast.success('Consent form submitted successfully!');
  } catch (error) {
    toast.error('Failed to submit form', {
      description: getErrorMessage(error),
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

### Step 4: Add Admin View

Update `AdminPage.tsx` to add a "Consent Forms" tab similar to the Enquiries tab.

## API Endpoints

### Public
- `POST /api/consent-forms` - Submit consent form (rate-limited: 3 per 10 min)

### Admin
- `GET /api/consent-forms` - List all consent forms
- `GET /api/consent-forms/:id` - Get consent form details
- `PATCH /api/consent-forms/:id/status` - Update status (PENDING/APPROVED/REJECTED)
- `GET /api/consent-forms/stats` - Get statistics

## Database Migration

Run from `server/` directory:
```bash
npm run db:generate
npm run db:migrate
```

This creates the `consent_forms` table.

## Testing

1. Navigate to `/consent-form`
2. Fill out the form
3. Upload photo and ID proof
4. Submit
5. Check email for confirmation
6. Login as admin
7. View consent forms in admin dashboard
8. Update status to APPROVED/REJECTED

## Status Workflow

```
PENDING (Blue) → APPROVED (Green) / REJECTED (Red)
```

- **PENDING**: Newly submitted, awaiting review
- **APPROVED**: Verified and approved by admin
- **REJECTED**: Rejected due to incomplete/incorrect information

## Email Notifications

### User Confirmation
- Subject: "Consent Form Received — [Package Name] ✅"
- Contains: Package details, next steps, important notes

### Admin Notification
- Subject: "📋 New Consent Form: [Package Name] — [Full Name]"
- Contains: All traveler details, link to admin dashboard

## Security

- Rate limiting: 3 submissions per 10 minutes per IP
- File upload validation: Max 5MB for ID proof, 10MB for photo
- Cloudinary secure URLs
- Admin-only access to view/manage forms
- Audit logging for all actions

## Future Enhancements

1. **Multi-traveler support**: Currently uses first traveler as main, could expand to store all travelers
2. **Document verification**: OCR to verify ID proof details
3. **E-signature**: Digital signature capture
4. **PDF generation**: Generate PDF of submitted form
5. **WhatsApp notifications**: Send updates via WhatsApp
6. **Payment integration**: Link to booking payment

## Troubleshooting

### Files not uploading
- Check Cloudinary credentials in `.env`
- Verify file size limits
- Check network tab for upload errors

### Form not submitting
- Check browser console for errors
- Verify all required fields are filled
- Check rate limiting (wait 10 minutes if exceeded)

### Admin not receiving emails
- Verify `ADMIN_EMAIL` in `.env`
- Check SMTP configuration
- Look in spam folder

## Support

For issues, check:
1. Browser console for errors
2. Server logs for API errors
3. Database for submitted records
4. Cloudinary dashboard for uploaded files
