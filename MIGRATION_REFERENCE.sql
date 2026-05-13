-- ============================================================================
-- Migration: Add Enquiry Model
-- Description: Creates the enquiries table for managing customer enquiries
-- Date: 2026-05-11
-- ============================================================================

-- Create EnquiryStatus enum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'CLOSED');

-- Create enquiries table
CREATE TABLE "enquiries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "packageTitle" VARCHAR(200) NOT NULL,
    "packagePrice" DECIMAL(10,2) NOT NULL,
    "numberOfPeople" INTEGER NOT NULL DEFAULT 1,
    "travelDate" DATE,
    "selectedRoute" VARCHAR(200),
    "budgetMin" DECIMAL(10,2) NOT NULL,
    "budgetMax" DECIMAL(10,2) NOT NULL,
    "remarks" TEXT,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better query performance
CREATE INDEX "enquiries_status_idx" ON "enquiries"("status");
CREATE INDEX "enquiries_createdAt_idx" ON "enquiries"("createdAt");
CREATE INDEX "enquiries_email_idx" ON "enquiries"("email");

-- ============================================================================
-- Rollback Instructions
-- ============================================================================
-- To rollback this migration, run:
-- DROP TABLE "enquiries";
-- DROP TYPE "EnquiryStatus";

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify table exists
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'enquiries'
ORDER BY ordinal_position;

-- Verify indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'enquiries';

-- Verify enum type
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'EnquiryStatus'::regtype
ORDER BY enumsortorder;

-- ============================================================================
-- Sample Data (for testing)
-- ============================================================================

-- Insert sample enquiry
INSERT INTO "enquiries" (
    "name",
    "email",
    "phone",
    "city",
    "packageTitle",
    "packagePrice",
    "numberOfPeople",
    "travelDate",
    "budgetMin",
    "budgetMax",
    "remarks",
    "status"
) VALUES (
    'John Doe',
    'john.doe@example.com',
    '9876543210',
    'Mumbai',
    'Amarnath Yatra - 5 Days',
    25000.00,
    2,
    '2026-07-15',
    25000.00,
    35000.00,
    'Looking for vegetarian food options',
    'NEW'
);

-- ============================================================================
-- Useful Queries for Admin
-- ============================================================================

-- Count enquiries by status
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM "enquiries"
GROUP BY status
ORDER BY count DESC;

-- Recent enquiries (last 7 days)
SELECT 
    "name",
    "email",
    "packageTitle",
    "status",
    "createdAt"
FROM "enquiries"
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
ORDER BY "createdAt" DESC;

-- Top packages by enquiry count
SELECT 
    "packageTitle",
    COUNT(*) as enquiry_count,
    AVG("numberOfPeople") as avg_people,
    AVG("budgetMax") as avg_budget
FROM "enquiries"
GROUP BY "packageTitle"
ORDER BY enquiry_count DESC
LIMIT 10;

