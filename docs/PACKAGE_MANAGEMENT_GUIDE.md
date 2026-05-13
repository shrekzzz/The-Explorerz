# Package Management Guide

## Overview
This application now uses a fully dynamic package management system where all packages are stored in the database and accessed via API calls.

## Architecture

### Data Sources (Priority Order)
1. **Database** (Primary) - PostgreSQL via Prisma ORM
2. **API** - REST API endpoints (`/packages`)
3. **localStorage** - Client-side cache for offline access

### Key Functions

#### `getTravelPackagesAsync()` - Async (Recommended)
```typescript
import { getTravelPackagesAsync } from '@/lib/packages';

// In async context (useEffect, event handlers)
const packages = await getTravelPackagesAsync();
```

**Behavior:**
- Fetches from API (`GET /packages`)
- Transforms API response to frontend format
- Caches to localStorage for offline access
- Falls back to localStorage if API fails
- Returns empty array if both fail

#### `getTravelPackages()` - Sync (Legacy)
```typescript
import { getTravelPackages } from '@/lib/packages';

// Synchronous access (immediate render)
const packages = getTravelPackages();
```

**Behavior:**
- Reads from localStorage only
- No API call
- Returns cached packages
- Use only when async is not possible

## Adding New Packages

### Method 1: Admin Panel (Recommended)
1. Navigate to `/admin` (requires authentication)
2. Click "Add Package" button
3. Fill in package details
4. Upload images
5. Save

### Method 2: Database Seed
1. Edit `server/prisma/seed.ts`
2. Add package to the `packages` array
3. Run: `npm run seed` in server directory

### Method 3: API Call
```typescript
import api from '@/lib/api';

await api.post('/packages', {
  title: 'Package Name',
  subtitle: 'Description',
  category: 'PILGRIMAGE', // PILGRIMAGE | TREK | HERITAGE | NATURE | ADVENTURE
  duration: '5 Days',
  price: 15000,
  locations: ['Location 1', 'Location 2'],
  highlights: ['Highlight 1', 'Highlight 2'],
  bestTime: 'Oct - Mar',
  status: 'AVAILABLE', // AVAILABLE | COMING_SOON | ARCHIVED
  included: ['Item 1', 'Item 2'],
  images: [
    { url: 'https://...', isPrimary: true, sortOrder: 0 },
    { url: 'https://...', isPrimary: false, sortOrder: 1 }
  ]
});
```

## Package Schema

### Frontend Format (`TravelPackage`)
```typescript
interface TravelPackage {
  id: string;                    // UUID
  title: string;                 // Package name
  subtitle: string;              // Short description
  category: string;              // pilgrimage | trek | heritage | nature | adventure
  duration: string;              // e.g., "5-7 Days"
  price: number;                 // Price in INR
  rating: number;                // 0-5
  reviews: number;               // Review count
  image: string;                 // Primary image URL
  locations: string[];           // List of locations
  highlights: string[];          // Key highlights
  highlightImages?: string[];    // Additional images
  distance?: number;             // Distance in km
  bestTime: string;              // Best time to visit
  difficulty?: string;           // Easy | Moderate | Difficult | Extreme
  included: string[];            // What's included
  status: string;                // available | coming-soon
  routes?: Route[];              // Optional route details
  pptUrl?: string;               // PowerPoint URL
  pptFilename?: string;          // PowerPoint filename
}
```

### Backend Format (API Response)
```typescript
{
  id: string;                    // UUID
  title: string;
  subtitle: string;
  category: string;              // UPPERCASE: PILGRIMAGE | TREK | etc.
  duration: string;
  price: Decimal;                // Prisma Decimal type
  rating: Decimal;
  reviewCount: number;
  locations: string[];           // JSON array
  highlights: string[];          // JSON array
  bestTime: string;
  status: string;                // UPPERCASE: AVAILABLE | COMING_SOON | ARCHIVED
  included: string[];            // JSON array
  distance?: number;
  difficulty?: string;           // UPPERCASE: EASY | MODERATE | DIFFICULT | EXTREME
  routes?: Route[];              // JSON array
  pptUrl?: string;
  pptFilename?: string;
  images: Array<{                // From package_images table
    url: string;
    isPrimary: boolean;
    sortOrder: number;
  }>;
}
```

