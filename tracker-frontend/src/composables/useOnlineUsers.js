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

// ✅ Flag to ensure we only set up listeners once
let listenersRegistered = false

export function useOnlineUsers() {
  let statusInterval
  let handleOnlineCount

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
    handleOnlineCount = (data) => {
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

    // ✅ Set up event listeners when socket is ready
    onSocketReady((socket) => {
      if (listenersRegistered) {
        console.log('[useOnlineUsers] Listeners already registered, skipping')
        return
      }

      console.log('[useOnlineUsers] Socket is ready, setting up event listener')
      onOnlineCount(handleOnlineCount)
      listenersRegistered = true
      console.log('[useOnlineUsers] Event listener registered successfully')
    })

    // ✅ Cleanup function
    onUnmounted(() => {
      clearInterval(statusInterval)
      if (listenersRegistered && handleOnlineCount) {
        offOnlineCount(handleOnlineCount)
        listenersRegistered = false
      }
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