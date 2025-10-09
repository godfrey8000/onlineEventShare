# 📦 Project Structure

```
tracker-app/
├─ .env                              # ENV: DATABASE_URL, JWT_SECRET, CORS_ORIGIN
├─ package.json
├─ prisma/
│  └─ schema.prisma
├─ src/
│  ├─ index.js                       # Express + Socket.io server
│  ├─ db.js                          # Prisma client
│  ├─ config.js                      # env loader
│  ├─ middleware/
│  │  └─ auth.js                     # JWT auth middleware
│  ├─ routes/
│  │  ├─ auth.routes.js              # login/register
│  │  ├─ episodes.routes.js          # CRUD for Episode/Map/Channel
│  │  └─ trackers.routes.js          # CRUD for Tracker
│  ├─ socket.js                      # Socket.io event wiring
│  └─ utils/
│     └─ validators.js               # zod-based validation
└─ public/
   └─ index.html                     # Minimal frontend board (vanilla)
```

---

# 📑 package.json

```json
{
  "name": "tracker-app",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "prisma:dev": "prisma migrate dev --name init"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "helmet": "^7.0.0",
    "jsonwebtoken": "^9.0.2",
    "prisma": "^5.18.0",
    "@prisma/client": "^5.18.0",
    "socket.io": "^4.7.5",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

---

# 🔐 .env (example)
```
DATABASE_URL="file:./dev.db"         # swap to Postgres when deploying
JWT_SECRET="change-me"
CORS_ORIGIN="http://localhost:5173,http://localhost:3000"
PORT=8080
```

---

# 🗄️ prisma/schema.prisma

```prisma
// SQLite for local dev; switch to PostgreSQL in prod
// datasource db { provider = "postgresql" url = env("DATABASE_URL") }
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client { provider = "prisma-client-js" }

model User {
  id        Int       @id @default(autoincrement())
  username  String    @unique
  password  String
  createdAt DateTime  @default(now())
  trackers  Tracker[]
}

model Episode {
  id        Int      @id @default(autoincrement())
  name      String
  maps      Map[]
  createdAt DateTime @default(now())
}

model Map {
  id        Int       @id @default(autoincrement())
  name      String
  episode   Episode   @relation(fields: [episodeId], references: [id])
  episodeId Int
  channels  Channel[]
}

model Channel {
  id     Int    @id @default(autoincrement())
  name   String
  map    Map    @relation(fields: [mapId], references: [id])
  mapId  Int
}

/// Tracker is the real-time entity. status is float: 0.0..5.0 where 0=OFF, 1..4 quarters, 5=ON
model Tracker {
  id         Int      @id @default(autoincrement())
  episodeId  Int
  mapId      Int
  channelId  Int
  level      String   // alias for map name/level label; denormalized for quick sorting
  status     Float    @default(0) // allow decimals e.g., 1.5, 2.8
  nickname   String
  createdBy  Int
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  episode Episode @relation(fields: [episodeId], references: [id])
  map     Map     @relation(fields: [mapId], references: [id])
  channel Channel @relation(fields: [channelId], references: [id])
  user    User    @relation(fields: [createdBy], references: [id])

  @@index([episodeId, mapId, channelId])
  @@index([status])
  @@index([nickname])
}
```

---

# ⚙️ src/config.js
```js
import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 8080;
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
export const CORS_ORIGIN = (process.env.CORS_ORIGIN || '*').split(',');
```

---

# 🛟 src/db.js
```js
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
```

---

# 🔒 src/middleware/auth.js
```js
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

export function authOptional(req, _res, next) {
  const hdr = req.headers.authorization || '';
  if (hdr.startsWith('Bearer ')) {
    try { req.user = jwt.verify(hdr.slice(7), JWT_SECRET); } catch {}
  }
  next();
}

