# Multi-stage build for production

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY tracker-frontend/package*.json ./
RUN npm ci --only=production

# Copy frontend source
COPY tracker-frontend/ ./

# Build frontend (creates dist folder)
RUN npm run build

# Stage 2: Backend + Serve Frontend
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies for backend
COPY package*.json ./
RUN npm ci --only=production

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy backend source
COPY src ./src

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/frontend/dist ./public

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application (runs migrations first)
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
