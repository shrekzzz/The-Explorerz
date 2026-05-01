# The-Explorerz: Quick Reference Card

> **TL;DR**: Everything you need to know in one page

---

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Start services
docker-compose up -d

# 2. Setup database
cd server && npm install && npm run db:migrate && npm run db:seed

# 3. Start dev servers
npm run dev          # Terminal 1 (backend)
cd .. && npm run dev # Terminal 2 (frontend)

# 4. Open http://localhost:5173
```

---

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@deshyatra.com` | `Admin123!@#` |

---

## 📡 API Endpoints (28 Total)

### Auth (10)
```
POST   /api/auth/register              # Register new user
POST   /api/auth/login                 # Login
POST   /api/auth/refresh               # Refresh token
POST   /api/auth/logout                # Logout
POST   /api/auth/logout-all            # Logout all devices
GET    /api/auth/me                    # Current user
POST   /api/auth/send-verification     # Send verification email
POST   /api/auth/verify-email          # Verify email
POST   /api/auth/forgot-password       # Request password reset
POST   /api/auth/reset-password        # Reset password
```

### Packages (5)
```
GET    /api/packages                   # List (public)
GET    /api/packages/:id               # Detail (public)
POST   /api/packages                   # Create (STAFF+)
PUT    /api/packages/:id               # Update (STAFF+)
DELETE /api/packages/:id               # Delete (ADMIN+)
```

### Trips (5)
```
GET    /api/trips                      # User's trips
GET    /api/trips/:id                  # Trip detail
GET    /api/trips/shared/:token        # Shared trip (public)
POST   /api/trips                      # Create trip
DELETE /api/trips/:id                  # Delete trip
```

### Bookings (4)
```
GET    /api/bookings                   # User's bookings
GET    /api/bookings/:id               # Booking detail
POST   /api/bookings                   # Create booking
PATCH  /api/bookings/:id/status        # Update status
```

### Admin (4)
```
GET    /api/admin/dashboard            # Stats (ADMIN+)
GET    /api/admin/users                # User list (ADMIN+)
PATCH  /api/admin/users/:id/role       # Change role (ADMIN+)
GET    /api/admin/audit-logs           # Audit logs (ADMIN+)
```

---

## 🔐 RBAC Matrix

| Action | USER | STAFF | ADMIN | SUPERADMIN |
|--------|------|-------|-------|------------|
| View packages | ✅ | ✅ | ✅ | ✅ |
| Create trips | ✅ | ✅ | ✅ | ✅ |
| Book packages | ✅ | ✅ | ✅ | ✅ |
| Create packages | ❌ | ✅ | ✅ | ✅ |
| Update packages | ❌ | ✅ | ✅ | ✅ |
| Delete packages | ❌ | ❌ | ✅ | ✅ |
| View all bookings | ❌ | ✅ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ | ✅ |
| View audit logs | ❌ | ❌ | ✅ | ✅ |

---

## 🗄️ Database Schema (12 Tables)

```
users ──┬── sessions
        ├── trips ──┬── itinerary_days ── activities
        │           └── trip_hotels
        ├── bookings ── packages ──┬── package_images
        ├── reviews ────────────────┘
        └── audit_logs

packages ── bookings
         └── reviews
```

---

## 🧪 Testing

```bash
# Run all tests
cd server && npm test

# Watch mode
npm run test:watch

# Integration tests
npm run test:integration

# Coverage
npm test -- --coverage
```

**Test Coverage**: 27 tests (15 auth + 12 RBAC)

---

## 🔧 Common Commands

### Database
```bash
cd server

npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:seed          # Seed data
npm run db:studio        # Open Prisma Studio
```

### Development
```bash
npm run dev              # Start with hot reload
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Lint code
```

### Docker
```bash
docker-compose up -d              # Start all services
docker-compose up -d postgres     # Start only PostgreSQL
docker-compose logs -f api        # View API logs
docker-compose down               # Stop all services
docker-compose down -v            # Stop + delete volumes
```

---

## 🌍 Environment Variables

