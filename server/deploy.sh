#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Handle database migrations
echo "🗄️  Handling database migrations..."

# Check if migrations table exists
if npx prisma migrate status 2>&1 | grep -q "Database schema is not empty"; then
  echo "⚠️  Database already has schema"
  echo "🔄 Using db push to sync schema..."
  npx prisma db push --skip-generate --accept-data-loss
else
  echo "✅ Running migrations..."
  npx prisma migrate deploy
fi

echo "✅ Deployment complete!"
