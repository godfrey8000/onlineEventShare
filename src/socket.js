import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import { prisma } from './db.js'
import { JWT_SECRET } from './config.js'

const onlineUsers = new Map() // socket.id → { id, username, nickname, role }

export function createSocket(server, corsOrigins) {
  console.log('[Socket.io] Creating server with CORS origins:', corsOrigins)

  const io = new Server(server, {
    cors: {
      origin: corsOrigins,
      credentials: true,
      methods: ["GET", "POST"]
    },
    pingInterval: 10000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e6,
    transports: ['websocket', 'polling'],
    allowEIO3: true
  })

  console.log('[Socket.io] Server created successfully')

  // --- helper: decode JWT if provided ---
  function decodeToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch {
      return null
    }
  }

  // --- helper: build room key for episode/map/channel ---
  function roomKey({ episodeNumber, mapId, channelId }) {  // ✅ Fixed param name
    return `ep:${episodeNumber}|map:${mapId}|ch:${channelId}`
  }

  // --- middleware for auth ---
  io.use((socket, next) => {
    const { token } = socket.handshake.auth || {}
    console.log('[Socket.io] Auth middleware - token received:', token ? 'Yes (' + token.substring(0, 20) + '...)' : 'No')

    if (token) {
      const decoded = decodeToken(token)
      if (decoded) {
        socket.user = decoded
        console.log('[Socket.io] Token decoded successfully:', { id: decoded.id, username: decoded.username, nickname: decoded.nickname, role: decoded.role })
      } else {
        console.log('[Socket.io] Token decode failed')
      }
    }
    next()
  })

  io.on('connection', (socket) => {
    // --- Determine user info or visitor ---
    const userInfo = socket.user ? {
      id: socket.user.id,
      username: socket.user.username,
      nickname: socket.user.nickname,
      role: socket.user.role
    } : null

    onlineUsers.set(socket.id, userInfo)

    console.log(`[Socket] ${userInfo?.nickname || 'Visitor'} connected (${socket.id})`)
    console.log(`[Socket] Total online users: ${onlineUsers.size}`, Array.from(onlineUsers.values()))

    emitOnlineCounts(io)

    // --- handle disconnect ---
    socket.on('disconnect', () => {
      onlineUsers.delete(socket.id)
      emitOnlineCounts(io)
      console.log(`[Socket] ${userInfo?.nickname || 'Visitor'} disconnected`)
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
        
        const { id, status, nickname, level } = payload
        const data = {}

        if (status !== undefined) {
          const statusNum = Number(status)
          if (isNaN(statusNum) || statusNum < 0 || statusNum > 5) {
            throw new Error('Status must be between 0 and 5')
          }
          data.status = statusNum
        }
        if (nickname !== undefined) data.nickname = nickname
        if (level !== undefined) data.level = parseInt(level)

        const updated = await prisma.tracker.update({ 
          where: { id },
          data,
          include: { map: true, episode: true, user: true }
        })

        const key = { 
          episodeNumber: updated.episodeNumber,  // ✅ Fixed field name
          mapId: updated.mapId, 
          channelId: updated.channelId 
        }

        io.to(roomKey(key)).emit('tracker:changed', updated)
        io.emit('tracker:changed:global', updated)
        cb?.({ ok: true, updated })
      } catch (e) {
        console.error('[Socket] tracker:update error:', e)
        cb?.({ error: e.message })
      }
    })

    // --- tracker create ---
    socket.on('tracker:create', async (payload, cb) => {
      try {
        if (!socket.user) return cb?.({ error: 'AUTH' })
        
        // Validate required fields
        const { episodeNumber, mapId, channelId, level, status, nickname } = payload
        if (!episodeNumber || !mapId || channelId === undefined) {
          throw new Error('Missing required fields')
        }

        const tracker = await prisma.tracker.create({
          data: { 
            episodeNumber: parseInt(episodeNumber),  // ✅ Fixed field name
            mapId: parseInt(mapId),
            channelId: parseInt(channelId),
            level: level ? parseInt(level) : null,
            status: status !== undefined ? Number(status) : 0,
            nickname: nickname || socket.user.nickname,
            userId: socket.user.id  // ✅ Fixed field name (was createdBy)
          },
          include: { map: true, episode: true, user: true }
        })

        const key = { 
          episodeNumber: tracker.episodeNumber,  // ✅ Fixed field name
          mapId: tracker.mapId, 
          channelId: tracker.channelId 
        }

        io.to(roomKey(key)).emit('tracker:created', tracker)
        io.emit('tracker:created:global', tracker)
        cb?.({ ok: true, created: tracker })
      } catch (e) {
        console.error('[Socket] tracker:create error:', e)
        cb?.({ error: e.message })
      }
    })

    // --- tracker delete ---
    socket.on('tracker:delete', async (payload, cb) => {
      try {
        if (!socket.user) return cb?.({ error: 'AUTH' })
        
        const { id } = payload
        
        // Get tracker info before deleting for broadcasting
        const tracker = await prisma.tracker.findUnique({ 
          where: { id },
          include: { map: true, episode: true }
        })
        
        if (!tracker) throw new Error('Tracker not found')

        // Check permission (user can delete own, ADMIN can delete any)
        if (tracker.userId !== socket.user.id && socket.user.role !== 'ADMIN') {
          throw new Error('Permission denied')
        }

        await prisma.tracker.delete({ where: { id } })

        const key = { 
          episodeNumber: tracker.episodeNumber,
          mapId: tracker.mapId, 
          channelId: tracker.channelId 
        }

        io.to(roomKey(key)).emit('tracker:deleted', { id })
        io.emit('tracker:deleted:global', { id })
        cb?.({ ok: true })
      } catch (e) {
        console.error('[Socket] tracker:delete error:', e)
        cb?.({ error: e.message })
      }
    })

    // --- chat: send message ---
    socket.on('chat:send', async (payload, cb) => {
      try {
        if (!socket.user) return cb?.({ error: 'AUTH' })
        
        // Check if user has CHATTER role or higher
        const allowedRoles = ['CHATTER', 'EDITOR', 'ADMIN']
        if (!allowedRoles.includes(socket.user.role)) {
          throw new Error('Permission denied: CHATTER role required')
        }

        const { content } = payload
        if (!content || content.trim().length === 0) {
          throw new Error('Message cannot be empty')
        }

        if (content.length > 1000) {
          throw new Error('Message too long (max 1000 characters)')
        }

        const message = await prisma.chatMessage.create({
          data: {
            userId: socket.user.id,
            content: content.trim()
          },
          include: {
            user: {
              select: { id: true, username: true, nickname: true, role: true }
            }
          }
        })

        io.emit('chat:message', message)
        cb?.({ ok: true, message })
      } catch (e) {
        console.error('[Socket] chat:send error:', e)
        cb?.({ error: e.message })
      }
    })

    // --- chat: load history ---
    socket.on('chat:loadHistory', async (payload, cb) => {
      try {
        const { limit = 100, before } = payload || {}
        
        // Get messages (last 1000 or last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        
        const where = {
          createdAt: { gte: sevenDaysAgo }
        }
        
        if (before) {
          where.createdAt.lt = new Date(before)
        }

        const messages = await prisma.chatMessage.findMany({
          where,
          take: Math.min(limit, 1000),
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, username: true, nickname: true, role: true }
            }
          }
        })

        cb?.({ ok: true, messages: messages.reverse() })
      } catch (e) {
        console.error('[Socket] chat:loadHistory error:', e)
        cb?.({ error: e.message })
      }
    })
  })

  return io
}

// --- broadcast user online counts globally ---
function emitOnlineCounts(io) {
  const allUsers = Array.from(onlineUsers.values())
  const namedUsers = allUsers.filter(u => u !== null)
  const visitors = allUsers.filter(u => u === null)

  const payload = {
    total: allUsers.length,
    visitors: visitors.length,
    namedUsers: namedUsers,  // ✅ Array of user objects with id, username, nickname, role
    count: {
      users: namedUsers.length,
      visitors: visitors.length
    }
  }

  console.log('[Socket] Emitting users:onlineCount:', payload)
  io.emit('users:onlineCount', payload)
}