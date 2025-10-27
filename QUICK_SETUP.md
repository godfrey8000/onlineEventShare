# Quick Setup for New Computer

## Prerequisites
- PostgreSQL installed and running
- Node.js installed
- Database created (e.g., `trackerdb`)

## Option 1: Fresh Database (Recommended - Fastest)

This is the simplest approach for a new computer:

```bash
# 1. Install dependencies
npm install

# 2. Update .env file with your database credentials
# DATABASE_URL="postgresql://username:password@localhost:5432/trackerdb"

# 3. Push schema to database (creates all tables)
npx prisma db push

# 4. Generate Prisma client
npx prisma generate

# 5. Start server
npm run dev
```

That's it! Your database is ready with all tables including the new `reminderEnabled` field.

---

## Option 2: Using Migrations (If You Need Migration History)

If you want to maintain migration history:

```bash
# 1. Install dependencies
npm install

# 2. Update .env file
# DATABASE_URL="postgresql://username:password@localhost:5432/trackerdb"

# 3. Apply all migrations
npx prisma migrate deploy

# 4. Generate Prisma client
npx prisma generate

# 5. Start server
npm run dev
```

---

## Verify Setup

Open Prisma Studio to verify all tables exist:

```bash
npx prisma studio
```

Check that the `Tracker` table has these columns:
- id
- episodeNumber
- mapId
- userId
- channelId
- level
- status
- nickname
- createdAt
- updatedAt
- countdownEndsAt
- isFull
- reminderEnabled ← This should exist

---

## If You Get Errors

### "Type Role already exists"
Your database already has some tables. Either:
- Drop the database and recreate it: `DROP DATABASE trackerdb; CREATE DATABASE trackerdb;`
- Or use `npx prisma db push --force-reset` (WARNING: Deletes all data)

### "Migration failed"
Use the fresh approach instead:
```bash
npx prisma db push --force-reset
npx prisma generate
```

### "Cannot connect to database"
Check your .env DATABASE_URL is correct and PostgreSQL is running.

---

## Manual SQL Application (Advanced)

If you prefer to run SQL manually:

```bash
# Connect to your database
psql -U postgres -d trackerdb

# Then run:
\i prisma/migrations/combined_init.sql

# Exit psql
\q

# Generate client
npx prisma generate
```

But you'll need to create the `combined_init.sql` file first (see MIGRATION_SETUP_GUIDE.md).
