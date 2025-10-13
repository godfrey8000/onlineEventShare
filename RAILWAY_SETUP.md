# 🚂 Railway.app Deployment - Step by Step

## ✅ Fixed Issues
- ✅ **Vite build error** - Fixed: Now installs all dependencies for build
- ✅ **Environment variables** - Set to use relative URLs

## 🚀 Quick Deployment Steps

### 1. Push Your Code to GitHub
```bash
git add .
git commit -m "Fix Dockerfile for Railway deployment"
git push
```

### 2. Setup Railway Project

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `tosmtrackerReborn`
5. Railway will start building immediately

### 3. Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will automatically create a database
4. The `DATABASE_URL` variable is automatically added

### 4. Configure Environment Variables

Click on your **app service** (not the database), then go to **"Variables"** tab:

**Add these variables:**

```env
NODE_ENV=production
JWT_SECRET=<paste-your-secret-here>
PORT=8080
```

**For CORS_ORIGIN:**
```env
CORS_ORIGIN=https://${{RAILWAY_PUBLIC_DOMAIN}}
```

Or if Railway doesn't support that variable:
1. Wait for first deployment
2. Get your public URL (e.g., `https://xyz.up.railway.app`)
3. Set: `CORS_ORIGIN=https://xyz.up.railway.app`

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. Fix "Unexposed Service" Issue

The error "Unexposed service" means Railway can't access your app.

**Option A: Railway will auto-detect (usually works)**
- Railway should automatically detect `EXPOSE 8080` from Dockerfile
- Just wait for the build to complete

**Option B: Manually expose port**
1. Go to your service **Settings**
2. Scroll to **"Networking"** section
3. Click **"Generate Domain"** or **"Add Public Domain"**
4. Railway will assign a public URL

**Option C: Check if PORT variable is correct**
Railway might assign a different PORT. Update your service:
1. Remove `PORT=8080` variable if it exists
2. Railway will automatically set `PORT` variable
3. Our code already uses `process.env.PORT || 8080`

### 6. Monitor Deployment

1. Go to **"Deployments"** tab
2. Click on the latest deployment
3. Switch to **"Deploy Logs"** tab
4. Watch for:
   ```
   ✅ Migration successful
   ✅ Server running on http://localhost:8080
   ✅ CORS enabled for: https://...
   ✅ Socket.io ready
   ```

### 7. Verify Deployment

Once deployed, test your application:

```bash
# Check health endpoint
curl https://your-app.up.railway.app/health

# Should return: {"ok":true}
```

Open in browser:
- `https://your-app.up.railway.app`

Check browser console for:
- `[Socket] Connected!` ✅
- No CORS errors ✅

---

## 🐛 Troubleshooting

### Build Fails: "vite: not found"
**Fixed!** We updated the Dockerfile to install all dependencies (not just production).

If still failing:
- Check if `tracker-frontend/package-lock.json` exists
- Verify `vite` is in `devDependencies` in `tracker-frontend/package.json`

### Build Fails: "Cannot find module '@prisma/client'"
Railway might be caching. Try:
1. Go to Settings → **"Redeploy"**
2. Or push a dummy commit: `git commit --allow-empty -m "trigger rebuild"`

### "Unexposed Service" Error
This means Railway can't access your app on port 8080.

**Solution 1: Generate Public Domain**
1. Service Settings → Networking
2. Click **"Generate Domain"**

**Solution 2: Let Railway set PORT**
1. Remove `PORT` environment variable
2. Railway sets it automatically
3. Our code uses `process.env.PORT || 8080`

**Solution 3: Check Dockerfile EXPOSE**
Make sure Dockerfile has:
```dockerfile
EXPOSE 8080
```

### Database Connection Error
Check if:
1. PostgreSQL service is running (green indicator)
2. `DATABASE_URL` variable is set (should be automatic)
3. Format is correct: `postgresql://user:pass@host:5432/db`

**Manual fix:**
1. Go to PostgreSQL service
2. Go to **"Variables"** tab
3. Copy the `DATABASE_URL`
4. Go to app service → Variables
5. Make sure `DATABASE_URL` matches

### CORS Errors in Browser
Update `CORS_ORIGIN` to match your Railway URL:
```env
CORS_ORIGIN=https://your-app.up.railway.app
```

### WebSocket Connection Fails
Check:
1. `CORS_ORIGIN` is correct
2. Browser console shows connection attempt to correct URL
3. No firewall blocking WebSocket

### Migrations Fail
Check deploy logs for migration errors:
1. Might be a schema issue
2. Try resetting database (Warning: deletes data):
   - Delete PostgreSQL service
   - Create new one
   - Redeploy app

---

## 📊 Environment Variables Summary

### Required Variables:
| Variable | Value | Where to Get |
|----------|-------|--------------|
| `NODE_ENV` | `production` | Manual |
| `JWT_SECRET` | Random 64-char string | Run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `DATABASE_URL` | Postgres connection string | Automatic from Railway Postgres |
| `CORS_ORIGIN` | Your Railway domain | Manual: `https://your-app.up.railway.app` |

### Optional Variables:
| Variable | Default | Note |
|----------|---------|------|
| `PORT` | 8080 | Railway may override this |

---

## ✅ Deployment Checklist

Before deploying:
- [x] Fixed Dockerfile (vite dependencies)
- [x] Pushed code to GitHub
- [ ] Created Railway project
- [ ] Added PostgreSQL database
- [ ] Generated JWT_SECRET
- [ ] Set environment variables
- [ ] Generated public domain
- [ ] Verified deployment (health check)
- [ ] Tested login/logout
- [ ] Tested WebSocket connection
- [ ] Tested real-time features

---

## 🎯 Quick Reference

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Check Health
```bash
curl https://your-app.up.railway.app/health
```

### View Logs
Railway Dashboard → Your Service → **Deployments** → Latest → **Deploy Logs**

### Redeploy
Railway Dashboard → Your Service → **Settings** → **Redeploy**

### Environment Variables
Railway Dashboard → Your Service → **Variables**

---

## 📞 Still Having Issues?

1. **Check Railway Logs:**
   - Click on your service
   - Go to "Deployments"
   - Select latest deployment
   - Check "Build Logs" and "Deploy Logs"

2. **Check Railway Status:**
   - https://status.railway.app/

3. **Railway Community:**
   - Discord: https://discord.gg/railway
   - GitHub Discussions: https://github.com/railwayapp/railway/discussions

4. **Common Solutions:**
   - Try **"Redeploy"** in settings
   - Remove and re-add environment variables
   - Delete and recreate database (if schema issues)
   - Check if you're on free plan limits

---

## 💰 Railway Pricing Note

**Free Tier:**
- $5 credit per month
- Usually enough for small projects
- Monitor usage in Railway dashboard

**If you exceed free tier:**
- Add payment method
- Only charged for what you use
- ~$0.000463/GB-hour for compute
- ~$0.25/GB/month for database storage

---

## 🎉 Success!

Once deployed successfully, you'll have:
- ✅ Live application at `https://your-app.up.railway.app`
- ✅ PostgreSQL database
- ✅ Automatic deployments on git push
- ✅ Environment variable management
- ✅ Logs and monitoring
- ✅ SSL certificate (automatic)

**Your application is now live! 🚀**
