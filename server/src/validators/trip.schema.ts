import { z } from 'zod';

const activityCategoryEnum = z.enum([
  'FOOD', 'ADVENTURE', 'TEMPLES', 'CULTURE', 'NIGHTLIFE',
  'NATURE', 'SHOPPING', 'TRANSPORT', 'RELAXATION',
]);

const activitySchema = z.object({
  time: z.string().max(10),
  title: z.string().min(1).max(200).trim(),
  description: z.string().min(1).max(2000).trim(),
  locationName: z.string().min(1).max(200).trim(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  category: activityCategoryEnum,
  cost: z.number().min(0),
});

const itineraryDaySchema = z.object({
  dayNumber: z.number().int().positive(),
  title: z.string().min(1).max(200).trim(),
  activities: z.array(activitySchema).min(1),
});

const hotelSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  rating: z.number().min(0).max(5),
  pricePerNight: z.number().positive(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const createTripSchema = z.object({
  destination: z.string().min(1).max(200).trim(),
  days: z.number().int().positive().max(30),
  budget: z.number().positive(),
  interests: z.array(z.string()).min(1),
  isPublic: z.boolean().default(false),
  itinerary: z.array(itineraryDaySchema).min(1),
  budgetBreakdown: z.object({
    accommodation: z.number().min(0),
    food: z.number().min(0),
    transport: z.number().min(0),
    activities: z.number().min(0),
    total: z.number().min(0),
  }),
  hotels: z.array(hotelSchema).default([]),
});

export const updateTripSchema = z.object({
  isPublic: z.boolean().optional(),
  destination: z.string().min(1).max(200).trim().optional(),
});

export const tripQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  destination: z.string().max(200).optional(),
  sortBy: z.enum(['createdAt', 'destination', 'days', 'budget']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
export type TripQuery = z.infer<typeof tripQuerySchema>;