export function authRequired(req, res, next) {
  const hdr = req.headers.authorization || '';
  if (!hdr.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(hdr.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

# ✅ src/utils/validators.js
```js
import { z } from 'zod';

export const RegisterSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(6).max(128)
});

export const LoginSchema = RegisterSchema;

export const UpsertEpisode = z.object({ name: z.string().min(1) });
export const UpsertMap = z.object({ name: z.string().min(1), episodeId: z.number().int() });
export const UpsertChannel = z.object({ name: z.string().min(1), mapId: z.number().int() });

export const CreateTracker = z.object({
  episodeId: z.number().int(),
  mapId: z.number().int(),
  channelId: z.number().int(),
  level: z.string().min(1),
  status: z.number().min(0).max(5),
  nickname: z.string().min(1)
});

export const UpdateTracker = z.object({
  status: z.number().min(0).max(5).optional(),
  nickname: z.string().min(1).optional()
});
```

---

# 👥 src/routes/auth.routes.js
```js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { JWT_SECRET } from '../config.js';
import { RegisterSchema, LoginSchema } from '../utils/validators.js';

const router = express.Router();

router.post('/register-once', async (req, res) => {
  // One-time setup: if any user exists, block
  const body = RegisterSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json(body.error);
  const existing = await prisma.user.findFirst();
  if (existing) return res.status(403).json({ error: 'Registration locked' });
  const { username, password } = body.data;
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { username, password: hashed } });
  const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

router.post('/login', async (req, res) => {
  const body = LoginSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json(body.error);
  const { username, password } = body.data;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(401).json({ error: 'Invalid creds' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid creds' });
  const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

export default router;
```

---

# 🗺️ src/routes/episodes.routes.js
```js
import express from 'express';
import { prisma } from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { UpsertEpisode, UpsertMap, UpsertChannel } from '../utils/validators.js';

const router = express.Router();

// Episodes
router.get('/episodes', async (_req, res) => {
  const eps = await prisma.episode.findMany({ include: { maps: { include: { channels: true } } } });
  res.json(eps);
});

router.post('/episodes', authRequired, async (req, res) => {
  const body = UpsertEpisode.safeParse(req.body);
  if (!body.success) return res.status(400).json(body.error);
  const ep = await prisma.episode.create({ data: body.data });
  res.json(ep);
});

// Maps
router.post('/maps', authRequired, async (req, res) => {
  const body = UpsertMap.safeParse(req.body);
  if (!body.success) return res.status(400).json(body.error);
  const map = await prisma.map.create({ data: body.data });
  res.json(map);
});

// Channels
router.post('/channels', authRequired, async (req, res) => {
  const body = UpsertChannel.safeParse(req.body);
  if (!body.success) return res.status(400).json(body.error);
  const channel = await prisma.channel.create({ data: body.data });
  res.json(channel);
});

export default router;
```

---

# 🧭 src/routes/trackers.routes.js
```js
import express from 'express';
import { prisma } from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { CreateTracker, UpdateTracker } from '../utils/validators.js';

const router = express.Router();

// List trackers with simple sorting (status, level, nickname)
router.get('/trackers', async (req, res) => {
  const { sortBy = 'updatedAt', order = 'desc' } = req.query;
  const allowed = ['status', 'level', 'nickname', 'createdAt', 'updatedAt'];
  const sort = allowed.includes(sortBy) ? sortBy : 'updatedAt';
  const asc = order === 'asc';
  const trackers = await prisma.tracker.findMany({
    orderBy: { [sort]: asc ? 'asc' : 'desc' },
    include: { episode: true, map: true, channel: true, user: true }
  });
  res.json(trackers);
});

router.post('/trackers', authRequired, async (req, res) => {
  const parsed = CreateTracker.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const data = parsed.data;
  const tracker = await prisma.tracker.create({
    data: { ...data, createdBy: req.user.id }
  });
  res.json(tracker);
});

router.patch('/trackers/:id', authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateTracker.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const tracker = await prisma.tracker.update({ where: { id }, data: parsed.data });
  res.json(tracker);
});

router.delete('/trackers/:id', authRequired, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.tracker.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
```

---

# ⚡ src/socket.js
```js
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { prisma } from './db.js';
import { JWT_SECRET } from './config.js';

export function createSocket(server, corsOrigins) {
  const io = new Server(server, {
    cors: { origin: corsOrigins, credentials: true },
    pingInterval: 10000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e6
  });

  // Namespacing by episode/map/channel using rooms => "ep:{id}|map:{id}|ch:{id}"
  function roomKey({ episodeId, mapId, channelId }) {
    return `ep:${episodeId}|map:${mapId}|ch:${channelId}`;
  }

  io.use((socket, next) => {
    // Optional auth for write ops via JWT in handshake.auth.token
    const { token } = socket.handshake.auth || {};
    if (!token) return next();
    try { socket.user = jwt.verify(token, JWT_SECRET); } catch {}
    next();
  });

  io.on('connection', (socket) => {
    // Client can subscribe to a room for <1s realtime updates of specific channel
    socket.on('subscribe', (key) => {
      socket.join(roomKey(key));
    });

    socket.on('unsubscribe', (key) => {
      socket.leave(roomKey(key));
    });

    // Secure update: requires socket.user
    socket.on('tracker:update', async (payload, cb) => {
      try {
        if (!socket.user) return cb?.({ error: 'AUTH' });
        const { id, status, nickname } = payload;
        const data = {};
        if (typeof status === 'number') {
          if (status < 0 || status > 5) throw new Error('status out of range');
          data.status = status;
        }
        if (typeof nickname === 'string') data.nickname = nickname;
        const updated = await prisma.tracker.update({ where: { id }, data });
        const key = { episodeId: updated.episodeId, mapId: updated.mapId, channelId: updated.channelId };
        io.to(roomKey(key)).emit('tracker:changed', updated);
        io.emit('tracker:changed:global', updated); // board view
        cb?.({ ok: true, updated });
      } catch (e) {
        cb?.({ error: e.message });
      }
    });

    socket.on('tracker:create', async (payload, cb) => {
      try {
        if (!socket.user) return cb?.({ error: 'AUTH' });
        const now = await prisma.tracker.create({ data: { ...payload, createdBy: socket.user.id } });
        const key = { episodeId: now.episodeId, mapId: now.mapId, channelId: now.channelId };
        io.to(roomKey(key)).emit('tracker:created', now);
        io.emit('tracker:created:global', now);
        cb?.({ ok: true, created: now });
      } catch (e) { cb?.({ error: e.message }); }
    });
  });

  return io;
}
```

---

# 🚀 src/index.js
```js
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

const app = express();
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.static('public'));

app.use('/api/auth', authRoutes);
app.use('/api', episodesRoutes);
app.use('/api', trackersRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
createSocket(server, CORS_ORIGIN);

server.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
});
```

---

# 🌐 public/index.html (minimal board + login)
```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Tracker Board</title>
  <style>
    body{font-family:system-ui,Arial;margin:0;background:#0b0c10;color:#eaeaea}
    header{display:flex;gap:12px;align-items:center;padding:12px 16px;background:#111}
    input,button,select{padding:8px;border-radius:8px;border:1px solid #333;background:#1b1f23;color:#eaeaea}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;padding:16px}
    .card{border:1px solid #2a2a2a;border-radius:12px;padding:12px;background:#141414}
    .muted{opacity:.8;font-size:12px}
    .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    .badge{padding:2px 8px;border-radius:999px;background:#222;border:1px solid #333}
  </style>
</head>
<body>
<header>
  <strong>Tracker Board</strong>
  <span id="authStatus" class="muted"></span>
  <div class="row" style="margin-left:auto">
    <input id="username" placeholder="username"/>
    <input id="password" placeholder="password" type="password"/>
    <button id="loginBtn">Login</button>
  </div>
  <div class="row">
    <label>Sort</label>
    <select id="sortBy">
      <option value="updatedAt">updated</option>
      <option value="status">status</option>
      <option value="level">level</option>
      <option value="nickname">nickname</option>
    </select>
  </div>
</header>
<div class="grid" id="grid"></div>

<script src="https://cdn.socket.io/4.7.5/socket.io.min.js" integrity="sha384-/vY5K0g6i6XNaFffJc2WicYvB8VwJu6y7tCiA0wz7F2QF7FQm1h8sB3k6wQeaH6H" crossorigin="anonymous"></script>
<script>
  const API = location.origin + '/api';
  let token = localStorage.getItem('token') || '';
  const authStatus = document.getElementById('authStatus');
  function setAuthStatus(){authStatus.textContent = token? '✅ logged in' : '🔒 viewer';}
  setAuthStatus();

  document.getElementById('loginBtn').onclick = async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const r = await fetch(API + '/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username,password})});
    const j = await r.json();
    if (j.token){ token = j.token; localStorage.setItem('token', token); setAuthStatus(); }
    else alert('login failed');
  };

  async function load(sortBy='updatedAt'){
    const r = await fetch(`${API}/trackers?sortBy=${encodeURIComponent(sortBy)}`);
    const items = await r.json();
    render(items);
  }

  function fmtAgo(ts){ const d=new Date(ts); const s=(Date.now()-d)/1000; if(s<60) return Math.floor(s)+ 's ago'; if(s<3600) return Math.floor(s/60)+'m ago'; return Math.floor(s/3600)+'h ago'; }

  function render(items){
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    for(const t of items){
      const el = document.createElement('div');
      el.className = 'card';
      el.innerHTML = `
        <div class="row"><div class="badge">Ep ${t.episodeId}</div><div class="badge">Map ${t.mapId} (${t.level})</div><div class="badge">Ch ${t.channelId}</div></div>
        <h3 style="margin:8px 0">${t.nickname}</h3>
        <div class="row"><strong>Status:</strong> <span>${t.status.toFixed(1)}</span></div>
        <div class="muted">created ${fmtAgo(t.createdAt)}, updated ${fmtAgo(t.updatedAt)} by ${t.user?.username || 'unknown'}</div>
        ${token ? `<div class="row" style="margin-top:8px">
          <input type="number" step="0.1" min="0" max="5" value="${t.status}" id="st-${t.id}">
          <button data-id="${t.id}" class="upd">Update</button>
        </div>`: ''}
      `;
      grid.appendChild(el);
    }

    document.querySelectorAll('.upd').forEach(btn => {
      btn.onclick = () => {
        const id = Number(btn.dataset.id);
        const val = Number(document.getElementById('st-'+id).value);
        sio.emit('tracker:update', { id, status: val }, (resp)=>{ if(resp?.error) alert(resp.error); });
      };
    });
  }

  // Socket.io for <1s realtime fan-out
  const sio = io({ auth: { token } });
  sio.on('connect', ()=> console.log('ws connected'));
  sio.on('tracker:changed:global', ()=> load(document.getElementById('sortBy').value));
  sio.on('tracker:created:global', ()=> load(document.getElementById('sortBy').value));

  document.getElementById('sortBy').onchange = (e)=> load(e.target.value);
  load();
</script>
</body>
</html>
```

---

# 🧪 Quickstart

```bash
# 1) install
npm i

# 2) generate client & DB
npx prisma generate
npx prisma migrate dev --name init

# 3) boot
npm run dev

# 4) one-time admin
curl -X POST http://localhost:8080/api/auth/register-once \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}'

# 5) open http://localhost:8080
```

---

# 🏗️ Notes on Scale & "Unlimited Bandwidth"
- No host truly offers unlimited bandwidth. Use **Railway/Render** for app + **Cloudflare** proxy (WS supported) to offload bandwidth, add caching for REST endpoints, and enable HTTP/2/3 multiplexing.
- Socket.io emits are tiny; keep payloads small and **room-targeted**. Board gets a single global event while detail pages subscribe per (episode,map,channel) room.
- For <1s latency, emit immediately on write; readers do **no polling**. Set pingInterval/pingTimeout as in `socket.js`.
- Add **rate limits** for write ops and expose **read-only** events to guests.
- When moving to Postgres: change `datasource` and set `DATABASE_URL` (Railway/Render provide). Run `prisma migrate deploy` on boot.

---

# 🔒 Extras To Add Later (stubs)
- Write-rate limiting with `express-rate-limit`.
- Audit log table for status changes.
- Invite-only registration token instead of one-time lock.
- CSRF not needed for token Authorization; prefer short JWT TTL + refresh.
- Replace vanilla UI with React/Vue if desired (API is ready).
