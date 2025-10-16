# Deployment Guide

## Railway Deployment

### Initial Setup (First Time Only)

1. **Create Railway Project**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login to Railway
   railway login

   # Link to your project
   railway link
   ```

2. **Set Environment Variables in Railway Dashboard**
   ```env
   DATABASE_URL=postgresql://...  # Provided by Railway Postgres
   JWT_SECRET=your-secure-random-secret  # Generate with: npm run generate:secret
   CORS_ORIGIN=https://your-app.railway.app
   PORT=8080
   NODE_ENV=production
   ```

3. **Initial Deployment**
   ```bash
   # Push code to Railway
   railway up
   ```

   On first deployment, the seed script will populate Episodes, Maps, and Channels.

### Subsequent Deployments (Updates)

For code updates, simply push again:
```bash
railway up
```

**Important:** The seed script now automatically detects if the database is already seeded and skips duplicate data insertion. You'll see this log on updates:
```
✅ Database already seeded (Episodes: 11, Maps: 50, Channels: 10)
⏭️  Skipping seed to prevent duplicates
```

### Deployment Process

The `Dockerfile` CMD runs these steps in order:

1. **Database Migration** - `npx prisma migrate deploy`
   - Applies any pending migrations to production database
   - Safe to run multiple times (idempotent)

2. **Database Seeding** - `node prisma/seed.js`
   - Checks if data exists before seeding
   - Skips if Episodes, Maps, and Channels already exist
   - Prevents duplicate data on updates

3. **Start Server** - `node src/index.js`
   - Starts Express server with Socket.io
   - Serves frontend from `/public`
   - Initializes housekeeping jobs

### Migration Strategy

#### Development
```bash
# Create a new migration
npx prisma migrate dev --name migration_name
```

#### Production
Migrations are automatically applied on deployment via `prisma migrate deploy`.

**Manual Migration (if needed):**
```bash
# Connect to production database
railway run npx prisma migrate deploy
```

### Seed Script Behavior

The seed script (`prisma/seed.js`) now has intelligent duplicate prevention:

```javascript
// Checks before seeding
const episodeCount = await prisma.episode.count()
const mapCount = await prisma.map.count()
const channelCount = await prisma.channel.count()

if (episodeCount > 0 && mapCount > 0 && channelCount > 0) {
  console.log('⏭️  Skipping seed to prevent duplicates')
  return
}
```

**Seed Data Includes:**
- 11 Episodes (EP1-EP11)
- ~50 Maps across all episodes
- 10 Channels (Ch 1-10)

### Troubleshooting

#### Problem: Duplicate Data After Deployment
**Solution:** This is now fixed! The seed script checks if data exists before inserting.

#### Problem: Migration Failed
```bash
# Check migration status
railway run npx prisma migrate status

# Reset migrations (DANGER: drops data)
railway run npx prisma migrate reset --skip-seed
```

#### Problem: Need to Re-seed Data
```bash
# Delete existing data first
railway run psql $DATABASE_URL -c "TRUNCATE TABLE \"Episode\", \"Map\", \"Channel\" CASCADE;"

# Then redeploy or manually run seed
railway run node prisma/seed.js
```

#### Problem: Environment Variables Not Set
```bash
# Check current variables
railway variables

# Set a variable
railway variables set JWT_SECRET=your-secret-here
```

### Monitoring Deployments

1. **View Logs**
   ```bash
   railway logs
   ```

2. **Check Health**
   ```bash
   curl https://your-app.railway.app/health
   ```

3. **Verify Seed Logs**
   Look for these messages in deployment logs:
   - ✅ First deployment: `🌱 Seeding database...` → `🎉 Seed completed!`
   - ✅ Update deployment: `⏭️ Skipping seed to prevent duplicates`

### Best Practices

1. **Always run pre-deployment check locally:**
   ```bash
   npm run deploy:check
   ```

2. **Test migrations in development first:**
   ```bash
   npx prisma migrate dev
   ```

3. **Keep JWT_SECRET secure:**
   - Never commit to git
   - Use Railway environment variables
   - Generate with: `npm run generate:secret`

4. **Monitor housekeeping jobs:**
   - Check logs daily for cleanup stats
   - Verify old data is being removed
   - Manual trigger: `POST /api/housekeeping/run` (requires ADMIN auth)

5. **Database backups:**
   - Railway PostgreSQL automatically backs up daily
   - Consider manual backups before major migrations

### Rollback Strategy

If a deployment fails:

```bash
# View recent deployments
railway status

# Rollback to previous deployment
railway rollback
```

Or redeploy a specific git commit:
```bash
git checkout <previous-commit>
railway up
git checkout main
```

### CI/CD Integration

Railway automatically deploys on git push if connected to GitHub:

1. Connect Railway project to GitHub repository
2. Set up automatic deployments on push to `main` branch
3. Railway will run the Dockerfile CMD automatically

No additional CI/CD configuration needed!

## Docker Local Testing

Test the production Docker build locally:

```bash
# Build image
npm run docker:build

# Run container (make sure .env exists)
npm run docker:run
```

Access at: http://localhost:8080

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | ✅ Yes | Secret for JWT signing | Generated 64-char string |
| `CORS_ORIGIN` | ✅ Yes | Allowed frontend origin | `https://your-app.railway.app` |
| `PORT` | ⚠️ Railway sets | Server port | `8080` (default) |
| `NODE_ENV` | ⚠️ Recommended | Environment mode | `production` |

## Security Checklist for Production

- [ ] `JWT_SECRET` is not the default value
- [ ] `CORS_ORIGIN` is set to your actual domain (not `*`)
- [ ] `DATABASE_URL` uses SSL connection
- [ ] Environment variables are set in Railway dashboard (not in code)
- [ ] `.env` file is in `.gitignore`
- [ ] Admin account password is strong and unique
- [ ] HTTPS is enabled (Railway provides this automatically)
- [ ] Security headers are enabled (via Helmet.js)

## Useful Commands

```bash
# Check deployment readiness
npm run deploy:check

# Generate secure JWT secret
npm run generate:secret

# View Railway logs
railway logs

# Connect to production database
railway run psql

# Run migration in production
railway run npx prisma migrate deploy

# Check seed status (via logs)
railway logs | grep -i seed
```
