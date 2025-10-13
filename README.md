# 🎮 TosmTracker Reborn

A real-time game progress tracker with WebSocket support, built with Vue 3 and Node.js.

## ✨ Features

- 🔐 **User Authentication** - JWT-based auth with role management (VIEWER, CHATTER, EDITOR, ADMIN)
- 📊 **Real-time Tracking** - Live tracker updates across all connected clients
- 💬 **Chat System** - Built-in chat for users with CHATTER+ roles
- 🗺️ **Episode & Map Management** - Track progress across multiple episodes and maps
- 👥 **Online Users** - See who's currently connected
- 🌍 **Multi-language** - i18n support (English, Chinese)
- ⚡ **WebSocket** - Real-time bidirectional communication with Socket.io

## 🛠️ Tech Stack

### Frontend
- Vue 3 (Composition API)
- Vite
- Socket.io-client
- Axios
- Vue-i18n

### Backend
- Node.js + Express
- Socket.io
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Bcrypt

## 📋 Prerequisites

- Node.js 18+ or Docker
- PostgreSQL 14+ (or use Docker)

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# 1. Clone repository
git clone <your-repo>
cd tosmtrackerReborn

# 2. Copy environment files
cp .env.example .env
cp tracker-frontend/.env.example tracker-frontend/.env

# 3. Generate JWT secret
npm run generate:secret

# 4. Edit .env with your settings
nano .env

# 5. Run with Docker
docker-compose up --build

# 6. Access application
# http://localhost:8080
```

### Option 2: Manual Setup

```bash
# 1. Install backend dependencies
npm install

# 2. Install frontend dependencies
cd tracker-frontend
npm install
cd ..

# 3. Setup environment
cp .env.example .env
# Edit .env with your database URL and JWT secret

# 4. Setup database
npx prisma migrate dev
npx prisma generate

# 5. Run backend (Terminal 1)
npm run dev

# 6. Run frontend (Terminal 2)
cd tracker-frontend
npm run dev
```

## 🔧 Development

```bash
# Backend development
npm run dev

# Frontend development
cd tracker-frontend
npm run dev

# Run Prisma Studio (database GUI)
npx prisma studio

# Generate new migration
npx prisma migrate dev --name <migration-name>

# Run deployment check
npm run deploy:check

# Generate secure JWT secret
npm run generate:secret
```

## 📦 Build for Production

```bash
# Build frontend
npm run build

# Or build Docker image
npm run docker:build
```

## 🌐 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Options:

- **Railway.app** (Recommended) - One-click deploy with GitHub
- **Render.com** - Free tier available
- **Fly.io** - Docker-based deployment
- **VPS** - Manual deployment with Docker

## 📚 API Documentation

### Authentication
```
POST /api/auth/register - Register new user
POST /api/auth/login - Login user
POST /api/auth/register-once - Register guest (no duplicate username)
PATCH /api/auth/profile - Update profile
GET /api/auth/users - Get all users (ADMIN only)
PATCH /api/auth/users/:id/role - Update user role (ADMIN only)
```

### Trackers
```
GET /api/trackers - Get all trackers
POST /api/trackers - Create tracker (EDITOR+)
PATCH /api/trackers/:id - Update tracker (EDITOR+)
DELETE /api/trackers/:id - Delete tracker (EDITOR+/owner)
```

### Episodes & Maps
```
GET /api/episodes - Get all episodes
GET /api/maps - Get maps by episode
POST /api/maps/:id/favorite - Add map to favorites
DELETE /api/maps/:id/favorite - Remove from favorites
```

### Chat
```
GET /api/chat/history - Get chat history
POST /api/chat/send - Send message (CHATTER+)
GET /api/chat/stats - Get chat statistics
```

## 🔌 WebSocket Events

### Client → Server
```javascript
// Tracker operations
socket.emit('tracker:create', data, callback)
socket.emit('tracker:update', data, callback)
socket.emit('tracker:delete', data, callback)

// Chat operations
socket.emit('chat:send', { content }, callback)
socket.emit('chat:loadHistory', { limit, before }, callback)

// Room subscription
socket.emit('subscribe', { episodeNumber, mapId, channelId })
socket.emit('unsubscribe', { episodeNumber, mapId, channelId })
```

### Server → Client
```javascript
// Tracker events
socket.on('tracker:created:global', handler)
socket.on('tracker:changed:global', handler)
socket.on('tracker:deleted:global', handler)

// Chat events
socket.on('chat:message', handler)

// User events
socket.on('users:onlineCount', handler)
```

## 🔐 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/trackerdb"
JWT_SECRET="your-secret-key"
CORS_ORIGIN="http://localhost:5173"
PORT=8080
NODE_ENV=development
```

### Frontend (tracker-frontend/.env)
```env
VITE_API_URL=http://localhost:8080
VITE_SOCKET_URL=http://localhost:8080
```

## 📝 Database Schema

- **Users** - User accounts with roles
- **Episodes** - Game episodes
- **Maps** - Maps within episodes
- **Trackers** - User progress trackers
- **ChatMessage** - Chat messages
- **MapFavorite** - User favorite maps
- **Channel** - Communication channels

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🐛 Troubleshooting

### WebSocket not connecting
- Verify CORS_ORIGIN includes your frontend URL
- Check firewall allows WebSocket connections
- Ensure backend is running on correct port

### Database connection error
- Verify DATABASE_URL format is correct
- Check PostgreSQL is running
- Test connection: `psql <DATABASE_URL>`

### Build fails
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node -v` (needs 18+)
- Clear Docker cache: `docker system prune -a`

## 📧 Support

For issues and questions, please open an issue on GitHub.

## 🙏 Acknowledgments

Built with ❤️ using Vue.js, Socket.io, and Prisma.
