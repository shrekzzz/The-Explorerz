# 📦 Package Management - Quick Reference

## 🚀 Quick Start

### Fetch Packages
```typescript
// Async (Recommended)
import { getTravelPackagesAsync } from '@/lib/packages';
const packages = await getTravelPackagesAsync();

// Sync (Cache only)
import { getTravelPackages } from '@/lib/packages';
const packages = getTravelPackages();
```

### Add Package (Admin)
```typescript
import { savePackage } from '@/lib/storage';

await savePackage({
  id: crypto.randomUUID(),
  title: 'Package Name',
  subtitle: 'Description',
  category: 'pilgrimage',
  duration: '5 Days',
  price: 15000,
  rating: 4.5,
  reviews: 0,
  image: 'https://...',
  locations: ['Location 1'],
  highlights: ['Highlight 1'],
  bestTime: 'Oct - Mar',
  included: ['Item 1'],
  status: 'available',
});
```

### Delete Package
```typescript
import { deletePackage } from '@/lib/storage';
await deletePackage(packageId);
```

## 📊 Data Flow

```
Database → API → Transform → Cache → Frontend
                    ↓ (if API fails)
                localStorage → Frontend
```

## 🔧 Common Tasks

### Setup Database
```bash
cd server
npm run prisma:migrate
npm run seed
```

### Check API
```bash
curl http://localhost:5000/api/packages
```

### Clear Cache
```javascript
localStorage.removeItem('aeroplan_packages')
```

### Verify Packages
```javascript
console.log(localStorage.getItem('aeroplan_packages'))
```

## 🐛 Quick Fixes

| Problem | Solution |
|---------|----------|
| No packages showing | Run `npm run seed` in server |
| Stale data | Clear localStorage and refresh |
| API error | Check server is running |
| Images broken | Verify Cloudinary config |

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/lib/packages.ts` | Package functions & types |
| `src/lib/storage.ts` | API integration & caching |
| `server/src/routes/packages.ts` | API endpoints |
| `server/prisma/seed.ts` | Database seeding |

## 🎯 Best Practices

1. ✅ Always use `getTravelPackagesAsync()` when possible
2. ✅ Handle empty states gracefully
3. ✅ Show loading indicators during API calls
4. ✅ Cache aggressively for better UX
5. ✅ Validate data before saving

## 📞 Need Help?

- **Technical Details**: See `PACKAGE_MANAGEMENT_GUIDE.md`
- **Changes Made**: See `HARDCODED_PACKAGES_REMOVAL.md`
- **Full Audit**: See `HARDCODED_DATA_AUDIT.md`
- **Complete Summary**: See `HARDCODED_REMOVAL_COMPLETE.md`
