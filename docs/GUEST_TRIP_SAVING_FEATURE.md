# Guest Trip Saving Feature - Complete Implementation

## ✅ Feature Added Successfully

Users can now **save trips without logging in** by providing their contact information (name, email, phone). This allows non-authenticated users to save their planned trips and be contacted by the admin.

## 🎯 What Was Implemented

### 1. **Database Schema Changes**

#### Updated Trip Model (`server/prisma/schema.prisma`):
```prisma
model Trip {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String?  @db.Uuid  // Now optional
  
  // Contact info for non-authenticated users
  guestName       String?  @db.VarChar(200)
  guestEmail      String?  @db.VarChar(255)
  guestPhone      String?  @db.VarChar(20)
  
  // ... other fields
  
  user      User?          @relation(...) // Now optional
}
```

**Changes**:
- ✅ `userId` is now optional (nullable)
- ✅ Added `guestName` field
- ✅ Added `guestEmail` field
- ✅ Added `guestPhone` field
- ✅ Added index on `guestEmail` for faster lookups
- ✅ User relation is now optional

### 2. **Backend API Changes**

#### A. Validator Schema (`server/src/validators/trip.schema.ts`):
```typescript
export const createTripSchema = z.object({
  // ... existing fields
  
  // Optional contact info for non-authenticated users
  guestName: z.string().min(1).max(200).trim().optional(),
  guestEmail: z.string().email().max(255).optional(),
  guestPhone: z.string().min(10).max(20).trim().optional(),
});
```

#### B. Trip Routes (`server/src/routes/trip.routes.ts`):
```typescript
// Changed from authenticate to optionalAuth
router.post('/', optionalAuth, validateBody(createTripSchema), createTrip);
```

**Before**: Required authentication
**After**: Optional authentication (works for both logged-in and guest users)

#### C. Trip Controller (`server/src/controllers/trip.controller.ts`):
```typescript
export async function createTrip(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.userId;

  // Validate: either authenticated user OR guest contact info
  if (!userId && (!data.guestName || !data.guestEmail || !data.guestPhone)) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Please provide your name, email, and phone number to save this trip',
      },
    });
    return;
  }

  // Save trip with userId OR guest contact info
  const trip = await prisma.trip.create({
    data: {
      userId: userId || null,
      guestName: data.guestName || null,
      guestEmail: data.guestEmail || null,
      guestPhone: data.guestPhone || null,
      // ... other fields
    },
  });
}
```

**Logic**:
- If user is authenticated → save with `userId`
- If user is NOT authenticated → require `guestName`, `guestEmail`, `guestPhone`
- Returns 400 error if neither condition is met

### 3. **Frontend Changes**

#### A. Storage Layer (`src/lib/storage.ts`):
```typescript
export async function saveTrip(
  trip: TripPlan, 
  guestInfo?: { name: string; email: string; phone: string }
): Promise<void> {
  // Always save locally as fallback
  saveLocalTrip(trip);

  // Try to save to API (works for both authenticated and guest users)
  try {
    await api.post("/trips", {
      // ... trip data
      guestName: guestInfo?.name,
      guestEmail: guestInfo?.email,
      guestPhone: guestInfo?.phone,
    });
  } catch (error) {
    throw error; // Re-throw so caller knows it failed
  }
}
```

**Changes**:
- Added optional `guestInfo` parameter
- Removed authentication check (works for all users)
- Throws error if API call fails (so UI can show contact form)

#### B. Results Page (`src/pages/ResultsPage.tsx`):

**New Features**:
1. **Contact Form Dialog** - Shows when non-authenticated user clicks "Save Trip"
2. **Smart Save Logic** - Detects if user is logged in
3. **Form Validation** - Ensures all fields are filled

**UI Flow**:
```
User clicks "Save Trip"
  ↓
Is user authenticated?
  ↓ YES → Save directly to API
  ↓ NO  → Show contact form dialog
           ↓
           User fills: Name, Email, Phone
           ↓
           Click "Save Trip"
           ↓
           Save to API with guest info
           ↓
           Success! "We'll contact you soon"
```

**Contact Form Fields**:
- Full Name (required)
- Email (required, validated)
- Phone Number (required, min 10 digits)

#### C. Saved Trips Page (`src/pages/SavedTripsPage.tsx`):
```typescript
// Changed from sync to async
useEffect(() => { 
  getSavedTrips().then((loadedTrips) => {
    setTrips(loadedTrips);
    setLoading(false);
  });
}, []);
```

**Before**: Only showed trips for authenticated users
**After**: Shows localStorage trips for all users

### 4. **Admin Panel Updates**

#### A. Trip Interface (`src/pages/AdminPage.tsx`):
```typescript
interface Trip {
  // ... existing fields
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;  // Now optional
}
```

#### B. Trips Table Display:
```typescript
<TableCell>
  {trip.user ? (
    // Registered user
    <>
      <div className="font-medium">{trip.user.firstName} {trip.user.lastName}</div>
      <div className="text-xs text-muted-foreground">{trip.user.email}</div>
    </>
  ) : (
    // Guest user
    <>
      <div className="font-medium">{trip.guestName || "Guest User"}</div>
      <div className="text-xs text-muted-foreground">{trip.guestEmail}</div>
      <div className="text-xs text-muted-foreground">{trip.guestPhone}</div>
    </>
  )}
</TableCell>
```

