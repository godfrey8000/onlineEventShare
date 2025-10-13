import { ref, onMounted, onUnmounted } from 'vue'
import { getSocket, getConnectionStatus, onOnlineCount, offOnlineCount, onSocketReady } from '../services/socket'

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
    console.log('[useOnlineUsers] Composable mounted')

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
      console.log('[useOnlineUsers] Received users:onlineCount event:', data)
      onlineCount.value = data.total
      visitorCount.value = data.visitors
      namedUsers.value = data.namedUsers || []
      console.log('[useOnlineUsers] Updated state:', {
        onlineCount: onlineCount.value,
        visitorCount: visitorCount.value,
        namedUsers: namedUsers.value
      })
    }

    // ✅ Set up event listeners when socket is ready (runs on EVERY connect/reconnect)
    onSocketReady((socket) => {
      console.log('[useOnlineUsers] Socket ready event fired for socket:', socket.id)
      console.log('[useOnlineUsers] Setting up event listener')
      onOnlineCount(handleOnlineCount)
      console.log('[useOnlineUsers] Event listener registered successfully')
    })

    // ✅ Cleanup function
    onUnmounted(() => {
      console.log('[useOnlineUsers] Composable unmounted, cleaning up')
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