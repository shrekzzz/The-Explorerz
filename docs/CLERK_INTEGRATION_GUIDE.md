# Clerk Authentication Integration Guide

**Date**: May 1, 2026  
**Status**: ✅ Integrated

---

## 🎉 What Changed

The-Explorerz now uses **Clerk** for authentication instead of custom JWT implementation. Clerk provides:

- ✅ **Managed Authentication** - No need to maintain auth infrastructure
- ✅ **Built-in UI Components** - Pre-built sign-in/sign-up forms
- ✅ **Social Logins** - Google, Facebook, GitHub, etc.
- ✅ **Multi-Factor Authentication** - SMS, authenticator apps
- ✅ **Session Management** - Automatic token refresh
- ✅ **User Management Dashboard** - Manage users via Clerk dashboard
- ✅ **Email Verification** - Built-in email verification flow
- ✅ **Password Reset** - Built-in password reset flow
- ✅ **Webhooks** - Real-time user events

---

## 📦 Packages Installed

### Frontend
```json
{
  "@clerk/clerk-react": "^5.x.x"
}
```

### Backend
```json
{
  "@clerk/express": "^1.x.x"
}
```

---

## 🔧 Setup Instructions

### Step 1: Create Clerk Account

1. Go to https://clerk.com
2. Sign up for a free account
3. Create a new application
4. Choose authentication methods (Email, Google, etc.)

### Step 2: Get API Keys

1. Go to **API Keys** in Clerk dashboard
2. Copy **Publishable Key** (starts with `pk_test_` or `pk_live_`)
3. Copy **Secret Key** (starts with `sk_test_` or `sk_live_`)

### Step 3: Configure Environment Variables

**Frontend (`.env`):**
```env
VITE_API_URL=http://localhost:3001
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-publishable-key-here
```

**Backend (`server/.env`):**
```env
NODE_ENV=development
PORT=3001

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_your-publishable-key-here
CLERK_SECRET_KEY=sk_test_your-secret-key-here

# Database
DATABASE_URL=postgresql://postgres:postgres_dev_password@localhost:5432/explorerz_db

# Redis
REDIS_URL=redis://localhost:6379

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@deshyatra.com

# CORS
CORS_ORIGINS=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### Step 4: Configure Clerk Dashboard

1. **Allowed Redirect URLs**:
   - Add `http://localhost:5173` for development
   - Add your production URL for production

2. **User Metadata**:
   - Go to **Users** → **Metadata**
   - Add custom field: `role` (string) with default value `USER`

3. **Email Templates** (Optional):
   - Customize verification email
   - Customize password reset email

---

## 🔄 Migration from Custom JWT

### What Was Removed

- ❌ Custom JWT generation/verification
- ❌ Password hashing (Argon2id)
- ❌ Refresh token rotation
- ❌ Session table in database
- ❌ Custom login/register endpoints
- ❌ Custom email verification flow
- ❌ Custom password reset flow

### What Was Kept

- ✅ User table (synced from Clerk)
- ✅ RBAC (roles stored in Clerk metadata + local DB)
- ✅ Audit logging
- ✅ Rate limiting
- ✅ All other endpoints (trips, packages, bookings)

### Database Changes

**User table** now synced from Clerk:
- `id` - Clerk user ID
- `email` - From Clerk
- `firstName` - From Clerk
- `lastName` - From Clerk
- `avatarUrl` - From Clerk
- `isEmailVerified` - From Clerk
- `role` - From Clerk public metadata
- `passwordHash` - Empty (not used)

**Session table** - No longer used (Clerk manages sessions)

---

## 🎨 Frontend Usage

### 1. Sign In/Sign Up

Clerk provides pre-built UI components:

```typescript
import { SignIn, SignUp } from '@clerk/clerk-react';

// Sign In Page
function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn 
        routing="path" 
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/plan"
      />
    </div>
  );
}

// Sign Up Page
function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp 
        routing="path" 
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/plan"
      />
    </div>
  );
}
```

### 2. User Button

```typescript
import { UserButton } from '@clerk/clerk-react';

function Navbar() {
  return (
    <nav>
      <UserButton afterSignOutUrl="/" />
    </nav>
  );
}
```

### 3. Protected Routes

```typescript
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

function ProtectedPage() {
  return (
    <>
      <SignedIn>
        <div>Protected content</div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
```

