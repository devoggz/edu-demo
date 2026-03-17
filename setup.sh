#!/bin/bash
set -e

echo "🔧 EduTrack Setup"
echo ""

# Step 1: Clean stale Prisma artifacts
echo "1. Cleaning stale Prisma artifacts..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma
rm -rf node_modules/prisma
echo "   ✓ Cleaned"

# Step 2: Clean install
echo "2. Installing dependencies..."
npm install --legacy-peer-deps
echo "   ✓ Installed"

# Step 3: Generate Prisma client
echo "3. Generating Prisma client..."
npx prisma generate
echo "   ✓ Generated"

# Step 4: Run migrations
echo "4. Running database migrations..."
npx prisma migrate dev --name init
echo "   ✓ Migrations applied"

# Step 5: Seed database
echo "5. Seeding database..."
npx prisma db seed
echo "   ✓ Seeded"

echo ""
echo "✅ Setup complete! Run: npm run dev"
