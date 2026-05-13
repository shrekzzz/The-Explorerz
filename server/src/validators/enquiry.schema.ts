import { z } from 'zod';

// ─── Enquiry Validation Schema ──────────

export const createEnquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be a valid 10-digit number'),
  city: z.string().min(2, 'City must be at least 2 characters').max(100),
  packageTitle: z.string().min(1, 'Package title is required').max(200),
  packagePrice: z.number().positive('Package price must be positive'),
  numberOfPeople: z.number().int().min(1, 'At least 1 person required').max(50),
  travelDate: z.string().optional().nullable(),
  selectedRoute: z.string().max(200).optional().nullable(),
  budgetMin: z.number().positive('Minimum budget must be positive'),
  budgetMax: z.number().positive('Maximum budget must be positive'),
  remarks: z.string().max(2000).optional().nullable(),
});

export const updateEnquiryStatusSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED']),
});

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;
export type UpdateEnquiryStatusInput = z.infer<typeof updateEnquiryStatusSchema>;
