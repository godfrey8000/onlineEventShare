# 🚀 TosmTracker Deployment Guide

## 📋 Table of Contents
1. [Environment Variables](#environment-variables)
2. [Local Docker Development](#local-docker-development)
3. [Deployment Options](#deployment-options)
4. [Railway.app Deployment (Recommended)](#railwayapp-deployment)
5. [Render.com Deployment](#rendercom-deployment)
6. [Fly.io Deployment](#flyio-deployment)
7. [Manual VPS Deployment](#manual-vps-deployment)

---

## 🔐 Environment Variables

### Backend (.env in root)
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# JWT Secret (MUST change in production - use strong random string)
JWT_SECRET="your-super-secret-jwt-key-change-this"

# CORS Origins (comma-separated for multiple)
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Server Port
PORT=8080

# Node Environment
NODE_ENV=production
```

### Frontend (.env in tracker-frontend/)
```env
# Development
VITE_API_URL=http://localhost:8080
VITE_SOCKET_URL=http://localhost:8080

# Production (leave empty to use relative URLs)
# VITE_API_URL=
# VITE_SOCKET_URL=
```

**Important Notes:**
- In production with Docker, frontend uses relative URLs (`/api`, `/socket.io`)
- Only set `VITE_API_URL` if frontend is on a different domain than backend
- Generate JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## 🐳 Local Docker Development

### Prerequisites
- Docker Desktop installed
- Docker Compose installed

### Quick Start

1. **Copy environment files:**
```bash
cp .env.example .env
cp tracker-frontend/.env.example tracker-frontend/.env
```

2. **Edit .env file:**
```bash
# .env
DATABASE_URL="postgresql://postgres:postgres@db:5432/trackerdb?schema=public"
JWT_SECRET="your-secret-key-here"
CORS_ORIGIN=http://localhost:8080
DB_PASSWORD=postgres
```

3. **Build and run:**
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

4. **Access application:**
- Frontend + Backend: http://localhost:8080
- Database: localhost:5432

### Useful Commands

```bash
# Rebuild only app (after code changes)
docker-compose up --build app

# Run Prisma migrations
docker-compose exec app npx prisma migrate deploy

# Seed database
docker-compose exec app npm run seed

# Access database
docker-compose exec db psql -U postgres -d trackerdb

# View app logs
docker-compose logs -f app
```

---

## 🌐 Deployment Options

### Comparison Table

| Platform | Cost | Database | Ease | WebSocket | Best For |
|----------|------|----------|------|-----------|----------|
| **Railway** | $5/mo credit | ✅ Included | ⭐⭐⭐⭐⭐ | ✅ Yes | Recommended |
| **Render** | Free (sleeps) | ✅ 90 days | ⭐⭐⭐⭐ | ✅ Yes | Testing |
| **Fly.io** | Free tier | ✅ Yes | ⭐⭐⭐ | ✅ Yes | Production |
| **Vercel+Railway** | Free+$5 | ✅ Yes | ⭐⭐⭐⭐ | ✅ Yes | Separate deploy |

---

## 🚂 Railway.app Deployment (Recommended)

### Why Railway?
- ✅ Easiest setup
- ✅ PostgreSQL included
- ✅ WebSocket support
- ✅ GitHub auto-deploy
- ✅ $5/month credit (usually enough)

### Steps:

1. **Sign up:** https://railway.app (use GitHub)

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Add PostgreSQL:**
   - Click "+ New"
   - Select "Database" → "PostgreSQL"
   - Railway will automatically provide `DATABASE_URL`

4. **Configure Environment Variables:**
   ```
   NODE_ENV=production
   PORT=8080
   JWT_SECRET=<generate-random-string>
   CORS_ORIGIN=${{RAILWAY_PUBLIC_DOMAIN}}
   ```
   Note: Railway provides `RAILWAY_PUBLIC_DOMAIN` automatically

5. **Configure Build:**
   - Railway auto-detects Dockerfile
   - No additional configuration needed!

6. **Deploy:**
   - Push to GitHub
   - Railway automatically builds and deploys
   - Get your public URL: `https://your-app.up.railway.app`

7. **Run Migrations:**
   - In Railway dashboard, go to your service
   - Click "Deployments" → Select deployment → "View Logs"
   - Migrations run automatically on startup

### Environment Variables for Railway:
```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<your-generated-secret>
CORS_ORIGIN=https://${{RAILWAY_STATIC_URL}}
PORT=8080
```

---

## 🎨 Render.com Deployment

### Steps:

1. **Sign up:** https://render.com

2. **Create PostgreSQL:**
   - "New +" → "PostgreSQL"
   - Name: `tracker-db`
   - Free tier (90 days, then $7/mo)
   - Copy "Internal Database URL"

3. **Create Web Service:**
   - "New +" → "Web Service"
   - Connect GitHub repo
   - **Build Command:**
     ```bash
     cd tracker-frontend && npm install && npm run build && cd .. && npm install
     ```
   - **Start Command:**
     ```bash
     npm start
     ```
   - **Environment Variables:**
     ```
     NODE_ENV=production
     DATABASE_URL=<from-step-2>
     JWT_SECRET=<generate>
     CORS_ORIGIN=https://your-app.onrender.com
     PORT=8080
     ```

4. **Alternative with Docker:**
   - Select "Docker" as environment
   - Render will use your Dockerfile automatically
   - No build command needed

### Note:
Render free tier spins down after 15 minutes of inactivity (slow cold starts).

---

## 🪰 Fly.io Deployment

### Steps:

1. **Install flyctl:**
```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Mac/Linux
curl -L https://fly.io/install.sh | sh
```

2. **Login:**
```bash
flyctl auth login
```

3. **Create fly.toml:**
```bash
flyctl launch --no-deploy
```

4. **Edit fly.toml:**
```toml
app = "your-app-name"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8080"
  NODE_ENV = "production"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80
    force_https = true

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
```

5. **Create PostgreSQL:**
```bash
flyctl postgres create
flyctl postgres attach <postgres-app-name>
```

6. **Set secrets:**
```bash
flyctl secrets set JWT_SECRET="your-secret"
flyctl secrets set CORS_ORIGIN="https://your-app.fly.dev"
```

7. **Deploy:**
```bash
flyctl deploy
```

---

## 🖥️ Manual VPS Deployment

### Prerequisites:
- Ubuntu 22.04+ VPS
- Docker installed
- Domain pointed to VPS
- Nginx (optional, for reverse proxy)

### Steps:

1. **Clone repository:**
```bash
git clone <your-repo>
cd tosmtrackerReborn
```

2. **Setup environment:**
```bash
cp .env.example .env
nano .env  # Edit values
```

3. **Run with Docker Compose:**
```bash
docker-compose up -d
```

4. **Setup Nginx (optional):**
```nginx
# /etc/nginx/sites-available/tracker
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:8080/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

5. **Setup SSL (Let's Encrypt):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

6. **Auto-restart on reboot:**
```bash
# Create systemd service or use Docker restart policy
# Already configured in docker-compose.yml (restart: unless-stopped)
```

---

## 🔧 Post-Deployment

### 1. Verify Deployment:
```bash
# Check health endpoint
curl https://your-domain.com/health

# Check WebSocket
# Open browser console on your site:
# Should see: [Socket] Connected!
```

### 2. Create Admin User:
```bash
# Option 1: Use seed script
docker-compose exec app npm run seed

# Option 2: Manual registration
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","nickname":"Admin"}'

# Then manually update role in database to ADMIN
```

### 3. Database Backups:
```bash
# PostgreSQL backup
docker-compose exec db pg_dump -U postgres trackerdb > backup.sql

# Restore
docker-compose exec -T db psql -U postgres trackerdb < backup.sql
```

### 4. Monitoring:
```bash
# View logs
docker-compose logs -f

# Check resource usage
docker stats
```

---

## 🐛 Troubleshooting

### WebSocket not connecting:
1. Check CORS_ORIGIN matches your domain
2. Ensure WebSocket port (8080) is open
3. Check if reverse proxy supports WebSocket upgrades

### Database connection errors:
1. Verify DATABASE_URL format
2. Check database is running: `docker-compose ps`
3. Test connection: `docker-compose exec db psql -U postgres -d trackerdb`

### Build fails:
1. Check Node.js version (needs 20+)
2. Clear Docker cache: `docker system prune -a`
3. Check .dockerignore isn't excluding necessary files

### Frontend shows blank page:
1. Check build succeeded: `ls tracker-frontend/dist`
2. Verify VITE_API_URL is correct or empty
3. Check browser console for errors

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Fly.io Docs](https://fly.io/docs)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

## ✅ Deployment Checklist

- [ ] Changed JWT_SECRET to strong random value
- [ ] Updated CORS_ORIGIN to production domain
- [ ] Set DATABASE_URL correctly
- [ ] Tested database migrations
- [ ] Verified WebSocket connection
- [ ] Created admin user
- [ ] Setup database backups
- [ ] Configured monitoring/logs
- [ ] Tested login/logout
- [ ] Tested real-time features (tracker updates, chat)
- [ ] Setup SSL certificate
- [ ] Configured domain DNS
