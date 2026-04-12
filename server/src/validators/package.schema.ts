import { z } from 'zod';

const packageCategoryEnum = z.enum(['PILGRIMAGE', 'TREK', 'HERITAGE', 'NATURE', 'ADVENTURE']);
const packageStatusEnum = z.enum(['AVAILABLE', 'COMING_SOON', 'ARCHIVED']);
const difficultyEnum = z.enum(['EASY', 'MODERATE', 'DIFFICULT', 'EXTREME']);

export const createPackageSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  subtitle: z.string().min(1).max(500).trim(),
  category: packageCategoryEnum,
  duration: z.string().min(1).max(50).trim(),
  price: z.number().positive('Price must be positive'),
  locations: z.array(z.string().max(100)).min(1, 'At least one location'),
  highlights: z.array(z.string().max(500)).min(1, 'At least one highlight'),
  bestTime: z.string().min(1).max(100).trim(),
  difficulty: difficultyEnum.optional(),
  included: z.array(z.string().max(200)).default([]),
  status: packageStatusEnum.default('COMING_SOON'),
});

export const updatePackageSchema = createPackageSchema.partial();

export const packageQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  category: packageCategoryEnum.optional(),
  status: packageStatusEnum.optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(['price', 'rating', 'reviewCount', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
export type PackageQuery = z.infer<typeof packageQuerySchema>;
