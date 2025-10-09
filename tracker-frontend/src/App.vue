<template>
  <div class="app">
    <!-- 🔐 Login Bar -->
    <LoginBar
      :token="token"
      :nickname="nickname"
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
          @updated="n => nickname = n"
        />
      </div>
    </transition>

    <!-- 🧱 Core Components -->
    <AddTracker v-if="token" :nickname="nickname" @added="fetchTrackers" />
    <TrackerBoard
      :trackers="trackers"
      :token="token"
      @update="updateTracker"
    />

    <!-- 👥 Online User Count -->
    <button class="connected-btn" @click="showUsers = !showUsers">
      👥 {{ onlineCount }} ({{ visitorCount }} 👤)
    </button>

    <!-- 🧑‍🤝‍🧑 Online User Panel -->
    <transition name="fade">
      <div v-if="showUsers" class="user-panel">
        <div v-for="user in onlineUsers" :key="user" class="user-item">
          🟢 {{ user }}
        </div>
        <div v-if="visitorCount > 0" class="visitor-count">
          👤 Visitors: {{ visitorCount }}
        </div>
      </div>
    </transition>

    <!-- 🔄 Connection Status -->
    <div class="updateTime">
      <span :style="{ color: socketConnected ? 'limegreen' : 'orange' }">
        {{ socketConnected
            ? `🟢 Connected (${latency} ms)`
            : `🟠 Reconnecting… attempt #${reconnectAttempts}` }}
      </span>
      &nbsp;• Updated {{ lastUpdateAgo }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { API, setAuthToken } from './services/api'
import { connectSocket } from './services/socket'
import LoginBar from './components/LoginBar.vue'
import TrackerBoard from './components/TrackerBoard.vue'
import AddTracker from './components/AddTracker.vue'
import UserProfile from './components/UserProfile.vue'
import { useOnlineUsers } from './composables/useOnlineUsers'  // ✅ corrected path

/* ✅ Global composable state for online users */
const { socketConnected, onlineCount, visitorCount, onlineUsers,
        reconnectAttempts, latency } = useOnlineUsers()
/* ✅ Local app state */
const token = ref(localStorage.getItem('token') || '')
const nickname = ref(localStorage.getItem('nickname') || '')
const trackers = ref([])
const lastUpdate = ref(Date.now())
const showProfile = ref(false)
const showUsers = ref(false)

/* 🕒 Human-friendly time display */
const lastUpdateAgo = computed(() => {
  const s = (Date.now() - lastUpdate.value) / 1000
  if (s < 60) return `${Math.floor(s)}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
})

/* 📡 Fetch all tracker data */
async function fetchTrackers() {
  try {
    const res = await API.get('/trackers')
    trackers.value = res.data
    lastUpdate.value = Date.now()
  } catch (err) {
    console.error('Failed to fetch trackers:', err)
  }
}

/* 🔑 Handle Login */
function handleLogin({ token: t, nickname: n }) {
  token.value = t
  nickname.value = n
  localStorage.setItem('token', t)
  localStorage.setItem('nickname', n)
  setAuthToken(t)

  // Connect socket for authenticated user
  const s = connectSocket(t)
  s.on('tracker:changed:global', fetchTrackers)
  s.on('tracker:created:global', fetchTrackers)

  fetchTrackers()
}

/* 🚪 Handle Logout */
function handleLogout() {
  localStorage.clear()
  token.value = ''
  nickname.value = ''
  trackers.value = []
  setAuthToken('')
}

/* 🔒 Password utility (for testing via console) */
import bcrypt from 'bcryptjs'
async function makeAPassword(makePassword) {
  const hashed = await bcrypt.hash(makePassword, 10)
  console.log('Hashed:', hashed)
  return hashed
}
window.makeAPassword = makeAPassword

/* 🧠 Mount Logic */
onMounted(() => {
  if (token.value) {
    setAuthToken(token.value)
    const s = connectSocket(token.value)
    s.on('tracker:changed:global', fetchTrackers)
    s.on('tracker:created:global', fetchTrackers)
  }
  fetchTrackers()
})
</script>

<style scoped>
.app {
  background: #121212;
  color: #eee;
  min-height: 100vh;
  padding-bottom: 40px;
}

.connected-btn {
  position: fixed;
  bottom: 60px;
  right: 20px;
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  background: #222;
  color: #fff;
  cursor: pointer;
}

.user-panel {
  position: fixed;
  bottom: 100px;
  right: 20px;
  background: #1e1e1e;
  padding: 12px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  max-height: 200px;
  overflow-y: auto;
}

.user-item {
  margin: 4px 0;
}

.visitor-count {
  margin-top: 8px;
  font-style: italic;
  opacity: 0.8;
}

.updateTime {
  position: fixed;
  right: 20px;
  bottom: 20px;
  font-size: 12px;
  opacity: 0.7;
}
</style>
