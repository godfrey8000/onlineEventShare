# 🚀 Deployment Setup - Changes Made

This document summarizes all changes made to prepare your project for deployment.

## 📝 Files Created

### 1. Docker Configuration
- ✅ **Dockerfile** - Multi-stage build for production
  - Stage 1: Builds frontend (Vue → static files)
  - Stage 2: Runs backend + serves frontend
  - Includes health check
  - Auto-runs migrations on startup

- ✅ **docker-compose.yml** - Local development with Docker
  - PostgreSQL container
  - Application container
  - Volume persistence
  - Health checks for both services

- ✅ **.dockerignore** - Excludes unnecessary files from Docker build

### 2. Environment Configuration
- ✅ **.env.example** - Backend environment template
- ✅ **tracker-frontend/.env.example** - Frontend environment template
- ✅ **.gitignore** - Prevents committing sensitive files

### 3. Documentation
- ✅ **DEPLOYMENT.md** - Comprehensive deployment guide
  - Free hosting options comparison
  - Railway.app step-by-step guide
  - Render.com instructions
  - Fly.io instructions
  - Manual VPS deployment
  - Troubleshooting section

- ✅ **README.md** - Project overview and quick start
  - Features list
  - Tech stack
  - Quick start guides
  - API documentation
  - WebSocket events
  - Troubleshooting

### 4. Deployment Scripts
- ✅ **scripts/deploy-check.sh** - Pre-deployment verification
  - Checks environment variables
  - Validates Node.js version
  - Checks dependencies
  - Verifies Docker installation

- ✅ **scripts/generate-secret.js** - JWT secret generator
  - Creates cryptographically secure random string

- ✅ **scripts/local-deploy.sh** - One-command local deployment
  - Runs checks
  - Builds containers
  - Runs migrations
  - Shows access URLs

- ✅ **scripts/setup-windows.ps1** - Windows setup script
  - Interactive setup wizard
  - Checks prerequisites
  - Installs dependencies
  - Generates secrets

### 5. Platform Configuration
- ✅ **railway.json** - Railway.app configuration
  - Specifies Dockerfile build
  - Deployment settings

## 🔧 Files Modified

### 1. Backend Changes

#### **src/index.js**
- Added SPA fallback routing (serves frontend from `/public`)
- Serves `index.html` for non-API routes
- API routes return 404 JSON

#### **src/config.js**
- Already properly configured to read from environment

#### **package.json**
- Added deployment scripts:
  ```json
  "prisma:deploy": "prisma migrate deploy"
  "build": "cd tracker-frontend && npm install && npm run build"
  "deploy:check": "bash scripts/deploy-check.sh"
  "deploy:local": "bash scripts/local-deploy.sh"
  "generate:secret": "node scripts/generate-secret.js"
  "docker:build": "docker build -t tosmtracker ."
  "docker:run": "docker run -p 8080:8080 --env-file .env tosmtracker"
  ```

### 2. Frontend Changes

#### **tracker-frontend/vite.config.js**
- Added proxy configuration for development
- Proxies `/api` and `/socket.io` to backend
- Enables seamless development without CORS issues

#### **tracker-frontend/src/services/api.js**
- Changed API_BASE to use relative URLs in production
- Falls back to `/api` when VITE_API_URL is not set
- Works seamlessly when frontend and backend are on same domain

#### **tracker-frontend/src/services/socket.js**
- Changed SOCKET_URL to use `window.location.origin` as fallback
- Automatically uses current domain in production
- No hardcoded URLs needed

## 🎯 How It Works

### Development Mode (Current Setup)
```
Frontend (Port 5173) ←→ Backend (Port 8080)
  - Vite dev server          - Express server
  - Hot reload               - nodemon
  - Proxy to backend         - PostgreSQL
```