## Image Management

### Primary Image
- Set `isPrimary: true` in the images array
- Only one image should be primary
- Used as the main package thumbnail

### Highlight Images
- Set `isPrimary: false`
- Used in package detail page gallery
- Sorted by `sortOrder` field

### Image Upload
```typescript
// Upload to Cloudinary via backend
const formData = new FormData();
formData.append('image', file);
formData.append('folder', 'packages');

const response = await api.post('/uploads/single', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

const imageUrl = response.data.data.url;
```

## Common Operations

### Fetch All Packages
```typescript
const packages = await getTravelPackagesAsync();
```

### Filter by Category
```typescript
const packages = await getTravelPackagesAsync();
const pilgrimagePackages = packages.filter(p => p.category === 'pilgrimage');
```

### Get Single Package
```typescript
const packages = await getTravelPackagesAsync();
const package = packages.find(p => p.id === packageId);
```

### Update Package
```typescript
import { savePackage } from '@/lib/storage';

await savePackage(updatedPackage);
```

### Delete Package
```typescript
import { deletePackage } from '@/lib/storage';

await deletePackage(packageId);
```

## Caching Strategy

### localStorage Cache
- Automatically updated when fetching from API
- Used as fallback when API is unavailable
- Cleared on logout (for user-specific data)

### Cache Invalidation
- Automatic: After create/update/delete operations
- Manual: Clear localStorage or refresh page

## Error Handling

### API Failure
```typescript
try {
  const packages = await getTravelPackagesAsync();
  if (packages.length === 0) {
    // Show empty state or error message
  }
} catch (error) {
  console.error('Failed to load packages:', error);
  // Fallback to localStorage automatically handled
}
```

### No Packages Available
```typescript
const packages = await getTravelPackagesAsync();

if (packages.length === 0) {
  return (
    <div>
      <p>No packages available. Please check back later.</p>
      <p>Admin: Add packages via the admin panel or run database seed.</p>
    </div>
  );
}
```

## Testing

### Test Empty Database
```bash
# In server directory
npm run prisma:reset
# Don't run seed
```

### Test with Sample Data
```bash
# In server directory
npm run seed
```

### Test Offline Mode
1. Load packages (populates localStorage)
2. Disconnect network
3. Refresh page
4. Verify packages still display from cache

## Migration from Hardcoded Packages

### Before (Old Code)
```typescript
// ❌ Don't do this anymore
import { travelPackages } from '@/lib/packages';
const packages = travelPackages;
```

### After (New Code)
```typescript
// ✅ Do this instead
import { getTravelPackagesAsync } from '@/lib/packages';
const packages = await getTravelPackagesAsync();
```

## Troubleshooting

### "No packages showing"
1. Check if database is seeded: `npm run seed` in server directory
2. Check API endpoint: `curl http://localhost:5000/api/packages`
3. Check browser console for errors
4. Check localStorage: `localStorage.getItem('aeroplan_packages')`

### "Stale data showing"
1. Clear localStorage: `localStorage.removeItem('aeroplan_packages')`
2. Refresh page
3. Verify API returns updated data

### "Images not loading"
1. Check image URLs in database
2. Verify Cloudinary configuration
3. Check CORS settings
4. Verify image URLs are accessible

## Best Practices

1. **Always use async function** when possible
2. **Handle empty states** gracefully
3. **Show loading indicators** during API calls
4. **Cache aggressively** for better UX
5. **Validate data** before saving
6. **Use TypeScript types** for type safety
7. **Log errors** for debugging
8. **Test offline scenarios**

## Related Files

- `src/lib/packages.ts` - Package functions and types
- `src/lib/storage.ts` - Storage and API integration
- `server/src/routes/packages.ts` - API endpoints
- `server/prisma/schema.prisma` - Database schema
- `server/prisma/seed.ts` - Database seeding
