import { ref, onMounted, onUnmounted } from 'vue'
import { connectSocket, getPing, getReconnectAttempts } from '../services/socket'

const socketConnected = ref(false)
const onlineCount = ref(0)
const visitorCount = ref(0)
const onlineUsers = ref([])
const reconnectAttempts = ref(0)
const latency = ref(0)

export function useOnlineUsers() {
  let pingInterval

  onMounted(() => {
    const socket = connectSocket(localStorage.getItem('token') || '')

    socket.on('connect', () => {
      socketConnected.value = true
      reconnectAttempts.value = 0
    })

    socket.on('disconnect', () => {
      socketConnected.value = false
    })

    socket.on('reconnect_attempt', () => {
      reconnectAttempts.value = getReconnectAttempts()
    })

    socket.on('users:onlineCount', (data) => {
      onlineCount.value = data.total
      visitorCount.value = data.visitors
      onlineUsers.value = data.users
    })

    // update latency display every 5 s
    pingInterval = setInterval(() => (latency.value = getPing()), 5000)
  })

  onUnmounted(() => clearInterval(pingInterval))

  return { socketConnected, onlineCount, visitorCount, onlineUsers, reconnectAttempts, latency }
}