-- Conversion rate by package
SELECT 
    "packageTitle",
    COUNT(*) as total_enquiries,
    SUM(CASE WHEN status = 'CONVERTED' THEN 1 ELSE 0 END) as converted,
    ROUND(
        SUM(CASE WHEN status = 'CONVERTED' THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
        2
    ) as conversion_rate
FROM "enquiries"
GROUP BY "packageTitle"
HAVING COUNT(*) >= 5
ORDER BY conversion_rate DESC;

-- Enquiries pending action (NEW or CONTACTED)
SELECT 
    "id",
    "name",
    "email",
    "phone",
    "packageTitle",
    "status",
    "createdAt",
    EXTRACT(EPOCH FROM (NOW() - "createdAt")) / 3600 as hours_since_created
FROM "enquiries"
WHERE status IN ('NEW', 'CONTACTED')
ORDER BY "createdAt" ASC;

-- Monthly enquiry trends
SELECT 
    DATE_TRUNC('month', "createdAt") as month,
    COUNT(*) as total_enquiries,
    SUM(CASE WHEN status = 'CONVERTED' THEN 1 ELSE 0 END) as converted,
    SUM("numberOfPeople") as total_people,
    AVG("budgetMax") as avg_budget
FROM "enquiries"
GROUP BY DATE_TRUNC('month', "createdAt")
ORDER BY month DESC;

-- Enquiries by city
SELECT 
    "city",
    COUNT(*) as enquiry_count,
    AVG("numberOfPeople") as avg_group_size
FROM "enquiries"
GROUP BY "city"
ORDER BY enquiry_count DESC
LIMIT 20;

-- Response time analysis (time to first status change)
WITH first_update AS (
    SELECT 
        e."id",
        e."createdAt",
        MIN(al."createdAt") as first_contact
    FROM "enquiries" e
    LEFT JOIN "audit_logs" al ON 
        al."resourceId" = e."id" AND 
        al."action" = 'ENQUIRY_STATUS_UPDATED'
    GROUP BY e."id", e."createdAt"
)
SELECT 
    AVG(EXTRACT(EPOCH FROM (first_contact - "createdAt")) / 3600) as avg_response_hours,
    MIN(EXTRACT(EPOCH FROM (first_contact - "createdAt")) / 3600) as min_response_hours,
    MAX(EXTRACT(EPOCH FROM (first_contact - "createdAt")) / 3600) as max_response_hours
FROM first_update
WHERE first_contact IS NOT NULL;

-- ============================================================================
-- Maintenance Queries
-- ============================================================================

-- Archive old closed enquiries (older than 1 year)
-- Note: Create an archive table first
CREATE TABLE "enquiries_archive" (LIKE "enquiries" INCLUDING ALL);

INSERT INTO "enquiries_archive"
SELECT * FROM "enquiries"
WHERE status = 'CLOSED' 
  AND "updatedAt" < NOW() - INTERVAL '1 year';

DELETE FROM "enquiries"
WHERE status = 'CLOSED' 
  AND "updatedAt" < NOW() - INTERVAL '1 year';

-- Vacuum table after large deletes
VACUUM ANALYZE "enquiries";

-- ============================================================================
-- Performance Optimization
-- ============================================================================

-- Add composite index for common query patterns
CREATE INDEX "enquiries_status_created_idx" ON "enquiries"("status", "createdAt" DESC);

-- Add partial index for active enquiries
CREATE INDEX "enquiries_active_idx" ON "enquiries"("createdAt" DESC)
WHERE status IN ('NEW', 'CONTACTED');

-- Analyze table statistics
ANALYZE "enquiries";

-- ============================================================================
-- Security & Compliance
-- ============================================================================

-- Grant permissions (adjust roles as needed)
GRANT SELECT, INSERT ON "enquiries" TO app_user;
GRANT SELECT, UPDATE ON "enquiries" TO admin_user;

-- Create view for PII-redacted enquiries (for analytics)
CREATE VIEW "enquiries_analytics" AS
SELECT 
    "id",
    LEFT("email", 3) || '***@' || SPLIT_PART("email", '@', 2) as email_masked,
    LEFT("phone", 3) || 'XXXXXXX' as phone_masked,
    "city",
    "packageTitle",
    "packagePrice",
    "numberOfPeople",
    "travelDate",
    "budgetMin",
    "budgetMax",
    "status",
    "createdAt",
    "updatedAt"
FROM "enquiries";

-- ============================================================================
-- Backup & Restore
-- ============================================================================

-- Backup enquiries table
-- pg_dump -U postgres -d explorerz_db -t enquiries -f enquiries_backup.sql

-- Restore enquiries table
-- psql -U postgres -d explorerz_db -f enquiries_backup.sql

-- Export to CSV
-- COPY (SELECT * FROM enquiries) TO '/path/to/enquiries.csv' WITH CSV HEADER;

-- ============================================================================
-- Monitoring Queries
-- ============================================================================

-- Table size
SELECT 
    pg_size_pretty(pg_total_relation_size('enquiries')) as total_size,
    pg_size_pretty(pg_relation_size('enquiries')) as table_size,
    pg_size_pretty(pg_indexes_size('enquiries')) as indexes_size;

-- Row count
SELECT COUNT(*) as total_rows FROM "enquiries";

-- Dead tuples (for vacuum monitoring)
SELECT 
    schemaname,
    relname,
    n_dead_tup,
    n_live_tup,
    ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_percentage
FROM pg_stat_user_tables
WHERE relname = 'enquiries';