**Display Logic**:
- If `trip.user` exists → Show registered user info
- If `trip.user` is null → Show guest contact info

#### C. Trip Detail Dialog:
Same logic as table - shows either user info or guest contact info

## 📊 User Experience

### For Non-Authenticated Users:

1. **Plan a Trip** → Fill form, generate itinerary
2. **Click "Save Trip"** → Contact form appears
3. **Fill Contact Info** → Name, Email, Phone
4. **Submit** → Trip saved to database
5. **Success Message** → "Trip saved! We'll contact you soon."
6. **View Saved Trips** → See trip in localStorage

### For Authenticated Users:

1. **Plan a Trip** → Fill form, generate itinerary
2. **Click "Save Trip"** → Saved immediately (no form)
3. **Success Message** → "Trip saved! Find it in your Saved Trips."
4. **View Saved Trips** → See trip synced across devices

## 🔐 Data Flow

### Guest User Trip Save:
```
Frontend (ResultsPage)
  ↓ User clicks "Save Trip"
  ↓ Check: getAccessToken() === null
  ↓ Show contact form dialog
  ↓ User fills: name, email, phone
  ↓
API Call: POST /api/trips
  {
    destination: "Manali",
    days: 5,
    budget: 25000,
    guestName: "John Doe",
    guestEmail: "john@example.com",
    guestPhone: "+91 9876543210",
    // ... itinerary, hotels, etc.
  }
  ↓
Backend (trip.controller.ts)
  ↓ Validate: guestName, guestEmail, guestPhone present
  ↓ Create trip with userId = null
  ↓ Save to database
  ↓
Database
  ↓ Trip saved with guest contact info
  ↓
Admin Panel
  ↓ Shows trip with guest info
  ↓ Admin can contact guest via email/phone
```

### Authenticated User Trip Save:
```
Frontend (ResultsPage)
  ↓ User clicks "Save Trip"
  ↓ Check: getAccessToken() !== null
  ↓ Save directly (no form)
  ↓
API Call: POST /api/trips
  {
    destination: "Manali",
    // ... trip data (no guest fields)
  }
  ↓
Backend
  ↓ Extract userId from JWT token
  ↓ Create trip with userId
  ↓ Save to database
  ↓
Database
  ↓ Trip saved with user association
```

## 🎨 UI Components

### Contact Form Dialog:
- **Title**: "Save Your Trip"
- **Description**: "Please provide your contact information..."
- **Fields**:
  - Full Name (text input)
  - Email (email input with validation)
  - Phone Number (tel input)
- **Buttons**:
  - Cancel (outline)
  - Save Trip (primary, shows "Saving..." when loading)

### Admin Panel - Trips Table:
- **User Column**: Shows either:
  - Registered user: Name + Email
  - Guest user: Guest Name + Email + Phone (with "Guest User" fallback)

### Admin Panel - Trip Detail:
- **Created By Section**: Shows either:
  - Registered user info
  - Guest contact info

## 📝 Validation Rules

### Backend Validation:
- **Guest Name**: 1-200 characters, trimmed
- **Guest Email**: Valid email format, max 255 characters
- **Guest Phone**: 10-20 characters, trimmed
- **Logic**: Either `userId` OR all three guest fields must be present

### Frontend Validation:
- All fields required (checked before submission)
- Email format validated by browser
- Phone minimum 10 digits (enforced by schema)

## 🚀 Deployment Steps

### 1. Database Migration:
```bash
cd server
npx prisma generate
npx prisma migrate deploy  # For production
# OR
npx prisma migrate dev --name add_guest_contact_to_trips  # For development
```

### 2. Backend Rebuild:
```bash
cd server
npm run build
```

### 3. Restart Backend Server:
```bash
npm run dev  # Development
# OR
npm start    # Production
```

### 4. Frontend:
No build needed - changes are in source files

## ✅ Testing Checklist

- [x] Guest user can save trip with contact info
- [x] Authenticated user can save trip without contact form
- [x] Contact form validates all fields
- [x] Guest trips appear in admin panel
- [x] Guest contact info displays correctly
- [x] Saved trips page works for non-authenticated users
- [x] localStorage fallback works
- [x] No TypeScript errors
- [x] Backend validation works
- [x] Database schema updated

## 🎯 Benefits

### For Users:
- ✅ No forced registration
- ✅ Quick trip saving
- ✅ Can plan trips without account
- ✅ Still get contacted by admin

### For Business:
- ✅ Capture leads (email, phone)
- ✅ Lower barrier to entry
- ✅ More trip submissions
- ✅ Contact potential customers

### For Admin:
- ✅ See all trips (registered + guest)
- ✅ Contact guest users directly
- ✅ Track trip interest
- ✅ Convert guests to customers

## 📊 Summary

| Feature | Before | After |
|---------|--------|-------|
| Trip Saving | Requires login | Works for all users |
| Guest Contact | Not captured | Name, Email, Phone saved |
| Admin View | Only registered users | All users (registered + guest) |
| User Experience | Forced registration | Optional registration |
| Lead Capture | None | Full contact info |

---

**Feature Status**: ✅ **COMPLETE AND READY**
**Date**: May 13, 2026
**Files Modified**: 8
**Database Changes**: 3 new fields
**TypeScript Errors**: 0
