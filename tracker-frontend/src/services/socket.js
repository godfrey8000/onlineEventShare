import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080'

let socket = null
let reconnectAttempts = 0
let lastConnectedAt = null
let lastDisconnectedAt = null

// ✅ Connect to socket with token
export function connectSocket(token = '') {
  if (socket?.connected) {
    console.log('[Socket] Already connected')
    return socket
  }

  // Disconnect old socket if exists
  if (socket) {
    socket.disconnect()
  }

  console.log('[Socket] Connecting to:', SOCKET_URL)

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],  // ✅ Fallback to polling if websocket fails
    auth: { token: token || undefined },
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
  })

  // ✅ Connection events
  socket.on('connect', () => {
    console.log('[Socket] Connected!', socket.id)
    reconnectAttempts = 0
    lastConnectedAt = new Date()
    lastDisconnectedAt = null
  })

  socket.on('disconnect', (reason) => {
    console.warn('[Socket] Disconnected:', reason)
    lastDisconnectedAt = new Date()
  })

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message)
  })

  // ✅ Reconnection tracking
  socket.on('reconnect_attempt', (attempt) => {
    reconnectAttempts = attempt
    console.warn(`[Socket] Reconnect attempt #${attempt}`)
  })

  socket.on('reconnect', (attempt) => {
    console.log(`[Socket] Reconnected after ${attempt} attempts!`)
    reconnectAttempts = 0
    lastConnectedAt = new Date()
    lastDisconnectedAt = null
  })

  socket.on('reconnect_failed', () => {
    console.error('[Socket] Reconnection failed after max attempts')
  })

  return socket
}

// ✅ Disconnect socket
export function disconnectSocket() {
  if (socket) {
    console.log('[Socket] Manually disconnecting')
    socket.disconnect()
    socket = null
  }
}

// ✅ Get socket instance
export function getSocket() {
  return socket
}

// ✅ Check if connected
export function isConnected() {
  return socket?.connected || false
}

// ✅ Get connection status
export function getConnectionStatus() {
  if (!socket) {
    return {
      connected: false,
      status: 'not_initialized',
      reconnectAttempts: 0,
      lastConnectedAt: null,
      lastDisconnectedAt: null,
      disconnectedFor: null,
    }
  }

  const now = new Date()
  let disconnectedFor = null
  
  if (lastDisconnectedAt && !socket.connected) {
    disconnectedFor = Math.floor((now - lastDisconnectedAt) / 1000) // seconds
  }

  return {
    connected: socket.connected,
    status: socket.connected ? 'connected' : reconnectAttempts > 0 ? 'reconnecting' : 'disconnected',
    reconnectAttempts,
    lastConnectedAt,
    lastDisconnectedAt,
    disconnectedFor,
    socketId: socket.id,
  }
}

// ✅ Subscribe to room updates
export function subscribeToRoom(episodeNumber, mapId, channelId) {
  if (!socket?.connected) {
    console.warn('[Socket] Cannot subscribe - not connected')
    return
  }
  
  socket.emit('subscribe', { episodeNumber, mapId, channelId })
  console.log('[Socket] Subscribed to room:', { episodeNumber, mapId, channelId })
}

// ✅ Unsubscribe from room
export function unsubscribeFromRoom(episodeNumber, mapId, channelId) {
  if (!socket?.connected) return
  
  socket.emit('unsubscribe', { episodeNumber, mapId, channelId })
  console.log('[Socket] Unsubscribed from room:', { episodeNumber, mapId, channelId })
}

// ✅ Tracker operations
export function createTracker(data, callback) {
  if (!socket?.connected) {
    callback?.({ error: 'Not connected' })
    return
  }
  socket.emit('tracker:create', data, callback)
}

export function updateTracker(data, callback) {
  if (!socket?.connected) {
    callback?.({ error: 'Not connected' })
    return
  }
  socket.emit('tracker:update', data, callback)
}

export function deleteTracker(data, callback) {
  if (!socket?.connected) {
    callback?.({ error: 'Not connected' })
    return
  }
  socket.emit('tracker:delete', data, callback)
}

// ✅ Chat operations
export function sendChatMessage(content, callback) {
  if (!socket?.connected) {
    callback?.({ error: 'Not connected' })
    return
  }
  socket.emit('chat:send', { content }, callback)
}

export function loadChatHistory(params, callback) {
  if (!socket?.connected) {
    callback?.({ error: 'Not connected' })
    return
  }
  socket.emit('chat:loadHistory', params, callback)
}

// ✅ Event listener helpers
export function onTrackerCreated(handler) {
  socket?.on('tracker:created:global', handler)
}

export function onTrackerUpdated(handler) {
  socket?.on('tracker:changed:global', handler)
}

export function onTrackerDeleted(handler) {
  socket?.on('tracker:deleted:global', handler)
}

export function onChatMessage(handler) {
  socket?.on('chat:message', handler)
}

export function onOnlineCount(handler) {
  socket?.on('users:onlineCount', handler)
}

// ✅ Remove event listeners
export function offTrackerCreated(handler) {
  socket?.off('tracker:created:global', handler)
}

export function offTrackerUpdated(handler) {
  socket?.off('tracker:changed:global', handler)
}

export function offTrackerDeleted(handler) {
  socket?.off('tracker:deleted:global', handler)
}

export function offChatMessage(handler) {
  socket?.off('chat:message', handler)
}

export function offOnlineCount(handler) {
  socket?.off('users:onlineCount', handler)
}

export default {
  connect: connectSocket,
  disconnect: disconnectSocket,
  getSocket,
  isConnected,
  getConnectionStatus,
  subscribeToRoom,
  unsubscribeFromRoom,
  createTracker,
  updateTracker,
  deleteTracker,
  sendChatMessage,
  loadChatHistory,
  onTrackerCreated,
  onTrackerUpdated,
  onTrackerDeleted,
  onChatMessage,
  onOnlineCount,
  offTrackerCreated,
  offTrackerUpdated,
  offTrackerDeleted,
  offChatMessage,
  offOnlineCount,
}