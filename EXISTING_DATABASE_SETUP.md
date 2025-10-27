# Setup Guide for Existing Database

## Your Situation: Database with Older Schema

When you have an existing database from a previous version and you get migration conflicts, here's how to resolve it:

---

## ✅ Solution: Verify & Sync Approach

### Step 1: Check Your Database Schema

Run the schema checker script:

```bash
node check-schema.js
```

This will show you:
- ✅ What columns exist in your database
- ❌ What columns are missing
- 📝 Your migration history

### Step 2: Understand the Results

**If all columns exist (✓):**
- Your database is up to date!
- You just need to generate the Prisma client
- Skip to Step 4

**If columns are missing (✗):**
- You need to add them manually
- Go to Step 3

### Step 3: Add Missing Columns (Only if needed)

If `check-schema.js` shows missing columns, create this SQL file:

**`fix-schema.sql`:**
```sql
-- Add missing columns (idempotent - won't error if already exists)

-- Add reminderEnabled if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Tracker' AND column_name = 'reminderEnabled'
  ) THEN
    ALTER TABLE "Tracker" ADD COLUMN "reminderEnabled" BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE 'Added reminderEnabled column';
  ELSE
    RAISE NOTICE 'reminderEnabled column already exists';
  END IF;
END $$;

-- Add countdownEndsAt if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Tracker' AND column_name = 'countdownEndsAt'
  ) THEN
    ALTER TABLE "Tracker" ADD COLUMN "countdownEndsAt" TIMESTAMP(3);
    RAISE NOTICE 'Added countdownEndsAt column';
  ELSE
    RAISE NOTICE 'countdownEndsAt column already exists';
  END IF;
END $$;

-- Add isFull if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Tracker' AND column_name = 'isFull'
  ) THEN
    ALTER TABLE "Tracker" ADD COLUMN "isFull" BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE 'Added isFull column';
  ELSE
    RAISE NOTICE 'isFull column already exists';
  END IF;
END $$;
```

**Apply it:**

**Option A: Using Prisma (Recommended):**
```bash
npx prisma db execute --file fix-schema.sql
```

**Option B: Using psql:**
```bash
psql -U your_username -d trackerdb -f fix-schema.sql
```

**Option C: Using pgAdmin:**
1. Open pgAdmin
2. Navigate to your database
3. Open Query Tool
4. Paste the SQL from `fix-schema.sql`
5. Execute

### Step 4: Resolve Migration History

After your database has all the columns, you need to tell Prisma that migrations are applied:

```bash
# Mark all existing migrations as applied
npx prisma migrate resolve --applied 20251027000000_add_reminder_enabled
npx prisma migrate resolve --applied 20251026010000_remove_phase_one_time
npx prisma migrate resolve --applied 20251026000000_add_phase_one_time
npx prisma migrate resolve --applied 20251018191306_add_is_full
npx prisma migrate resolve --applied 20251018163837_add_countdown_timer
```

Or simpler - if your database is correct, just:

```bash
# This tells Prisma to sync migration status with database
npx prisma migrate resolve --applied $(ls prisma/migrations | grep -E '^[0-9]')
```

### Step 5: Generate Prisma Client

```bash
npx prisma generate
```

### Step 6: Verify Everything Works

```bash
# Check schema again
node check-schema.js

# Start your server
npm run dev
```

---

## 🚨 Common Errors & Solutions

### Error: "Migration X failed to apply cleanly"

**Cause:** Migration tries to create something that already exists

**Solution:**
1. Check what exists: `node check-schema.js`
2. If columns exist, mark migration as resolved: `npx prisma migrate resolve --applied migration_name`
3. If columns missing, add them with `fix-schema.sql`

### Error: "Type 'Role' already exists"

**Cause:** Your database already has the Role enum

**Solution:**
```bash
npx prisma migrate resolve --applied 20251014000000_init
npx prisma generate
```

### Error: "Cannot generate client"

**Cause:** Schema doesn't match database

**Solution:**
1. Run `node check-schema.js` to see differences
2. Either:
   - Update database to match schema (use `fix-schema.sql`)
   - Or update schema to match database (edit `schema.prisma`)
3. Then `npx prisma generate`

---

## 🎯 Quick Fix (Your Specific Case)

Based on your database check, **everything is already correct**! Just run:

```bash
# 1. Make sure schema.prisma has reminderEnabled (already done ✓)
# 2. Generate client
npx prisma generate

# 3. Start server
npm run dev
```

**That's it!** Your database already has all the required columns from the previous session.

---

## 📊 Understanding Your Migration History

You have these migrations applied (in order):
1. `20251013160241_init` - Initial database setup
2. `20251014000000_init` - Duplicate init (safe to ignore)
3. `20251018163837_add_countdown_timer` - Added countdownEndsAt
4. `20251018191306_add_is_full` - Added isFull flag
5. `20251026000000_add_phase_one_time` - Temporarily added phaseOneTime
6. `20251026010000_remove_phase_one_time` - Removed phaseOneTime (not needed)
7. `20251027000000_add_reminder_enabled` - Added reminderEnabled

All of these have been applied to your database successfully! ✅

---

## 🔄 For Future: Clean Migration Approach

To avoid multiple migrations in the future, you can:

1. **Keep current setup** (easiest - just continue as is)

2. **Or squash migrations** (advanced - create one combined init):
   ```bash
   # Backup your data first!
   pg_dump -U postgres -d trackerdb > backup.sql

   # Drop all tables
   npx prisma migrate reset --force

   # Push schema (creates all tables fresh)
   npx prisma db push

   # Restore data
   psql -U postgres -d trackerdb < backup.sql
   ```

**Recommendation:** Keep your current setup. It's working perfectly!

---

## ✅ Verification Checklist

- [x] Database has all required columns
- [x] Migrations are marked as applied
- [x] Prisma client is generated
- [ ] Server starts without errors
- [ ] Can create/edit trackers
- [ ] ReminderEnabled field is accessible in API

Run the server and test to complete the checklist!
