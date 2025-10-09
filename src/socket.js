import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import { prisma } from './db.js'
import { JWT_SECRET } from './config.js'

const onlineUsers = new Map() // socket.id → nickname or null

export function createSocket(server, corsOrigins) {
  const io = new Server(server, {
    cors: { origin: corsOrigins, credentials: true },
    pingInterval: 10000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e6
  })

  // --- helper: decode JWT if provided ---
  function decodeToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch {
      return null
    }
  }

  // --- helper: build room key for episode/map/channel ---
  function roomKey({ episodeId, mapId, channelId }) {
    return `ep:${episodeId}|map:${mapId}|ch:${channelId}`
  }

  // --- middleware for auth ---
  io.use((socket, next) => {
    const { token } = socket.handshake.auth || {}
    if (token) socket.user = decodeToken(token)
    next()
  })

  io.on('connection', (socket) => {
    // --- Determine nickname or visitor ---
    const nickname = socket.user?.nickname || null
    onlineUsers.set(socket.id, nickname)
    emitOnlineCounts(io)

    console.log(`[Socket] ${nickname || 'Visitor'} connected (${socket.id})`)

    // --- handle disconnect ---
    socket.on('disconnect', () => {
      onlineUsers.delete(socket.id)
      emitOnlineCounts(io)
      console.log(`[Socket] ${nickname || 'Visitor'} disconnected`)
    })

    // --- allow client to subscribe to a map/episode/channel room ---
    socket.on('subscribe', (key) => {
      socket.join(roomKey(key))
    })

    socket.on('unsubscribe', (key) => {
      socket.leave(roomKey(key))
    })

    // --- tracker update ---
    socket.on('tracker:update', async (payload, cb) => {
      try {
        if (!socket.user) return cb?.({ error: 'AUTH' })
        const { id, status, nickname } = payload
        const data = {}

        if (typeof status === 'number') {
          if (status < 0 || status > 5) throw new Error('status out of range')
          data.status = status
        }
        if (typeof nickname === 'string') data.nickname = nickname

        const updated = await prisma.tracker.update({ where: { id }, data })
        const key = { episodeId: updated.episodeId, mapId: updated.mapId, channelId: updated.channelId }

        io.to(roomKey(key)).emit('tracker:changed', updated)
        io.emit('tracker:changed:global', updated)
        cb?.({ ok: true, updated })
      } catch (e) {
        cb?.({ error: e.message })
      }
    })

    // --- tracker create ---
    socket.on('tracker:create', async (payload, cb) => {
      try {
        if (!socket.user) return cb?.({ error: 'AUTH' })
        const now = await prisma.tracker.create({
          data: { ...payload, createdBy: socket.user.id }
        })
        const key = { episodeId: now.episodeId, mapId: now.mapId, channelId: now.channelId }

        io.to(roomKey(key)).emit('tracker:created', now)
        io.emit('tracker:created:global', now)
        cb?.({ ok: true, created: now })
      } catch (e) {
        cb?.({ error: e.message })
      }
    })
  })

  return io
}

// --- broadcast user online counts globally ---
function emitOnlineCounts(io) {
  const users = Array.from(onlineUsers.values())
  const namedUsers = users.filter((u) => u)
  const visitors = users.filter((u) => !u)

  io.emit('users:onlineCount', {
    total: users.length,
    visitors: visitors.length,
    users: namedUsers,
  })
}
