# 🔧 Clean Migration Setup

This folder has been cleaned up to have a single, idempotent initial migration.

## 📋 What Was Done

1. ✅ Deleted all old migration folders (4 old migrations removed)
2. ✅ Created a single `20250127000000_init` migration
3. ✅ Made migration **idempotent** (safe to run multiple times)
4. ✅ Handles existing tables gracefully with `CREATE TABLE IF NOT EXISTS`

## 🚀 How to Apply (Choose ONE method)

### Method 1: Fresh Database (Recommended for New Environments)

```bash
# Drop and recreate database (WARNING: Deletes all data!)
npx prisma migrate reset --force

# This will:
# - Drop the database
# - Create it fresh
# - Apply the init migration
# - Run seed if available
```

### Method 2: Existing Database with Data (Safe Method)

```bash
# Step 1: Mark migration as applied without running it
npx prisma migrate resolve --applied 20250127000000_init

# Step 2: Generate Prisma Client
npx prisma generate

# Step 3: Verify everything is in sync
npx prisma migrate status
```

### Method 3: Existing Database - Manual Sync

If you have an existing database with tables already created:

```bash
# Step 1: Run the migration SQL (it's idempotent, so safe to run)
psql $DATABASE_URL -f prisma/migrations/20250127000000_init/migration.sql

# Step 2: Reset the migrations table
psql $DATABASE_URL -f prisma/migrations/reset-migrations.sql

# Step 3: Generate Prisma Client
npx prisma generate

# Step 4: Verify
npx prisma migrate status
```

## 🔄 For Different Computers

When moving to a different computer:

1. **Pull the latest code** with the new migration structure
2. **Choose the appropriate method** above based on your situation:
   - **Fresh setup**: Use Method 1
   - **Existing data**: Use Method 2 or 3

## 📊 Database Schema

The init migration creates these tables:

- ✅ `Episode` - Game episodes
- ✅ `User` - User accounts with roles
- ✅ `Map` - Maps/levels
- ✅ `Tracker` - Boss trackers (with countdown & isFull)
- ✅ `MapFavorite` - User's favorite maps
- ✅ `ChatMessage` - Chat messages
- ✅ `Channel` - Channels
- ✅ `ReminderSettings` - Voice reminder settings (NEW!)
- ✅ `Role` enum - User roles (VIEWER, CHATTER, EDITOR, ADMIN)

## ✨ Key Features

### Idempotent SQL
All table creations use `CREATE TABLE IF NOT EXISTS`, so:
- ✅ Safe to run on fresh database
- ✅ Safe to run on existing database
- ✅ Won't fail if tables already exist
- ✅ Won't drop existing data

### Foreign Keys with Checks
All foreign keys check for existence before creation:
```sql
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Map_episodeNumber_fkey'
    ) THEN
        ALTER TABLE "Map" ADD CONSTRAINT ...
    END IF;
END $$;
```

## 🛠️ Troubleshooting

### "Migration already applied"
```bash
npx prisma migrate resolve --applied 20250127000000_init
```

### "Tables already exist"
The migration is idempotent - just run it! It will skip existing tables.

### "Foreign key already exists"
The migration checks for this - just run it!

### Starting Fresh
```bash
# Drop everything and start over
npx prisma migrate reset --force
npx prisma generate
```

## 📝 Adding New Migrations

After this clean init, add new migrations normally:

```bash
# 1. Update schema.prisma
# 2. Create migration
npx prisma migrate dev --name your_migration_name

# 3. Generate client
npx prisma generate
```

## ⚠️ Important Notes

1. **Backup your data** before any migration operations
2. **Test migrations** in development first
3. **The init migration is safe** to run multiple times
4. **All computers** should use the same migration strategy

## 🎯 Verification

After applying migrations, verify with:

```bash
# Check migration status
npx prisma migrate status

# Should show:
# ✓ 20250127000000_init applied

# Introspect database to verify schema
npx prisma db pull

# Compare with your schema.prisma - they should match!
```

---

**Last Updated:** January 27, 2025
**Migration Version:** 20250127000000_init (Clean Single Migration)