### 4. Get User Info

```typescript
import { useUser } from '@clerk/clerk-react';

function Profile() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <div>Loading...</div>;
  if (!user) return <div>Not signed in</div>;

  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      <p>Email: {user.primaryEmailAddress?.emailAddress}</p>
      <img src={user.imageUrl} alt="Avatar" />
    </div>
  );
}
```

### 5. Make API Calls

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { getSavedTrips } from '@/lib/storage';

function MyTrips() {
  const { isAuthenticated } = useAuth();
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      getSavedTrips().then(setTrips);
    }
  }, [isAuthenticated]);

  return <div>{/* Render trips */}</div>;
}
```

---

## 🔐 Backend Usage

### 1. Protect Routes

```typescript
import { clerkAuth } from './middleware/clerk-auth.js';

// Require authentication
router.get('/trips', clerkAuth, getTrips);

// Optional authentication
router.get('/packages', clerkAuthOptional, getPackages);
```

### 2. Access User Info

```typescript
export async function getTrips(req: Request, res: Response) {
  const userId = req.user!.userId; // Clerk user ID
  const email = req.user!.email;
  const role = req.user!.role;

  const trips = await prisma.trip.findMany({
    where: { userId },
  });

  res.json({ success: true, data: trips });
}
```

### 3. Check Roles

```typescript
import { requireRole } from './middleware/rbac.js';

// Require ADMIN role
router.delete('/packages/:id', clerkAuth, requireRole(['ADMIN']), deletePackage);
```

---

## 🎭 User Roles

### Setting Roles

Roles are stored in Clerk's `publicMetadata`:

**Via Clerk Dashboard:**
1. Go to **Users**
2. Select a user
3. Click **Metadata**
4. Add to **Public Metadata**:
   ```json
   {
     "role": "ADMIN"
   }
   ```

**Via Clerk API:**
```typescript
import { clerkClient } from '@clerk/express';

await clerkClient.users.updateUserMetadata(userId, {
  publicMetadata: {
    role: 'ADMIN',
  },
});
```

### Available Roles

| Role | Permissions |
|------|-------------|
| `USER` | View packages, create trips, book packages |
| `STAFF` | + Create/update packages, view all bookings |
| `ADMIN` | + Delete packages, manage users, view audit logs |
| `SUPERADMIN` | + System configuration |

---

## 🔄 User Sync Flow

```
┌─────────────────────────────────────────────────────────┐
│                   USER SYNC FLOW                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. User signs in via Clerk UI                          │
│  2. Clerk generates JWT token                           │
│  3. Frontend sends token to backend API                 │
│  4. Backend verifies token with Clerk                   │
│  5. Backend checks if user exists in local DB           │
│  6. If not exists: Create user from Clerk data          │
│  7. If exists: Update user info from Clerk              │
│  8. Attach user info to request                         │
│  9. Continue to route handler                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Customization

### Custom Sign In Page

```typescript
import { SignIn } from '@clerk/clerk-react';

function CustomSignIn() {
  return (
    <div className="custom-container">
      <h1>Welcome to DeshYatra</h1>
      <SignIn 
        appearance={{
          elements: {
            formButtonPrimary: 'bg-purple-600 hover:bg-purple-700',
            card: 'shadow-xl',
          },
        }}
      />
    </div>
  );
}
```

### Custom User Button

```typescript
import { UserButton } from '@clerk/clerk-react';

function CustomUserButton() {
  return (
    <UserButton 
      appearance={{
        elements: {
          avatarBox: 'w-10 h-10',
        },
      }}
      userProfileMode="modal"
      afterSignOutUrl="/"
    />
  );
}
```

---

## 🔔 Webhooks (Optional)

Clerk can send webhooks for user events:

### 1. Configure Webhook in Clerk Dashboard

1. Go to **Webhooks**
2. Add endpoint: `https://yourdomain.com/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`, `user.deleted`
4. Copy signing secret

### 2. Create Webhook Handler