### Production Mode (Docker)
```
Single Container (Port 8080)
  ├── Express Server
  │   ├── Serves static frontend (/public)
  │   ├── API routes (/api/*)
  │   └── WebSocket (Socket.io)
  └── PostgreSQL Container (linked)
```

## 🌐 Environment Variables Reference

### Required Variables (Backend)
| Variable | Development | Production | Example |
|----------|-------------|------------|---------|
| `DATABASE_URL` | localhost | Provider URL | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Any string | **MUST CHANGE** | Use `npm run generate:secret` |
| `CORS_ORIGIN` | `http://localhost:5173` | Your domain | `https://yourdomain.com` |
| `PORT` | 8080 | 8080 or dynamic | `8080` |
| `NODE_ENV` | development | production | `production` |

### Optional Variables (Frontend)
| Variable | When to Set | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Separate domains | `https://api.yourdomain.com` |
| `VITE_SOCKET_URL` | Separate domains | `https://api.yourdomain.com` |

**Note:** Leave frontend variables empty for same-domain deployment!

## 🚀 Quick Start Commands

### Local Development (Without Docker)
```bash
# Backend
npm install
npx prisma migrate dev
npm run dev

# Frontend (new terminal)
cd tracker-frontend
npm install
npm run dev
```

### Local Development (With Docker)
```bash
# Setup
cp .env.example .env
npm run generate:secret  # Copy output to .env

# Run
docker-compose up --build

# Access: http://localhost:8080
```

### Deployment Check
```bash
npm run deploy:check
```

### Deploy to Railway
```bash
# 1. Push to GitHub
git add .
git commit -m "Add deployment configuration"
git push

# 2. Go to railway.app
# 3. Connect GitHub repo
# 4. Add PostgreSQL database
# 5. Set environment variables
# 6. Deploy!
```

## ⚙️ Production Deployment Checklist

- [ ] Generate new JWT_SECRET (never use default!)
- [ ] Set DATABASE_URL to production database
- [ ] Set CORS_ORIGIN to production domain
- [ ] Set NODE_ENV=production
- [ ] Run `npm run deploy:check` to verify
- [ ] Test locally with Docker first
- [ ] Backup database before migrations
- [ ] Monitor logs after deployment

## 🔄 Deployment Flow

### With Railway/Render/Fly.io:
```
1. Git push to GitHub
2. Platform detects Dockerfile
3. Builds Docker image
4. Runs container
5. Container starts app:
   - Runs: npx prisma migrate deploy
   - Starts: node src/index.js
6. App serves frontend + API + WebSocket
```

### With Docker Compose (Local/VPS):
```
1. docker-compose up --build
2. Builds app image
3. Starts PostgreSQL container
4. Starts app container
5. Runs migrations
6. Ready at localhost:8080
```

## 🎓 Learning Resources

- **Docker**: https://docs.docker.com/get-started/
- **Railway**: https://docs.railway.app/
- **Prisma Migrations**: https://www.prisma.io/docs/concepts/components/prisma-migrate
- **Socket.io Deployment**: https://socket.io/docs/v4/server-deployment/

## 🐛 Common Issues & Solutions

### Issue: "JWT_SECRET is insecure"
**Solution:** Run `npm run generate:secret` and update .env

### Issue: "Cannot connect to database"
**Solution:** Verify DATABASE_URL format: `postgresql://user:pass@host:port/db`

### Issue: "WebSocket connection failed"
**Solution:**
- Check CORS_ORIGIN includes your domain
- Ensure WebSocket ports are open
- Verify reverse proxy supports WebSocket upgrade

### Issue: "Frontend shows blank page"
**Solution:**
- Check `tracker-frontend/dist` folder exists
- Verify build succeeded: `npm run build`
- Check browser console for errors

## 📞 Need Help?

1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guides
2. Check [README.md](./README.md) for troubleshooting
3. Run `npm run deploy:check` for diagnostics
4. Open an issue on GitHub

---

**All set! Your project is ready for deployment! 🎉**
