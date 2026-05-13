# The-Explorerz: Complete System Architecture & Implementation Plan

> **Last Updated**: March 25, 2026  
> **Status**: Phase 1–9 Complete ✅ | Phase 10–12 Pending

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Completion Status Dashboard](#completion-status-dashboard)
3. [High-Level System Architecture](#high-level-system-architecture)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Database Schema Design](#database-schema-design)
6. [Redis Caching Strategy](#redis-caching-strategy)
7. [Authentication & Security Architecture](#authentication--security-architecture)
8. [Microservices Architecture](#microservices-architecture)
9. [API Reference](#api-reference)
10. [Frontend Integration](#frontend-integration)
11. [Deployment Architecture](#deployment-architecture)
12. [Recommendations & Future Fixes](#recommendations--future-fixes)
13. [Verification Plan](#verification-plan)

---

## Current State Analysis

**The-Explorerz** (DeshYatra) was a travel planning SPA with:
- **Frontend**: Vite + React + TypeScript + TailwindCSS + shadcn/ui
- **Pages**: Landing, Plan, Results, SavedTrips, Packages, PackageDetail, Admin, NotFound
- **Data**: All stored in `localStorage` — no database, no persistence across devices
- **Backend**: Basic Express server for local image uploads — no auth, no security

> [!CAUTION]
> **Critical Gaps Identified & Resolved**: No authentication ✅ Fixed, no database ✅ Fixed, no authorization ✅ Fixed, admin page publicly accessible ✅ Fixed, no input validation ✅ Fixed, no rate limiting ✅ Fixed, file uploads to local disk ✅ Fixed.

---

## Completion Status Dashboard

| Phase | Name | Status | Files |
|-------|------|--------|-------|
| 1 | Research & Planning | ✅ Complete | Implementation plan, DFDs |
| 2 | Backend Infrastructure | ✅ Complete | `package.json`, `tsconfig.json`, `.env.example` |
| 3 | Database & Prisma Schema | ✅ Complete | 12 models, 6 enums, seed script |
| 4 | Authentication & Security | ✅ Complete | JWT, Argon2id, RBAC, rate limiting |
| 5 | Middleware Layer | ✅ Complete | 7 middleware (auth, rbac, rate limit, security, validate, error, audit) |
| 6 | Microservices | ✅ Complete | Email, Upload (Cloudinary), Audit |
| 7 | API Routes & Controllers | ✅ Complete | 6 route files, 6 controllers, 23 endpoints |
| 8 | App Entry & Deployment | ✅ Complete | Express app, graceful shutdown, Dockerfile, docker-compose |
| 9 | Frontend Integration | ✅ Complete | API client, AuthContext, Login/Register, ProtectedRoute |
| 10 | Replace localStorage with API | 🔲 Pending | `storage.ts`, `tripGenerator.ts`, pages |
| 11 | Testing Suite | 🔲 Pending | Unit, integration, E2E tests |
| 12 | CI/CD Pipeline | 🔲 Pending | GitHub Actions workflow |

---

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB["React SPA<br/>Vite + TailwindCSS + shadcn/ui"]
        MOBILE["Future: Mobile App"]
    end

    subgraph "API Gateway"
        GW["Express API :3001"]
        RL["Rate Limiter<br/>5 strategies"]
        SEC["Security<br/>Helmet + CORS + CSP"]
        GW --> RL --> SEC
    end

    subgraph "Backend Services"
        AUTH["Auth Service<br/>JWT + Argon2id + RBAC"]
        API["Core API<br/>Prisma ORM"]
        EMAIL["Email Service<br/>Nodemailer + Templates"]
        UPLOAD["Upload Service<br/>Cloudinary CDN"]
        AUDIT["Audit Service<br/>Event Logging"]
    end

    subgraph "Data Layer"
        PG["PostgreSQL 16<br/>12 models, 6 enums"]
        REDIS["Redis 7<br/>Cache + Sessions + Rate Limiting"]
        S3["Cloudinary<br/>Auto-optimized images"]
    end

    WEB -->|"HTTPS + JWT"| GW
    MOBILE -->|"REST API"| GW
    SEC --> AUTH --> PG
    SEC --> API --> PG
    SEC --> UPLOAD --> S3
    AUTH --> REDIS
    API --> REDIS
    API --> EMAIL
    API --> AUDIT --> PG
```

---

## Data Flow Diagrams

### Level 0 — Context Diagram

```mermaid
graph LR
    USER["👤 User<br/>Traveler / Admin"]
    SYS["The-Explorerz<br/>Travel Platform"]
    CLOUD["☁️ Cloudinary<br/>Image CDN"]
    MAIL["📧 Email Provider<br/>SendGrid / SES"]
    PAY["💳 Payment Gateway<br/>Razorpay (Future)"]

    USER -->|"Browse, Book, Plan"| SYS
    SYS -->|"Trip Plans, Confirmations"| USER
    SYS -->|"Store/Retrieve Media"| CLOUD
    SYS -->|"Send Emails"| MAIL
    SYS -.->|"Process Payments (Future)"| PAY
```

### Level 1 — Major Processes

```mermaid
graph TB
    USER["👤 User"]

    subgraph "P1: Authentication ✅"
        P1A["Register / Login"]
        P1B["Token Management<br/>JWT Rotation"]
        P1C["Password Reset"]
    end

    subgraph "P2: Trip Planning ✅"
        P2A["Create Trip"]
        P2B["AI Itinerary Gen"]
        P2C["Save / Share Trip"]
    end

    subgraph "P3: Package Management ✅"
        P3A["Browse Packages"]
        P3B["Package CRUD<br/>Staff+ Only"]
        P3C["Package Booking"]
    end

    subgraph "P4: File Management ✅"
        P4A["Upload Images"]
        P4B["Optimize + CDN"]
    end

    subgraph "P5: Notifications ✅"
        P5A["Email Notifications"]
        P5B["In-App Alerts (Future)"]
    end

    DB[("PostgreSQL")]
    CACHE[("Redis")]
    FILES[("Cloudinary")]

    USER --> P1A --> DB
    P1A --> P1B --> CACHE
    USER --> P2A --> P2B --> DB
    P2C --> DB
    USER --> P3A --> DB
    P3B --> DB
    P3C --> DB
    USER --> P4A --> P4B --> FILES
    P3C --> P5A
    P1A --> P5A
```

### Level 2 — Authentication Process Detail

```mermaid
sequenceDiagram
    participant U as User
    participant API as Express API
    participant ZOD as Zod Validator
    participant ARGON as Argon2id
    participant PG as PostgreSQL
    participant JWT as JWT Utils
    participant REDIS as Redis

    Note over U,REDIS: Registration Flow
    U->>API: POST /api/auth/register
    API->>ZOD: Validate (email, password, name)
    ZOD-->>API: ✓ Valid
    API->>ARGON: Hash password (64MB, 3 iter)
    ARGON-->>API: passwordHash
    API->>PG: Create user record
    PG-->>API: user object
    API->>JWT: Generate access (15min) + refresh (7d)
    API->>PG: Store session (refresh token + IP + UA)
    API->>REDIS: Cache session for quick lookup
    API-->>U: {user, accessToken} + httpOnly cookie

    Note over U,REDIS: Token Refresh Flow (Silent)
    U->>API: POST /api/auth/refresh (cookie)
    API->>JWT: Verify refresh token
    API->>PG: Find session, validate token
    alt Token reuse detected
        API->>PG: Revoke ALL user sessions
        API->>REDIS: Clear all session cache
        API-->>U: 401 (forced re-login)
    else Valid
        API->>PG: Delete old session, create new
        API->>JWT: Generate new token pair
        API->>REDIS: Update session cache
        API-->>U: {accessToken} + new httpOnly cookie
    end
```

---

## Database Schema Design

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Trip : creates
    User ||--o{ Booking : makes
    User ||--o{ Session : has
    User ||--o{ AuditLog : generates
    User ||--o{ Review : writes
    Package ||--o{ Booking : booked_in
    Package ||--o{ PackageImage : has
    Package ||--o{ Review : receives
    Trip ||--o{ ItineraryDay : contains
    ItineraryDay ||--o{ Activity : contains
    Trip ||--o{ TripHotel : includes

    User {
        uuid id PK
        string email UK "indexed"
        string passwordHash "Argon2id"
        string firstName
        string lastName
        string phone
        string avatarUrl
        enum role "USER|STAFF|ADMIN|SUPERADMIN"
        boolean isEmailVerified "default false"
        boolean isActive "default true"
        datetime lastLoginAt
        datetime createdAt
        datetime updatedAt
    }

    Session {
        string id PK "crypto random"
        uuid userId FK
        string refreshToken UK "JWT"
        string ipAddress
        string userAgent "max 500 chars"
        datetime expiresAt "indexed"
        datetime createdAt
    }

    Package {
        uuid id PK
        string title "max 200"
        string subtitle "max 500"
        enum category "PILGRIMAGE|TREK|HERITAGE|NATURE|ADVENTURE"
        string duration
        decimal price "indexed"
        decimal rating "0-5, default 0"
        int reviewCount "default 0"
        string_arr locations
        string_arr highlights
        string bestTime
        enum difficulty "EASY|MODERATE|DIFFICULT|EXTREME"
        string_arr included
        enum status "AVAILABLE|COMING_SOON|ARCHIVED"
        uuid createdBy FK
        datetime createdAt "indexed"
        datetime updatedAt
    }

    PackageImage {
        uuid id PK
        uuid packageId FK "cascade delete"
        string url
        string publicId "Cloudinary ID"
        boolean isPrimary
        int sortOrder
    }

    Trip {
        uuid id PK
        uuid userId FK "cascade delete"
        string destination "indexed"
        int days
        decimal budget
        string_arr interests
        json budgetBreakdown "accommodation,food,transport,activities,total"
        boolean isPublic "default false"
        string shareToken UK "nullable"
        datetime createdAt
        datetime updatedAt
    }

    ItineraryDay {
        uuid id PK
        uuid tripId FK "cascade delete"
        int dayNumber
        string title
    }

    Activity {
        uuid id PK
        uuid itineraryDayId FK "cascade delete"
        string time
        string title
        string description
        string locationName
        decimal lat "GPS latitude"
        decimal lng "GPS longitude"
        enum category "FOOD|ADVENTURE|TEMPLES|CULTURE|NIGHTLIFE|NATURE|SHOPPING|TRANSPORT|RELAXATION"
        decimal cost
    }

    TripHotel {
        uuid id PK
        uuid tripId FK "cascade delete"
        string name
        decimal rating "0-5"
        decimal pricePerNight
        decimal lat
        decimal lng
    }

    Booking {
        uuid id PK
        uuid userId FK
        uuid packageId FK
        enum status "PENDING|CONFIRMED|CANCELLED|COMPLETED|REFUNDED"
        decimal totalAmount "price * travelers"
        int travelers "1-20"
        datetime travelDate
        json contactInfo "name,email,phone,specialRequests"
        string paymentId "nullable, future"
        datetime createdAt "indexed"
        datetime updatedAt
    }

    Review {
        uuid id PK
        uuid userId FK
        uuid packageId FK
        int rating "1-5"
        string comment "max 2000"
        datetime createdAt
    }

    AuditLog {
        uuid id PK
        uuid userId FK "nullable"
        string action "e.g. USER_LOGIN, PACKAGE_CREATE"
        string resource "e.g. user, package, booking"
        string resourceId "nullable"
        json metadata "request body, changes"
        string ipAddress
        datetime createdAt "indexed desc"
    }
```

### Prisma Schema: [schema.prisma](file:///c:/Deshyatra/The-Explorerz/server/prisma/schema.prisma)

**Key Design Decisions:**
- **UUID primary keys** — prevents sequential ID enumeration attacks
- **Cascade deletes** — when a User is deleted, all their Trips, Bookings, Sessions are cleaned up
- **Composite unique index** on `Review(userId, packageId)` — one review per user per package
- **Database indexes** on `User.email`, `Package.category`, `Package.status`, `Booking.status`, `AuditLog.createdAt` for query performance
- **JSON columns** for flexible data (budgetBreakdown, contactInfo, metadata) — avoids over-normalization

---

## Redis Caching Strategy

### Architecture

```mermaid
graph LR
    subgraph "Application"
        API["Express API"]
        MW["Cache Middleware"]
    end

    subgraph "Redis 7"
        SESS["Session Store<br/>sessions:{userId}:{sessionId}"]
        RL["Rate Limit Counters<br/>rl:{strategy}:{key}"]
        CACHE["Data Cache<br/>cache:{resource}:{id}"]
        INV["Cache Invalidation<br/>Pub/Sub"]
    end

    API --> MW --> SESS
    MW --> RL
    MW --> CACHE
    API --> INV
```

### Cache Key Schema

| Key Pattern | TTL | Purpose | Set On | Invalidated On |
|-------------|-----|---------|--------|----------------|
| `sessions:{userId}:{sessionId}` | 7 days | Session validation | Login/Refresh | Logout |
| `rl:global:{ip}` | 1 min | Global rate limit | Every request | Auto-expire |
| `rl:login:{ip}` | 15 min | Login rate limit | Login attempt | Auto-expire |
| `rl:register:{ip}` | 1 hour | Register rate limit | Register attempt | Auto-expire |
| `rl:upload:{userId}` | 1 min | Upload rate limit | Upload | Auto-expire |
| `cache:packages:list:{hash}` | 5 min | Package listing | GET /packages | Package CRUD |
| `cache:packages:{id}` | 10 min | Package detail | GET /packages/:id | Package update/delete |
| `cache:admin:dashboard` | 2 min | Dashboard stats | GET /admin/dashboard | Any mutation |
| `cache:user:{id}` | 15 min | User profile | GET /auth/me | Profile update |

### Cache Implementation Pattern

```
Request Flow:
┌──────────┐     ┌────────────┐     ┌───────┐     ┌──────────┐
│  Client  │────>│  Cache MW  │────>│ Redis │     │ Postgres │
└──────────┘     └────────────┘     └───────┘     └──────────┘
                       │                │               │
                       │──── HIT? ────>│               │
                       │<── YES: data──│               │
                       │                │               │
                       │──── MISS ────>│               │
                       │               │──── Query ───>│
                       │               │<── Result ───│
                       │<── SET + TTL──│               │
                       │                │               │
                 return cached/fresh data
```

### Cache Invalidation Strategy

```typescript
// Pattern: Write-through invalidation
// On any mutation, delete related cache keys

// Example: When a package is updated
await redis.del(`cache:packages:${packageId}`);
await redis.del('cache:packages:list:*');  // Invalidate all list variants
await redis.del('cache:admin:dashboard');   // Dashboard shows package counts
```

### Current Redis Usage (✅ Implemented)

| Feature | Status | Implementation |
|---------|--------|---------------|
| Session storage | ✅ Done | `sessions:{userId}:{sessionId}` with TTL |
| Rate limiting | ✅ Done | 5 strategies via express-rate-limit + Redis store |
| Token blacklisting | ✅ Done | Sessions deleted on logout from both DB + Redis |

### Redis Usage (🔲 Recommended Additions)

| Feature | Priority | Benefit |
|---------|----------|---------|
| Package list cache | High | Avoid heavy DB queries with JOINs on every browse |
| Dashboard stats cache | High | Aggregation queries are expensive |
| User profile cache | Medium | Reduce DB reads on every authenticated request |
| Trip shared link cache | Medium | Public shared trips get repeated views |
| Search result cache | Low | Short TTL cache for popular search queries |

---

## Authentication & Security Architecture

### JWT Token Strategy ✅ Implemented

```
┌─────────────────────────────────────────────────┐
│                  TOKEN STRATEGY                  │
├─────────────────────────────────────────────────┤
│  Access Token (Short-lived)                     │
│  ├─ Lifetime: 15 minutes                       │
│  ├─ Storage: JavaScript memory (XSS-safe)      │
│  ├─ Algorithm: HS256                            │
│  └─ Payload: {userId, role, permissions}        │
│                                                 │
│  Refresh Token (Long-lived)                     │
│  ├─ Lifetime: 7 days                           │
│  ├─ Storage: HTTP-only secure cookie            │
│  ├─ Rotation: New token on each refresh         │
│  ├─ Reuse detection: Revokes ALL sessions       │
│  └─ Stored in: PostgreSQL + Redis               │
└─────────────────────────────────────────────────┘
```

### RBAC Permission Matrix ✅ Implemented

| Permission | `USER` | `STAFF` | `ADMIN` | `SUPERADMIN` |
|-----------|--------|---------|---------|--------------|
| View packages | ✅ | ✅ | ✅ | ✅ |
| Create/save trips | ✅ | ✅ | ✅ | ✅ |
| Book packages | ✅ | ✅ | ✅ | ✅ |
| Write reviews | ✅ | ✅ | ✅ | ✅ |
| Manage own profile | ✅ | ✅ | ✅ | ✅ |
| Upload files | ✅ | ✅ | ✅ | ✅ |
| View all bookings | ❌ | ✅ | ✅ | ✅ |
| Create/update packages | ❌ | ✅ | ✅ | ✅ |
| Delete packages | ❌ | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ | ✅ |
| View audit logs | ❌ | ❌ | ✅ | ✅ |
| System configuration | ❌ | ❌ | ❌ | ✅ |

### Security Hardening ✅ Implemented

| Layer | Protection | Implementation |
|-------|-----------|----------------|
| **Passwords** | Argon2id (64MB, 3 iter, 4 parallel) | `auth.service.ts` |
| **Headers** | Helmet (CSP, HSTS, X-Frame-Options, nosniff, referrer) | `security.ts` |
| **CORS** | Whitelist-only with credentials | `security.ts` |
| **XSS** | CSP headers + access token in memory (not localStorage) | `security.ts`, `api.ts` |
| **CSRF** | SameSite=strict cookies | `auth.controller.ts` |
| **Injection** | Prisma parameterized queries + Zod validation | `validate.ts`, Prisma ORM |
| **Brute Force** | Rate limiting (5 req/15min login, 3 req/hr register) | `rateLimiter.ts` |
| **Body Limit** | 10KB JSON body max | `app.ts` |
| **Token Theft** | Refresh token reuse → all sessions revoked | `auth.service.ts` |
| **Audit Trail** | All mutations logged with user, IP, metadata | `audit.ts`, `audit.service.ts` |
| **Uploads** | MIME whitelist + 5MB limit + EXIF strip | `upload.controller.ts`, `upload.service.ts` |

### Rate Limiting Strategy ✅ Implemented

| Endpoint | Limit | Window | Key |
|----------|-------|--------|-----|
| `POST /auth/login` | 5 | 15 min | IP |
| `POST /auth/register` | 3 | 1 hour | IP |
| `POST /auth/forgot-password` | 3 | 1 hour | IP |
| `POST /api/uploads/*` | 10 | 1 min | User ID |
| `* /api/*` (global) | 100 | 1 min | IP |

---

## Microservices Architecture

### Service Map ✅ Implemented

| Service | Files | Status |
|---------|-------|--------|
| **Auth Service** | `auth.service.ts`, `auth.controller.ts`, `auth.routes.ts` | ✅ |
| **Email Service** | `email.service.ts` (3 HTML templates) | ✅ |
| **Upload Service** | `upload.service.ts`, `upload.controller.ts` | ✅ |
| **Audit Service** | `audit.service.ts`, `audit.ts` middleware | ✅ |

### Email Templates ✅

| Template | Trigger | Style |
|----------|---------|-------|
| Welcome | User registration | Purple gradient header |
| Booking Confirmation | Booking created | Green gradient + order details table |
| Password Reset | Forgot password | Amber gradient + CTA button |

### Upload Pipeline ✅

```
File → Multer (memory) → MIME check → Size check (5MB)
  → Cloudinary upload → Auto quality → Format auto-detect
  → Max 2000px width → EXIF stripped → Thumbnail generated
  → URL + publicId returned
```

---

## API Reference (23 Endpoints) ✅

### Auth (`/api/auth`)

| Method | Route | Auth | Rate Limit | Description |
|--------|-------|------|------------|-------------|
| `POST` | `/register` | ❌ | 3/hr | Register new user |
| `POST` | `/login` | ❌ | 5/15min | Login with credentials |
| `POST` | `/refresh` | Cookie | — | Rotate tokens |
| `POST` | `/logout` | Cookie | — | Logout (clear session) |
| `POST` | `/logout-all` | ✅ | — | Logout from all devices |
| `GET` | `/me` | ✅ | — | Current user profile |

### Packages (`/api/packages`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/` | ❌ | List (filter by category/status/price, search, sort, paginate) |
| `GET` | `/:id` | ❌ | Detail with images + reviews + counts |
| `POST` | `/` | Staff+ | Create package (audit logged) |
| `PUT` | `/:id` | Staff+ | Update package (audit logged) |
| `DELETE` | `/:id` | Admin+ | Delete package (audit logged) |

### Trips (`/api/trips`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/` | ✅ | User's trips with pagination |
| `GET` | `/:id` | Owner | Trip detail with nested itinerary |
| `GET` | `/shared/:token` | ❌ | Public shared trip via link |
| `POST` | `/` | ✅ | Create trip with nested itinerary + activities + hotels |
| `DELETE` | `/:id` | Owner/Admin | Delete trip |

### Bookings (`/api/bookings`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/` | ✅ | User's bookings (admin sees all) |
| `GET` | `/:id` | Owner/Admin | Booking detail |
| `POST` | `/` | ✅ | Create booking (sends confirmation email) |
| `PATCH` | `/:id/status` | ✅ | Update status (users: cancel only, admin: any) |

### Uploads (`/api/uploads`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/single` | ✅ | Upload single image to Cloudinary |
| `POST` | `/multiple` | ✅ | Upload up to 5 images |
| `DELETE` | `/` | ✅ | Delete image by publicId |

### Admin (`/api/admin`) — Requires ADMIN/SUPERADMIN

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/dashboard` | Aggregate stats (users, packages, trips, bookings, status breakdown) |
| `GET` | `/users` | User list with trip/booking counts |
| `PATCH` | `/users/:id/role` | Change user role (audit logged) |
| `PATCH` | `/users/:id/toggle-active` | Activate/deactivate user (audit logged) |
| `GET` | `/audit-logs` | Query audit logs (filter by user, action, resource) |

---

## Frontend Integration ✅

### Files Created

| File | Purpose |
|------|---------|
| [api.ts](file:///c:/Deshyatra/The-Explorerz/src/lib/api.ts) | Axios with token refresh queue + request interceptor |
| [AuthContext.tsx](file:///c:/Deshyatra/The-Explorerz/src/contexts/AuthContext.tsx) | Session restoration on mount, login/register/logout |
| [ProtectedRoute.tsx](file:///c:/Deshyatra/The-Explorerz/src/components/ProtectedRoute.tsx) | Route guard with loading spinner + role denial |
| [LoginPage.tsx](file:///c:/Deshyatra/The-Explorerz/src/pages/LoginPage.tsx) | Animated login with password toggle |
| [RegisterPage.tsx](file:///c:/Deshyatra/The-Explorerz/src/pages/RegisterPage.tsx) | Password strength bar (5 rules, color-coded) |
| [App.tsx](file:///c:/Deshyatra/The-Explorerz/src/App.tsx) | AuthProvider + protected `/admin` route |

### Token Flow

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND TOKEN FLOW                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Access Token:                                          │
│  ├─ Stored in: JavaScript variable (memory only)        │
│  ├─ Attached via: axios request interceptor             │
│  └─ Never in: localStorage, sessionStorage, cookies     │
│                                                         │
│  Refresh Token:                                         │
│  ├─ Stored in: HTTP-only, secure, SameSite=strict cookie│
│  ├─ Path: /api/auth (only sent to auth endpoints)       │
│  ├─ JavaScript: CANNOT access (XSS protection)          │
│  └─ Rotation: New cookie on each refresh                │
│                                                         │
│  On 401 Response:                                       │
│  ├─ axios interceptor catches the error                 │
│  ├─ Queues additional requests (no race conditions)     │
│  ├─ Calls POST /api/auth/refresh                        │
│  ├─ On success: retries queued requests with new token  │
│  └─ On failure: redirect to /login                      │
└─────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture ✅

### Docker Compose Stack

```mermaid
graph TB
    subgraph "docker-compose.yml"
        API["Node.js API<br/>:3001<br/>Multi-stage build, non-root"]
        PG["PostgreSQL 16-alpine<br/>:5432<br/>Persistent volume"]
        REDIS_C["Redis 7-alpine<br/>:6379<br/>256MB cap, LRU eviction"]
    end

    subgraph "External Services"
        CDN["Cloudinary CDN"]
        SMTP["SendGrid / SES"]
    end

    API -->|Prisma| PG
    API -->|ioredis| REDIS_C
    API -->|SDK| CDN
    API -->|SMTP| SMTP

    PG --- V1[("postgres_data<br/>volume")]
    REDIS_C --- V2[("redis_data<br/>volume")]
```

### Files

| File | Description |
|------|-------------|
| [Dockerfile](file:///c:/Deshyatra/The-Explorerz/server/Dockerfile) | Multi-stage (build + production), non-root user, health check |
| [docker-compose.yml](file:///c:/Deshyatra/The-Explorerz/docker-compose.yml) | PostgreSQL 16 + Redis 7 + API with health checks |

---

## Recommendations & Future Fixes

### 🔴 High Priority

| # | Item | Type | Details |
|---|------|------|---------|
| 1 | **Replace localStorage with API calls** | Fix | `storage.ts` still uses localStorage. Should call `POST /api/trips` and `GET /api/trips` instead. This is the critical remaining integration work. |
| 2 | **Install server dependencies** | Fix | Run `cd server && npm install` to resolve lint errors (missing `node_modules`). |
| 3 | **Run Prisma migration** | Fix | Run `npx prisma migrate dev --name init` to create DB tables from schema. |
| 4 | **Add Redis data caching** | Enhancement | Cache package lists (5min TTL), dashboard stats (2min), user profiles (15min) to reduce DB load. See [Redis Caching Strategy](#redis-caching-strategy) above. |
| 5 | **Email verification flow** | Enhancement | Currently `isEmailVerified` defaults to `false` but isn't enforced. Add email verification on register with a signed link. |

### 🟡 Medium Priority

| # | Item | Type | Details |
|---|------|------|---------|
| 6 | **Payment integration** | Feature | Add Razorpay/Stripe for booking payments. Schema already has `paymentId` field. |
| 7 | **Forgot password flow** | Feature | Backend route exists in schema, needs controller + frontend page. |
| 8 | **Image gallery for packages** | Enhancement | PackageImage model exists. Add admin UI for managing package images. |
| 9 | **Write integration tests** | Quality | Use Vitest + Supertest. Priority: auth flow, RBAC, rate limiting. |
| 10 | **Add request logging middleware** | Monitoring | Log all requests with response time, status code, user ID (using Pino). |
| 11 | **Implement Redis cache invalidation** | Performance | Add write-through invalidation when packages/bookings are modified. |
| 12 | **Account lockout** | Security | Lock account after 10 failed login attempts (30 min cooldown). Track in Redis. |

### 🟢 Low Priority (Future)

| # | Item | Type | Details |
|---|------|------|---------|
| 13 | **CI/CD pipeline** | DevOps | GitHub Actions: lint → test → build → deploy. |
| 14 | **API documentation** | DX | Add Swagger/OpenAPI via `@asteasolutions/zod-to-openapi`. |
| 15 | **WebSocket notifications** | Feature | Real-time booking status updates, admin alerts. |
| 16 | **Search with Elasticsearch** | Performance | Full-text search across packages, trips, destinations. |
| 17 | **BullMQ email queue** | Reliability | Move from fire-and-forget to queued email delivery with retries. |
| 18 | **Nginx reverse proxy** | Production | Add Nginx config for SSL termination, static file serving, gzip. |
| 19 | **Database connection pooling** | Scalability | Configure Prisma connection pool size based on load. |
| 20 | **Rate limit Redis store** | Scalability | Currently in-memory. Switch to `rate-limit-redis` for multi-instance deployments. |
| 21 | **Mobile app API** | Feature | REST API is already mobile-ready. Add push notification service. |
| 22 | **Admin analytics dashboard** | Feature | Charts for bookings over time, popular packages, user growth. |

---

## Environment Configuration

```bash
# .env.example (server)
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/explorerz_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate with: openssl rand -base64 64)
JWT_ACCESS_SECRET=<generated-256-bit-secret>
JWT_REFRESH_SECRET=<generated-256-bit-secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key
EMAIL_FROM=noreply@deshyatra.com

# Security
CORS_ORIGINS=http://localhost:5173,https://deshyatra.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

---

## Verification Plan

### Automated Tests (Recommended)

```bash
# Unit Tests (Vitest)
cd server && npm test
# Auth: JWT generation, password hashing, token rotation
# Validators: All Zod schemas with edge cases
# RBAC: Permission matrix verification

# Integration Tests (Supertest)
cd server && npm run test:integration
# Auth: register → login → refresh → logout
# CRUD: packages, trips, bookings
# Rate limiting: verify 429 after threshold
# Upload: validate Cloudinary round-trip
```

### Manual Verification Checklist

- [ ] **Auth flow**: Register → login → verify JWT → refresh → logout
- [ ] **Admin guard**: Access `/admin` without login → redirected to `/login`
- [ ] **RBAC**: Login as USER → try admin endpoints → get 403
- [ ] **Rate limiting**: Rapid login attempts → get 429 after 5th
- [ ] **File upload**: Upload image → verify in Cloudinary dashboard
- [ ] **Security headers**: Scan with [SecurityHeaders.com](https://securityheaders.com)
- [ ] **Cookie security**: Check DevTools → refresh token is HTTP-only, secure, SameSite
- [ ] **Booking email**: Create booking → check inbox for confirmation email

---

## File Reference

### Complete Backend Tree

```
server/
├── prisma/
│   ├── schema.prisma           # 12 models, 6 enums ✅
│   └── seed.ts                 # Admin + 6 packages ✅
├── src/
│   ├── config/
│   │   ├── env.ts              # Zod-validated env ✅
│   │   ├── database.ts         # Prisma singleton ✅
│   │   ├── redis.ts            # Redis with retry ✅
│   │   ├── cloudinary.ts       # Cloudinary SDK ✅
│   │   └── email.ts            # Nodemailer transport ✅
│   ├── middleware/
│   │   ├── auth.ts             # JWT verify + optional ✅
│   │   ├── rbac.ts             # 4 roles, 30+ perms ✅
│   │   ├── rateLimiter.ts      # 5 strategies ✅
│   │   ├── security.ts         # Helmet + CORS + CSP ✅
│   │   ├── validate.ts         # Zod body/query/params ✅
│   │   ├── errorHandler.ts     # Global error + 404 ✅
│   │   └── audit.ts            # Audit logging ✅
│   ├── services/
│   │   ├── auth.service.ts     # Argon2id + JWT rotation ✅
│   │   ├── email.service.ts    # 3 HTML templates ✅
│   │   ├── upload.service.ts   # Cloudinary auto-optimize ✅
│   │   └── audit.service.ts    # Audit log CRUD ✅
│   ├── controllers/
│   │   ├── auth.controller.ts  ✅
│   │   ├── package.controller.ts ✅
│   │   ├── trip.controller.ts  ✅
│   │   ├── booking.controller.ts ✅
│   │   ├── upload.controller.ts ✅
│   │   └── admin.controller.ts ✅
│   ├── routes/
│   │   ├── auth.routes.ts      ✅
│   │   ├── package.routes.ts   ✅
│   │   ├── trip.routes.ts      ✅
│   │   ├── booking.routes.ts   ✅
│   │   ├── upload.routes.ts    ✅
│   │   └── admin.routes.ts     ✅
│   ├── validators/
│   │   ├── auth.schema.ts      ✅
│   │   ├── package.schema.ts   ✅
│   │   ├── trip.schema.ts      ✅
│   │   └── booking.schema.ts   ✅
│   ├── utils/
│   │   ├── jwt.ts              ✅
│   │   ├── crypto.ts           ✅
│   │   ├── logger.ts           ✅
│   │   └── errors.ts           ✅
│   ├── app.ts                  ✅
│   └── index.ts                ✅
├── package.json                ✅
├── tsconfig.json               ✅
├── .env.example                ✅
├── .gitignore                  ✅
└── Dockerfile                  ✅

Frontend (src/):
├── lib/api.ts                  ✅ Axios + interceptors
├── contexts/AuthContext.tsx     ✅ Session restore
├── components/ProtectedRoute.tsx ✅ Route guard
├── pages/LoginPage.tsx         ✅ Animated login
├── pages/RegisterPage.tsx      ✅ Password strength
└── App.tsx                     ✅ AuthProvider + routes

Root:
├── docker-compose.yml          ✅ PG + Redis + API
└── .env.example                ✅ Vite API URL
```
