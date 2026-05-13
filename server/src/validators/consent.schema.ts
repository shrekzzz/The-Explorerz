import { z } from 'zod';

// ─── Consent Form Validation Schema ─────

export const createConsentFormSchema = z.object({
  // Personal Information
  fullName: z.string().min(2, 'Full name is required').max(200),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be a valid 10-digit number'),
  dateOfBirth: z.string().refine((date) => {
    const dob = new Date(date);
    const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return age >= 0 && age <= 120;
  }, 'Invalid date of birth'),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']),
  nationality: z.string().min(2).max(100),
  address: z.string().min(10, 'Complete address is required').max(500),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),

  // Emergency Contact
  emergencyName: z.string().min(2).max(200),
  emergencyPhone: z.string().regex(/^\d{10}$/, 'Emergency phone must be 10 digits'),
  emergencyRelation: z.string().min(2).max(100),

  // Travel Details
  packageName: z.string().min(1).max(200),
  travelDate: z.string(),
  numberOfTravelers: z.number().int().min(1).max(50),

  // Medical Information
  medicalConditions: z.string().max(2000).optional().nullable(),
  medicalConditionSeverity: z.enum(['Mild', 'Moderate', 'Severe']).optional().nullable(),
  allergies: z.string().max(1000).optional().nullable(),
  medications: z.string().max(1000).optional().nullable(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']).optional().nullable(),

  // Documents
  photoUrl: z.string().url().optional().nullable(),
  photoPublicId: z.string().optional().nullable(),
  idProofUrl: z.string().url().optional().nullable(),
  idProofPublicId: z.string().optional().nullable(),
  idProofType: z.enum(['Aadhaar', 'PAN', 'Passport', 'Driving License', 'Voter ID']).optional().nullable(),
  idNumber: z.string().max(50).optional().nullable(),

  // Consent & Agreements
  termsAccepted: z.boolean().refine((val) => val === true, 'You must accept terms and conditions'),
  privacyAccepted: z.boolean().refine((val) => val === true, 'You must accept privacy policy'),
  medicalConsent: z.boolean().refine((val) => val === true, 'Medical consent is required'),
  photoConsent: z.boolean(),

  // Additional Information
  specialRequests: z.string().max(2000).optional().nullable(),
  dietaryPreference: z.enum(['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Jain', 'No Preference']).optional().nullable(),
});

export const updateConsentFormStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  adminNotes: z.string().max(2000).optional().nullable(),
});

export type CreateConsentFormInput = z.infer<typeof createConsentFormSchema>;
export type UpdateConsentFormStatusInput = z.infer<typeof updateConsentFormStatusSchema>;
