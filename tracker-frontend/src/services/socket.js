import { io } from 'socket.io-client'
import { API_BASE } from './api'

let socket = null
let reconnectAttempts = 0
let ping = 0
let pingTimer = null

export function connectSocket(token = '') {
  if (socket && socket.connected) return socket

  socket = io(API_BASE.replace(/\/api$/, ''), {
    transports: ['websocket'],
    auth: { token: token || undefined },
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  })

  // --- Reconnect handling ---
  socket.on('reconnect_attempt', () => {
    reconnectAttempts++
    console.warn(`[Socket] Reconnect attempt #${reconnectAttempts}`)
  })

  socket.on('reconnect', () => {
    console.log('[Socket] Reconnected!')
    reconnectAttempts = 0
  })

  // --- Latency ping test ---
  socket.on('connect', () => {
    if (pingTimer) clearInterval(pingTimer)
    pingTimer = setInterval(() => {
      const start = Date.now()
      socket.emit('pingCheck', () => {
        ping = Date.now() - start
      })
    }, 5000)
  })

  socket.on('disconnect', () => {
    if (pingTimer) clearInterval(pingTimer)
  })

  return socket
}

export function getSocket() {
  return socket
}

export function getPing() {
  return ping
}

export function getReconnectAttempts() {
  return reconnectAttempts
}
