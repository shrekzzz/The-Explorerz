# The-Explorerz: Setup Guide

## Prerequisites

Before running the application, ensure you have:

1. **Node.js 20+** installed
2. **PostgreSQL 16** running (via Docker or local installation)
3. **Redis 7** running (via Docker or local installation)
4. **Cloudinary account** (free tier available)
5. **SendGrid account** (free tier: 100 emails/day)

---

## Quick Start (Docker - Recommended)

### 1. Start Docker Desktop

Ensure Docker Desktop is running on your system.

### 2. Start Database Services

```bash
# Start PostgreSQL + Redis
docker-compose up -d postgres redis

# Verify services are running
docker-compose ps
```

### 3. Run Database Migrations

```bash
cd server
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Configure Environment Variables

Edit `server/.env` and update:

```env
# Get from https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your-actual-cloud-name
CLOUDINARY_API_KEY=your-actual-api-key
CLOUDINARY_API_SECRET=your-actual-api-secret

# Get from https://sendgrid.com/settings/api_keys
SMTP_PASS=your-actual-sendgrid-api-key
```

### 5. Start Development Servers

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
npm run dev
```

### 6. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health**: http://localhost:3001/api/health

---

## Alternative Setup (Local PostgreSQL/Redis)

If you prefer local installations instead of Docker:

### Install PostgreSQL

**Windows:**
```bash
# Download from https://www.postgresql.org/download/windows/
# Or use Chocolatey
choco install postgresql

# Create database
psql -U postgres
CREATE DATABASE explorerz_db;
\q
```

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb explorerz_db
```

**Linux:**
```bash
sudo apt install postgresql-16
sudo systemctl start postgresql
sudo -u postgres createdb explorerz_db
```

### Install Redis

**Windows:**
```bash
# Download from https://github.com/microsoftarchive/redis/releases
# Or use Chocolatey
choco install redis-64

# Start Redis
redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt install redis-server
sudo systemctl start redis
```

### Update Connection Strings

Edit `server/.env`:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/explorerz_db
REDIS_URL=redis://localhost:6379
```

---

## Cloudinary Setup

1. Sign up at https://cloudinary.com (free tier available)
2. Go to Dashboard → Account Details
3. Copy:
   - Cloud Name
   - API Key
   - API Secret
4. Update `server/.env` with these values

**Why Cloudinary?**
- Auto image optimization
- CDN delivery
- Format auto-detection
- Thumbnail generation
- EXIF stripping for privacy

---

## SendGrid Setup

1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Go to Settings → API Keys
3. Create new API key with "Mail Send" permission
4. Copy the API key
5. Update `server/.env`:
   ```env
   SMTP_PASS=SG.your-actual-api-key-here
   ```

**Email Templates Included:**
- Welcome email (on registration)
- Booking confirmation (on booking creation)
- Password reset (forgot password flow)

---

## Database Migrations

### Create Initial Schema

```bash
cd server
npm run db:migrate
```

This creates all tables:
- users
- sessions
- packages
- package_images
- trips
- itinerary_days
- activities
- trip_hotels
- bookings
- reviews
- audit_logs

### Seed Sample Data

```bash
npm run db:seed
```

This creates:
- Admin user (email: admin@deshyatra.com, password: Admin123!@#)
- 6 sample packages (Char Dham, Kedarnath, etc.)

### View Database

```bash
npm run db:studio
```

Opens Prisma Studio at http://localhost:5555

---

## Verification Checklist

### Backend Health Check

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-05-01T06:34:40.123Z",
    "uptime": 123.456,
    "database": "connected",
    "redis": "connected"
  }
}
```

### Test Registration

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Test Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

### Test Package Listing

```bash
curl http://localhost:3001/api/packages
```

---

## Troubleshooting

### "Cannot connect to database"

**Check PostgreSQL is running:**
```bash
# Docker
docker-compose ps

# Local (Windows)
Get-Service postgresql*

# Local (macOS/Linux)
brew services list  # macOS
systemctl status postgresql  # Linux
```

**Check connection string:**
- Verify `DATABASE_URL` in `server/.env`
- Ensure database exists: `psql -U postgres -l`

### "Cannot connect to Redis"

**Check Redis is running:**
```bash
# Docker
docker-compose ps

# Local
redis-cli ping  # Should return "PONG"
```

**Check connection string:**
- Verify `REDIS_URL` in `server/.env`

### "Prisma Client not generated"

```bash
cd server
npm run db:generate
```

### "Migration failed"

```bash
# Reset database (WARNING: deletes all data)
cd server
npx prisma migrate reset

# Or manually drop and recreate
psql -U postgres
DROP DATABASE explorerz_db;
CREATE DATABASE explorerz_db;
\q

# Then run migrations again
npm run db:migrate
```

### "Port 3001 already in use"

```bash
# Find process using port 3001
netstat -ano | findstr :3001  # Windows
lsof -i :3001  # macOS/Linux

# Kill the process or change PORT in server/.env
```

### "Cloudinary upload failed"

- Verify credentials in `server/.env`
- Check Cloudinary dashboard for API limits
- Ensure image is under 5MB

### "Email not sending"

- Verify SendGrid API key in `server/.env`
- Check SendGrid dashboard for sending limits
- Verify sender email is verified in SendGrid

---

## Production Deployment

See [PRODUCTION_READINESS_REPORT.md](./PRODUCTION_READINESS_REPORT.md) for:
- Complete deployment checklist
- Security hardening
- Performance optimization
- Monitoring setup
- Cost estimates

---

## Development Commands

### Backend

```bash
cd server

# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Database commands
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:seed        # Seed sample data
npm run db:studio      # Open Prisma Studio
```

### Frontend

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint
```

### Docker

```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d postgres redis

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (deletes data)
docker-compose down -v

# Rebuild images
docker-compose build --no-cache
```

---

## Next Steps

1. ✅ Environment configured
2. ✅ Database running
3. ✅ Migrations applied
4. ✅ Sample data seeded
5. 🔲 **Fix localStorage usage** (see below)
6. 🔲 **Write tests** (see PRODUCTION_READINESS_REPORT.md)
7. 🔲 **Deploy to production**

---

## Important Notes

### JWT Secrets

The JWT secrets in `server/.env` are already generated and secure. **Do not commit this file to Git.**

For production, generate new secrets:

```bash
# PowerShell
$bytes = New-Object byte[] 64
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### CORS Configuration

Update `CORS_ORIGINS` in `server/.env` for production:

```env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Database Backups

Set up automated backups for production:

```bash
# PostgreSQL backup
pg_dump -U postgres explorerz_db > backup.sql

# Restore
psql -U postgres explorerz_db < backup.sql
```

---

## Support

For issues or questions:
1. Check [PRODUCTION_READINESS_REPORT.md](./PRODUCTION_READINESS_REPORT.md)
2. Review [implementation_plan.md](./implementation_plan.md)
3. Check server logs: `docker-compose logs -f api`
4. Check database: `npm run db:studio`

---

**Last Updated**: May 1, 2026
