import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PORT, CORS_ORIGIN } from './config.js';
import { prisma } from './db.js';
import authRoutes from './routes/auth.routes.js';
import episodesRoutes from './routes/episodes.routes.js';
import trackersRoutes from './routes/trackers.routes.js';
import { createSocket } from './socket.js';
import mapsRoutes from './routes/maps.routes.js';


const app = express();


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
        connectSrc: ["*"],
        styleSrc: ["'self'", "'unsafe-inline'"]
      },
    },
  })
);

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.static('public'));

app.use('/api/auth', authRoutes);
app.use('/api', episodesRoutes);
app.use('/api', trackersRoutes);
app.use('/api', mapsRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
createSocket(server, CORS_ORIGIN);

server.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
});