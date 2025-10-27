# Database Migration Setup Guide

## For Fresh/New Database (Recommended)

If you're setting up on a new computer with a fresh PostgreSQL database:

### Step 1: Update Schema
Make sure your `prisma/schema.prisma` has the `reminderEnabled` field in Tracker model:

```prisma
model Tracker {
  id              Int       @id @default(autoincrement())
  episodeNumber   Int
  mapId           Int
  userId          Int?
  channelId       Int
  level           Int?
  status          Decimal   @default(0)
  nickname        String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  countdownEndsAt DateTime?
  isFull          Boolean   @default(false)
  reminderEnabled Boolean   @default(false)  // ← ADD THIS LINE
  episode         Episode   @relation(fields: [episodeNumber], references: [episodeId])
  map             Map       @relation(fields: [mapId], references: [id])
  user            User?     @relation(fields: [userId], references: [id])
}
```

### Step 2: Reset Migrations (Fresh Start)

```bash
# Remove all migration folders (keep instructions.md and migration_lock.toml)
rm -rf prisma/migrations/20*

# Push schema directly to database (creates all tables)
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### Step 3: Verify Database

```bash
npx prisma studio
```

This will open Prisma Studio where you can verify all tables exist with correct columns.

---

## For Existing Database with Data (Migration Approach)

If you have existing data you want to keep:

### Step 1: Check Current Migration Status

```bash
# Connect to your PostgreSQL database
psql -U your_username -d trackerdb

# Check what migrations are recorded
SELECT * FROM "_prisma_migrations" ORDER BY "started_at";
```

### Step 2: Apply Missing Migrations

```bash
# This will apply any pending migrations
npx prisma migrate deploy
```

### Step 3: Generate Client

```bash
npx prisma generate
```

---

## Troubleshooting

### Error: "Migration X failed to apply"

If you get migration errors, you can reset the migration history:

```bash
# WARNING: This will drop all data!
npx prisma migrate reset

# Or manually in psql:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Then apply fresh:
npx prisma db push
npx prisma generate
```

### Error: "Column already exists"

The migrations are idempotent, but if you get column exists errors:

```sql
-- Run this in psql to check what exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Tracker';
```

If `reminderEnabled` exists, you're good. If not:

```sql
ALTER TABLE "Tracker" ADD COLUMN "reminderEnabled" BOOLEAN NOT NULL DEFAULT false;
```

---

## Manual SQL Application (Alternative)

If you prefer to apply SQL manually instead of using Prisma migrate:

### Step 1: Create a combined migration SQL file

Create `prisma/migrations/combined_init.sql`:

```sql
-- Create enums
CREATE TYPE "Role" AS ENUM ('VIEWER', 'CHATTER', 'EDITOR', 'ADMIN');

-- Create tables
CREATE TABLE "User" (
    "id" SERIAL PRIMARY KEY,
    "username" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "nickname" TEXT,
    "role" "Role" DEFAULT 'VIEWER' NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "Episode" (
    "id" SERIAL PRIMARY KEY,
    "episodeId" INTEGER UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Map" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("episodeNumber") REFERENCES "Episode"("episodeId")
);

CREATE TABLE "Tracker" (
    "id" SERIAL PRIMARY KEY,
    "episodeNumber" INTEGER NOT NULL,
    "mapId" INTEGER NOT NULL,
    "userId" INTEGER,
    "channelId" INTEGER NOT NULL,
    "level" INTEGER,
    "status" DECIMAL(65,30) DEFAULT 0 NOT NULL,
    "nickname" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "countdownEndsAt" TIMESTAMP(3),
    "isFull" BOOLEAN DEFAULT false NOT NULL,
    "reminderEnabled" BOOLEAN DEFAULT false NOT NULL,
    FOREIGN KEY ("episodeNumber") REFERENCES "Episode"("episodeId"),
    FOREIGN KEY ("mapId") REFERENCES "Map"("id"),
    FOREIGN KEY ("userId") REFERENCES "User"("id")
);

CREATE TABLE "MapFavorite" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "mapId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id"),
    FOREIGN KEY ("mapId") REFERENCES "Map"("id"),
    UNIQUE("userId", "mapId")
);

CREATE TABLE "ChatMessage" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id")
);

CREATE TABLE "Channel" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL
);

CREATE TABLE "ReminderSettings" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER UNIQUE NOT NULL,
    "enabled" BOOLEAN DEFAULT true NOT NULL,
    "volume" DOUBLE PRECISION DEFAULT 1.0 NOT NULL,
    "rate" DOUBLE PRECISION DEFAULT 1.0 NOT NULL,
    "pitch" DOUBLE PRECISION DEFAULT 1.0 NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id")
);

-- Create migrations tracking table
CREATE TABLE "_prisma_migrations" (
    "id" VARCHAR(36) PRIMARY KEY,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMP(3),
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "applied_steps_count" INTEGER DEFAULT 0 NOT NULL
);
```

### Step 2: Apply the SQL

```bash
# Method 1: Using psql
psql -U your_username -d trackerdb -f prisma/migrations/combined_init.sql

# Method 2: Using Prisma
npx prisma db execute --file prisma/migrations/combined_init.sql
```

### Step 3: Mark migration as applied

```bash
npx prisma migrate resolve --applied 20251027000000_add_reminder_enabled

# Or manually in psql:
INSERT INTO "_prisma_migrations" (
    "id",
    "checksum",
    "finished_at",
    "migration_name",
    "started_at",
    "applied_steps_count"
) VALUES (
    gen_random_uuid()::text,
    'manual_combined_init',
    NOW(),
    '20251027000000_combined_init',
    NOW(),
    1
);
```

### Step 4: Generate Prisma Client

```bash
npx prisma generate
```

---

## Recommended: Clean Approach

For a new computer, I recommend:

1. **Update schema.prisma** - Add `reminderEnabled Boolean @default(false)` to Tracker model
2. **Run `npx prisma db push`** - Creates all tables from schema (no migrations needed)
3. **Run `npx prisma generate`** - Generates client
4. **Start server** - Everything should work

This avoids migration complexity entirely and is perfect for development/new setups.
