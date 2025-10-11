import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PORT, CORS_ORIGIN } from './config.js';
import { prisma } from './db.js';
import authRoutes from './routes/auth.routes.js';
import episodesRoutes from './routes/episodes.routes.js';
import trackersRoutes from './routes/trackers.routes.js';
import mapsRoutes from './routes/maps.routes.js';
import chatRoutes from './routes/chat.routes.js';  // ✅ Add this
import { createSocket } from './socket.js';

const app = express();

// ✅ Updated helmet config for Socket.io
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.socket.io",
          "https://cdn.jsdelivr.net"
        ],
        connectSrc: ["'self'", "ws://localhost:8080", "http://localhost:8080"],  // ✅ Be explicit
        styleSrc: ["'self'", "'unsafe-inline'"]
      },
    },
  })
);

// ✅ CORS before other middleware
app.use(cors({ 
  origin: CORS_ORIGIN, 
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']  // ✅ Add methods
}));

app.use(express.json());
app.use(express.static('public'));

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api', episodesRoutes);
app.use('/api', trackersRoutes);
app.use('/api', mapsRoutes);
app.use('/api', chatRoutes);  // ✅ Add chat routes

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Create HTTP server and Socket.io
const server = http.createServer(app);
const io = createSocket(server, CORS_ORIGIN);

// Start server
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ CORS enabled for: ${CORS_ORIGIN}`);
  console.log(`✅ Socket.io ready`);
});

// ✅ Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});