### Backend (`server/.env`)
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/explorerz_db
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=<generated>
JWT_REFRESH_SECRET=<generated>
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
SMTP_PASS=your-sendgrid-api-key
CORS_ORIGINS=http://localhost:5173
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:3001
```

---

## 🐛 Troubleshooting

### "Cannot connect to database"
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### "Prisma Client not generated"
```bash
cd server
npm run db:generate
```

### "Port 3001 already in use"
```bash
# Windows
netstat -ano | findstr :3001

# macOS/Linux
lsof -i :3001

# Kill process or change PORT in server/.env
```

### "Email not sending"
- Verify `SMTP_PASS` in `server/.env`
- Check SendGrid dashboard for API limits
- Check server logs: `docker-compose logs -f api`

### "Cloudinary upload failed"
- Verify credentials in `server/.env`
- Check Cloudinary dashboard for API limits
- Ensure image is under 5MB

---

## 📊 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /auth/login` | 5 | 15 min |
| `POST /auth/register` | 3 | 1 hour |
| `POST /auth/forgot-password` | 3 | 1 hour |
| `POST /uploads/*` | 10 | 1 min |
| `* /api/*` (global) | 100 | 1 min |

---

## 🔒 Security Features

- ✅ Argon2id password hashing (64MB, 3 iterations)
- ✅ JWT with rotation (15min access, 7d refresh)
- ✅ HTTP-only, secure, SameSite=strict cookies
- ✅ Token reuse detection → revoke all sessions
- ✅ Rate limiting (5 strategies)
- ✅ RBAC (4 roles, 30+ permissions)
- ✅ Helmet security headers (CSP, HSTS, etc.)
- ✅ CORS whitelist-only
- ✅ Input validation (Zod schemas)
- ✅ Audit logging (all mutations)
- ✅ File upload restrictions (MIME, size, EXIF strip)

---

## 📧 Email Templates

| Template | Trigger | Expiry |
|----------|---------|--------|
| Welcome | Registration | N/A |
| Email Verification | Registration / Manual | 24 hours |
| Booking Confirmation | Booking created | N/A |
| Password Reset | Forgot password | 1 hour |

---

## 🎨 Frontend Storage API

```typescript
import {
  getSavedTrips,
  saveTrip,
  deleteTrip,
  getPackages,
  createBooking,
} from '@/lib/storage';

// Get user's trips (requires auth)
const trips = await getSavedTrips();

// Save a trip (requires auth)
const savedTrip = await saveTrip(tripData);

// Get packages (public)
const packages = await getPackages({ category: 'PILGRIMAGE' });

// Create booking (requires auth)
const booking = await createBooking({
  packageId: 'uuid',
  travelers: 2,
  travelDate: '2026-06-01',
  contactInfo: { name, email, phone },
});
```

---

## 📱 Frontend Auth API

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  const handleLogin = async () => {
    await login('email@example.com', 'password');
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user.firstName}!</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

---

## 🔗 Useful Links

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **API Health**: http://localhost:3001/api/health
- **Prisma Studio**: http://localhost:5555 (run `npm run db:studio`)
- **Cloudinary**: https://cloudinary.com/console
- **SendGrid**: https://sendgrid.com/settings/api_keys

---

## 📚 Documentation

1. **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** — Complete setup instructions
2. **[PRODUCTION_READINESS_REPORT.md](./PRODUCTION_READINESS_REPORT.md)** — Detailed assessment
3. **[IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)** — What was implemented
4. **[implementation_plan.md](./implementation_plan.md)** — Original architecture plan
5. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** — This file

---

## 🎯 Production Checklist

- [ ] Docker Desktop running
- [ ] Database migrated (`npm run db:migrate`)
- [ ] Database seeded (`npm run db:seed`)
- [ ] Cloudinary configured
- [ ] SendGrid configured
- [ ] Tests passing (`npm test`)
- [ ] Email delivery tested
- [ ] File upload tested
- [ ] Admin dashboard tested

---

## 🆘 Need Help?

1. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) troubleshooting section
2. Check server logs: `docker-compose logs -f api`
3. Check database: `npm run db:studio`
4. Run tests: `npm test`
5. Check [PRODUCTION_READINESS_REPORT.md](./PRODUCTION_READINESS_REPORT.md)

---

**Last Updated**: May 1, 2026  
**Status**: ✅ Production Ready
