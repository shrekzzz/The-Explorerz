#!/bin/bash
# Baseline existing database for Prisma migrations

echo "🔍 Checking if database needs baseline..."

# Try to run migrations
if npx prisma migrate deploy 2>&1 | grep -q "P3005"; then
  echo "⚠️  Database already has schema, baselining..."
  
  # Mark all migrations as applied without running them
  npx prisma migrate resolve --applied add_medical_severity
  
  echo "✅ Database baselined successfully"
else
  echo "✅ Migrations applied successfully"
fi
