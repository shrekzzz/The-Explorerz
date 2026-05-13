# Image Not Showing - Debug Guide

## Current Situation

From your logs:
```
Package images: /placeholder.svg (2) [
  'https://res.cloudinary.com/.../xxkx3utfjufkvnc2bvnu.jpg',
  'https://res.cloudinary.com/.../lsw35ugok2ssxnuwsb5j.jpg'
]
```

- ❌ Main image: `/placeholder.svg` (wrong)
- ✅ Highlight images: 2 URLs (correct)

## Why This Happens

The transformation function is not finding the primary image in the `images` array from the API.

## Quick Fix Steps

### Step 1: Hard Refresh the Browser
The frontend code may not have reloaded with the fix.

**Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`  
**Mac**: `Cmd + Shift + R`

### Step 2: Check Browser Console

After hard refresh, look for these logs when you load the package list:

```
Transforming API package: fa64075b-... Kokan Yatra
API package images: [{isPrimary: true, url: "..."}, ...]
Found primary image: https://res.cloudinary.com/...
Transformed package: {image: "https://...", ...}
```

### Step 3: If Still Not Working

If you still see `/placeholder.svg`, check:

1. **Is the transformation log showing?**
   - If NO → Frontend code didn't reload
   - If YES → Check what `API package images` shows

2. **What does `API package images` show?**
   - If `undefined` → API not returning images
   - If `[...]` → Check if `isPrimary: true` exists

3. **Does "Found primary image" appear?**
   - If NO → The find logic isn't working
   - If YES → Check the URL value

## Manual Test

Open browser console and run:

```javascript
// Test the transformation logic
const testPackage = {
  id: 'test',
  title: 'Test',
  images: [
    {isPrimary: true, url: 'https://example.com/primary.jpg'},
    {isPrimary: false, url: 'https://example.com/highlight1.jpg'}
  ]
};

// Test find
const primary = testPackage.images.find(img => img.isPrimary === true);
console.log('Primary found:', primary);
console.log('Primary URL:', primary?.url);

// Test filter
const highlights = testPackage.images.filter(img => img.isPrimary !== true);
console.log('Highlights:', highlights);
```

Expected output:
```
Primary found: {isPrimary: true, url: 'https://example.com/primary.jpg'}
Primary URL: https://example.com/primary.jpg
Highlights: [{isPrimary: false, url: 'https://example.com/highlight1.jpg'}]
```

## Alternative: Clear Cache

If hard refresh doesn't work:

### Option 1: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Option 2: Clear All
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## Check Network Tab

1. Open DevTools → Network tab
2. Refresh the page
3. Find the request to `/api/packages?limit=50...`
4. Click on it
5. Go to "Response" tab
6. Find your package in the response
7. Check if `images` array exists and has `isPrimary: true`

Example response should look like:
```json
{
  "id": "fa64075b-...",
  "title": "Kokan Yatra",
  "images": [
    {
      "id": "fe2c88fe-...",
      "url": "https://res.cloudinary.com/.../fcwpfrevhaodid85dxrn.jpg",
      "isPrimary": true,
      "sortOrder": 0
    },
    {
      "id": "aa4f2f2c-...",
      "url": "https://res.cloudinary.com/.../xxkx3utfjufkvnc2bvnu.jpg",
      "isPrimary": false,
      "sortOrder": 1
    }
  ]
}
```

## If API Response is Correct

If the API response has the images array with `isPrimary: true`, but the frontend still shows placeholder:

1. **Check if transformation logs appear**
2. **Check if the logs show the correct data**
3. **Verify the transformation code is running**

## Force Code Reload

If nothing works, the frontend build might be cached:

### For Development Server:
1. Stop the dev server (Ctrl+C)
2. Clear node_modules/.vite or .next cache
3. Restart: `npm run dev`

### Quick Test:
Add this to the top of `src/lib/packages.ts`:
```typescript
console.log('packages.ts loaded at:', new Date().toISOString());
```

If you don't see this log after refresh, the file isn't reloading.

## Expected vs Actual

### Expected (after fix):
```
Package images: "https://res.cloudinary.com/.../fcwpfrevhaodid85dxrn.jpg" [
  'https://res.cloudinary.com/.../xxkx3utfjufkvnc2bvnu.jpg',
  'https://res.cloudinary.com/.../lsw35ugok2ssxnuwsb5j.jpg'
]
```

### Actual (your current):
```
Package images: /placeholder.svg [
  'https://res.cloudinary.com/.../xxkx3utfjufkvnc2bvnu.jpg',
  'https://res.cloudinary.com/.../lsw35ugok2ssxnuwsb5j.jpg'
]
```

## Quick Checklist

- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Check console for transformation logs
- [ ] Check Network tab for API response
- [ ] Verify images array has isPrimary: true
- [ ] Clear browser cache
- [ ] Restart dev server if needed

---

**Most likely cause**: Frontend code hasn't reloaded. Try hard refresh first!
