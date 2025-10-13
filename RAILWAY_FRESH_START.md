# 🔄 Railway Fresh Start - Clean Database Setup

This guide will help you start completely fresh with a new database and seed data.

## 📋 What We're Doing

1. ✅ Delete old PostgreSQL database
2. ✅ Create fresh PostgreSQL database
3. ✅ Update Dockerfile to auto-run seed
4. ✅ Deploy with fresh schema + seed data
5. ✅ Fix CORS configuration

---

## 🚀 Step-by-Step Instructions

### **Step 1: Delete Old Database on Railway**

1. Go to **Railway dashboard**
2. Click on **PostgreSQL service** (the database icon)
3. Go to **"Settings"** tab (bottom of sidebar)
4. Scroll all the way down
5. Find **"Danger"** section
6. Click **"Delete Service from All Environments"**
7. Type the service name to confirm
8. Click **"Delete"**

⏳ Wait 10 seconds for deletion to complete

---

### **Step 2: Create Fresh Database**

1. Still in Railway dashboard
2. Click **"+ New"** button (top right)
3. Select **"Database"**
4. Click **"Add PostgreSQL"**
5. Railway will create a brand new empty database

✅ Database created!

---

### **Step 3: Update CORS_ORIGIN Variable**

**IMPORTANT:** Fix the CORS issue we saw in logs.

1. Click on your **app service** (main application)
2. Go to **"Variables"** tab
3. Find or add `CORS_ORIGIN`

**Get your Railway URL first:**
1. Click **"Settings"** tab
2. Find **"Domains"** section
3. See your URL (e.g., `https://xyz.up.railway.app`)
4. Copy it

**Update CORS_ORIGIN:**
```env
CORS_ORIGIN=https://your-actual-railway-url.up.railway.app
```

(Replace with YOUR actual URL!)

---

### **Step 4: Verify Environment Variables**

Your app service should have these variables:

```env
NODE_ENV=production
JWT_SECRET=<your-64-char-secret>
CORS_ORIGIN=https://your-app.up.railway.app
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

**Note:** `DATABASE_URL` should auto-populate. If not:
1. Click **Postgres service** → **"Variables"**
2. Copy `DATABASE_URL` value
3. Go back to app service → **"Variables"**
4. Add it manually

---

### **Step 5: Push Updated Code**

```bash
git add .
git commit -m "Add auto-seed on deployment + fix CORS"
git push
```

Railway will automatically detect the push and start deploying.

---

### **Step 6: Monitor Deployment**

1. Go to **Deployments** tab
2. Click on latest deployment
3. Watch **"Deploy Logs"**

**Look for these success messages:**

```
✅ Prisma schema loaded from prisma/schema.prisma
✅ The following migration(s) have been applied:
✅ migrations/20251008094453_init/migration.sql
✅ All migrations have been successfully applied.

🌱 Seeding database...
✅ Episodes created: LEVEL 1-9 地圖, LEVEL 10-19 地圖...
✅ Maps created
✅ Channels created
🎉 Seed completed!

✅ Server running on http://localhost:8080
✅ CORS enabled for: https://your-app.up.railway.app
✅ Socket.io ready
```

---

## ✅ Verification

### **Test 1: Health Check**
```bash
curl https://your-app.up.railway.app/health
```
Should return: `{"ok":true}`

### **Test 2: Check Episodes**
```bash
curl https://your-app.up.railway.app/api/episodes
```
Should return array of 11 episodes

### **Test 3: Open in Browser**
1. Go to `https://your-app.up.railway.app`
2. Open DevTools Console (F12)
3. Should see: `[Socket] Connected!`
4. Should see NO CORS errors
5. Episodes and maps should load

### **Test 4: Register/Login**
1. Try registering a new user
2. Try logging in
3. Test tracker creation
4. Test real-time features

---

## 🐛 Troubleshooting

### Seed fails with "unique constraint violation"

This means seed data already exists (database wasn't truly empty).

**Solution:**
1. Delete the PostgreSQL service again
2. Create new one
3. Redeploy

### CORS errors in browser

Check `CORS_ORIGIN` variable:
```bash
# In Railway app service Variables tab
CORS_ORIGIN=https://your-actual-url.up.railway.app
```

**Common mistakes:**
- ❌ `http://` instead of `https://`
- ❌ Missing `https://` prefix
- ❌ Using `localhost:5173` instead of Railway URL
- ❌ Trailing slash at end

**Correct format:**
- ✅ `https://your-app.up.railway.app`

### Seed runs every restart

**Current behavior:** Seed runs on every deployment.

**Why it's okay:**
- We use `upsert` and `skipDuplicates`
- Seed won't create duplicates
- Just updates existing data if already there

**If you want to disable auto-seed:**

Edit Dockerfile line 55:
```dockerfile
# Before:
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/index.js"]

# After (no seed):
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
```

Then push again.

### DATABASE_URL not found

Make sure:
1. PostgreSQL service is running (green indicator)
2. App service has `DATABASE_URL` variable
3. Value is: `${{Postgres.DATABASE_URL}}`

**Manual fix:**
1. Delete `DATABASE_URL` variable from app
2. Re-add it: `${{Postgres.DATABASE_URL}}`
3. Save
4. Redeploy

---

## 📊 What Changed

### Files Modified:

**1. Dockerfile**
- Added: `COPY prisma/seed.js ./prisma/seed.js`
- Changed CMD to run seed: `node prisma/seed.js`

**2. package.json**
- Added: `"seed": "node prisma/seed.js"`
- Added: `"prisma": { "seed": "node prisma/seed.js" }`

**3. Seed behavior**
- Now runs automatically on every deployment
- Uses `upsert` and `skipDuplicates` to prevent errors

---

## 🎯 Summary

After following these steps, you'll have:

- ✅ Fresh PostgreSQL database
- ✅ Schema created by migrations
- ✅ Data populated by seed file:
  - 11 Episodes
  - 50+ Maps
  - 10 Channels
- ✅ Correct CORS configuration
- ✅ Working WebSocket
- ✅ Auto-seed on deployment

**Your app is now production-ready! 🚀**

---

## 💡 Manual Seed (If Needed)

If you ever need to run seed manually:

**Railway CLI method:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Run seed
railway run npm run seed
```

**Alternative: One-off command in Railway:**
1. Go to Railway dashboard
2. Click on your app service
3. Go to **"Settings"**
4. Find **"Deploy Triggers"**
5. Add one-time command: `npm run seed`

---

## 📞 Need Help?

Check deploy logs for specific errors:
- Railway Dashboard → Your Service → Deployments → Latest → Deploy Logs

Common log patterns:
- `Prisma schema validation` = DATABASE_URL missing
- `unique constraint` = Seed running on existing data (usually fine)
- `CORS` errors = Fix CORS_ORIGIN variable
- `vite: not found` = Already fixed in Dockerfile

