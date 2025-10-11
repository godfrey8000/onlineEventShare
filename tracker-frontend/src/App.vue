<template>
  <div class="app">
    <!-- 🔐 Login Bar -->
    <LoginBar
      :token="token"
      :nickname="nickname"
      :role="role"
      @login="handleLogin"
      @logout="handleLogout"
      @openProfile="showProfile = !showProfile"
    />

    <!-- 👤 Profile Overlay -->
    <transition name="fade">
      <div
        v-if="showProfile"
        class="profile-overlay"
        @click.self="showProfile = false"
      >
        <UserProfile
          :token="token"
          :nickname="nickname"
          @updated="handleProfileUpdate"
        />
      </div>
    </transition>

    <!-- 🧱 Core Components -->
    <AddTracker 
      v-if="token && canEdit" 
      :nickname="nickname" 
      @added="handleTrackerAdded" 
    />
    
    <TrackerBoard
      :trackers="trackers"
      :token="token"
      :role="role"
      @update="handleTrackerUpdate"
      @delete="handleTrackerDelete"
    />

    <!-- 💬 Chat Room (if user has permission) -->
    <ChatRoom v-if="token && canChat" />

    <!-- 👥 Online User Count -->
    <button class="connected-btn" @click="showUsers = !showUsers">
      👥 {{ onlineCount }} online
      <span v-if="visitorCount > 0">({{ visitorCount }} 👤)</span>
    </button>

    <!-- 🧑‍🤝‍🧑 Online User Panel -->
    <transition name="fade">
      <div v-if="showUsers" class="user-panel" @click.self="showUsers = false">
        <h3>Online Users</h3>
        <div v-if="namedUsers.length > 0" class="named-users">
          <div v-for="user in namedUsers" :key="user.id" class="user-item">
            🟢 {{ user.nickname || user.username }}
            <span class="role-badge">{{ user.role }}</span>
          </div>
        </div>
        <div v-if="visitorCount > 0" class="visitor-count">
          👤 {{ visitorCount }} visitor{{ visitorCount > 1 ? 's' : '' }}
        </div>
        <div v-if="onlineCount === 0" class="no-users">
          No users online
        </div>
      </div>
    </transition>

    <!-- 🔄 Connection Status -->
    <div class="connection-status">
      <div class="status-line">
        <span :class="['status-indicator', connectionStatusClass]">
          {{ connectionStatusText }}
        </span>
        <span v-if="socketConnected && latency > 0" class="latency">
          {{ latency }}ms
        </span>
      </div>
      <div class="update-time">
        Last update: {{ lastUpdateAgo }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { api, setAuthToken, initAuth } from './services/api'
import { 
  connectSocket, 
  disconnectSocket,
  getConnectionStatus,
  onTrackerCreated,
  onTrackerUpdated,
  onTrackerDeleted,
  offTrackerCreated,
  offTrackerUpdated,
  offTrackerDeleted
} from './services/socket'
import LoginBar from './components/LoginBar.vue'
import TrackerBoard from './components/TrackerBoard.vue'
import AddTracker from './components/AddTracker.vue'
import UserProfile from './components/UserProfile.vue'
import ChatRoom from './components/ChatRoom.vue'
import { useOnlineUsers } from './composables/useOnlineUsers'

/* ✅ Global composable state for online users */
const { 
  socketConnected, 
  onlineCount, 
  visitorCount, 
  namedUsers,  // ✅ Changed from onlineUsers to namedUsers for clarity
  reconnectAttempts, 
  latency 
} = useOnlineUsers()

/* ✅ Local app state */
const token = ref('')
const nickname = ref('')
const role = ref('VIEWER')
const trackers = ref([])
const lastUpdate = ref(Date.now())
const showProfile = ref(false)
const showUsers = ref(false)

/* 🔒 Permission checks */
const canEdit = computed(() => ['EDITOR', 'ADMIN'].includes(role.value))
const canChat = computed(() => ['CHATTER', 'EDITOR', 'ADMIN'].includes(role.value))

/* 🔌 Connection status display */
const connectionStatusClass = computed(() => {
  if (socketConnected.value) return 'connected'
  if (reconnectAttempts.value > 0) return 'reconnecting'
  return 'disconnected'
})

const connectionStatusText = computed(() => {
  if (socketConnected.value) return '🟢 Connected'
  if (reconnectAttempts.value > 0) return `🟡 Reconnecting... (${reconnectAttempts.value})`
  return '🔴 Disconnected'
})

/* 🕒 Human-friendly time display */
const lastUpdateAgo = computed(() => {
  const s = Math.floor((Date.now() - lastUpdate.value) / 1000)
  if (s < 10) return 'just now'
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
})

/* 📡 Fetch all tracker data */
async function fetchTrackers() {
  try {
    const res = await api.getTrackers()
    trackers.value = res.data
    lastUpdate.value = Date.now()
  } catch (err) {
    console.error('Failed to fetch trackers:', err)
  }
}

/* 🔑 Handle Login */
// App.vue - handleLogin function
function handleLogin({ token: t, role: r, nickname: n }) {
  token.value = t
  role.value = r  // ✅ Now passed from LoginBar
  nickname.value = n
  
  localStorage.setItem('token', t)
  localStorage.setItem('role', r)
  localStorage.setItem('nickname', n)
  
  setAuthToken(t)
  disconnectSocket()
  connectSocket(t)
  
  fetchTrackers()
}

/* 🚪 Handle Logout */
function handleLogout() {
  localStorage.clear()
  token.value = ''
  nickname.value = ''
  role.value = 'VIEWER'
  setAuthToken(null)
  
  // Reconnect as visitor
  disconnectSocket()
  connectSocket()
  
  fetchTrackers()
}

/* 👤 Handle Profile Update */
function handleProfileUpdate({ nickname: n }) {
  nickname.value = n
  localStorage.setItem('nickname', n)
}

/* 🎯 Real-time event handlers */
function handleTrackerCreated(tracker) {
  console.log('[App] Tracker created:', tracker)
  // ✅ Check if already exists before adding
  const exists = trackers.value.find(t => t.id === tracker.id)
  if (!exists) {
    trackers.value.push(tracker)
  }
  lastUpdate
  .value = Date.now()
}
function handleTrackerUpdated(tracker) {
  console.log('[App] Tracker updated:', tracker)
  const index = trackers.value.findIndex(t => t.id === tracker.id)
  if (index !== -1) {
    // ✅ IMPORTANT: Replace the entire object to trigger reactivity
    trackers.value[index] = { ...tracker }
    // ✅ Force Vue to detect the change
    trackers.value = [...trackers.value]
  }
  lastUpdate.value = Date.now()
}

function handleTrackerDeleted({ id }) {
  console.log('[App] Tracker deleted:', id)
  trackers.value = trackers.value.filter(t => t.id !== id)
  lastUpdate.value = Date.now()
}

/* 📤 User action handlers */
function handleTrackerAdded(newTracker) {
  // Optimistic update - will be confirmed by socket event
  console.log('[App] User added tracker:', newTracker)
}

function handleTrackerUpdate(updatedTracker) {
  console.log('[App] User updated tracker:', updatedTracker)
  // The socket event will handle the actual update
  // This is just for optimistic UI update
  const index = trackers.value.findIndex(t => t.id === updatedTracker.id)
  if (index !== -1) {
    trackers.value[index] = { ...updatedTracker }
    trackers.value = [...trackers.value]
  }
}

function handleTrackerDelete(trackerId) {
  // Delete will be confirmed by socket event
  console.log('[App] User deleted tracker:', trackerId)
}

/* 🧠 Mount Logic */
onMounted(() => {
  // Restore auth from localStorage
  const savedToken = initAuth()
  if (savedToken) {
    token.value = savedToken
    nickname.value = localStorage.getItem('nickname') || ''
    role.value = localStorage.getItem('role') || 'VIEWER'
  }
  
  // Connect socket (with or without token)
  connectSocket(savedToken)
  
  // Set up real-time listeners
  onTrackerCreated(handleTrackerCreated)
  onTrackerUpdated(handleTrackerUpdated)
  onTrackerDeleted(handleTrackerDeleted)
  
  // Fetch initial data
  fetchTrackers()
})

/* 🧹 Cleanup on unmount */
onBeforeUnmount(() => {
  offTrackerCreated(handleTrackerCreated)
  offTrackerUpdated(handleTrackerUpdated)
  offTrackerDeleted(handleTrackerDeleted)
})
</script>

<style scoped>
.app {
  background: #121212;
  color: #eee;
  min-height: 100vh;
  padding-bottom: 80px;
}

.profile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.connected-btn {
  position: fixed;
  bottom: 80px;
  right: 20px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: #2a2a2a;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: background 0.2s;
}

.connected-btn:hover {
  background: #3a3a3a;
}

.user-panel {
  position: fixed;
  bottom: 130px;
  right: 20px;
  background: #1e1e1e;
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  max-height: 300px;
  min-width: 200px;
  overflow-y: auto;
  z-index: 100;
}

.user-panel h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #aaa;
  text-transform: uppercase;
}

.named-users {
  margin-bottom: 8px;
}

.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
}

.role-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #333;
  color: #888;
  text-transform: uppercase;
  margin-left: 8px;
}

.visitor-count {
  padding-top: 8px;
  margin-top: 8px;
  border-top: 1px solid #333;
  font-size: 13px;
  opacity: 0.8;
}

.no-users {
  text-align: center;
  opacity: 0.5;
  font-size: 13px;
}

.connection-status {
  position: fixed;
  right: 20px;
  bottom: 20px;
  font-size: 12px;
  background: #1a1a1a;
  padding: 8px 12px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.status-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.status-indicator {
  font-weight: 600;
}

.status-indicator.connected {
  color: #4caf50;
}

.status-indicator.reconnecting {
  color: #ff9800;
}

.status-indicator.disconnected {
  color: #f44336;
}

.latency {
  color: #888;
  font-size: 11px;
}

.update-time {
  color: #666;
  font-size: 11px;
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>