```typescript
import { Webhook } from 'svix';

export async function handleClerkWebhook(req: Request, res: Response) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  const svix_id = req.headers['svix-id'] as string;
  const svix_timestamp = req.headers['svix-timestamp'] as string;
  const svix_signature = req.headers['svix-signature'] as string;

  const wh = new Webhook(webhookSecret);
  const payload = wh.verify(JSON.stringify(req.body), {
    'svix-id': svix_id,
    'svix-timestamp': svix_timestamp,
    'svix-signature': svix_signature,
  });

  const { type, data } = payload;

  switch (type) {
    case 'user.created':
      // Sync new user to database
      await prisma.user.create({
        data: {
          id: data.id,
          email: data.email_addresses[0].email_address,
          firstName: data.first_name,
          lastName: data.last_name,
          avatarUrl: data.image_url,
          role: data.public_metadata?.role || 'USER',
        },
      });
      break;

    case 'user.updated':
      // Update user in database
      await prisma.user.update({
        where: { id: data.id },
        data: {
          email: data.email_addresses[0].email_address,
          firstName: data.first_name,
          lastName: data.last_name,
          avatarUrl: data.image_url,
        },
      });
      break;

    case 'user.deleted':
      // Delete user from database
      await prisma.user.delete({
        where: { id: data.id },
      });
      break;
  }

  res.json({ success: true });
}
```

---

## 🧪 Testing

### Test User Creation

1. Go to Clerk dashboard → **Users**
2. Click **Create User**
3. Fill in details
4. Set role in public metadata:
   ```json
   {
     "role": "ADMIN"
   }
   ```

### Test Authentication

```bash
# 1. Sign in via frontend
# 2. Open browser DevTools → Network
# 3. Find API request
# 4. Copy Authorization header
# 5. Test with curl

curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/trips
```

---

## 🚀 Production Deployment

### 1. Update Environment Variables

```env
# Production Clerk keys
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your-production-key
CLERK_SECRET_KEY=sk_live_your-production-secret

# Production URLs
CORS_ORIGINS=https://yourdomain.com
```

### 2. Configure Clerk for Production

1. Go to **Settings** → **Domains**
2. Add production domain
3. Update redirect URLs
4. Enable production mode

### 3. Update Database

```bash
# Run migrations
cd server
npm run db:migrate:prod

# Sync existing users (if any)
# Run a script to sync users from Clerk to local DB
```

---

## 📊 Comparison: Custom JWT vs Clerk

| Feature | Custom JWT | Clerk |
|---------|-----------|-------|
| **Setup Time** | 2-3 days | 30 minutes |
| **Maintenance** | High | None |
| **Security** | Manual updates | Auto-updated |
| **UI Components** | Build yourself | Pre-built |
| **Social Logins** | Integrate each | Built-in |
| **MFA** | Build yourself | Built-in |
| **User Management** | Build admin panel | Dashboard included |
| **Email Verification** | Build yourself | Built-in |
| **Password Reset** | Build yourself | Built-in |
| **Session Management** | Manual | Automatic |
| **Cost** | Free (self-hosted) | Free tier: 10k MAU |

---

## 🎯 Migration Checklist

- [x] Install Clerk packages
- [x] Update environment variables
- [x] Replace AuthContext with Clerk
- [x] Update API client for Clerk tokens
- [x] Create Clerk auth middleware
- [x] Update backend routes
- [x] Remove custom auth endpoints
- [x] Update frontend components
- [ ] Create Clerk account
- [ ] Get API keys
- [ ] Configure Clerk dashboard
- [ ] Test sign in/sign up
- [ ] Test API calls
- [ ] Test role-based access
- [ ] Deploy to production

---

## 🆘 Troubleshooting

### "Missing Clerk Publishable Key"

**Solution**: Add `VITE_CLERK_PUBLISHABLE_KEY` to `.env`

### "Invalid authentication token"

**Solution**: 
1. Check token is being sent in Authorization header
2. Verify Clerk secret key in `server/.env`
3. Check token hasn't expired

### "User not synced to database"

**Solution**:
1. Check Clerk middleware is running
2. Verify database connection
3. Check user creation logic in `clerk-auth.ts`

### "Role not working"

**Solution**:
1. Go to Clerk dashboard → Users
2. Select user → Metadata
3. Add to Public Metadata: `{ "role": "ADMIN" }`

---

## 📚 Resources

- **Clerk Docs**: https://clerk.com/docs
- **Clerk React**: https://clerk.com/docs/references/react/overview
- **Clerk Express**: https://clerk.com/docs/references/backend/overview
- **Clerk Dashboard**: https://dashboard.clerk.com

---

**Last Updated**: May 1, 2026  
**Status**: ✅ Integrated and Ready
