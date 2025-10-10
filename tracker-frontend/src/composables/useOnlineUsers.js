import { ref, onMounted, onUnmounted } from 'vue'
import { connectSocket, getSocket, isConnected, getConnectionStatus, onOnlineCount, offOnlineCount } from '../services/socket'

// ✅ Shared reactive state (singleton pattern)
const socketConnected = ref(false)
const onlineCount = ref(0)
const visitorCount = ref(0)
const namedUsers = ref([])
const reconnectAttempts = ref(0)
const latency = ref(0)
const lastConnectedAt = ref(null)
const lastDisconnectedAt = ref(null)
const disconnectedFor = ref(null)

export function useOnlineUsers() {
  let statusInterval

  onMounted(() => {
    const socket = getSocket()
    
    // If socket not initialized, connect it
    if (!socket) {
      const token = localStorage.getItem('token') || ''
      connectSocket(token)
    }

    // ✅ Update connection status periodically
    const updateStatus = () => {
      const status = getConnectionStatus()
      socketConnected.value = status.connected
      reconnectAttempts.value = status.reconnectAttempts
      lastConnectedAt.value = status.lastConnectedAt
      lastDisconnectedAt.value = status.lastDisconnectedAt
      disconnectedFor.value = status.disconnectedFor
      
      // ✅ Calculate latency from socket.io ping
      const sock = getSocket()
      if (sock?.connected && sock.io?.engine) {
        // Socket.io provides ping in the engine
        latency.value = sock.io.engine.transport?.ping || 0
      }
    }

    // Update status every second
    statusInterval = setInterval(updateStatus, 1000)
    updateStatus() // Initial update

    // ✅ Listen for online count updates
    const handleOnlineCount = (data) => {
      onlineCount.value = data.total
      visitorCount.value = data.visitors
      namedUsers.value = data.namedUsers || []
    }

    onOnlineCount(handleOnlineCount)

    // ✅ Cleanup function
    onUnmounted(() => {
      clearInterval(statusInterval)
      offOnlineCount(handleOnlineCount)
    })
  })

  return { 
    socketConnected, 
    onlineCount, 
    visitorCount, 
    namedUsers,  // ✅ Changed from onlineUsers to namedUsers
    reconnectAttempts, 
    latency,
    lastConnectedAt,
    lastDisconnectedAt,
    disconnectedFor
  }
}