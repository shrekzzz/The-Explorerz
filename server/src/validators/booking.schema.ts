import { z } from 'zod';

export const createBookingSchema = z.object({
  packageId: z.string().uuid(),
  travelers: z.number().int().positive().max(20),
  travelDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  contactInfo: z.object({
    name: z.string().min(1).max(200).trim(),
    email: z.string().email(),
    phone: z.string().min(10).max(20),
    specialRequests: z.string().max(1000).optional(),
  }),
});

export const updateBookingSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED']),
});

export const bookingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'REFUNDED']).optional(),
  sortBy: z.enum(['createdAt', 'travelDate', 'totalAmount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type BookingQuery = z.infer<typeof bookingQuerySchema>;
