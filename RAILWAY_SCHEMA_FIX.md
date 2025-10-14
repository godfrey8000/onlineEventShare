# 🔧 Fix Schema Mismatch on Railway

## Problem
```
The column `Tracker.episodeNumber` does not exist in the current database.
```

**Root Cause:** Old migration files have `Tracker.episodeId` but current schema uses `Tracker.episodeNumber`.

---

## ✅ Solution: Fresh Start with Correct Schema

### **Option A: Complete Fresh Start (Recommended)**

This creates a brand new migration matching your current schema:

```bash
# 1. Delete old migrations
rm -rf prisma/migrations

# 2. Create fresh migration from current schema
npx prisma migrate dev --name init

# 3. Push to GitHub
git add prisma/migrations
git commit -m "Fresh migration: Match current schema (episodeNumber)"
git push

# 4. On Railway:
# - Delete PostgreSQL service
# - Create new PostgreSQL
# - Redeploy (auto-deploys from git push)

# 5. Verify deployment
# - Check deploy logs for migration success
# - Test: curl https://tosmtrackerchicken.up.railway.app/api/episodes
```

---

### **Option B: Add Migration to Fix Existing DB**

If you want to keep the existing database and just fix the column name:

**Already created:** `prisma/migrations/20251013_fix_episodeNumber/migration.sql`

```bash
# 1. Push the fix migration
git add prisma/migrations
git commit -m "Add migration to rename episodeId to episodeNumber"
git push

# 2. Railway auto-deploys
# 3. Migration will run and rename the column
```

**⚠️ Warning:** This only works if you have data you want to keep. For a fresh start, use **Option A**.

---

## 🚀 Recommended Steps (Option A)

```bash
# Step 1: Clean slate
rm -rf prisma/migrations

# Step 2: Generate new migration
npx prisma migrate dev --name init
# This will:
# - Create new migration matching your schema.prisma
# - Test it on your local database

# Step 3: Commit and push
git add prisma/migrations
git commit -m "Fresh migration with correct schema"
git push

# Step 4: Railway
# Go to Railway dashboard:
# 1. Delete PostgreSQL service
# 2. Create new PostgreSQL service
# 3. Wait for auto-deploy (or manually trigger)

# Step 5: Verify
curl https://tosmtrackerchicken.up.railway.app/api/episodes
# Should return: []  (empty array but no error!)
```

---

## 📊 What Will Happen

### Before:
```sql
-- Old migration created:
CREATE TABLE "Tracker" (
    "episodeId" INTEGER,  -- ❌ Wrong!
    ...
)
```

### After:
```sql
-- New migration creates:
CREATE TABLE "Tracker" (
    "episodeNumber" INTEGER,  -- ✅ Correct!
    ...
)
```

---

## ✅ Verification

After deploying, check:

### 1. Railway Deploy Logs
```
✅ Prisma schema loaded
✅ Applying migration `20251013_init`
✅ Migration successful
✅ Seed completed
✅ Server running
```

### 2. Test APIs
```bash
# Episodes (should work)
curl https://tosmtrackerchicken.up.railway.app/api/episodes

# Maps (should work)
curl https://tosmtrackerchicken.up.railway.app/api/maps

# Health (should work)
curl https://tosmtrackerchicken.up.railway.app/health
```

### 3. Browser
- No "Failed to load episodes" errors
- Episodes and maps load
- No 500 errors in console

---

## 🐛 If Issues Persist

### Check Prisma Client Generation
```bash
# In Railway deploy logs, look for:
✅ Prisma Client generated
```

### Check Migration Applied
```bash
# In Railway deploy logs, look for:
✅ The following migration(s) have been applied:
migrations/
  └─ 20251013_init/
    └─ migration.sql
```

### Manual Prisma Generate
If Prisma client isn't generated, the Dockerfile already has:
```dockerfile
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && ..."]
```

---

## 💡 Why This Happened

Your schema evolved:
1. Started with `episodeId` in Tracker
2. Changed to `episodeNumber` in Tracker
3. But migration files still had old schema
4. Database created with old schema
5. Code tried to use new field name → ERROR!

**Solution:** Recreate migrations to match current schema.

---

## 🎯 TL;DR

```bash
# 1. Delete old migrations
rm -rf prisma/migrations

# 2. Create new migration
npx prisma migrate dev --name init

# 3. Push to GitHub
git add . && git commit -m "Fresh migration" && git push

# 4. Delete Railway PostgreSQL + Create new one

# 5. Wait for auto-deploy

# 6. Test
curl https://tosmtrackerchicken.up.railway.app/api/episodes
```

Done! 🎉
